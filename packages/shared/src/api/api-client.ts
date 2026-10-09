import type { IsoDate, IsoDateTime, TimeOfDay } from '../domain/common';
import type { DeliveryDocument, LiveLocation } from '../domain/delivery';
import type {
  CreateOrderInput,
  OrderDetail,
  OrderSummary,
  PricingBreakdown,
} from '../domain/order';
import type { Product, PumpOption } from '../domain/product';
import type { Site, SiteInput } from '../domain/site';
import type { Plant, Supplier } from '../domain/supplier';
import type { CustomerProfile, User } from '../domain/user';
import type { DeliveryStatus, OrderStatus } from '../enums';
import type { OtpRequestInput, OtpVerifyInput, StaffLoginInput } from '../schemas/auth';
import type { Paginated } from '../schemas/common';
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

export interface ApiClient {
  auth: AuthApi;
  catalog: CatalogApi;
  sites: SitesApi;
  orders: OrdersApi;
  tracking: TrackingApi;
}

/** How a client learns the current access token (session store in the apps). */
export type AccessTokenProvider = () => string | null;
