import type { CustomerType, UserRole } from '../enums';
import type { Locale } from '../i18n';
import type { Id, IsoDateTime } from './common';

export interface User {
  id: Id;
  /** E.164, e.g. "+994501234567". */
  phone: string;
  email: string | null;
  fullName: string | null;
  locale: Locale;
  role: UserRole;
  isActive: boolean;
  createdAt: IsoDateTime;
}

export interface CustomerProfile {
  userId: Id;
  customerType: CustomerType;
  companyName: string | null;
  /** VÖEN for company customers. */
  taxId: string | null;
}

/** What the signed-in customer sees about themselves. */
export interface CustomerAccount extends User {
  profile: CustomerProfile;
}

/** Customer-visible subset of a driver (spec §9.3: name + phone on the delivery card). */
export interface DriverSummary {
  id: Id;
  fullName: string;
  phone: string;
}

export interface Driver extends DriverSummary {
  supplierId: Id;
  isOnShift: boolean;
  currentTruckId: Id | null;
  lastSeenAt: IsoDateTime | null;
}
