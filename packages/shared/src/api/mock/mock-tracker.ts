import type { Delivery, LiveLocation } from '../../domain/delivery';
import { OrderEventType } from '../../domain/order';
import { DeliveryStatus, OrderStatus, UserRole } from '../../enums';
import { MOCK_AVERAGE_SPEED_KMH } from '../../fixtures/routes';
import { interpolateAlongPolyline, polylineLengthKm } from '../../geo/geo';
import { deriveOrderStatus } from '../../state-machines/delivery-state.machine';
import type { DeliveryStatusEvent, OrderStatusEvent } from '../api-client';
import { Emitter } from './emitter';
import type { MockStore } from './mock-store';

export interface MockTrackerOptions {
  store: MockStore;
  now?: () => Date;
  /** Simulated mixer speed along the route (spec §9 fallback uses the same number). */
  averageSpeedKmh?: number;
  /** Real-time interval between ticks when started. */
  tickMs?: number;
  /** Simulated dwell times after arrival (demo-friendly defaults). */
  unloadingAfterMs?: number;
  completeAfterMs?: number;
}

export interface TrackerEvents extends Record<string, unknown> {
  location: LiveLocation;
  deliveryStatus: DeliveryStatusEvent;
  orderStatus: OrderStatusEvent;
}

/**
 * Stands in for the driver phone + Socket.IO pipeline (spec §9): moves every EN_ROUTE delivery that
 * has a route along it, arrives at the end, unloads, completes, and promotes the order status.
 * `tick(dtMs)` is deterministic for tests; `start()` drives it with a timer for the apps.
 */
export class MockTracker {
  readonly events = new Emitter<TrackerEvents>();
  private readonly store: MockStore;
  private readonly now: () => Date;
  private readonly speedKmh: number;
  private readonly tickMs: number;
  private readonly unloadingAfterMs: number;
  private readonly completeAfterMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastTickAt: number | null = null;

  constructor(options: MockTrackerOptions) {
    this.store = options.store;
    this.now = options.now ?? (() => new Date());
    this.speedKmh = options.averageSpeedKmh ?? MOCK_AVERAGE_SPEED_KMH;
    this.tickMs = options.tickMs ?? 5000;
    this.unloadingAfterMs = options.unloadingAfterMs ?? 45_000;
    this.completeAfterMs = options.completeAfterMs ?? 90_000;
  }

  get running(): boolean {
    return this.timer !== null;
  }

  start(): void {
    if (this.timer) return;
    this.lastTickAt = this.now().getTime();
    this.timer = setInterval(() => {
      const t = this.now().getTime();
      const elapsed = this.lastTickAt === null ? 0 : t - this.lastTickAt;
      const dt = elapsed > 0 ? elapsed : this.tickMs; // fixed clocks (tests) still advance
      this.lastTickAt = t;
      this.tick(dt);
    }, this.tickMs);
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    this.lastTickAt = null;
  }

  /** Advance the simulation by `dtMs` of travel time. */
  tick(dtMs: number): void {
    const at = this.now();
    for (const delivery of this.store.data.deliveries) {
      switch (delivery.status) {
        case DeliveryStatus.EN_ROUTE:
          this.advance(delivery, dtMs, at);
          break;
        case DeliveryStatus.ARRIVED:
          if (
            delivery.arrivedAt &&
            at.getTime() - Date.parse(delivery.arrivedAt) >= this.unloadingAfterMs
          ) {
            this.setStatus(delivery, DeliveryStatus.UNLOADING, at);
          }
          break;
        case DeliveryStatus.UNLOADING:
          if (
            delivery.unloadStartedAt &&
            at.getTime() - Date.parse(delivery.unloadStartedAt) >= this.completeAfterMs
          ) {
            this.complete(delivery, at);
          }
          break;
        default:
          break;
      }
    }
  }

  private advance(delivery: Delivery, dtMs: number, at: Date): void {
    const route = this.store.routeOf(delivery.id);
    if (!route || route.length < 2) return;
    const lengthKm = polylineLengthKm(route);
    const travelledKm = (this.speedKmh * dtMs) / 3_600_000;
    const previous = this.store.routeProgress.get(delivery.id) ?? 0;
    const fraction = lengthKm === 0 ? 1 : Math.min(1, previous + travelledKm / lengthKm);
    this.store.routeProgress.set(delivery.id, fraction);

    const position = interpolateAlongPolyline(route, fraction);
    const remainingKm = lengthKm * (1 - fraction);
    const etaMinutes =
      fraction >= 1 ? 0 : Math.max(1, Math.round((remainingKm / this.speedKmh) * 60));
    const speed = fraction >= 1 ? 0 : this.speedKmh;

    delivery.lastLocation = position.point;
    delivery.lastLocationAt = at.toISOString();
    delivery.lastSpeedKmh = speed;
    delivery.lastHeading = Math.round(position.heading);
    delivery.etaMinutes = etaMinutes;
    this.store.addLocation({
      deliveryId: delivery.id,
      location: position.point,
      speedKmh: speed,
      heading: delivery.lastHeading,
      accuracyM: 8,
      recordedAt: delivery.lastLocationAt,
    });
    this.events.emit('location', {
      deliveryId: delivery.id,
      orderId: delivery.orderId,
      lat: position.point.lat,
      lng: position.point.lng,
      heading: delivery.lastHeading,
      speedKmh: speed,
      etaMinutes,
      at: delivery.lastLocationAt,
    });

    if (fraction >= 1) this.setStatus(delivery, DeliveryStatus.ARRIVED, at);
  }

  private setStatus(delivery: Delivery, status: DeliveryStatus, at: Date): void {
    this.store.setDeliveryStatus(delivery, status, at.toISOString());
    this.store.addEvent({
      orderId: delivery.orderId,
      type: OrderEventType.DELIVERY_STATUS_CHANGED,
      at: at.toISOString(),
      actorRole: status === DeliveryStatus.ARRIVED ? null : UserRole.DRIVER,
      actorId: status === DeliveryStatus.ARRIVED ? null : delivery.driverId,
      payload: { deliveryId: delivery.id, sequence: delivery.sequence, status },
    });
    this.events.emit('deliveryStatus', {
      orderId: delivery.orderId,
      deliveryId: delivery.id,
      status,
      etaMinutes: delivery.etaMinutes,
      at: at.toISOString(),
    });
  }

  private complete(delivery: Delivery, at: Date): void {
    this.setStatus(delivery, DeliveryStatus.COMPLETED, at);
    const receiver = this.store.findSite(this.store.findOrder(delivery.orderId)?.siteId ?? '');
    this.store.data.documents.push({
      id: this.store.nextDocumentId(delivery.id),
      deliveryId: delivery.id,
      number: `TA-${delivery.orderId.replace(/^ord_/, '').padStart(6, '0')}-${delivery.sequence}`,
      pdfUrl: null,
      photoUrls: [],
      signatureUrl: null,
      receivedByName: receiver?.contactName ?? '—',
      receivedAt: at.toISOString(),
    });
    const order = this.store.findOrder(delivery.orderId);
    if (!order) return;
    const next = deriveOrderStatus(order.status, this.store.deliveriesOf(order.id));
    if (next && next !== order.status) {
      const from = order.status;
      order.status = next;
      if (next === OrderStatus.COMPLETED) order.completedAt = at.toISOString();
      this.store.addEvent({
        orderId: order.id,
        type: OrderEventType.STATUS_CHANGED,
        at: at.toISOString(),
        fromStatus: from,
        toStatus: next,
      });
      this.events.emit('orderStatus', { orderId: order.id, status: next, at: at.toISOString() });
    }
  }
}
