import type { GeoPoint, GeoPolygon } from '../domain/common';
import type { PricingBreakdown } from '../domain/order';
import type { Product, PumpOption } from '../domain/product';
import type { SupplierSettings } from '../domain/supplier';
import { ErrorCode } from '../error-codes';
import { isPointInPolygon } from '../geo/geo';
import { addMoney, multiplyMoney, ZERO_MONEY } from '../money/money';

/**
 * Spec §10:
 *   subtotal    = product.basePrice × volumeM3            (excl. VAT)
 *   pumpFee     = pump ? (pricePerOrder ?? 0) + (pricePerM3 ?? 0) × volumeM3 : 0
 *   deliveryFee = 0                                        (settings.deliveryIncluded)
 *   vat         = (subtotal + pumpFee + deliveryFee) × settings.vatRate
 *   total       = subtotal + pumpFee + deliveryFee + vat
 * Pure function: the mock client and the API module call exactly this (ADR 0007).
 */
export interface QuoteInput {
  product: Pick<Product, 'basePrice' | 'minQty'>;
  volumeM3: number;
  /** `null` when no pump is requested. */
  pumpOption: Pick<PumpOption, 'pricePerOrder' | 'pricePerM3'> | null;
  settings: Pick<SupplierSettings, 'vatRate' | 'minOrderM3' | 'deliveryIncluded'>;
  /** When both are provided the site is validated against the service area (spec §3). */
  siteLocation?: GeoPoint | null;
  serviceArea?: GeoPolygon | null;
}

export type QuoteFailureCode =
  | typeof ErrorCode.VALIDATION_ERROR
  | typeof ErrorCode.MIN_VOLUME_NOT_MET
  | typeof ErrorCode.OUT_OF_SERVICE_AREA;

export type QuoteResult =
  | {
      ok: true;
      breakdown: PricingBreakdown;
      /** false when a pump is requested but its price is not configured yet (dispatcher confirms). */
      pumpPriceKnown: boolean;
    }
  | { ok: false; code: QuoteFailureCode; details: Record<string, unknown> };

const VOLUME_MAX_M3 = 1000;

export function isValidVolume(volumeM3: number): boolean {
  if (!Number.isFinite(volumeM3) || volumeM3 <= 0 || volumeM3 > VOLUME_MAX_M3) return false;
  // at most two decimals (0.25 m³ steps are the finest a mixer is loaded with)
  return Math.abs(volumeM3 * 100 - Math.round(volumeM3 * 100)) < 1e-9;
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const { product, volumeM3, pumpOption, settings } = input;

  if (!isValidVolume(volumeM3)) {
    return {
      ok: false,
      code: ErrorCode.VALIDATION_ERROR,
      details: { field: 'volumeM3', volumeM3 },
    };
  }

  const minVolume = product.minQty ?? settings.minOrderM3;
  if (volumeM3 < minVolume) {
    return {
      ok: false,
      code: ErrorCode.MIN_VOLUME_NOT_MET,
      details: { minOrderM3: minVolume, volumeM3 },
    };
  }

  if (
    input.siteLocation &&
    input.serviceArea &&
    !isPointInPolygon(input.siteLocation, input.serviceArea)
  ) {
    return {
      ok: false,
      code: ErrorCode.OUT_OF_SERVICE_AREA,
      details: { location: input.siteLocation },
    };
  }

  const subtotal = multiplyMoney(product.basePrice, volumeM3);

  let pumpFee = ZERO_MONEY;
  let pumpPriceKnown = true;
  if (pumpOption) {
    if (pumpOption.pricePerOrder === null && pumpOption.pricePerM3 === null) {
      pumpPriceKnown = false;
    } else {
      pumpFee = addMoney(
        pumpOption.pricePerOrder ?? ZERO_MONEY,
        pumpOption.pricePerM3 ? multiplyMoney(pumpOption.pricePerM3, volumeM3) : ZERO_MONEY,
      );
    }
  }

  // Delivery is included in the price (spec §1). A paid-delivery model does not exist yet, so the
  // fee is zero regardless of the flag; the flag is kept for the snapshot's honesty.
  const deliveryFee = ZERO_MONEY;

  const taxable = addMoney(subtotal, pumpFee, deliveryFee);
  const vat = multiplyMoney(taxable, settings.vatRate);
  const total = addMoney(taxable, vat);

  return {
    ok: true,
    pumpPriceKnown,
    breakdown: {
      basePerM3: product.basePrice,
      volumeM3,
      subtotal,
      pumpFee,
      deliveryFee,
      vatRate: settings.vatRate,
      vat,
      total,
      currency: 'AZN',
      overrideReason: null,
    },
  };
}
