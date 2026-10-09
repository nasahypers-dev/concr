import { calculateQuote, isValidVolume } from './calculate-quote';

const settings = { vatRate: 0.18, minOrderM3: 3, deliveryIncluded: true };
const m300 = { basePrice: '110.00', minQty: null };
const m100 = { basePrice: '90.00', minQty: null };

describe('calculateQuote (spec §10)', () => {
  it('matches the spec example: 10 m³ of M300 = 1 298,00 ₼ incl. VAT', () => {
    const result = calculateQuote({ product: m300, volumeM3: 10, pumpOption: null, settings });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.breakdown).toEqual({
      basePerM3: '110.00',
      volumeM3: 10,
      subtotal: '1100.00',
      pumpFee: '0.00',
      deliveryFee: '0.00',
      vatRate: 0.18,
      vat: '198.00',
      total: '1298.00',
      currency: 'AZN',
      overrideReason: null,
    });
    expect(result.pumpPriceKnown).toBe(true);
  });

  it('handles fractional volumes', () => {
    const result = calculateQuote({ product: m100, volumeM3: 7.5, pumpOption: null, settings });
    if (!result.ok) throw new Error(result.code);
    expect(result.breakdown.subtotal).toBe('675.00');
    expect(result.breakdown.vat).toBe('121.50');
    expect(result.breakdown.total).toBe('796.50');
  });

  it('adds a pump fee per order and per m³ without VAT (D15)', () => {
    const result = calculateQuote({
      product: m300,
      volumeM3: 10,
      pumpOption: { pricePerOrder: '100.00', pricePerM3: '5.00' },
      settings,
    });
    if (!result.ok) throw new Error(result.code);
    expect(result.breakdown.pumpFee).toBe('150.00');
    expect(result.breakdown.vat).toBe('198.00'); // 1100 × 0.18, the pump is not taxed
    expect(result.breakdown.total).toBe('1448.00');
  });

  it('flags an unknown pump price instead of guessing it', () => {
    const result = calculateQuote({
      product: m300,
      volumeM3: 10,
      pumpOption: { pricePerOrder: null, pricePerM3: null },
      settings,
    });
    if (!result.ok) throw new Error(result.code);
    expect(result.pumpPriceKnown).toBe(false);
    expect(result.breakdown.pumpFee).toBe('0.00');
    expect(result.breakdown.total).toBe('1298.00');
  });

  it('rejects volumes below the supplier minimum, or the product minimum when set', () => {
    const tooSmall = calculateQuote({ product: m300, volumeM3: 2.5, pumpOption: null, settings });
    expect(tooSmall).toEqual({
      ok: false,
      code: 'MIN_VOLUME_NOT_MET',
      details: { minOrderM3: 3, volumeM3: 2.5 },
    });
    const productMin = calculateQuote({
      product: { basePrice: '90.00', minQty: 5 },
      volumeM3: 4,
      pumpOption: null,
      settings,
    });
    expect(productMin.ok).toBe(false);
    if (!productMin.ok) expect(productMin.details.minOrderM3).toBe(5);
  });

  it('rejects sites outside the service area, but only when both inputs are given', () => {
    const area = {
      points: [
        { lat: 40.2, lng: 49.3 },
        { lat: 40.2, lng: 50.4 },
        { lat: 40.7, lng: 50.4 },
        { lat: 40.7, lng: 49.3 },
      ],
    };
    const outside = calculateQuote({
      product: m300,
      volumeM3: 10,
      pumpOption: null,
      settings,
      siteLocation: { lat: 41.5, lng: 48.5 },
      serviceArea: area,
    });
    expect(outside.ok).toBe(false);
    if (!outside.ok) expect(outside.code).toBe('OUT_OF_SERVICE_AREA');

    const inside = calculateQuote({
      product: m300,
      volumeM3: 10,
      pumpOption: null,
      settings,
      siteLocation: { lat: 40.41, lng: 49.87 },
      serviceArea: area,
    });
    expect(inside.ok).toBe(true);

    const noArea = calculateQuote({
      product: m300,
      volumeM3: 10,
      pumpOption: null,
      settings,
      siteLocation: { lat: 41.5, lng: 48.5 },
      serviceArea: null,
    });
    expect(noArea.ok).toBe(true);
  });

  it('validates the volume number itself', () => {
    expect(isValidVolume(10)).toBe(true);
    expect(isValidVolume(0.25)).toBe(true);
    expect(isValidVolume(0)).toBe(false);
    expect(isValidVolume(-1)).toBe(false);
    expect(isValidVolume(10.123)).toBe(false);
    expect(isValidVolume(Number.NaN)).toBe(false);
    expect(isValidVolume(1001)).toBe(false);
    const result = calculateQuote({ product: m300, volumeM3: 10.123, pumpOption: null, settings });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('VALIDATION_ERROR');
  });
});
