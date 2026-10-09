import type { ProductCategory, ProductUnit, SlumpClass } from '../enums';
import type { Id, MoneyString } from './common';

export interface Product {
  id: Id;
  supplierId: Id;
  category: ProductCategory;
  unit: ProductUnit;
  /** "M300" for concrete, "Qum" etc. for aggregates (Phase 4). */
  grade: string;
  /** e.g. "B22.5" — optional technical class shown in the product sheet. */
  strengthClass: string | null;
  description: string | null;
  slumpOptions: SlumpClass[];
  /** Per m³ (or per ton), excluding VAT. */
  basePrice: MoneyString;
  /** Product-specific minimum quantity; `null` means the supplier default applies. */
  minQty: number | null;
  isActive: boolean;
  sortOrder: number;
  /** "Populyar" badge in the catalogue (TODO(nurlan): which grades). */
  isPopular: boolean;
}

export interface PumpOption {
  id: Id;
  supplierId: Id;
  boomLengthM: number;
  /** Either/both may be set; `null` + `null` means "price confirmed by the dispatcher". */
  pricePerOrder: MoneyString | null;
  pricePerM3: MoneyString | null;
  isActive: boolean;
}
