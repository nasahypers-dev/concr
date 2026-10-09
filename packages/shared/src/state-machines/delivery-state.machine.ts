import { DeliveryStatus, OrderStatus, TRACKING_DELIVERY_STATUSES } from '../enums';
import { InvalidTransitionError, type TransitionCheck } from './errors';

/**
 * Delivery (trip) lifecycle (spec §8.2):
 * PLANNED → ASSIGNED → LOADING → EN_ROUTE → ARRIVED → UNLOADING → COMPLETED,
 * CANCELLED from any non-terminal status, FAILED from ARRIVED/UNLOADING (reason required).
 * GPS is collected only in EN_ROUTE and ARRIVED.
 */
export const DeliveryActor = {
  DRIVER: 'DRIVER',
  DISPATCHER: 'DISPATCHER',
  SYSTEM: 'SYSTEM',
} as const;
export type DeliveryActor = (typeof DeliveryActor)[keyof typeof DeliveryActor];

export interface DeliveryTransitionRule {
  from: DeliveryStatus;
  to: DeliveryStatus;
  actors: readonly DeliveryActor[];
  reasonRequired?: boolean;
}

const NON_TERMINAL: readonly DeliveryStatus[] = [
  DeliveryStatus.PLANNED,
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.LOADING,
  DeliveryStatus.EN_ROUTE,
  DeliveryStatus.ARRIVED,
  DeliveryStatus.UNLOADING,
];

export const DELIVERY_TRANSITIONS: readonly DeliveryTransitionRule[] = [
  { from: DeliveryStatus.PLANNED, to: DeliveryStatus.ASSIGNED, actors: [DeliveryActor.DISPATCHER] },
  {
    from: DeliveryStatus.ASSIGNED,
    to: DeliveryStatus.LOADING,
    actors: [DeliveryActor.DRIVER, DeliveryActor.DISPATCHER],
  },
  { from: DeliveryStatus.LOADING, to: DeliveryStatus.EN_ROUTE, actors: [DeliveryActor.DRIVER] },
  {
    from: DeliveryStatus.EN_ROUTE,
    to: DeliveryStatus.ARRIVED,
    actors: [DeliveryActor.DRIVER, DeliveryActor.SYSTEM], // SYSTEM = geofence auto-arrival (spec §9.2)
  },
  { from: DeliveryStatus.ARRIVED, to: DeliveryStatus.UNLOADING, actors: [DeliveryActor.DRIVER] },
  { from: DeliveryStatus.UNLOADING, to: DeliveryStatus.COMPLETED, actors: [DeliveryActor.DRIVER] },
  {
    from: DeliveryStatus.ARRIVED,
    to: DeliveryStatus.FAILED,
    actors: [DeliveryActor.DRIVER, DeliveryActor.DISPATCHER],
    reasonRequired: true,
  },
  {
    from: DeliveryStatus.UNLOADING,
    to: DeliveryStatus.FAILED,
    actors: [DeliveryActor.DRIVER, DeliveryActor.DISPATCHER],
    reasonRequired: true,
  },
  ...NON_TERMINAL.map<DeliveryTransitionRule>((from) => ({
    from,
    to: DeliveryStatus.CANCELLED,
    actors: [DeliveryActor.DISPATCHER],
    reasonRequired: true,
  })),
];

export const TERMINAL_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  DeliveryStatus.COMPLETED,
  DeliveryStatus.CANCELLED,
  DeliveryStatus.FAILED,
];

export function isTerminalDeliveryStatus(status: DeliveryStatus): boolean {
  return TERMINAL_DELIVERY_STATUSES.includes(status);
}

export function isTrackingDeliveryStatus(status: DeliveryStatus): boolean {
  return TRACKING_DELIVERY_STATUSES.includes(status);
}

/** The driver's "next big button" order (spec §13): Yükləmə → Yola düş → Çatdım → Boşaldım → Tamamla. */
export const DRIVER_HAPPY_PATH: readonly DeliveryStatus[] = [
  DeliveryStatus.LOADING,
  DeliveryStatus.EN_ROUTE,
  DeliveryStatus.ARRIVED,
  DeliveryStatus.UNLOADING,
  DeliveryStatus.COMPLETED,
];

export interface DeliveryTransitionContext {
  actor: DeliveryActor;
  reason?: string | null;
}

export function checkDeliveryTransition(
  from: DeliveryStatus,
  to: DeliveryStatus,
  ctx: DeliveryTransitionContext,
): TransitionCheck {
  const rule = DELIVERY_TRANSITIONS.find((r) => r.from === from && r.to === to);
  if (!rule) return { allowed: false, denial: 'INVALID_TRANSITION' };
  if (!rule.actors.includes(ctx.actor)) return { allowed: false, denial: 'ACTOR_NOT_ALLOWED' };
  if (rule.reasonRequired && !(typeof ctx.reason === 'string' && ctx.reason.trim().length > 0)) {
    return { allowed: false, denial: 'REASON_REQUIRED' };
  }
  return { allowed: true };
}

export function transitionDelivery(
  from: DeliveryStatus,
  to: DeliveryStatus,
  ctx: DeliveryTransitionContext,
): DeliveryStatus {
  const check = checkDeliveryTransition(from, to, ctx);
  if (!check.allowed) throw new InvalidTransitionError('delivery', from, to, check.denial);
  return to;
}

/** Next status on the driver happy path, or null when the trip is done / not startable. */
export function nextDriverStatus(from: DeliveryStatus): DeliveryStatus | null {
  const rule = DELIVERY_TRANSITIONS.find(
    (r) =>
      r.from === from &&
      r.actors.includes(DeliveryActor.DRIVER) &&
      DRIVER_HAPPY_PATH.includes(r.to),
  );
  return rule?.to ?? null;
}

/**
 * Order status derived from its deliveries (spec §8.1 "sistem" rows):
 * - SCHEDULED → IN_PROGRESS once any delivery left the plant,
 * - IN_PROGRESS → COMPLETED once every delivery is terminal and at least one completed.
 * Returns null when nothing changes (e.g. all trips failed: the dispatcher decides).
 */
export function deriveOrderStatus(
  current: OrderStatus,
  deliveries: readonly { status: DeliveryStatus }[],
): OrderStatus | null {
  if (deliveries.length === 0) return null;
  const started = deliveries.some(
    (d) =>
      d.status === DeliveryStatus.EN_ROUTE ||
      d.status === DeliveryStatus.ARRIVED ||
      d.status === DeliveryStatus.UNLOADING ||
      d.status === DeliveryStatus.COMPLETED,
  );
  if (current === OrderStatus.SCHEDULED && started) return OrderStatus.IN_PROGRESS;
  const allTerminal = deliveries.every((d) => isTerminalDeliveryStatus(d.status));
  const anyCompleted = deliveries.some((d) => d.status === DeliveryStatus.COMPLETED);
  if (current === OrderStatus.IN_PROGRESS && allTerminal && anyCompleted)
    return OrderStatus.COMPLETED;
  return null;
}
