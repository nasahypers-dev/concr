import type { Id, IsoDate } from '../../domain/common';
import type { Delivery, DeliveryDetail, DriverDelivery } from '../../domain/delivery';
import type { Driver, User } from '../../domain/user';
import { DeliveryStatus, UserRole } from '../../enums';
import { ErrorCode } from '../../error-codes';
import { bakuDate, MOCK_AVERAGE_SPEED_KMH } from '../../fixtures';
import { haversineKm } from '../../geo/geo';
import {
  type CompleteDeliveryData,
  completeDeliverySchema,
  type DriverStatusInput,
  driverStatusSchema,
  type LocationBatchInput,
  locationBatchSchema,
  MAX_ACCURACY_M,
  type ShiftInput,
  shiftSchema,
} from '../../schemas/driver';
import {
  checkDeliveryTransition,
  DeliveryActor,
  isTrackingDeliveryStatus,
} from '../../state-machines/delivery-state.machine';
import type { DriverApi } from '../api-client';
import { ApiClientError } from '../errors';
import type { MockStore } from './mock-store';
import type { MockTracker } from './mock-tracker';

/** The zod-backed validator the mock client shares with every namespace. */
export type ParseFn = <T>(
  schema: {
    safeParse: (v: unknown) => { success: boolean; data?: T; error?: { issues: unknown[] } };
  },
  value: unknown,
) => T;

export interface DriverApiContext {
  store: MockStore;
  tracker: MockTracker;
  now: () => Date;
  delay: () => Promise<void>;
  parse: ParseFn;
  currentUser: () => User;
  deliveryDetail: (orderId: Id) => DeliveryDetail[];
}

/**
 * Mock of the driver endpoints (spec §11: /driver/deliveries, /status, /location, /complete,
 * /shift). Scoped to the signed-in driver: another driver's trip answers NOT_FOUND. Status changes
 * go through the shared delivery state machine; timestamps, events and live notifications go
 * through the tracker's `applyStatus` / `syncOrder`, so customers see the trip move in real time.
 */
export function createDriverApi(ctx: DriverApiContext): DriverApi {
  const { store, tracker, now, delay, parse } = ctx;

  const currentDriver = (): Driver => {
    const user = ctx.currentUser();
    const driver = user.role === UserRole.DRIVER ? store.findDriver(user.id) : undefined;
    if (!driver) throw new ApiClientError(ErrorCode.FORBIDDEN);
    return driver;
  };

  const ownedDelivery = (id: Id): Delivery => {
    const driver = currentDriver();
    const delivery = store.findDelivery(id);
    if (!delivery || delivery.driverId !== driver.id) throw new ApiClientError(ErrorCode.NOT_FOUND);
    return delivery;
  };

  const toDriverDelivery = (delivery: Delivery): DriverDelivery => {
    const order = store.findOrder(delivery.orderId);
    const site = order ? store.findSite(order.siteId) : undefined;
    const product = order ? store.data.products.find((p) => p.id === order.productId) : undefined;
    const detail = ctx.deliveryDetail(delivery.orderId).find((d) => d.id === delivery.id);
    if (!order || !site || !product || !detail) {
      throw new ApiClientError(ErrorCode.INTERNAL_ERROR, { details: { deliveryId: delivery.id } });
    }
    return {
      ...detail,
      order: {
        id: order.id,
        number: order.number,
        productGrade: product.grade,
        slump: order.slump,
        totalVolumeM3: order.volumeM3,
        pumpRequired: order.pumpRequired,
        requestedDate: order.requestedDate,
        timeWindowStart: order.timeWindowStart,
        timeWindowEnd: order.timeWindowEnd,
        customerNote: order.customerNote,
        customerPhone: store.findUserById(order.customerId)?.phone ?? '',
      },
      site: {
        name: site.name,
        addressLine: site.addressLine,
        location: site.location,
        accessNotes: site.accessNotes,
        contactName: order.siteContactName ?? site.contactName,
        contactPhone: order.siteContactPhone || site.contactPhone,
      },
    };
  };

  /** The Baku calendar day a trip belongs to: planned departure, else the order's window day. */
  const tripDate = (delivery: Delivery): IsoDate | null => {
    if (delivery.plannedDepartureAt) return bakuDate(new Date(delivery.plannedDepartureAt));
    return store.findOrder(delivery.orderId)?.requestedDate ?? null;
  };

  const denied = (delivery: Delivery, to: DeliveryStatus, denial: string): ApiClientError =>
    new ApiClientError(ErrorCode.INVALID_STATE_TRANSITION, {
      details: { deliveryId: delivery.id, from: delivery.status, to, denial },
    });

  const etaTo = (delivery: Delivery, point: { lat: number; lng: number }): number => {
    const site = store.findSite(store.findOrder(delivery.orderId)?.siteId ?? '');
    if (!site) return 0;
    const km = haversineKm(point, site.location);
    return Math.max(1, Math.round((km / MOCK_AVERAGE_SPEED_KMH) * 60));
  };

  return {
    async me() {
      await delay();
      return currentDriver();
    },

    async setShift(input) {
      await delay();
      const driver = currentDriver();
      const data = parse<ShiftInput>(shiftSchema, input);
      if (data.truckId !== undefined && data.truckId !== null) {
        const truck = store.data.trucks.find((t) => t.id === data.truckId && t.isActive);
        if (!truck) {
          throw new ApiClientError(ErrorCode.NOT_FOUND, { details: { truckId: data.truckId } });
        }
        for (const t of store.data.trucks)
          if (t.currentDriverId === driver.id) t.currentDriverId = null;
        truck.currentDriverId = driver.id;
        driver.currentTruckId = truck.id;
      } else if (data.truckId === null) {
        for (const t of store.data.trucks)
          if (t.currentDriverId === driver.id) t.currentDriverId = null;
        driver.currentTruckId = null;
      }
      driver.isOnShift = data.onShift;
      driver.lastSeenAt = now().toISOString();
      return driver;
    },

    async listDeliveries(date) {
      await delay();
      const driver = currentDriver();
      const day = date ?? bakuDate(now());
      return store
        .deliveriesOfDriver(driver.id)
        .filter((d) => tripDate(d) === day)
        .map(toDriverDelivery);
    },

    async getDelivery(id) {
      await delay();
      return toDriverDelivery(ownedDelivery(id));
    },

    async setStatus(id, input) {
      await delay();
      const driver = currentDriver();
      const delivery = ownedDelivery(id);
      const { to, reason } = parse<DriverStatusInput>(driverStatusSchema, input);
      if (to === DeliveryStatus.COMPLETED) {
        // Completion carries the handover act (receiver + photos): a separate call.
        throw new ApiClientError(ErrorCode.VALIDATION_ERROR, {
          details: { field: 'to', message: 'Use complete() to finish a trip' },
        });
      }
      const check = checkDeliveryTransition(delivery.status, to, {
        actor: DeliveryActor.DRIVER,
        reason: reason ?? null,
      });
      if (!check.allowed) throw denied(delivery, to, check.denial);
      const at = now();
      if (to === DeliveryStatus.FAILED) delivery.failReason = reason ?? null;
      store.driverControlled.add(delivery.id);
      tracker.applyStatus(delivery, to, at, { id: driver.id, role: UserRole.DRIVER });
      tracker.syncOrder(delivery.orderId, at);
      driver.lastSeenAt = at.toISOString();
      return toDriverDelivery(delivery);
    },

    async pushLocations(id, batch) {
      await delay();
      const driver = currentDriver();
      const delivery = ownedDelivery(id);
      const points = parse<LocationBatchInput>(locationBatchSchema, batch);
      if (!isTrackingDeliveryStatus(delivery.status)) {
        throw denied(delivery, delivery.status, 'NOT_TRACKING');
      }
      // Spec §9.2: drop inaccurate points, order by time, dedupe, ignore anything already seen.
      const seen = new Set<string>();
      const accepted = points
        .filter((p) => p.accuracyM === null || p.accuracyM <= MAX_ACCURACY_M)
        .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
        .filter((p) => {
          if (seen.has(p.recordedAt)) return false;
          seen.add(p.recordedAt);
          return !delivery.lastLocationAt || p.recordedAt > delivery.lastLocationAt;
        });
      for (const p of accepted) {
        store.addLocation({
          deliveryId: delivery.id,
          location: { lat: p.lat, lng: p.lng },
          speedKmh: p.speedKmh,
          heading: p.heading,
          accuracyM: p.accuracyM,
          recordedAt: p.recordedAt,
        });
      }
      const last = accepted.at(-1);
      if (last) {
        const point = { lat: last.lat, lng: last.lng };
        delivery.lastLocation = point;
        delivery.lastLocationAt = last.recordedAt;
        delivery.lastSpeedKmh = last.speedKmh;
        delivery.lastHeading = last.heading;
        delivery.etaMinutes =
          delivery.status === DeliveryStatus.ARRIVED ? 0 : etaTo(delivery, point);
        store.driverControlled.add(delivery.id);
        tracker.events.emit('location', {
          deliveryId: delivery.id,
          orderId: delivery.orderId,
          lat: point.lat,
          lng: point.lng,
          heading: last.heading,
          speedKmh: last.speedKmh,
          etaMinutes: delivery.etaMinutes,
          at: last.recordedAt,
        });
      }
      driver.lastSeenAt = now().toISOString();
      return { accepted: accepted.length };
    },

    async complete(id, input) {
      await delay();
      const driver = currentDriver();
      const delivery = ownedDelivery(id);
      const data = parse<CompleteDeliveryData>(completeDeliverySchema, input);
      const check = checkDeliveryTransition(delivery.status, DeliveryStatus.COMPLETED, {
        actor: DeliveryActor.DRIVER,
      });
      if (!check.allowed) throw denied(delivery, DeliveryStatus.COMPLETED, check.denial);
      const at = now();
      store.driverControlled.add(delivery.id);
      store.data.documents.push({
        id: store.nextDocumentId(delivery.id),
        deliveryId: delivery.id,
        number: store.documentNumberFor(delivery),
        pdfUrl: null,
        photoUrls: data.photoUris,
        signatureUrl: null,
        receivedByName: data.receivedByName,
        receivedAt: at.toISOString(),
      });
      tracker.applyStatus(delivery, DeliveryStatus.COMPLETED, at, {
        id: driver.id,
        role: UserRole.DRIVER,
      });
      tracker.syncOrder(delivery.orderId, at);
      driver.lastSeenAt = at.toISOString();
      return toDriverDelivery(delivery);
    },
  };
}
