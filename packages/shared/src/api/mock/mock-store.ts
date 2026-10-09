import type { GeoPoint, Id, IsoDateTime } from '../../domain/common';
import type { Delivery, DeliveryDocument, DeliveryLocation } from '../../domain/delivery';
import type { Order, OrderEvent, OrderEventType } from '../../domain/order';
import type { Site } from '../../domain/site';
import type { CustomerAccount, User } from '../../domain/user';
import type { DeliveryStatus, OrderStatus, UserRole } from '../../enums';
import { createFixtures, type FixtureSet, orderNumber, TRACKED_DELIVERY_ID } from '../../fixtures';

/**
 * Mutable in-memory state behind the mock API client. Built from the fixtures; every method on
 * the client reads and writes here. Deterministic ids make tests and bug reports reproducible.
 */
export class MockStore {
  readonly data: FixtureSet;
  /** Fraction (0..1) of the route already driven, per tracked delivery. */
  readonly routeProgress = new Map<Id, number>();
  /** Pending OTP codes by phone. */
  readonly otpCodes = new Map<string, string>();
  /** Issued refresh tokens → user id (logout invalidates). */
  readonly refreshTokens = new Map<string, Id>();
  private counters = { order: 0, site: 0, event: 0, delivery: 0, document: 0, user: 0 };

  constructor(fixtures?: FixtureSet) {
    this.data = fixtures ?? createFixtures();
    this.routeProgress.set(TRACKED_DELIVERY_ID, 0.35);
    this.counters.order = Math.max(0, ...this.data.orders.map((o) => Number(o.number.slice(-6))));
    this.counters.event = this.data.events.length;
    this.counters.site = this.data.sites.length;
    this.counters.delivery = this.data.deliveries.length;
    this.counters.document = this.data.documents.length;
    this.counters.user = this.data.users.length;
  }

  // ----- lookups -------------------------------------------------------------------------------

  findUserByPhone(phone: string): User | undefined {
    return this.data.users.find((u) => u.phone === phone);
  }

  findUserById(id: Id): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  }

  findCustomer(userId: Id): CustomerAccount | undefined {
    return this.data.customers.find((c) => c.id === userId);
  }

  ordersOf(customerId: Id): Order[] {
    return this.data.orders.filter((o) => o.customerId === customerId);
  }

  findOrder(id: Id): Order | undefined {
    return this.data.orders.find((o) => o.id === id);
  }

  deliveriesOf(orderId: Id): Delivery[] {
    return this.data.deliveries
      .filter((d) => d.orderId === orderId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  findDelivery(id: Id): Delivery | undefined {
    return this.data.deliveries.find((d) => d.id === id);
  }

  eventsOf(orderId: Id): OrderEvent[] {
    return this.data.events
      .filter((e) => e.orderId === orderId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  documentsOf(orderId: Id): DeliveryDocument[] {
    const deliveryIds = new Set(this.deliveriesOf(orderId).map((d) => d.id));
    return this.data.documents.filter((doc) => deliveryIds.has(doc.deliveryId));
  }

  sitesOf(customerId: Id): Site[] {
    return this.data.sites.filter((s) => s.customerId === customerId);
  }

  findSite(id: Id): Site | undefined {
    return this.data.sites.find((s) => s.id === id);
  }

  routeOf(deliveryId: Id): GeoPoint[] | undefined {
    return this.data.routes[deliveryId];
  }

  // ----- ids -----------------------------------------------------------------------------------

  nextOrderNumber(): { id: Id; number: string } {
    this.counters.order += 1;
    return { id: `ord_${this.counters.order}`, number: orderNumber(this.counters.order) };
  }

  nextSiteId(): Id {
    this.counters.site += 1;
    return `site_${this.counters.site}`;
  }

  nextDeliveryId(orderId: Id, sequence: number): Id {
    this.counters.delivery += 1;
    return `del_${orderId.replace(/^ord_/, '')}_${sequence}`;
  }

  nextDocumentId(deliveryId: Id): Id {
    this.counters.document += 1;
    return `doc_${deliveryId.replace(/^del_/, '')}`;
  }

  nextUserId(): Id {
    this.counters.user += 1;
    return `cust_${this.counters.user}`;
  }

  // ----- mutations -----------------------------------------------------------------------------

  addEvent(input: {
    orderId: Id;
    type: OrderEventType;
    at: IsoDateTime;
    fromStatus?: OrderStatus | null;
    toStatus?: OrderStatus | null;
    actorId?: Id | null;
    actorRole?: UserRole | null;
    payload?: Record<string, unknown>;
  }): OrderEvent {
    this.counters.event += 1;
    const event: OrderEvent = {
      id: `evt_${this.counters.event.toString().padStart(4, '0')}`,
      orderId: input.orderId,
      type: input.type,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      payload: input.payload ?? {},
      createdAt: input.at,
    };
    this.data.events.push(event);
    return event;
  }

  addLocation(sample: DeliveryLocation): void {
    this.data.locations.push(sample);
  }

  setDeliveryStatus(delivery: Delivery, status: DeliveryStatus, at: IsoDateTime): void {
    delivery.status = status;
    switch (status) {
      case 'EN_ROUTE':
        delivery.departedAt = at;
        break;
      case 'ARRIVED':
        delivery.arrivedAt = at;
        delivery.etaMinutes = 0;
        break;
      case 'UNLOADING':
        delivery.unloadStartedAt = at;
        break;
      case 'COMPLETED':
        delivery.completedAt = at;
        break;
      default:
        break;
    }
  }
}
