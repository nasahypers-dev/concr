import type { IsoDate, TimeOfDay } from '../domain/common';
import { OrderStatus } from '../enums';
import { InvalidTransitionError, type TransitionCheck } from './errors';

/**
 * Order lifecycle (spec §8.1). Pure functions, no side effects; side effects (pushes, delivery
 * creation) are the caller's job. The API `orders/order-state.machine.ts` re-exports this (ADR 0007).
 */
export const OrderActor = {
  CUSTOMER: 'CUSTOMER',
  DISPATCHER: 'DISPATCHER',
  SYSTEM: 'SYSTEM',
} as const;
export type OrderActor = (typeof OrderActor)[keyof typeof OrderActor];

export interface OrderTransitionRule {
  from: OrderStatus;
  to: OrderStatus;
  actors: readonly OrderActor[];
  /** Actors that must supply a reason for this transition. */
  reasonRequiredFor?: readonly OrderActor[];
  /** The customer may only cancel while `windowStart - now > cancelCutoffHours`. */
  customerCutoff?: boolean;
}

export const ORDER_TRANSITIONS: readonly OrderTransitionRule[] = [
  { from: OrderStatus.PENDING, to: OrderStatus.CONFIRMED, actors: [OrderActor.DISPATCHER] },
  {
    from: OrderStatus.PENDING,
    to: OrderStatus.REJECTED,
    actors: [OrderActor.DISPATCHER],
    reasonRequiredFor: [OrderActor.DISPATCHER],
  },
  { from: OrderStatus.PENDING, to: OrderStatus.CANCELLED, actors: [OrderActor.CUSTOMER] },
  { from: OrderStatus.CONFIRMED, to: OrderStatus.SCHEDULED, actors: [OrderActor.DISPATCHER] },
  {
    from: OrderStatus.CONFIRMED,
    to: OrderStatus.CANCELLED,
    actors: [OrderActor.CUSTOMER, OrderActor.DISPATCHER],
    reasonRequiredFor: [OrderActor.DISPATCHER],
    customerCutoff: true,
  },
  { from: OrderStatus.SCHEDULED, to: OrderStatus.IN_PROGRESS, actors: [OrderActor.SYSTEM] },
  {
    from: OrderStatus.SCHEDULED,
    to: OrderStatus.CANCELLED,
    actors: [OrderActor.DISPATCHER],
    reasonRequiredFor: [OrderActor.DISPATCHER],
  },
  { from: OrderStatus.IN_PROGRESS, to: OrderStatus.COMPLETED, actors: [OrderActor.SYSTEM] },
  {
    from: OrderStatus.IN_PROGRESS,
    to: OrderStatus.CANCELLED,
    actors: [OrderActor.DISPATCHER],
    reasonRequiredFor: [OrderActor.DISPATCHER],
  },
];

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
];

export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.SCHEDULED,
  OrderStatus.IN_PROGRESS,
];

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

export interface OrderTransitionContext {
  actor: OrderActor;
  now: Date;
  /** Start of the requested delivery window (see `windowStartToDate`). */
  windowStart: Date;
  cancelCutoffHours: number;
  reason?: string | null;
}

export function checkOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
  ctx: OrderTransitionContext,
): TransitionCheck {
  const rule = ORDER_TRANSITIONS.find((r) => r.from === from && r.to === to);
  if (!rule) return { allowed: false, denial: 'INVALID_TRANSITION' };
  if (!rule.actors.includes(ctx.actor)) return { allowed: false, denial: 'ACTOR_NOT_ALLOWED' };
  if (rule.reasonRequiredFor?.includes(ctx.actor) && !hasReason(ctx.reason)) {
    return { allowed: false, denial: 'REASON_REQUIRED' };
  }
  if (rule.customerCutoff && ctx.actor === OrderActor.CUSTOMER) {
    const hoursLeft = (ctx.windowStart.getTime() - ctx.now.getTime()) / 3_600_000;
    if (hoursLeft <= ctx.cancelCutoffHours)
      return { allowed: false, denial: 'CANCEL_CUTOFF_PASSED' };
  }
  return { allowed: true };
}

/** Returns the new status or throws InvalidTransitionError. */
export function transitionOrder(
  from: OrderStatus,
  to: OrderStatus,
  ctx: OrderTransitionContext,
): OrderStatus {
  const check = checkOrderTransition(from, to, ctx);
  if (!check.allowed) throw new InvalidTransitionError('order', from, to, check.denial);
  return to;
}

/** Target statuses an actor can reach from `from` right now (drives UI buttons). */
export function allowedOrderTransitions(
  from: OrderStatus,
  ctx: OrderTransitionContext,
): OrderStatus[] {
  return ORDER_TRANSITIONS.filter(
    (rule) =>
      rule.from === from && checkOrderTransition(from, rule.to, { ...ctx, reason: 'x' }).allowed,
  ).map((rule) => rule.to);
}

/** Convenience for the customer app: "can I still cancel?" */
export function customerCanCancel(
  status: OrderStatus,
  now: Date,
  windowStart: Date,
  cancelCutoffHours: number,
): boolean {
  return checkOrderTransition(status, OrderStatus.CANCELLED, {
    actor: OrderActor.CUSTOMER,
    now,
    windowStart,
    cancelCutoffHours,
  }).allowed;
}

/** Baku has no DST: UTC+4 all year. */
export const BAKU_UTC_OFFSET_MINUTES = 240;

/** "2026-10-12" + "08:00" in supplier local time → absolute Date. */
export function windowStartToDate(
  requestedDate: IsoDate,
  timeWindowStart: TimeOfDay,
  utcOffsetMinutes: number = BAKU_UTC_OFFSET_MINUTES,
): Date {
  const [year, month, day] = requestedDate.split('-').map(Number);
  const [hours, minutes] = timeWindowStart.split(':').map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hours === undefined ||
    minutes === undefined ||
    [year, month, day, hours, minutes].some((n) => Number.isNaN(n))
  ) {
    throw new RangeError(`Invalid window: ${requestedDate} ${timeWindowStart}`);
  }
  return new Date(Date.UTC(year, month - 1, day, hours, minutes) - utcOffsetMinutes * 60_000);
}

function hasReason(reason: string | null | undefined): boolean {
  return typeof reason === 'string' && reason.trim().length > 0;
}
