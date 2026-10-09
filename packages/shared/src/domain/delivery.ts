import type { DeliveryStatus } from '../enums';
import type { GeoPoint, Id, IsoDateTime } from './common';
import type { Truck } from './truck';
import type { DriverSummary } from './user';

/** One mixer trip (spec §3 "Reys"). */
export interface Delivery {
  id: Id;
  orderId: Id;
  supplierId: Id;
  /** 1-based position within the order ("Reys 2/3"). */
  sequence: number;
  volumeM3: number;
  truckId: Id | null;
  driverId: Id | null;
  status: DeliveryStatus;
  plannedDepartureAt: IsoDateTime | null;
  departedAt: IsoDateTime | null;
  arrivedAt: IsoDateTime | null;
  unloadStartedAt: IsoDateTime | null;
  completedAt: IsoDateTime | null;
  lastLocation: GeoPoint | null;
  lastLocationAt: IsoDateTime | null;
  lastSpeedKmh: number | null;
  /** Degrees clockwise from north; rotates the truck marker. */
  lastHeading: number | null;
  etaMinutes: number | null;
  failReason: string | null;
}

/** A GPS sample as stored in `DeliveryLocation` (spec §7). */
export interface DeliveryLocation {
  deliveryId: Id;
  location: GeoPoint;
  speedKmh: number | null;
  heading: number | null;
  accuracyM: number | null;
  recordedAt: IsoDateTime;
}

/** Signed delivery note for a completed trip (spec §3 "Təhvil aktı"). */
export interface DeliveryDocument {
  id: Id;
  deliveryId: Id;
  number: string;
  pdfUrl: string | null;
  photoUrls: string[];
  signatureUrl: string | null;
  receivedByName: string;
  receivedAt: IsoDateTime;
}

/** Delivery as shown to the customer and dispatcher: crew and paperwork resolved. */
export interface DeliveryDetail extends Delivery {
  truck: Truck | null;
  driver: DriverSummary | null;
  document: DeliveryDocument | null;
}

/** Real-time position event (spec §9.2 `delivery.location`). */
export interface LiveLocation {
  deliveryId: Id;
  orderId: Id;
  lat: number;
  lng: number;
  heading: number | null;
  speedKmh: number | null;
  etaMinutes: number | null;
  at: IsoDateTime;
}
