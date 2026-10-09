import { OrderStatus } from '../enums';
import { InvalidTransitionError } from './errors';
import {
  ACTIVE_ORDER_STATUSES,
  allowedOrderTransitions,
  checkOrderTransition,
  customerCanCancel,
  isTerminalOrderStatus,
  ORDER_TRANSITIONS,
  type OrderActor,
  TERMINAL_ORDER_STATUSES,
  transitionOrder,
  windowStartToDate,
} from './order-state.machine';

const now = new Date('2026-10-09T08:00:00.000Z');
const farWindow = new Date('2026-10-11T08:00:00.000Z'); // 48 h away
const nearWindow = new Date('2026-10-09T12:00:00.000Z'); // 4 h away

const ctx = (actor: OrderActor, extra = {}) => ({
  actor,
  now,
  windowStart: farWindow,
  cancelCutoffHours: 12,
  ...extra,
});

describe('order state machine (spec §8.1)', () => {
  it('lets the dispatcher confirm, schedule and (with a reason) reject or cancel', () => {
    expect(transitionOrder(OrderStatus.PENDING, OrderStatus.CONFIRMED, ctx('DISPATCHER'))).toBe(
      'CONFIRMED',
    );
    expect(transitionOrder(OrderStatus.CONFIRMED, OrderStatus.SCHEDULED, ctx('DISPATCHER'))).toBe(
      'SCHEDULED',
    );
    expect(
      checkOrderTransition(OrderStatus.PENDING, OrderStatus.REJECTED, ctx('DISPATCHER')),
    ).toEqual({ allowed: false, denial: 'REASON_REQUIRED' });
    expect(
      checkOrderTransition(
        OrderStatus.PENDING,
        OrderStatus.REJECTED,
        ctx('DISPATCHER', { reason: '  ' }),
      ),
    ).toEqual({ allowed: false, denial: 'REASON_REQUIRED' });
    expect(
      transitionOrder(
        OrderStatus.PENDING,
        OrderStatus.REJECTED,
        ctx('DISPATCHER', { reason: 'Həcm çox kiçikdir' }),
      ),
    ).toBe('REJECTED');
    for (const from of [OrderStatus.CONFIRMED, OrderStatus.SCHEDULED, OrderStatus.IN_PROGRESS]) {
      expect(
        transitionOrder(
          from,
          OrderStatus.CANCELLED,
          ctx('DISPATCHER', { reason: 'Mikser xarab oldu' }),
        ),
      ).toBe('CANCELLED');
      expect(checkOrderTransition(from, OrderStatus.CANCELLED, ctx('DISPATCHER'))).toEqual({
        allowed: false,
        denial: 'REASON_REQUIRED',
      });
    }
  });

  it('lets the customer cancel a pending order freely and a confirmed one only before the cutoff', () => {
    expect(transitionOrder(OrderStatus.PENDING, OrderStatus.CANCELLED, ctx('CUSTOMER'))).toBe(
      'CANCELLED',
    );
    expect(transitionOrder(OrderStatus.CONFIRMED, OrderStatus.CANCELLED, ctx('CUSTOMER'))).toBe(
      'CANCELLED',
    );
    expect(
      checkOrderTransition(
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
        ctx('CUSTOMER', { windowStart: nearWindow }),
      ),
    ).toEqual({ allowed: false, denial: 'CANCEL_CUTOFF_PASSED' });
    expect(customerCanCancel(OrderStatus.CONFIRMED, now, farWindow, 12)).toBe(true);
    expect(customerCanCancel(OrderStatus.CONFIRMED, now, nearWindow, 12)).toBe(false);
    expect(customerCanCancel(OrderStatus.SCHEDULED, now, farWindow, 12)).toBe(false);
    expect(customerCanCancel(OrderStatus.COMPLETED, now, farWindow, 12)).toBe(false);
  });

  it('reserves progress transitions for the system', () => {
    expect(transitionOrder(OrderStatus.SCHEDULED, OrderStatus.IN_PROGRESS, ctx('SYSTEM'))).toBe(
      'IN_PROGRESS',
    );
    expect(transitionOrder(OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED, ctx('SYSTEM'))).toBe(
      'COMPLETED',
    );
    expect(
      checkOrderTransition(OrderStatus.SCHEDULED, OrderStatus.IN_PROGRESS, ctx('DISPATCHER')),
    ).toEqual({ allowed: false, denial: 'ACTOR_NOT_ALLOWED' });
  });

  it('rejects undefined transitions and throws a typed error', () => {
    expect(checkOrderTransition(OrderStatus.PENDING, OrderStatus.COMPLETED, ctx('SYSTEM'))).toEqual(
      {
        allowed: false,
        denial: 'INVALID_TRANSITION',
      },
    );
    expect(() =>
      transitionOrder(OrderStatus.COMPLETED, OrderStatus.PENDING, ctx('SYSTEM')),
    ).toThrow(InvalidTransitionError);
    try {
      transitionOrder(OrderStatus.REJECTED, OrderStatus.CONFIRMED, ctx('DISPATCHER'));
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTransitionError);
      if (error instanceof InvalidTransitionError) {
        expect(error.from).toBe('REJECTED');
        expect(error.to).toBe('CONFIRMED');
        expect(error.denial).toBe('INVALID_TRANSITION');
      }
    }
  });

  it('lists allowed targets per actor for UI buttons', () => {
    expect(allowedOrderTransitions(OrderStatus.PENDING, ctx('DISPATCHER')).sort()).toEqual([
      'CONFIRMED',
      'REJECTED',
    ]);
    expect(allowedOrderTransitions(OrderStatus.PENDING, ctx('CUSTOMER'))).toEqual(['CANCELLED']);
    expect(
      allowedOrderTransitions(OrderStatus.CONFIRMED, ctx('CUSTOMER', { windowStart: nearWindow })),
    ).toEqual([]);
    expect(allowedOrderTransitions(OrderStatus.COMPLETED, ctx('DISPATCHER'))).toEqual([]);
  });

  it('classifies statuses and keeps the table consistent', () => {
    expect(TERMINAL_ORDER_STATUSES.every(isTerminalOrderStatus)).toBe(true);
    expect(ACTIVE_ORDER_STATUSES.some(isTerminalOrderStatus)).toBe(false);
    const allStatuses = Object.values(OrderStatus);
    expect([...TERMINAL_ORDER_STATUSES, ...ACTIVE_ORDER_STATUSES].sort()).toEqual(
      allStatuses.sort(),
    );
    for (const rule of ORDER_TRANSITIONS) {
      expect(isTerminalOrderStatus(rule.from)).toBe(false);
    }
  });

  it('converts supplier-local windows to absolute time (Baku, UTC+4)', () => {
    expect(windowStartToDate('2026-10-12', '08:00').toISOString()).toBe('2026-10-12T04:00:00.000Z');
    expect(windowStartToDate('2026-10-12', '00:30', 0).toISOString()).toBe(
      '2026-10-12T00:30:00.000Z',
    );
    expect(() => windowStartToDate('2026-10', '08:00')).toThrow(RangeError);
    expect(() => windowStartToDate('2026-10-12', 'ab:cd')).toThrow(RangeError);
  });
});
