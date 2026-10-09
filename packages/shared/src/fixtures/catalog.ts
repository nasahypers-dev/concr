import type { Product, PumpOption } from '../domain/product';
import { ProductCategory, ProductUnit, SlumpClass } from '../enums';
import { SUPPLIER_ID } from './supplier';

/** Real price list, spec §4 (per m³, excluding VAT). */
export const CONCRETE_PRICES: ReadonlyArray<readonly [grade: string, price: string]> = [
  ['M100', '90.00'],
  ['M150', '95.00'],
  ['M200', '100.00'],
  ['M250', '105.00'],
  ['M300', '110.00'],
  ['M350', '115.00'],
  ['M400', '120.00'],
  ['M450', '125.00'],
  ['M500', '130.00'],
  ['M550', '135.00'],
  ['M600', '140.00'],
];

/** TODO(nurlan): which grades carry the "Populyar" badge (spec §4 assumes M250/M300). */
const POPULAR_GRADES = new Set(['M250', 'M300']);

export function productId(grade: string): string {
  return `prod_${grade.toLowerCase()}`;
}

/** Sort order M100 → M600 (TODO(nurlan): spec §4 asks which direction the app should show). */
export function createProducts(): Product[] {
  return CONCRETE_PRICES.map(([grade, basePrice], index) => ({
    id: productId(grade),
    supplierId: SUPPLIER_ID,
    category: ProductCategory.CONCRETE,
    unit: ProductUnit.M3,
    grade,
    strengthClass: null,
    description: null,
    slumpOptions: [SlumpClass.P2, SlumpClass.P3, SlumpClass.P4],
    basePrice,
    minQty: null,
    isActive: true,
    sortOrder: index + 1,
    isPopular: POPULAR_GRADES.has(grade),
  }));
}

export const PUMP_24M_ID = 'pump_24m';

/** One 24 m pump exists (spec §3). TODO(nurlan): price model and other boom lengths. */
export function createPumpOptions(): PumpOption[] {
  return [
    {
      id: PUMP_24M_ID,
      supplierId: SUPPLIER_ID,
      boomLengthM: 24,
      pricePerOrder: null,
      pricePerM3: null,
      isActive: true,
    },
  ];
}
