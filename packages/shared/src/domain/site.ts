import type { GeoPoint, Id, IsoDateTime } from './common';

/** Pour location: address + coordinates + access notes (spec §3 "Obyekt"). */
export interface Site {
  id: Id;
  customerId: Id;
  name: string;
  addressLine: string;
  location: GeoPoint;
  accessNotes: string | null;
  contactName: string | null;
  /** Required: the person on site the driver calls (owner, 2026-10-09). */
  contactPhone: string;
  createdAt: IsoDateTime;
}

export type SiteInput = Omit<Site, 'id' | 'customerId' | 'createdAt'>;
