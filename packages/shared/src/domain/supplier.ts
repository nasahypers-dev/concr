import type { GeoPoint, GeoPolygon, Id } from './common';

/** Spec §7 `Supplier.settings`. Phase placeholders are marked in fixtures, not here. */
export interface SupplierSettings {
  /** Minimum order volume in m³ (spec §3, TODO(nurlan) value). */
  minOrderM3: number;
  /** 0.18 = 18 % (spec §4). */
  vatRate: number;
  /** Prices are stored excluding VAT (CLAUDE.md rule 6). */
  pricesIncludeVat: boolean;
  /** Delivery is included in the price for the whole service area (spec §1). */
  deliveryIncluded: boolean;
  /** Concrete lifetime counted from `departedAt`, minutes (spec §3). */
  concreteLifetimeMin: number;
  /** Earliest delivery window starts this many hours after ordering (TODO(nurlan)). */
  leadTimeHours: number;
  /** Customer may cancel a confirmed order until this many hours before the window (TODO(nurlan)). */
  cancelCutoffHours: number;
  /** Free text shown in the app, e.g. "24/7". */
  workingHours: string;
  /** Driver GPS sampling interval (spec §9.1). */
  locationUpdateIntervalSec: number;
  /** Auto "arrived" geofence radius in metres (spec §9.2). */
  arrivalGeofenceM: number;
}

export interface Supplier {
  id: Id;
  name: string;
  slug: string;
  legalName: string | null;
  /** VÖEN */
  taxId: string | null;
  phone: string;
  email: string;
  website: string | null;
  address: string;
  logoUrl: string | null;
  isActive: boolean;
  settings: SupplierSettings;
}

export interface Plant {
  id: Id;
  supplierId: Id;
  name: string;
  address: string;
  location: GeoPoint;
  isDefault: boolean;
}

/** Used only to validate that a site can be served; it never affects the price (spec §3). */
export interface ServiceArea {
  id: Id;
  supplierId: Id;
  name: string;
  polygon: GeoPolygon;
  isActive: boolean;
}
