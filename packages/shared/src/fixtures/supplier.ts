import type { Plant, ServiceArea, Supplier } from '../domain/supplier';

export const SUPPLIER_ID = 'sup_novxani';
export const PLANT_ID = 'plant_novxani';

/** Real contact details from spec §1. Settings marked TODO are assumptions (spec §20). */
export function createSupplier(): Supplier {
  return {
    id: SUPPLIER_ID,
    name: 'Novxanı Beton',
    slug: 'novxani-beton',
    legalName: null, // TODO(nurlan): legal entity name for documents
    taxId: null, // TODO(nurlan): VÖEN
    phone: '+994506209584',
    dispatchPhone: '+994503260343',
    email: 'info@novxanibeton.az',
    website: 'https://novxanibeton.az',
    address: 'Novxanı şossesi, Bakı',
    logoUrl: null,
    isActive: true,
    settings: {
      minOrderM3: 3, // TODO(nurlan): minimum order volume (spec §3)
      vatRate: 0.18,
      pricesIncludeVat: false,
      deliveryIncluded: true,
      concreteLifetimeMin: 90,
      leadTimeHours: 6, // TODO(nurlan): earliest delivery after ordering
      cancelCutoffHours: 12, // TODO(nurlan): customer cancellation cutoff
      workingHours: '24/7',
      locationUpdateIntervalSec: 10,
      arrivalGeofenceM: 150,
    },
  };
}

/** Plant coordinates from spec §7. */
export function createPlant(): Plant {
  return {
    id: PLANT_ID,
    supplierId: SUPPLIER_ID,
    name: 'Novxanı',
    address: 'Novxanı şossesi, Bakı',
    location: { lat: 40.4858529, lng: 49.8294278 },
    isDefault: true,
  };
}

/** Rough Baku + Absheron rectangle. TODO(nurlan): refine the real service polygon (spec §18). */
export function createServiceArea(): ServiceArea {
  return {
    id: 'area_absheron',
    supplierId: SUPPLIER_ID,
    name: 'Bakı və Abşeron',
    polygon: {
      points: [
        { lat: 40.68, lng: 49.3 },
        { lat: 40.68, lng: 50.45 },
        { lat: 40.15, lng: 50.45 },
        { lat: 40.15, lng: 49.3 },
      ],
    },
    isActive: true,
  };
}
