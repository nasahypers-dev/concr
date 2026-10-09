import type { Id, IsoDate, TimeOfDay } from '../../domain/common';
import type { DeliveryDetail, DeliveryDocument, LiveLocation } from '../../domain/delivery';
import {
  type CreateOrderInput,
  type Order,
  type OrderDetail,
  OrderEventType,
  type OrderSummary,
} from '../../domain/order';
import type { Product, PumpOption } from '../../domain/product';
import type { Site, SiteInput } from '../../domain/site';
import type { CustomerAccount, User } from '../../domain/user';
import { CustomerType, DeliveryStatus, OrderStatus, STAFF_ROLES, UserRole } from '../../enums';
import { ErrorCode } from '../../error-codes';
import { STAFF, type FixtureSet } from '../../fixtures';
import { isPointInPolygon } from '../../geo/geo';
import { calculateQuote } from '../../pricing/calculate-quote';
import { otpRequestSchema, otpVerifySchema, staffLoginSchema } from '../../schemas/auth';
import type { Paginated } from '../../schemas/common';
import {
  cancelOrderSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  listProductsQuerySchema,
  quoteRequestSchema,
  siteInputSchema,
  updateProfileSchema,
} from '../../schemas/order';
import { isTrackingDeliveryStatus } from '../../state-machines/delivery-state.machine';
import {
  BAKU_UTC_OFFSET_MINUTES,
  checkOrderTransition,
  OrderActor,
  windowStartToDate,
} from '../../state-machines/order-state.machine';
import type {
  AccessTokenProvider,
  ApiClient,
  AuthSession,
  EarliestSlot,
  OrderLiveHandlers,
  QuoteResponse,
  Unsubscribe,
} from '../api-client';
import { ApiClientError } from '../errors';
import { MockStore } from './mock-store';
import { MockTracker, type MockTrackerOptions } from './mock-tracker';

export interface MockApiClientOptions {
  tokenProvider: AccessTokenProvider;
  fixtures?: FixtureSet;
  /** Simulated network latency per call (0 in tests). */
  latencyMs?: number;
  now?: () => Date;
  /** The OTP every phone accepts in dev (spec §18). */
  otpCode?: string;
  tracker?: Omit<MockTrackerOptions, 'store' | 'now'>;
}

export interface MockApiClient extends ApiClient {
  readonly store: MockStore;
  readonly tracker: MockTracker;
}

const DEV_OTP = '123456';
const ACCESS_PREFIX = 'mock.';
const REFRESH_PREFIX = 'mockr.';
const WINDOW_HOURS = 2;

/**
 * In-memory ApiClient over the fixtures (ADR 0006). Behaves like the future REST API: validates
 * with the shared zod schemas, prices with `calculateQuote`, enforces the state machines, scopes
 * data by the signed-in user and answers cross-customer access with NOT_FOUND.
 */
export function createMockApiClient(options: MockApiClientOptions): MockApiClient {
  const store = new MockStore(options.fixtures);
  const now = options.now ?? (() => new Date());
  const latencyMs = options.latencyMs ?? 0;
  const otpCode = options.otpCode ?? DEV_OTP;
  const tracker = new MockTracker({ ...options.tracker, store, now });
  let tokenSeq = 0;

  const delay = (): Promise<void> =>
    latencyMs > 0 ? new Promise((resolve) => setTimeout(resolve, latencyMs)) : Promise.resolve();

  const parse = <T>(
    schema: {
      safeParse: (v: unknown) => { success: boolean; data?: T; error?: { issues: unknown[] } };
    },
    value: unknown,
  ): T => {
    const result = schema.safeParse(value);
    if (!result.success || result.data === undefined) {
      throw new ApiClientError(ErrorCode.VALIDATION_ERROR, {
        details: { issues: result.error?.issues ?? [] },
      });
    }
    return result.data;
  };

  const issueSession = (user: User): AuthSession => {
    tokenSeq += 1;
    const refreshToken = `${REFRESH_PREFIX}${user.id}.${tokenSeq}`;
    store.refreshTokens.set(refreshToken, user.id);
    return {
      accessToken: `${ACCESS_PREFIX}${user.id}.${tokenSeq}`,
      refreshToken,
      user,
      customer: store.findCustomer(user.id)?.profile ?? null,
    };
  };

  const currentUser = (): User => {
    const token = options.tokenProvider();
    if (!token || !token.startsWith(ACCESS_PREFIX))
      throw new ApiClientError(ErrorCode.UNAUTHORIZED);
    const userId = token.slice(ACCESS_PREFIX.length).split('.')[0] ?? '';
    const user = store.findUserById(userId);
    if (!user || !user.isActive) throw new ApiClientError(ErrorCode.UNAUTHORIZED);
    return user;
  };

  const currentCustomer = (): CustomerAccount => {
    const user = currentUser();
    const customer = store.findCustomer(user.id);
    if (!customer) throw new ApiClientError(ErrorCode.FORBIDDEN);
    return customer;
  };

  const isStaff = (user: User): boolean => STAFF_ROLES.includes(user.role);

  const ownedOrder = (id: Id): Order => {
    const user = currentUser();
    const order = store.findOrder(id);
    if (!order || (!isStaff(user) && order.customerId !== user.id)) {
      throw new ApiClientError(ErrorCode.NOT_FOUND);
    }
    return order;
  };

  const ownedSite = (id: Id): Site => {
    const customer = currentCustomer();
    const site = store.findSite(id);
    if (!site || site.customerId !== customer.id) throw new ApiClientError(ErrorCode.NOT_FOUND);
    return site;
  };

  const productById = (id: Id): Product => {
    const product = store.data.products.find((p) => p.id === id && p.isActive);
    if (!product) throw new ApiClientError(ErrorCode.NOT_FOUND, { details: { productId: id } });
    return product;
  };

  const pumpById = (id: Id | null): PumpOption | null => {
    if (id === null) return null;
    const pump = store.data.pumpOptions.find((p) => p.id === id && p.isActive);
    if (!pump) throw new ApiClientError(ErrorCode.NOT_FOUND, { details: { pumpOptionId: id } });
    return pump;
  };

  const earliestSlot = (): EarliestSlot => {
    const lead = store.data.supplier.settings.leadTimeHours;
    const local = new Date(now().getTime() + lead * 3_600_000 + BAKU_UTC_OFFSET_MINUTES * 60_000);
    let hour = local.getUTCHours() + (local.getUTCMinutes() > 0 ? 1 : 0);
    if (hour % WINDOW_HOURS !== 0) hour += WINDOW_HOURS - (hour % WINDOW_HOURS);
    let dayOffset = 0;
    if (hour >= 24) {
      hour -= 24;
      dayOffset = 1;
    }
    const day = new Date(local.getTime() + dayOffset * 86_400_000);
    const date: IsoDate = `${day.getUTCFullYear()}-${(day.getUTCMonth() + 1).toString().padStart(2, '0')}-${day
      .getUTCDate()
      .toString()
      .padStart(2, '0')}`;
    const end = (hour + WINDOW_HOURS) % 24;
    return {
      date,
      timeWindowStart: `${hour.toString().padStart(2, '0')}:00`,
      timeWindowEnd: `${end.toString().padStart(2, '0')}:00`,
    };
  };

  const windowMinutes = (time: TimeOfDay): number => {
    const [h = 0, m = 0] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const assertWindow = (requestedDate: IsoDate, start: TimeOfDay, end: TimeOfDay): Date => {
    const startAt = windowStartToDate(requestedDate, start);
    const endMinutes = end === '00:00' ? 24 * 60 : windowMinutes(end);
    if (endMinutes <= windowMinutes(start)) {
      throw new ApiClientError(ErrorCode.VALIDATION_ERROR, {
        details: { field: 'timeWindowEnd', message: 'Window end must be after its start' },
      });
    }
    const lead = store.data.supplier.settings.leadTimeHours;
    if (startAt.getTime() < now().getTime() + lead * 3_600_000) {
      throw new ApiClientError(ErrorCode.VALIDATION_ERROR, {
        details: { field: 'requestedDate', leadTimeHours: lead, earliestSlot: earliestSlot() },
      });
    }
    return startAt;
  };

  const deliveryDetail = (orderId: Id): DeliveryDetail[] =>
    store.deliveriesOf(orderId).map((delivery) => {
      const driver = delivery.driverId
        ? store.data.drivers.find((d) => d.id === delivery.driverId)
        : null;
      return {
        ...delivery,
        truck: delivery.truckId
          ? (store.data.trucks.find((t) => t.id === delivery.truckId) ?? null)
          : null,
        driver: driver ? { id: driver.id, fullName: driver.fullName, phone: driver.phone } : null,
        document: store.data.documents.find((doc) => doc.deliveryId === delivery.id) ?? null,
      };
    });

  const toSummary = (order: Order): OrderSummary => {
    const deliveries = store.deliveriesOf(order.id);
    const active = deliveries.find((d) => isTrackingDeliveryStatus(d.status));
    return {
      ...order,
      productGrade: store.data.products.find((p) => p.id === order.productId)?.grade ?? '',
      siteName: store.findSite(order.siteId)?.name ?? '',
      deliveriesTotal: deliveries.length,
      deliveriesCompleted: deliveries.filter((d) => d.status === DeliveryStatus.COMPLETED).length,
      activeEtaMinutes: active?.etaMinutes ?? null,
    };
  };

  const toDetail = (order: Order): OrderDetail => {
    const product = store.data.products.find((p) => p.id === order.productId);
    const site = store.findSite(order.siteId);
    if (!product || !site)
      throw new ApiClientError(ErrorCode.INTERNAL_ERROR, { details: { orderId: order.id } });
    return {
      ...order,
      product,
      site,
      pumpOption: order.pumpOptionId
        ? (store.data.pumpOptions.find((p) => p.id === order.pumpOptionId) ?? null)
        : null,
      deliveries: deliveryDetail(order.id),
      events: store.eventsOf(order.id),
    };
  };

  const liveOf = (orderId: Id): LiveLocation[] =>
    store
      .deliveriesOf(orderId)
      .filter((d) => isTrackingDeliveryStatus(d.status) && d.lastLocation)
      .map((d) => ({
        deliveryId: d.id,
        orderId,
        lat: d.lastLocation!.lat,
        lng: d.lastLocation!.lng,
        heading: d.lastHeading,
        speedKmh: d.lastSpeedKmh,
        etaMinutes: d.etaMinutes,
        at: d.lastLocationAt ?? now().toISOString(),
      }));

  const client: MockApiClient = {
    store,
    tracker,

    auth: {
      async requestOtp(input) {
        await delay();
        const { phone } = parse(otpRequestSchema, input);
        store.otpCodes.set(phone, otpCode);
        return { expiresInSec: 120, devCode: otpCode };
      },
      async verifyOtp(input) {
        await delay();
        const { phone, code } = parse(otpVerifySchema, input);
        if (code !== otpCode) throw new ApiClientError(ErrorCode.OTP_INVALID);
        store.otpCodes.delete(phone);
        let user = store.findUserByPhone(phone);
        if (user && isStaff(user)) throw new ApiClientError(ErrorCode.FORBIDDEN);
        if (!user) {
          const id = store.nextUserId();
          const createdAt = now().toISOString();
          const account: CustomerAccount = {
            id,
            phone,
            email: null,
            fullName: null,
            locale: 'az',
            role: UserRole.CUSTOMER,
            isActive: true,
            createdAt,
            profile: {
              userId: id,
              customerType: CustomerType.INDIVIDUAL,
              companyName: null,
              taxId: null,
            },
          };
          store.data.customers.push(account);
          const { profile: _profile, ...plain } = account;
          store.data.users.push(plain);
          user = plain;
        }
        return issueSession(user);
      },
      async staffLogin(input) {
        await delay();
        const { email, password } = parse(staffLoginSchema, input);
        const staff = Object.values(STAFF).find(
          (s) => s.email.toLowerCase() === email.toLowerCase() && s.password === password,
        );
        const user = staff ? store.findUserById(staff.id) : undefined;
        if (!user)
          throw new ApiClientError(ErrorCode.UNAUTHORIZED, { message: 'Invalid credentials' });
        return issueSession(user);
      },
      async refresh(refreshToken) {
        await delay();
        const userId = store.refreshTokens.get(refreshToken);
        const user = userId ? store.findUserById(userId) : undefined;
        if (!user) throw new ApiClientError(ErrorCode.UNAUTHORIZED);
        store.refreshTokens.delete(refreshToken); // rotation (CLAUDE.md rule 13)
        return issueSession(user);
      },
      async logout(refreshToken) {
        await delay();
        store.refreshTokens.delete(refreshToken);
      },
      async me() {
        await delay();
        return currentUser();
      },
      async updateProfile(input) {
        await delay();
        const user = currentUser();
        const patch = parse(updateProfileSchema, input);
        if (patch.fullName !== undefined) user.fullName = patch.fullName;
        if (patch.locale !== undefined) user.locale = patch.locale;
        const account = store.findCustomer(user.id);
        if (account) {
          account.fullName = user.fullName;
          account.locale = user.locale;
        }
        return user;
      },
    },

    catalog: {
      async getSupplier() {
        await delay();
        return { supplier: store.data.supplier, plant: store.data.plant };
      },
      async listProducts(query) {
        await delay();
        const { category } = parse(listProductsQuerySchema, query ?? {});
        return store.data.products
          .filter((p) => p.isActive && (!category || p.category === category))
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },
      async listPumpOptions() {
        await delay();
        return store.data.pumpOptions.filter((p) => p.isActive);
      },
      async quote(input) {
        await delay();
        const req = parse(quoteRequestSchema, input);
        const product = productById(req.productId);
        const pump = pumpById(req.pumpOptionId);
        const location = req.siteId ? ownedSite(req.siteId).location : (req.location ?? null);
        const result = calculateQuote({
          product,
          volumeM3: req.volumeM3,
          pumpOption: pump,
          settings: store.data.supplier.settings,
          siteLocation: location,
          serviceArea: store.data.serviceArea.polygon,
        });
        if (!result.ok) throw new ApiClientError(result.code, { details: result.details });
        const response: QuoteResponse = {
          breakdown: result.breakdown,
          pumpPriceKnown: result.pumpPriceKnown,
          inServiceArea: location
            ? isPointInPolygon(location, store.data.serviceArea.polygon)
            : true,
          earliestSlot: earliestSlot(),
        };
        return response;
      },
    },

    sites: {
      async list() {
        await delay();
        const customer = currentCustomer();
        return store.sitesOf(customer.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      },
      async get(id) {
        await delay();
        return ownedSite(id);
      },
      async create(input) {
        await delay();
        const customer = currentCustomer();
        const data = parse<SiteInput>(siteInputSchema, input);
        const site: Site = {
          id: store.nextSiteId(),
          customerId: customer.id,
          ...data,
          createdAt: now().toISOString(),
        };
        store.data.sites.push(site);
        return site;
      },
      async update(id, input) {
        await delay();
        const site = ownedSite(id);
        const data = parse<Partial<SiteInput>>(siteInputSchema.partial(), input);
        Object.assign(site, data);
        return site;
      },
      async remove(id) {
        await delay();
        const site = ownedSite(id);
        store.data.sites.splice(store.data.sites.indexOf(site), 1);
      },
    },

    orders: {
      async list(query) {
        await delay();
        const customer = currentCustomer();
        const { status, page, limit } = parse(listOrdersQuerySchema, query ?? {});
        const all = store
          .ordersOf(customer.id)
          .filter((o) => !status || status.length === 0 || status.includes(o.status))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const start = (page - 1) * limit;
        const result: Paginated<OrderSummary> = {
          items: all.slice(start, start + limit).map(toSummary),
          total: all.length,
          page,
          limit,
        };
        return result;
      },
      async get(id) {
        await delay();
        return toDetail(ownedOrder(id));
      },
      async create(input) {
        await delay();
        const customer = currentCustomer();
        const data = parse<CreateOrderInput>(createOrderSchema, input);
        const site = ownedSite(data.siteId);
        const product = productById(data.productId);
        if (data.pumpRequired && !data.pumpOptionId) {
          throw new ApiClientError(ErrorCode.VALIDATION_ERROR, {
            details: { field: 'pumpOptionId' },
          });
        }
        if (data.slump !== null && !product.slumpOptions.includes(data.slump)) {
          throw new ApiClientError(ErrorCode.VALIDATION_ERROR, { details: { field: 'slump' } });
        }
        const pump = data.pumpRequired ? pumpById(data.pumpOptionId) : null;
        assertWindow(data.requestedDate, data.timeWindowStart, data.timeWindowEnd);
        const quote = calculateQuote({
          product,
          volumeM3: data.volumeM3,
          pumpOption: pump,
          settings: store.data.supplier.settings,
          siteLocation: site.location,
          serviceArea: store.data.serviceArea.polygon,
        });
        if (!quote.ok) throw new ApiClientError(quote.code, { details: quote.details });
        const { id, number } = store.nextOrderNumber();
        const createdAt = now().toISOString();
        const order: Order = {
          id,
          number,
          supplierId: store.data.supplier.id,
          customerId: customer.id,
          siteId: site.id,
          siteContactName: site.contactName,
          siteContactPhone: site.contactPhone,
          productId: product.id,
          volumeM3: data.volumeM3,
          slump: data.slump,
          pumpRequired: data.pumpRequired,
          pumpOptionId: pump?.id ?? null,
          requestedDate: data.requestedDate,
          timeWindowStart: data.timeWindowStart,
          timeWindowEnd: data.timeWindowEnd,
          status: OrderStatus.PENDING,
          pricing: quote.breakdown,
          totalAmount: quote.breakdown.total,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'UNPAID',
          customerNote: data.customerNote,
          internalNote: null,
          cancelReason: null,
          cancelledBy: null,
          createdAt,
          confirmedAt: null,
          completedAt: null,
        };
        store.data.orders.push(order);
        store.addEvent({
          orderId: id,
          type: OrderEventType.CREATED,
          at: createdAt,
          toStatus: OrderStatus.PENDING,
          actorId: customer.id,
          actorRole: UserRole.CUSTOMER,
          payload: { number, total: order.totalAmount, pumpPriceKnown: quote.pumpPriceKnown },
        });
        return toDetail(order);
      },
      async cancel(id, input) {
        await delay();
        const customer = currentCustomer();
        const order = ownedOrder(id);
        const { reason } = parse(cancelOrderSchema, input ?? {});
        const at = now();
        const check = checkOrderTransition(order.status, OrderStatus.CANCELLED, {
          actor: OrderActor.CUSTOMER,
          now: at,
          windowStart: windowStartToDate(order.requestedDate, order.timeWindowStart),
          cancelCutoffHours: store.data.supplier.settings.cancelCutoffHours,
          reason,
        });
        if (!check.allowed) {
          throw new ApiClientError(ErrorCode.INVALID_STATE_TRANSITION, {
            details: { from: order.status, to: OrderStatus.CANCELLED, denial: check.denial },
          });
        }
        const from = order.status;
        order.status = OrderStatus.CANCELLED;
        order.cancelReason = reason ?? null;
        order.cancelledBy = UserRole.CUSTOMER;
        for (const delivery of store.deliveriesOf(order.id)) {
          if (
            delivery.status === DeliveryStatus.PLANNED ||
            delivery.status === DeliveryStatus.ASSIGNED
          ) {
            delivery.status = DeliveryStatus.CANCELLED;
          }
        }
        store.addEvent({
          orderId: order.id,
          type: OrderEventType.STATUS_CHANGED,
          at: at.toISOString(),
          fromStatus: from,
          toStatus: OrderStatus.CANCELLED,
          actorId: customer.id,
          actorRole: UserRole.CUSTOMER,
          payload: reason ? { reason } : {},
        });
        return toDetail(order);
      },
      async reorder(id) {
        await delay();
        const order = ownedOrder(id);
        const slot = earliestSlot();
        return {
          productId: order.productId,
          siteId: order.siteId,
          volumeM3: order.volumeM3,
          slump: order.slump,
          pumpRequired: order.pumpRequired,
          pumpOptionId: order.pumpOptionId,
          requestedDate: slot.date,
          timeWindowStart: order.timeWindowStart,
          timeWindowEnd: order.timeWindowEnd,
          paymentMethod: order.paymentMethod,
          customerNote: null,
        };
      },
      async listDocuments(id) {
        await delay();
        const order = ownedOrder(id);
        const documents: DeliveryDocument[] = store.documentsOf(order.id);
        return documents;
      },
    },

    tracking: {
      async getOrderLive(orderId) {
        await delay();
        return liveOf(ownedOrder(orderId).id);
      },
      subscribeOrder(orderId, handlers: OrderLiveHandlers): Unsubscribe {
        const offs = [
          tracker.events.on('location', (e) => {
            if (e.orderId === orderId) handlers.onLocation?.(e);
          }),
          tracker.events.on('deliveryStatus', (e) => {
            if (e.orderId === orderId) handlers.onDeliveryStatus?.(e);
          }),
          tracker.events.on('orderStatus', (e) => {
            if (e.orderId === orderId) handlers.onOrderStatus?.(e);
          }),
        ];
        tracker.start();
        return () => {
          for (const off of offs) off();
          if (tracker.events.listenerCount() === 0) tracker.stop();
        };
      },
    },
  };

  return client;
}
