import type { GeoPoint, Id, IsoDate, IsoDateTime, TimeOfDay } from '../domain/common';
import type { Delivery, DeliveryDocument, DeliveryLocation } from '../domain/delivery';
import type { Order, OrderEvent, PricingBreakdown } from '../domain/order';
import type { Product, PumpOption } from '../domain/product';
import type { Supplier } from '../domain/supplier';
import {
  DeliveryStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  SlumpClass,
  UserRole,
} from '../enums';
import { OrderEventType } from '../domain/order';
import { interpolateAlongPolyline, polylineLengthKm } from '../geo/geo';
import { calculateQuote } from '../pricing/calculate-quote';
import { PUMP_24M_ID } from './catalog';
import { CUSTOMER_IDS, SITE_IDS, STAFF } from './customers';
import { DRIVER_IDS, TRUCK_IDS } from './fleet';
import { MOCK_AVERAGE_SPEED_KMH } from './routes';
import { SUPPLIER_ID } from './supplier';
import { bakuDate, bakuHourSlot, minutesAgo, minutesFromNow } from './time';

export const ORDER_IDS = {
  pending: 'ord_101',
  confirmed: 'ord_102',
  scheduled: 'ord_103',
  inProgress: 'ord_104',
  completed: 'ord_105',
  cancelled: 'ord_106',
} as const;

/** The delivery the mock tracker animates on the customer map. */
export const TRACKED_DELIVERY_ID = 'del_104_2';

export interface OrderFixtureSet {
  orders: Order[];
  deliveries: Delivery[];
  events: OrderEvent[];
  documents: DeliveryDocument[];
  locations: DeliveryLocation[];
  /** Route polyline per delivery id (only tracked ones). */
  routes: Record<Id, GeoPoint[]>;
}

export interface OrderFixtureContext {
  now: Date;
  supplier: Supplier;
  products: Product[];
  pumpOptions: PumpOption[];
  routeToYasamal: GeoPoint[];
}

export function orderNumber(seq: number, year = 2026): string {
  return `CN-${year}-${seq.toString().padStart(6, '0')}`;
}

export function createOrderFixtures(ctx: OrderFixtureContext): OrderFixtureSet {
  const { now, supplier, products, pumpOptions, routeToYasamal } = ctx;
  const set: OrderFixtureSet = {
    orders: [],
    deliveries: [],
    events: [],
    documents: [],
    locations: [],
    routes: {},
  };
  const productByGrade = (grade: string): Product => {
    const product = products.find((p) => p.grade === grade);
    if (!product) throw new Error(`fixture product missing: ${grade}`);
    return product;
  };
  const pump = pumpOptions.find((p) => p.id === PUMP_24M_ID) ?? null;

  const price = (product: Product, volumeM3: number, withPump: boolean): PricingBreakdown => {
    const result = calculateQuote({
      product,
      volumeM3,
      pumpOption: withPump ? pump : null,
      settings: supplier.settings,
    });
    if (!result.ok) throw new Error(`fixture quote failed: ${result.code}`);
    return result.breakdown;
  };

  let eventSeq = 0;
  const pushEvent = (
    orderId: Id,
    type: OrderEvent['type'],
    at: IsoDateTime,
    extra: Partial<
      Pick<OrderEvent, 'fromStatus' | 'toStatus' | 'actorId' | 'actorRole' | 'payload'>
    > = {},
  ): void => {
    eventSeq += 1;
    set.events.push({
      id: `evt_${eventSeq.toString().padStart(4, '0')}`,
      orderId,
      type,
      fromStatus: extra.fromStatus ?? null,
      toStatus: extra.toStatus ?? null,
      actorId: extra.actorId ?? null,
      actorRole: extra.actorRole ?? null,
      payload: extra.payload ?? {},
      createdAt: at,
    });
  };

  const statusChange = (
    orderId: Id,
    from: OrderStatus,
    to: OrderStatus,
    at: IsoDateTime,
    actor: { id: Id; role: UserRole } | null,
    payload: Record<string, unknown> = {},
  ): void =>
    pushEvent(orderId, OrderEventType.STATUS_CHANGED, at, {
      fromStatus: from,
      toStatus: to,
      actorId: actor?.id ?? null,
      actorRole: actor?.role ?? null,
      payload,
    });

  const dispatcher = { id: STAFF.dispatcher.id, role: UserRole.DISPATCHER };
  const customer = { id: CUSTOMER_IDS.orxan, role: UserRole.CUSTOMER };

  interface BaseOrder {
    id: Id;
    seq: number;
    siteId: Id;
    grade: string;
    volumeM3: number;
    slump: SlumpClass;
    withPump: boolean;
    requestedDate: IsoDate;
    window: [TimeOfDay, TimeOfDay];
    status: OrderStatus;
    createdAt: IsoDateTime;
    confirmedAt?: IsoDateTime | null;
    completedAt?: IsoDateTime | null;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    customerNote?: string | null;
    cancelReason?: string | null;
    cancelledBy?: UserRole | null;
  }

  const makeOrder = (o: BaseOrder): Order => {
    const product = productByGrade(o.grade);
    const pricing = price(product, o.volumeM3, o.withPump);
    const order: Order = {
      id: o.id,
      number: orderNumber(o.seq),
      supplierId: SUPPLIER_ID,
      customerId: CUSTOMER_IDS.orxan,
      siteId: o.siteId,
      productId: product.id,
      volumeM3: o.volumeM3,
      slump: o.slump,
      pumpRequired: o.withPump,
      pumpOptionId: o.withPump ? PUMP_24M_ID : null,
      requestedDate: o.requestedDate,
      timeWindowStart: o.window[0],
      timeWindowEnd: o.window[1],
      status: o.status,
      pricing,
      totalAmount: pricing.total,
      paymentMethod: o.paymentMethod ?? PaymentMethod.CASH,
      paymentStatus: o.paymentStatus ?? PaymentStatus.UNPAID,
      customerNote: o.customerNote ?? null,
      internalNote: null,
      cancelReason: o.cancelReason ?? null,
      cancelledBy: o.cancelledBy ?? null,
      createdAt: o.createdAt,
      confirmedAt: o.confirmedAt ?? null,
      completedAt: o.completedAt ?? null,
    };
    set.orders.push(order);
    pushEvent(order.id, OrderEventType.CREATED, o.createdAt, {
      toStatus: OrderStatus.PENDING,
      actorId: CUSTOMER_IDS.orxan,
      actorRole: UserRole.CUSTOMER,
      payload: { number: order.number, total: pricing.total },
    });
    return order;
  };

  const makeDelivery = (
    d: Partial<Delivery> & Pick<Delivery, 'id' | 'orderId' | 'sequence' | 'volumeM3' | 'status'>,
  ): Delivery => {
    const delivery: Delivery = {
      supplierId: SUPPLIER_ID,
      truckId: null,
      driverId: null,
      plannedDepartureAt: null,
      departedAt: null,
      arrivedAt: null,
      unloadStartedAt: null,
      completedAt: null,
      lastLocation: null,
      lastLocationAt: null,
      lastSpeedKmh: null,
      lastHeading: null,
      etaMinutes: null,
      failReason: null,
      ...d,
    };
    set.deliveries.push(delivery);
    return delivery;
  };

  // 101 — PENDING, created an hour ago for tomorrow morning
  makeOrder({
    id: ORDER_IDS.pending,
    seq: 101,
    siteId: SITE_IDS.yasamal,
    grade: 'M300',
    volumeM3: 12,
    slump: SlumpClass.P3,
    withPump: false,
    requestedDate: bakuDate(now, 1),
    window: ['08:00', '10:00'],
    status: OrderStatus.PENDING,
    createdAt: minutesAgo(now, 60),
    customerNote: 'Səhər tez gəlsə yaxşı olar, usta 8-də gəlir.',
  });

  // 102 — CONFIRMED with a 24 m pump (200 ₼ per order, not taxed), day after tomorrow
  {
    const order = makeOrder({
      id: ORDER_IDS.confirmed,
      seq: 102,
      siteId: SITE_IDS.xirdalan,
      grade: 'M250',
      volumeM3: 8,
      slump: SlumpClass.P4,
      withPump: true,
      requestedDate: bakuDate(now, 2),
      window: ['10:00', '12:00'],
      status: OrderStatus.CONFIRMED,
      createdAt: minutesAgo(now, 300),
      confirmedAt: minutesAgo(now, 240),
      paymentMethod: PaymentMethod.CARD,
    });
    statusChange(
      order.id,
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      minutesAgo(now, 240),
      dispatcher,
    );
  }

  // 103 — SCHEDULED for tomorrow afternoon: 10 + 5 m³
  {
    const order = makeOrder({
      id: ORDER_IDS.scheduled,
      seq: 103,
      siteId: SITE_IDS.yasamal,
      grade: 'M400',
      volumeM3: 15,
      slump: SlumpClass.P3,
      withPump: false,
      requestedDate: bakuDate(now, 1),
      window: ['14:00', '16:00'],
      status: OrderStatus.SCHEDULED,
      createdAt: minutesAgo(now, 1500),
      confirmedAt: minutesAgo(now, 1400),
    });
    statusChange(
      order.id,
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      minutesAgo(now, 1400),
      dispatcher,
    );
    statusChange(
      order.id,
      OrderStatus.CONFIRMED,
      OrderStatus.SCHEDULED,
      minutesAgo(now, 1300),
      dispatcher,
      {
        deliveries: 2,
      },
    );
    makeDelivery({
      id: 'del_103_1',
      orderId: order.id,
      sequence: 1,
      volumeM3: 10,
      status: DeliveryStatus.ASSIGNED,
      truckId: TRUCK_IDS.mixer10a,
      driverId: DRIVER_IDS.elshan,
      plannedDepartureAt: minutesFromNow(now, 24 * 60 + 90),
    });
    makeDelivery({
      id: 'del_103_2',
      orderId: order.id,
      sequence: 2,
      volumeM3: 5,
      status: DeliveryStatus.PLANNED,
      plannedDepartureAt: minutesFromNow(now, 24 * 60 + 150),
    });
  }

  // 104 — IN_PROGRESS today: 25 m³ = 10 (done) + 10 (en route, tracked) + 5 (assigned)
  {
    const windowStart = bakuHourSlot(now, -1);
    const windowEnd = bakuHourSlot(now, 1);
    const order = makeOrder({
      id: ORDER_IDS.inProgress,
      seq: 104,
      siteId: SITE_IDS.yasamal,
      grade: 'M300',
      volumeM3: 25,
      slump: SlumpClass.P4,
      withPump: true,
      requestedDate: bakuDate(now, 0),
      window: [windowStart, windowEnd],
      status: OrderStatus.IN_PROGRESS,
      createdAt: minutesAgo(now, 2 * 24 * 60),
      confirmedAt: minutesAgo(now, 2 * 24 * 60 - 30),
      paymentStatus: PaymentStatus.PARTIAL,
    });
    statusChange(
      order.id,
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      minutesAgo(now, 2 * 24 * 60 - 30),
      dispatcher,
    );
    statusChange(
      order.id,
      OrderStatus.CONFIRMED,
      OrderStatus.SCHEDULED,
      minutesAgo(now, 24 * 60),
      dispatcher,
      {
        deliveries: 3,
      },
    );

    makeDelivery({
      id: 'del_104_1',
      orderId: order.id,
      sequence: 1,
      volumeM3: 10,
      status: DeliveryStatus.COMPLETED,
      truckId: TRUCK_IDS.mixer12a,
      driverId: DRIVER_IDS.rauf,
      plannedDepartureAt: minutesAgo(now, 125),
      departedAt: minutesAgo(now, 120),
      arrivedAt: minutesAgo(now, 85),
      unloadStartedAt: minutesAgo(now, 80),
      completedAt: minutesAgo(now, 50),
      lastLocation: routeToYasamal[routeToYasamal.length - 1] ?? null,
      lastLocationAt: minutesAgo(now, 85),
      lastSpeedKmh: 0,
      lastHeading: null,
      etaMinutes: 0,
    });
    set.documents.push({
      id: 'doc_104_1',
      deliveryId: 'del_104_1',
      number: 'TA-2026-000104-1',
      pdfUrl: null,
      photoUrls: [],
      signatureUrl: null,
      receivedByName: 'Orxan Məmmədli',
      receivedAt: minutesAgo(now, 50),
    });
    statusChange(
      order.id,
      OrderStatus.SCHEDULED,
      OrderStatus.IN_PROGRESS,
      minutesAgo(now, 120),
      null,
      {
        deliveryId: 'del_104_1',
      },
    );
    pushEvent(order.id, OrderEventType.DELIVERY_STATUS_CHANGED, minutesAgo(now, 50), {
      actorId: DRIVER_IDS.rauf,
      actorRole: UserRole.DRIVER,
      payload: { deliveryId: 'del_104_1', sequence: 1, status: DeliveryStatus.COMPLETED },
    });

    // the tracked trip: departed 20 minutes ago, 35 % of the way
    const fraction = 0.35;
    const position = interpolateAlongPolyline(routeToYasamal, fraction);
    const remainingKm = polylineLengthKm(routeToYasamal) * (1 - fraction);
    const etaMinutes = Math.max(1, Math.round((remainingKm / MOCK_AVERAGE_SPEED_KMH) * 60));
    makeDelivery({
      id: TRACKED_DELIVERY_ID,
      orderId: order.id,
      sequence: 2,
      volumeM3: 10,
      status: DeliveryStatus.EN_ROUTE,
      truckId: TRUCK_IDS.mixer10a,
      driverId: DRIVER_IDS.elshan,
      plannedDepartureAt: minutesAgo(now, 25),
      departedAt: minutesAgo(now, 20),
      lastLocation: position.point,
      lastLocationAt: minutesAgo(now, 0.2),
      lastSpeedKmh: MOCK_AVERAGE_SPEED_KMH,
      lastHeading: Math.round(position.heading),
      etaMinutes,
    });
    set.routes[TRACKED_DELIVERY_ID] = routeToYasamal;
    const samples = 20;
    for (let i = 0; i <= samples; i += 1) {
      const f = (fraction * i) / samples;
      const p = interpolateAlongPolyline(routeToYasamal, f);
      set.locations.push({
        deliveryId: TRACKED_DELIVERY_ID,
        location: p.point,
        speedKmh: i === 0 ? 0 : MOCK_AVERAGE_SPEED_KMH,
        heading: Math.round(p.heading),
        accuracyM: 8,
        recordedAt: minutesAgo(now, 20 - i),
      });
    }
    pushEvent(order.id, OrderEventType.DELIVERY_STATUS_CHANGED, minutesAgo(now, 20), {
      actorId: DRIVER_IDS.elshan,
      actorRole: UserRole.DRIVER,
      payload: { deliveryId: TRACKED_DELIVERY_ID, sequence: 2, status: DeliveryStatus.EN_ROUTE },
    });

    makeDelivery({
      id: 'del_104_3',
      orderId: order.id,
      sequence: 3,
      volumeM3: 5,
      status: DeliveryStatus.ASSIGNED,
      truckId: TRUCK_IDS.mixer8a,
      driverId: DRIVER_IDS.rauf,
      plannedDepartureAt: minutesFromNow(now, 40),
    });
  }

  // 105 — COMPLETED three days ago, with a signed delivery note
  {
    const daysAgo = 3;
    const base = -daysAgo * 24 * 60;
    const order = makeOrder({
      id: ORDER_IDS.completed,
      seq: 105,
      siteId: SITE_IDS.xirdalan,
      grade: 'M200',
      volumeM3: 12,
      slump: SlumpClass.P2,
      withPump: false,
      requestedDate: bakuDate(now, -daysAgo),
      window: ['09:00', '11:00'],
      status: OrderStatus.COMPLETED,
      createdAt: minutesAgo(now, -base + 24 * 60),
      confirmedAt: minutesAgo(now, -base + 23 * 60),
      completedAt: minutesAgo(now, -base - 150),
      paymentStatus: PaymentStatus.PAID,
    });
    statusChange(
      order.id,
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      minutesAgo(now, -base + 23 * 60),
      dispatcher,
    );
    statusChange(
      order.id,
      OrderStatus.CONFIRMED,
      OrderStatus.SCHEDULED,
      minutesAgo(now, -base + 20 * 60),
      dispatcher,
      {
        deliveries: 1,
      },
    );
    statusChange(
      order.id,
      OrderStatus.SCHEDULED,
      OrderStatus.IN_PROGRESS,
      minutesAgo(now, -base - 30),
      null,
    );
    makeDelivery({
      id: 'del_105_1',
      orderId: order.id,
      sequence: 1,
      volumeM3: 12,
      status: DeliveryStatus.COMPLETED,
      truckId: TRUCK_IDS.mixer12b,
      driverId: DRIVER_IDS.kamran,
      plannedDepartureAt: minutesAgo(now, -base - 20),
      departedAt: minutesAgo(now, -base - 30),
      arrivedAt: minutesAgo(now, -base - 70),
      unloadStartedAt: minutesAgo(now, -base - 75),
      completedAt: minutesAgo(now, -base - 150),
      lastSpeedKmh: 0,
      etaMinutes: 0,
    });
    set.documents.push({
      id: 'doc_105_1',
      deliveryId: 'del_105_1',
      number: 'TA-2026-000105-1',
      pdfUrl: null,
      photoUrls: [],
      signatureUrl: null,
      receivedByName: 'Usta Vüqar',
      receivedAt: minutesAgo(now, -base - 150),
    });
    statusChange(
      order.id,
      OrderStatus.IN_PROGRESS,
      OrderStatus.COMPLETED,
      minutesAgo(now, -base - 150),
      null,
    );
  }

  // 106 — CANCELLED by the customer a week ago
  {
    const base = 7 * 24 * 60;
    const order = makeOrder({
      id: ORDER_IDS.cancelled,
      seq: 106,
      siteId: SITE_IDS.yasamal,
      grade: 'M350',
      volumeM3: 8,
      slump: SlumpClass.P3,
      withPump: false,
      requestedDate: bakuDate(now, -6),
      window: ['16:00', '18:00'],
      status: OrderStatus.CANCELLED,
      createdAt: minutesAgo(now, base),
      cancelReason: 'Tikinti təxirə salındı',
      cancelledBy: UserRole.CUSTOMER,
    });
    statusChange(
      order.id,
      OrderStatus.PENDING,
      OrderStatus.CANCELLED,
      minutesAgo(now, base - 120),
      customer,
      {
        reason: 'Tikinti təxirə salındı',
      },
    );
  }

  // chronological event order (fixtures above are grouped by order)
  set.events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return set;
}
