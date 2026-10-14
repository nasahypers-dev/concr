import type { AdminDriver, AdminSettings, ReportSummary } from '../domain/admin';
import type { IsoDate, IsoDateTime, TimeOfDay } from '../domain/common';
import type { DeliveryDocument, DriverDelivery, LiveLocation } from '../domain/delivery';
import type {
  DispatchBoard,
  DispatchDelivery,
  DispatchOrderDetail,
  DispatchOrderSummary,
  LiveSnapshot,
  TripPlan,
} from '../domain/dispatch';
import type {
  CreateOrderInput,
  OrderDetail,
  OrderSummary,
  PricingBreakdown,
} from '../domain/order';
import type { Product, PumpOption } from '../domain/product';
import type { Site, SiteInput } from '../domain/site';
import type { Plant, ServiceArea, Supplier } from '../domain/supplier';
import type { Truck } from '../domain/truck';
import type { CustomerProfile, DriverAccount, User } from '../domain/user';
import type { DeliveryStatus, OrderStatus } from '../enums';
import type {
  DriverInput,
  ReportRange,
  ServiceAreaInput,
  TruckInput,
  UpdateDriverInput,
  UpdateProductInput,
  UpdatePumpOptionInput,
  UpdateSupplierSettingsInput,
  UpdateTruckInput,
} from '../schemas/admin';
import type { OtpRequestInput, OtpVerifyInput, StaffLoginInput } from '../schemas/auth';
import type { Paginated } from '../schemas/common';
import type {
  ConfirmOrderInput,
  DispatchCancelInput,
  ListDispatchOrdersQuery,
  ReassignDeliveryInput,
  RejectOrderInput,
  ScheduleOrderInput,
} from '../schemas/dispatch';
import type {
  CompleteDeliveryInput,
  DriverStatusInput,
  LocationBatchInput,
  ShiftInput,
} from '../schemas/driver';
import type {
  CancelOrderInput,
  ListOrdersQuery,
  ListProductsQuery,
  QuoteRequest,
  UpdateProfileInput,
} from '../schemas/order';

/**
 * The contract between the apps and the backend (ADR 0006). Implemented twice:
 * `createMockApiClient` (in-memory, this package) and `HttpApiClient` (REST, Phase B2).
 * Methods throw `ApiClientError` on business errors and `NetworkError` on transport failures.
 */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
  /** Present for CUSTOMER sessions. */
  customer: CustomerProfile | null;
}

export interface OtpRequestResult {
  expiresInSec: number;
  /** Only in dev/mock: the code the UI may prefill (spec §18: "123456"). */
  devCode?: string;
}

export interface AuthApi {
  requestOtp(input: OtpRequestInput): Promise<OtpRequestResult>;
  verifyOtp(input: OtpVerifyInput): Promise<AuthSession>;
  staffLogin(input: StaffLoginInput): Promise<AuthSession>;
  refresh(refreshToken: string): Promise<AuthSession>;
  logout(refreshToken: string): Promise<void>;
  me(): Promise<User>;
  updateProfile(input: UpdateProfileInput): Promise<User>;
}

export interface SupplierInfo {
  supplier: Supplier;
  plant: Plant;
}

export interface EarliestSlot {
  date: IsoDate;
  timeWindowStart: TimeOfDay;
  timeWindowEnd: TimeOfDay;
}

export interface QuoteResponse {
  breakdown: PricingBreakdown;
  pumpPriceKnown: boolean;
  inServiceArea: boolean;
  earliestSlot: EarliestSlot;
}

export interface CatalogApi {
  getSupplier(): Promise<SupplierInfo>;
  listProducts(query?: ListProductsQuery): Promise<Product[]>;
  listPumpOptions(): Promise<PumpOption[]>;
  quote(input: QuoteRequest): Promise<QuoteResponse>;
}

export interface SitesApi {
  list(): Promise<Site[]>;
  get(id: string): Promise<Site>;
  create(input: SiteInput): Promise<Site>;
  update(id: string, input: Partial<SiteInput>): Promise<Site>;
  remove(id: string): Promise<void>;
}

export interface OrdersApi {
  list(query?: ListOrdersQuery): Promise<Paginated<OrderSummary>>;
  get(id: string): Promise<OrderDetail>;
  create(input: CreateOrderInput): Promise<OrderDetail>;
  cancel(id: string, input?: CancelOrderInput): Promise<OrderDetail>;
  /** Prefilled draft for the wizard (same product, site, volume; new date). */
  reorder(id: string): Promise<CreateOrderInput>;
  listDocuments(id: string): Promise<DeliveryDocument[]>;
}

export interface OrderStatusEvent {
  orderId: string;
  status: OrderStatus;
  at: IsoDateTime;
}

export interface DeliveryStatusEvent {
  orderId: string;
  deliveryId: string;
  status: DeliveryStatus;
  etaMinutes: number | null;
  at: IsoDateTime;
}

export interface OrderLiveHandlers {
  onLocation?: (event: LiveLocation) => void;
  onDeliveryStatus?: (event: DeliveryStatusEvent) => void;
  onOrderStatus?: (event: OrderStatusEvent) => void;
}

export type Unsubscribe = () => void;

/** Spec §9.3: REST snapshot first, then a live subscription (Socket.IO later, timer in the mock). */
export interface TrackingApi {
  getOrderLive(orderId: string): Promise<LiveLocation[]>;
  subscribeOrder(orderId: string, handlers: OrderLiveHandlers): Unsubscribe;
}

/** Spec §11 driver endpoints: the mixer phone's view of its trips and the GPS inlet (§9.1). */
export interface DriverApi {
  me(): Promise<DriverAccount>;
  /** Shift on/off and the truck taken today (spec §13 "növbə toggle + mikser seçimi"). */
  setShift(input: ShiftInput): Promise<DriverAccount>;
  /** Trips assigned to the signed-in driver on a Baku calendar day (today when omitted). */
  listDeliveries(date?: IsoDate): Promise<DriverDelivery[]>;
  getDelivery(id: string): Promise<DriverDelivery>;
  /** Big-button transitions; COMPLETED goes through `complete` (needs the handover act). */
  setStatus(id: string, input: DriverStatusInput): Promise<DriverDelivery>;
  /** Batched GPS samples while EN_ROUTE/ARRIVED; returns how many passed validation. */
  pushLocations(id: string, batch: LocationBatchInput): Promise<{ accepted: number }>;
  complete(id: string, input: CompleteDeliveryInput): Promise<DriverDelivery>;
}

/**
 * Spec §11 dispatch endpoints (§14 panel): the supplier's view of every order and trip, the
 * dispatcher decisions of §8.1 and the live feed of §9.4. Staff roles only.
 */
export interface DispatchApi {
  listOrders(query?: ListDispatchOrdersQuery): Promise<Paginated<DispatchOrderSummary>>;
  getOrder(id: string): Promise<DispatchOrderDetail>;
  /** PENDING → CONFIRMED, optionally with a pump fee, a price override or a window change. */
  confirm(id: string, input?: ConfirmOrderInput): Promise<DispatchOrderDetail>;
  reject(id: string, input: RejectOrderInput): Promise<DispatchOrderDetail>;
  /** Proposal for the schedule dialog: largest mixer first (spec §8.1 "avtomatik bölgü"). */
  suggestPlan(id: string): Promise<TripPlan[]>;
  /** CONFIRMED → SCHEDULED: the trips become deliveries. */
  schedule(id: string, input: ScheduleOrderInput): Promise<DispatchOrderDetail>;
  cancel(id: string, input: DispatchCancelInput): Promise<DispatchOrderDetail>;
  /** Board edits of a trip that has not left the plant (mixer, driver, departure). */
  reassignDelivery(deliveryId: string, input: ReassignDeliveryInput): Promise<DispatchDelivery>;
  board(date?: IsoDate): Promise<DispatchBoard>;
  live(): Promise<LiveSnapshot>;
  subscribeLive(handlers: OrderLiveHandlers): Unsubscribe;
}

/**
 * Spec §11 admin endpoints (§14 settings and reports). Reads are open to every staff role; writes
 * need a supplier admin (spec §2). Drivers are created here and nowhere else (D22).
 */
export interface AdminApi {
  listProducts(): Promise<Product[]>;
  updateProduct(id: string, input: UpdateProductInput): Promise<Product>;
  listPumpOptions(): Promise<PumpOption[]>;
  updatePumpOption(id: string, input: UpdatePumpOptionInput): Promise<PumpOption>;
  listTrucks(): Promise<Truck[]>;
  createTruck(input: TruckInput): Promise<Truck>;
  updateTruck(id: string, input: UpdateTruckInput): Promise<Truck>;
  listDrivers(): Promise<AdminDriver[]>;
  createDriver(input: DriverInput): Promise<AdminDriver>;
  /** `isActive: false` locks the driver out of the app at once. */
  updateDriver(id: string, input: UpdateDriverInput): Promise<AdminDriver>;
  getSettings(): Promise<AdminSettings>;
  updateSettings(input: UpdateSupplierSettingsInput): Promise<Supplier>;
  updateServiceArea(input: ServiceAreaInput): Promise<ServiceArea>;
  reportSummary(range: ReportRange): Promise<ReportSummary>;
}

export interface ApiClient {
  auth: AuthApi;
  catalog: CatalogApi;
  sites: SitesApi;
  orders: OrdersApi;
  tracking: TrackingApi;
  driver: DriverApi;
  dispatch: DispatchApi;
  admin: AdminApi;
}

/** How a client learns the current access token (session store in the apps). */
export type AccessTokenProvider = () => string | null;
