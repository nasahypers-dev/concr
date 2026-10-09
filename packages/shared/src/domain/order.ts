import type { OrderStatus, PaymentMethod, PaymentStatus, SlumpClass, UserRole } from '../enums';
import type { Id, IsoDate, IsoDateTime, MoneyString, TimeOfDay } from './common';
import type { DeliveryDetail } from './delivery';
import type { Product, PumpOption } from './product';
import type { Site } from './site';

/** Frozen price calculation stored on the order (spec §10). Old orders never change. */
export interface PricingBreakdown {
  basePerM3: MoneyString;
  volumeM3: number;
  /** basePerM3 × volumeM3, excluding VAT. */
  subtotal: MoneyString;
  /** "0.00" when the pump price is not known yet (dispatcher confirms it). */
  pumpFee: MoneyString;
  /** Always "0.00" while `settings.deliveryIncluded` is true. */
  deliveryFee: MoneyString;
  vatRate: number;
  vat: MoneyString;
  total: MoneyString;
  currency: 'AZN';
  /** Set when a dispatcher overrides the price (spec §8.1). */
  overrideReason: string | null;
}

export interface Order {
  id: Id;
  /** "CN-2026-000123" (spec §20.8). */
  number: string;
  supplierId: Id;
  customerId: Id;
  siteId: Id;
  /** Contact on site, frozen at order time (the site may be edited later). */
  siteContactName: string | null;
  siteContactPhone: string;
  productId: Id;
  volumeM3: number;
  /** null when the customer left the choice to the dispatcher (owner, 2026-10-09). */
  slump: SlumpClass | null;
  pumpRequired: boolean;
  pumpOptionId: Id | null;
  requestedDate: IsoDate;
  timeWindowStart: TimeOfDay;
  timeWindowEnd: TimeOfDay;
  status: OrderStatus;
  pricing: PricingBreakdown;
  totalAmount: MoneyString;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerNote: string | null;
  internalNote: string | null;
  cancelReason: string | null;
  cancelledBy: UserRole | null;
  createdAt: IsoDateTime;
  confirmedAt: IsoDateTime | null;
  completedAt: IsoDateTime | null;
}

export const OrderEventType = {
  CREATED: 'CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  PRICE_OVERRIDDEN: 'PRICE_OVERRIDDEN',
  SCHEDULE_CHANGED: 'SCHEDULE_CHANGED',
  DELIVERY_STATUS_CHANGED: 'DELIVERY_STATUS_CHANGED',
  NOTE_ADDED: 'NOTE_ADDED',
} as const;
export type OrderEventType = (typeof OrderEventType)[keyof typeof OrderEventType];

/** Audit trail row (spec §7 `OrderEvent`); rendered as the timeline in the order detail. */
export interface OrderEvent {
  id: Id;
  orderId: Id;
  type: OrderEventType;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  actorId: Id | null;
  actorRole: UserRole | null;
  payload: Record<string, unknown>;
  createdAt: IsoDateTime;
}

/** List row: enough for cards and tables without extra round trips. */
export interface OrderSummary extends Order {
  productGrade: string;
  siteName: string;
  /** Count of deliveries by terminal/non-terminal state for "Reys 2/3". */
  deliveriesTotal: number;
  deliveriesCompleted: number;
  /** ETA of the active delivery, if any (spec §13 home card). */
  activeEtaMinutes: number | null;
}

/** GET /orders/:id (spec §11): deliveries + last locations + ETA + events resolved. */
export interface OrderDetail extends Order {
  product: Product;
  site: Site;
  pumpOption: PumpOption | null;
  deliveries: DeliveryDetail[];
  events: OrderEvent[];
}

/** POST /orders body (spec §11); the price is recalculated server-side, never trusted from the client. */
export interface CreateOrderInput {
  productId: Id;
  siteId: Id;
  volumeM3: number;
  slump: SlumpClass | null;
  pumpRequired: boolean;
  pumpOptionId: Id | null;
  requestedDate: IsoDate;
  timeWindowStart: TimeOfDay;
  timeWindowEnd: TimeOfDay;
  paymentMethod: PaymentMethod;
  customerNote: string | null;
}
