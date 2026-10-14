import type { Id, IsoDate, TimeOfDay } from '../../domain/common';
import type { Delivery, DeliveryDetail } from '../../domain/delivery';
import type {
  DispatchDelivery,
  DispatchOrderDetail,
  DispatchOrderSummary,
  LiveSnapshot,
  LiveTruck,
  TripPlan,
} from '../../domain/dispatch';
import {
  type Order,
  type OrderDetail,
  OrderEventType,
  type OrderSummary,
} from '../../domain/order';
import type { Truck } from '../../domain/truck';
import type { Driver, User } from '../../domain/user';
import { CustomerType, DeliveryStatus, OrderStatus, STAFF_ROLES, TruckType } from '../../enums';
import { ErrorCode } from '../../error-codes';
import { CONCRETE_WARNING_BEFORE_MIN } from '../../concrete/concrete-timer';
import { bakuDate } from '../../fixtures/time';
import { addMoney, isZeroMoney } from '../../money/money';
import { planDeliveries } from '../../planning/plan-deliveries';
import type { Paginated } from '../../schemas/common';
import {
  type ConfirmOrderInput,
  confirmOrderSchema,
  type DispatchCancelInput,
  dispatchCancelSchema,
  type ListDispatchOrdersData,
  listDispatchOrdersSchema,
  type ReassignDeliveryInput,
  reassignDeliverySchema,
  type RejectOrderInput,
  rejectOrderSchema,
  type ScheduleOrderInput,
  scheduleOrderSchema,
} from '../../schemas/dispatch';
import { isoDateSchema } from '../../schemas/order';
import {
  isTerminalDeliveryStatus,
  isTrackingDeliveryStatus,
} from '../../state-machines/delivery-state.machine';
import type { TransitionDenial } from '../../state-machines/errors';
import {
  checkOrderTransition,
  OrderActor,
  type OrderTransitionContext,
  windowStartToDate,
} from '../../state-machines/order-state.machine';
import type { DispatchApi, OrderLiveHandlers, Unsubscribe } from '../api-client';
import { ApiClientError } from '../errors';
import type { ParseFn } from './mock-driver-api';
import type { MockStore } from './mock-store';
import type { MockTracker } from './mock-tracker';

export interface DispatchApiContext {
  store: MockStore;
  tracker: MockTracker;
  now: () => Date;
  delay: () => Promise<void>;
  parse: ParseFn;
  currentUser: () => User;
  deliveryDetail: (orderId: Id) => DeliveryDetail[];
  toSummary: (order: Order) => OrderSummary;
  toDetail: (order: Order) => OrderDetail;
}

/** Spec §9.4: a tracked trip without a GPS sample for this long shows "no signal". */
export const NO_SIGNAL_AFTER_SEC = 120;
/** A mixer departing within this window is not proposed for another order. TODO(nurlan): real turnaround time. */
const MIXER_BUSY_WINDOW_MIN = 90;

/** Statuses in which a mixer is physically occupied by a trip. */
const BUSY_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  DeliveryStatus.LOADING,
  DeliveryStatus.EN_ROUTE,
  DeliveryStatus.ARRIVED,
  DeliveryStatus.UNLOADING,
];

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** "00:00" as a window end means midnight at the end of the day. */
function windowEndToDate(date: IsoDate, end: TimeOfDay): Date {
  const at = windowStartToDate(date, end);
  return end === '00:00' ? new Date(at.getTime() + 86_400_000) : at;
}

/**
 * Mock of the dispatcher endpoints (spec §11 `/dispatch/*`, §14): the supplier's view of every
 * order and trip. Staff only; everything is scoped by `supplierId`. Order decisions go through the
 * shared order state machine with the DISPATCHER actor and are announced through the tracker's
 * events, so the customer and driver apps in the same process see them live.
 */
export function createDispatchApi(ctx: DispatchApiContext): DispatchApi {
  const { store, tracker, now, delay, parse } = ctx;
  const supplierId = (): Id => store.data.supplier.id;

  const currentStaff = (): User => {
    const user = ctx.currentUser();
    if (!STAFF_ROLES.includes(user.role)) throw new ApiClientError(ErrorCode.FORBIDDEN);
    return user;
  };

  const supplierOrder = (id: Id): Order => {
    const order = store.findOrder(id);
    if (!order || order.supplierId !== supplierId()) throw new ApiClientError(ErrorCode.NOT_FOUND);
    return order;
  };

  const supplierDelivery = (id: Id): Delivery => {
    const delivery = store.findDelivery(id);
    if (!delivery || delivery.supplierId !== supplierId()) {
      throw new ApiClientError(ErrorCode.NOT_FOUND);
    }
    return delivery;
  };

  const activeMixers = (): Truck[] =>
    store.data.trucks.filter(
      (t) => t.supplierId === supplierId() && t.isActive && t.type === TruckType.MIXER,
    );

  const activeMixer = (id: Id): Truck => {
    const truck = activeMixers().find((t) => t.id === id);
    if (!truck) throw new ApiClientError(ErrorCode.NOT_FOUND, { details: { truckId: id } });
    return truck;
  };

  const driverById = (id: Id): Driver => {
    const driver = store.data.drivers.find((d) => d.id === id && d.supplierId === supplierId());
    if (!driver) throw new ApiClientError(ErrorCode.NOT_FOUND, { details: { driverId: id } });
    return driver;
  };

  const assertFits = (truck: Truck, volumeM3: number): void => {
    if (truck.capacityM3 !== null && volumeM3 > truck.capacityM3) {
      throw new ApiClientError(ErrorCode.VALIDATION_ERROR, {
        details: { field: 'volumeM3', truckId: truck.id, capacityM3: truck.capacityM3, volumeM3 },
      });
    }
  };

  const toDispatchSummary = (order: Order): DispatchOrderSummary => {
    const customer = store.findCustomer(order.customerId);
    const site = store.findSite(order.siteId);
    const pump = order.pumpOptionId
      ? store.data.pumpOptions.find((p) => p.id === order.pumpOptionId)
      : undefined;
    return {
      ...ctx.toSummary(order),
      customerName: customer?.fullName ?? null,
      customerPhone: customer?.phone ?? '',
      customerType: customer?.profile.customerType ?? CustomerType.INDIVIDUAL,
      siteAddressLine: site?.addressLine ?? '',
      pumpBoomLengthM: pump?.boomLengthM ?? null,
      pumpPriceKnown: !order.pumpRequired || !isZeroMoney(order.pricing.pumpFee),
    };
  };

  const toDispatchDetail = (order: Order): DispatchOrderDetail => {
    const customer = store.findCustomer(order.customerId);
    if (!customer) {
      throw new ApiClientError(ErrorCode.INTERNAL_ERROR, { details: { orderId: order.id } });
    }
    return { ...ctx.toDetail(order), customer };
  };

  const toDispatchDelivery = (delivery: Delivery): DispatchDelivery => {
    const order = store.findOrder(delivery.orderId);
    const site = order ? store.findSite(order.siteId) : undefined;
    const detail = ctx.deliveryDetail(delivery.orderId).find((d) => d.id === delivery.id);
    if (!order || !site || !detail) {
      throw new ApiClientError(ErrorCode.INTERNAL_ERROR, { details: { deliveryId: delivery.id } });
    }
    return {
      ...detail,
      orderNumber: order.number,
      productGrade: store.data.products.find((p) => p.id === order.productId)?.grade ?? '',
      siteName: site.name,
      siteLocation: site.location,
      requestedDate: order.requestedDate,
      timeWindowStart: order.timeWindowStart,
      timeWindowEnd: order.timeWindowEnd,
    };
  };

  /** The Baku calendar day a trip belongs to: planned departure, else the order's window day. */
  const tripDate = (delivery: Delivery): IsoDate | null => {
    if (delivery.plannedDepartureAt) return bakuDate(new Date(delivery.plannedDepartureAt));
    return store.findOrder(delivery.orderId)?.requestedDate ?? null;
  };

  const transitionContext = (
    order: Order,
    at: Date,
    reason: string | null,
  ): OrderTransitionContext => ({
    actor: OrderActor.DISPATCHER,
    now: at,
    windowStart: windowStartToDate(order.requestedDate, order.timeWindowStart),
    cancelCutoffHours: store.data.supplier.settings.cancelCutoffHours,
    reason,
  });

  const denied = (order: Order, to: OrderStatus, denial: TransitionDenial): ApiClientError =>
    new ApiClientError(ErrorCode.INVALID_STATE_TRANSITION, {
      details: { orderId: order.id, from: order.status, to, denial },
    });

  const assertTransition = (order: Order, to: OrderStatus, at: Date, reason: string | null) => {
    const check = checkOrderTransition(order.status, to, transitionContext(order, at, reason));
    if (!check.allowed) throw denied(order, to, check.denial);
  };

  /** Dispatcher status change: state machine, audit event, live notification (spec §8.1). */
  const transition = (
    order: Order,
    to: OrderStatus,
    staff: User,
    at: Date,
    reason: string | null,
    payload: Record<string, unknown> = {},
  ): void => {
    assertTransition(order, to, at, reason);
    const from = order.status;
    order.status = to;
    store.addEvent({
      orderId: order.id,
      type: OrderEventType.STATUS_CHANGED,
      at: at.toISOString(),
      fromStatus: from,
      toStatus: to,
      actorId: staff.id,
      actorRole: staff.role,
      payload: reason ? { ...payload, reason } : payload,
    });
    tracker.events.emit('orderStatus', { orderId: order.id, status: to, at: at.toISOString() });
  };

  /** Mixers without a trip departing close to `departureAt` (spec §8.1 proposal). */
  const mixersFreeAround = (departureAt: Date): Truck[] => {
    const busy = new Set<Id>();
    const window = MIXER_BUSY_WINDOW_MIN * 60_000;
    for (const d of store.deliveriesOfSupplier(supplierId())) {
      if (!d.truckId || isTerminalDeliveryStatus(d.status)) continue;
      const reference = d.plannedDepartureAt
        ? Date.parse(d.plannedDepartureAt)
        : BUSY_DELIVERY_STATUSES.includes(d.status)
          ? now().getTime()
          : null;
      if (reference !== null && Math.abs(reference - departureAt.getTime()) <= window) {
        busy.add(d.truckId);
      }
    }
    return activeMixers().filter((t) => !busy.has(t.id));
  };

  const suggest = (order: Order): TripPlan[] => {
    const first = windowStartToDate(order.requestedDate, order.timeWindowStart);
    const free = mixersFreeAround(first);
    return planDeliveries({
      volumeM3: order.volumeM3,
      mixers: free.length > 0 ? free : activeMixers(),
      firstDepartureAt: first,
    });
  };

  const signalLost = (delivery: Delivery, at: Date): boolean =>
    isTrackingDeliveryStatus(delivery.status) &&
    (!delivery.lastLocationAt ||
      at.getTime() - Date.parse(delivery.lastLocationAt) > NO_SIGNAL_AFTER_SEC * 1000);

  const liveSnapshot = (at: Date): LiveSnapshot => {
    const { concreteLifetimeMin } = store.data.supplier.settings;
    const deliveries = store.deliveriesOfSupplier(supplierId());
    const late: Id[] = [];
    const concreteRisk: Id[] = [];
    const noSignal: Id[] = [];
    for (const d of deliveries) {
      if (!isTrackingDeliveryStatus(d.status)) continue;
      const order = store.findOrder(d.orderId);
      if (
        order &&
        d.status === DeliveryStatus.EN_ROUTE &&
        d.etaMinutes !== null &&
        at.getTime() + d.etaMinutes * 60_000 >
          windowEndToDate(order.requestedDate, order.timeWindowEnd).getTime()
      ) {
        late.push(d.id);
      }
      if (
        d.departedAt &&
        (at.getTime() - Date.parse(d.departedAt)) / 60_000 >=
          concreteLifetimeMin - CONCRETE_WARNING_BEFORE_MIN
      ) {
        concreteRisk.push(d.id);
      }
      if (signalLost(d, at)) noSignal.push(d.id);
    }
    const trucks: LiveTruck[] = activeMixers().map((truck) => {
      const driver =
        store.data.drivers.find((dr) => dr.currentTruckId === truck.id) ??
        (truck.currentDriverId ? store.findDriver(truck.currentDriverId) : undefined) ??
        null;
      const current =
        deliveries.find(
          (d) => d.truckId === truck.id && BUSY_DELIVERY_STATUSES.includes(d.status),
        ) ?? null;
      return {
        truck,
        driver: driver ? { id: driver.id, fullName: driver.fullName, phone: driver.phone } : null,
        onShift: driver?.isOnShift ?? false,
        delivery: current ? toDispatchDelivery(current) : null,
        location: current?.lastLocation ?? null,
        locationAt: current?.lastLocationAt ?? null,
        heading: current?.lastHeading ?? null,
        speedKmh: current?.lastSpeedKmh ?? null,
        etaMinutes: current?.etaMinutes ?? null,
        signalLost: current ? signalLost(current, at) : false,
      };
    });
    return { at: at.toISOString(), trucks, alerts: { late, concreteRisk, noSignal } };
  };

  return {
    async listOrders(query) {
      await delay();
      currentStaff();
      const q = parse<ListDispatchOrdersData>(listDispatchOrdersSchema, query ?? {});
      const needle = q.search?.toLowerCase();
      const matches = (order: Order): boolean => {
        if (!needle) return true;
        const customer = store.findCustomer(order.customerId);
        const site = store.findSite(order.siteId);
        return [order.number, customer?.fullName, customer?.phone, site?.name].some((v) =>
          v?.toLowerCase().includes(needle),
        );
      };
      const all = store
        .ordersOfSupplier(supplierId())
        .filter((o) => !q.status || q.status.length === 0 || q.status.includes(o.status))
        .filter((o) => !q.date || o.requestedDate === q.date)
        .filter(matches)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const start = (q.page - 1) * q.limit;
      const result: Paginated<DispatchOrderSummary> = {
        items: all.slice(start, start + q.limit).map(toDispatchSummary),
        total: all.length,
        page: q.page,
        limit: q.limit,
      };
      return result;
    },

    async getOrder(id) {
      await delay();
      currentStaff();
      return toDispatchDetail(supplierOrder(id));
    },

    async confirm(id, input) {
      await delay();
      const staff = currentStaff();
      const order = supplierOrder(id);
      const data = parse<ConfirmOrderInput>(confirmOrderSchema, input ?? {});
      const at = now();
      // Validate everything before touching the order.
      assertTransition(order, OrderStatus.CONFIRMED, at, null);
      if (data.pumpFee !== undefined && !order.pumpRequired) {
        throw new ApiClientError(ErrorCode.VALIDATION_ERROR, {
          details: { field: 'pumpFee', message: 'The order has no pump' },
        });
      }
      if (
        data.schedule &&
        windowEndToDate(data.schedule.requestedDate, data.schedule.timeWindowEnd).getTime() <=
          windowStartToDate(data.schedule.requestedDate, data.schedule.timeWindowStart).getTime()
      ) {
        throw new ApiClientError(ErrorCode.VALIDATION_ERROR, {
          details: { field: 'timeWindowEnd', message: 'Window end must be after its start' },
        });
      }

      if (data.schedule) {
        const { requestedDate, timeWindowStart, timeWindowEnd, reason } = data.schedule;
        const from = {
          requestedDate: order.requestedDate,
          timeWindowStart: order.timeWindowStart,
          timeWindowEnd: order.timeWindowEnd,
        };
        order.requestedDate = requestedDate;
        order.timeWindowStart = timeWindowStart;
        order.timeWindowEnd = timeWindowEnd;
        store.addEvent({
          orderId: order.id,
          type: OrderEventType.SCHEDULE_CHANGED,
          at: at.toISOString(),
          actorId: staff.id,
          actorRole: staff.role,
          payload: { from, to: { requestedDate, timeWindowStart, timeWindowEnd }, reason },
        });
      }
      if (data.pumpFee !== undefined) {
        const pricing = order.pricing;
        const from = pricing.pumpFee;
        pricing.pumpFee = data.pumpFee;
        pricing.total = addMoney(
          pricing.subtotal,
          pricing.vat,
          pricing.pumpFee,
          pricing.deliveryFee,
        );
        order.totalAmount = pricing.total;
        store.addEvent({
          orderId: order.id,
          type: OrderEventType.PRICE_OVERRIDDEN,
          at: at.toISOString(),
          actorId: staff.id,
          actorRole: staff.role,
          payload: { field: 'pumpFee', from, to: data.pumpFee, total: pricing.total },
        });
      }
      if (data.priceOverride) {
        const from = order.pricing.total;
        order.pricing.total = data.priceOverride.total;
        order.pricing.overrideReason = data.priceOverride.reason;
        order.totalAmount = data.priceOverride.total;
        store.addEvent({
          orderId: order.id,
          type: OrderEventType.PRICE_OVERRIDDEN,
          at: at.toISOString(),
          actorId: staff.id,
          actorRole: staff.role,
          payload: {
            field: 'total',
            from,
            to: data.priceOverride.total,
            reason: data.priceOverride.reason,
          },
        });
      }
      if (data.internalNote !== undefined) order.internalNote = data.internalNote;
      order.confirmedAt = at.toISOString();
      transition(order, OrderStatus.CONFIRMED, staff, at, null);
      return toDispatchDetail(order);
    },

    async reject(id, input) {
      await delay();
      const staff = currentStaff();
      const order = supplierOrder(id);
      const { reason } = parse<RejectOrderInput>(rejectOrderSchema, input);
      const at = now();
      transition(order, OrderStatus.REJECTED, staff, at, reason);
      // One "why not" per order: a rejection reuses the cancellation fields.
      order.cancelReason = reason;
      order.cancelledBy = staff.role;
      return toDispatchDetail(order);
    },

    async suggestPlan(id) {
      await delay();
      currentStaff();
      const order = supplierOrder(id);
      if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
        throw denied(order, OrderStatus.SCHEDULED, 'INVALID_TRANSITION');
      }
      return suggest(order);
    },

    async schedule(id, input) {
      await delay();
      const staff = currentStaff();
      const order = supplierOrder(id);
      const { trips } = parse<ScheduleOrderInput>(scheduleOrderSchema, input);
      const at = now();
      assertTransition(order, OrderStatus.SCHEDULED, at, null);
      const sum = round2(trips.reduce((total, t) => total + t.volumeM3, 0));
      if (Math.abs(sum - order.volumeM3) > 0.01) {
        throw new ApiClientError(ErrorCode.VALIDATION_ERROR, {
          details: {
            field: 'trips',
            message: 'Trip volumes must add up to the order volume',
            sum,
            volumeM3: order.volumeM3,
          },
        });
      }
      if (new Set(trips.map((t) => t.sequence)).size !== trips.length) {
        throw new ApiClientError(ErrorCode.VALIDATION_ERROR, {
          details: { field: 'trips', message: 'Trip sequences must be unique' },
        });
      }
      // Resolve every mixer and driver before creating anything.
      const resolved = [...trips]
        .sort((a, b) => a.sequence - b.sequence)
        .map((trip) => {
          const truck = activeMixer(trip.truckId);
          assertFits(truck, trip.volumeM3);
          return { trip, driver: trip.driverId ? driverById(trip.driverId) : null };
        });
      for (const { trip, driver } of resolved) {
        const delivery: Delivery = {
          id: store.nextDeliveryId(order.id, trip.sequence),
          orderId: order.id,
          supplierId: order.supplierId,
          sequence: trip.sequence,
          volumeM3: trip.volumeM3,
          truckId: trip.truckId,
          driverId: driver?.id ?? null,
          status: driver ? DeliveryStatus.ASSIGNED : DeliveryStatus.PLANNED,
          plannedDepartureAt: trip.plannedDepartureAt,
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
        };
        store.data.deliveries.push(delivery);
      }
      transition(order, OrderStatus.SCHEDULED, staff, at, null, { deliveries: trips.length });
      return toDispatchDetail(order);
    },

    async cancel(id, input) {
      await delay();
      const staff = currentStaff();
      const order = supplierOrder(id);
      const { reason } = parse<DispatchCancelInput>(dispatchCancelSchema, input);
      const at = now();
      transition(order, OrderStatus.CANCELLED, staff, at, reason);
      order.cancelReason = reason;
      order.cancelledBy = staff.role;
      // Spec §8.1: trips that have not left the plant are cancelled with the order.
      for (const delivery of store.deliveriesOf(order.id)) {
        if (
          delivery.status === DeliveryStatus.PLANNED ||
          delivery.status === DeliveryStatus.ASSIGNED ||
          delivery.status === DeliveryStatus.LOADING
        ) {
          tracker.applyStatus(delivery, DeliveryStatus.CANCELLED, at, {
            id: staff.id,
            role: staff.role,
          });
        }
      }
      return toDispatchDetail(order);
    },

    async reassignDelivery(deliveryId, input) {
      await delay();
      const staff = currentStaff();
      const delivery = supplierDelivery(deliveryId);
      const data = parse<ReassignDeliveryInput>(reassignDeliverySchema, input);
      if (
        delivery.status !== DeliveryStatus.PLANNED &&
        delivery.status !== DeliveryStatus.ASSIGNED
      ) {
        throw new ApiClientError(ErrorCode.INVALID_STATE_TRANSITION, {
          details: {
            deliveryId: delivery.id,
            from: delivery.status,
            to: delivery.status,
            denial: 'INVALID_TRANSITION',
          },
        });
      }
      const at = now();
      if (data.truckId !== undefined) {
        const truck = activeMixer(data.truckId);
        assertFits(truck, delivery.volumeM3);
        delivery.truckId = truck.id;
      }
      if (data.driverId !== undefined) {
        delivery.driverId = data.driverId === null ? null : driverById(data.driverId).id;
      }
      if (data.plannedDepartureAt !== undefined) {
        delivery.plannedDepartureAt = data.plannedDepartureAt;
      }
      store.addEvent({
        orderId: delivery.orderId,
        type: OrderEventType.SCHEDULE_CHANGED,
        at: at.toISOString(),
        actorId: staff.id,
        actorRole: staff.role,
        payload: {
          deliveryId: delivery.id,
          sequence: delivery.sequence,
          truckId: delivery.truckId,
          driverId: delivery.driverId,
          plannedDepartureAt: delivery.plannedDepartureAt,
        },
      });
      const next = delivery.driverId ? DeliveryStatus.ASSIGNED : DeliveryStatus.PLANNED;
      if (next !== delivery.status) {
        tracker.applyStatus(delivery, next, at, { id: staff.id, role: staff.role });
      }
      return toDispatchDelivery(delivery);
    },

    async board(date) {
      await delay();
      currentStaff();
      const day = date === undefined ? bakuDate(now()) : parse<IsoDate>(isoDateSchema, date);
      const deliveries = store
        .deliveriesOfSupplier(supplierId())
        .filter((d) => tripDate(d) === day)
        .sort(
          (a, b) =>
            (a.plannedDepartureAt ?? '').localeCompare(b.plannedDepartureAt ?? '') ||
            a.sequence - b.sequence,
        )
        .map(toDispatchDelivery);
      return { date: day, trucks: activeMixers(), deliveries };
    },

    async live() {
      await delay();
      currentStaff();
      return liveSnapshot(now());
    },

    subscribeLive(handlers: OrderLiveHandlers): Unsubscribe {
      currentStaff();
      const mine = (orderId: Id): boolean => store.findOrder(orderId)?.supplierId === supplierId();
      const offs = [
        tracker.events.on('location', (e) => {
          if (mine(e.orderId)) handlers.onLocation?.(e);
        }),
        tracker.events.on('deliveryStatus', (e) => {
          if (mine(e.orderId)) handlers.onDeliveryStatus?.(e);
        }),
        tracker.events.on('orderStatus', (e) => {
          if (mine(e.orderId)) handlers.onOrderStatus?.(e);
        }),
      ];
      tracker.start();
      return () => {
        for (const off of offs) off();
        if (tracker.events.listenerCount() === 0) tracker.stop();
      };
    },
  };
}
