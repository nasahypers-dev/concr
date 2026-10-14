import type { CustomerType } from '../enums';
import type { GeoPoint, Id, IsoDate, IsoDateTime, TimeOfDay } from './common';
import type { DeliveryDetail } from './delivery';
import type { OrderDetail, OrderSummary } from './order';
import type { Truck } from './truck';
import type { CustomerAccount, DriverSummary } from './user';

/** Inbox / orders-table row for staff (GET /dispatch/orders). */
export interface DispatchOrderSummary extends OrderSummary {
  customerName: string | null;
  customerPhone: string;
  customerType: CustomerType;
  siteAddressLine: string;
  pumpBoomLengthM: number | null;
  /** false while a pump is requested and its price is not configured yet (dispatcher sets it). */
  pumpPriceKnown: boolean;
}

/** GET /dispatch/orders/:id — the customer resolved on top of the customer-facing detail. */
export interface DispatchOrderDetail extends OrderDetail {
  customer: CustomerAccount;
}

/** A trip with the order and site facts the board and the live map show. */
export interface DispatchDelivery extends DeliveryDetail {
  orderNumber: string;
  productGrade: string;
  siteName: string;
  siteLocation: GeoPoint;
  requestedDate: IsoDate;
  timeWindowStart: TimeOfDay;
  timeWindowEnd: TimeOfDay;
}

/** GET /dispatch/board?date= — mixer rows × the day's trips. */
export interface DispatchBoard {
  date: IsoDate;
  /** Active mixers, the board rows. */
  trucks: Truck[];
  deliveries: DispatchDelivery[];
}

/** One mixer on the live map (spec §9.4). */
export interface LiveTruck {
  truck: Truck;
  driver: DriverSummary | null;
  onShift: boolean;
  /** The trip the mixer is on right now (loading, en route, arrived, unloading), if any. */
  delivery: DispatchDelivery | null;
  location: GeoPoint | null;
  locationAt: IsoDateTime | null;
  heading: number | null;
  speedKmh: number | null;
  etaMinutes: number | null;
  /** No GPS sample for longer than the threshold while the trip is being tracked. */
  signalLost: boolean;
}

/** Spec §9.4 right panel, as delivery ids. */
export interface LiveAlerts {
  /** ETA falls after the end of the delivery window. */
  late: Id[];
  /** Concrete has been in the drum for the warning time (D7: 75 of 90 minutes) without unloading. */
  concreteRisk: Id[];
  /** No GPS sample for longer than the threshold. */
  noSignal: Id[];
}

/** GET /dispatch/live — every mixer's last position plus the alerts, computed server-side. */
export interface LiveSnapshot {
  at: IsoDateTime;
  trucks: LiveTruck[];
  alerts: LiveAlerts;
}

/** One trip of a schedule proposal or request (spec §8.1 "avtomatik bölgü"). */
export interface TripPlan {
  sequence: number;
  volumeM3: number;
  truckId: Id;
  driverId: Id | null;
  plannedDepartureAt: IsoDateTime;
}
