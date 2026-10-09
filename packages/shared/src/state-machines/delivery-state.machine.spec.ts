import { DeliveryStatus, OrderStatus } from '../enums';
import {
  checkDeliveryTransition,
  DELIVERY_TRANSITIONS,
  deriveOrderStatus,
  DRIVER_HAPPY_PATH,
  isTerminalDeliveryStatus,
  isTrackingDeliveryStatus,
  nextDriverStatus,
  TERMINAL_DELIVERY_STATUSES,
  transitionDelivery,
} from './delivery-state.machine';
import { InvalidTransitionError } from './errors';

describe('delivery state machine (spec §8.2)', () => {
  it('walks the driver happy path with the big buttons', () => {
    let status: DeliveryStatus = DeliveryStatus.ASSIGNED;
    for (const expected of DRIVER_HAPPY_PATH) {
      const next = nextDriverStatus(status);
      expect(next).toBe(expected);
      status = transitionDelivery(status, next!, { actor: 'DRIVER' });
    }
    expect(status).toBe('COMPLETED');
    expect(nextDriverStatus(DeliveryStatus.COMPLETED)).toBeNull();
    expect(nextDriverStatus(DeliveryStatus.PLANNED)).toBeNull(); // dispatcher must assign first
  });

  it('lets the dispatcher assign and cancel with a reason, the system auto-arrive', () => {
    expect(
      transitionDelivery(DeliveryStatus.PLANNED, DeliveryStatus.ASSIGNED, { actor: 'DISPATCHER' }),
    ).toBe('ASSIGNED');
    expect(
      transitionDelivery(DeliveryStatus.EN_ROUTE, DeliveryStatus.ARRIVED, { actor: 'SYSTEM' }),
    ).toBe('ARRIVED');
    for (const from of [
      DeliveryStatus.PLANNED,
      DeliveryStatus.ASSIGNED,
      DeliveryStatus.LOADING,
      DeliveryStatus.EN_ROUTE,
      DeliveryStatus.ARRIVED,
      DeliveryStatus.UNLOADING,
    ]) {
      expect(
        checkDeliveryTransition(from, DeliveryStatus.CANCELLED, { actor: 'DISPATCHER' }),
      ).toEqual({
        allowed: false,
        denial: 'REASON_REQUIRED',
      });
      expect(
        transitionDelivery(from, DeliveryStatus.CANCELLED, {
          actor: 'DISPATCHER',
          reason: 'Sifariş ləğv',
        }),
      ).toBe('CANCELLED');
      expect(
        checkDeliveryTransition(from, DeliveryStatus.CANCELLED, { actor: 'DRIVER', reason: 'x' }),
      ).toEqual({ allowed: false, denial: 'ACTOR_NOT_ALLOWED' });
    }
  });

  it('allows FAILED only from ARRIVED/UNLOADING with a reason', () => {
    expect(
      transitionDelivery(DeliveryStatus.ARRIVED, DeliveryStatus.FAILED, {
        actor: 'DRIVER',
        reason: 'Obyektə giriş yoxdur',
      }),
    ).toBe('FAILED');
    expect(
      checkDeliveryTransition(DeliveryStatus.UNLOADING, DeliveryStatus.FAILED, { actor: 'DRIVER' }),
    ).toEqual({ allowed: false, denial: 'REASON_REQUIRED' });
    expect(
      checkDeliveryTransition(DeliveryStatus.EN_ROUTE, DeliveryStatus.FAILED, {
        actor: 'DRIVER',
        reason: 'x',
      }),
    ).toEqual({ allowed: false, denial: 'INVALID_TRANSITION' });
    expect(() =>
      transitionDelivery(DeliveryStatus.COMPLETED, DeliveryStatus.EN_ROUTE, { actor: 'DRIVER' }),
    ).toThrow(InvalidTransitionError);
  });

  it('classifies statuses', () => {
    expect(TERMINAL_DELIVERY_STATUSES.every(isTerminalDeliveryStatus)).toBe(true);
    expect(isTerminalDeliveryStatus(DeliveryStatus.EN_ROUTE)).toBe(false);
    expect(isTrackingDeliveryStatus(DeliveryStatus.EN_ROUTE)).toBe(true);
    expect(isTrackingDeliveryStatus(DeliveryStatus.ARRIVED)).toBe(true);
    expect(isTrackingDeliveryStatus(DeliveryStatus.LOADING)).toBe(false);
    for (const rule of DELIVERY_TRANSITIONS)
      expect(isTerminalDeliveryStatus(rule.from)).toBe(false);
  });

  it('derives the order status from its deliveries', () => {
    const d = (status: DeliveryStatus) => ({ status });
    expect(deriveOrderStatus(OrderStatus.SCHEDULED, [])).toBeNull();
    expect(deriveOrderStatus(OrderStatus.SCHEDULED, [d('ASSIGNED'), d('PLANNED')])).toBeNull();
    expect(deriveOrderStatus(OrderStatus.SCHEDULED, [d('EN_ROUTE'), d('PLANNED')])).toBe(
      'IN_PROGRESS',
    );
    expect(deriveOrderStatus(OrderStatus.IN_PROGRESS, [d('COMPLETED'), d('EN_ROUTE')])).toBeNull();
    expect(deriveOrderStatus(OrderStatus.IN_PROGRESS, [d('COMPLETED'), d('CANCELLED')])).toBe(
      'COMPLETED',
    );
    expect(deriveOrderStatus(OrderStatus.IN_PROGRESS, [d('FAILED'), d('CANCELLED')])).toBeNull();
    expect(deriveOrderStatus(OrderStatus.CONFIRMED, [d('COMPLETED')])).toBeNull();
  });
});
