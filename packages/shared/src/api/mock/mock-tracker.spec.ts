import { createFixtures, ORDER_IDS, TRACKED_DELIVERY_ID } from '../../fixtures';
import { MockStore } from './mock-store';
import { MockTracker } from './mock-tracker';

const START = new Date('2026-10-09T08:30:00.000Z');

function setup() {
  let clock = START.getTime();
  const store = new MockStore(createFixtures(START));
  const tracker = new MockTracker({
    store,
    now: () => new Date(clock),
    averageSpeedKmh: 36, // 600 m per minute
    unloadingAfterMs: 60_000,
    completeAfterMs: 120_000,
    tickMs: 5000,
  });
  const advance = (ms: number) => {
    clock += ms;
    tracker.tick(ms);
  };
  return { store, tracker, advance };
}

describe('MockTracker', () => {
  it('moves the tracked delivery along its route and lowers the ETA', () => {
    const { store, tracker, advance } = setup();
    const delivery = store.findDelivery(TRACKED_DELIVERY_ID)!;
    const startEta = delivery.etaMinutes!;
    const startLocation = delivery.lastLocation!;
    const events: string[] = [];
    tracker.events.on('location', (e) => events.push(`loc:${e.etaMinutes}`));
    advance(60_000);
    expect(delivery.lastLocation).not.toEqual(startLocation);
    expect(delivery.etaMinutes).toBeLessThan(startEta);
    expect(delivery.lastHeading).toBeGreaterThanOrEqual(0);
    expect(events).toHaveLength(1);
    expect(
      store.data.locations.filter((l) => l.deliveryId === TRACKED_DELIVERY_ID).length,
    ).toBeGreaterThan(21);
  });

  it('arrives, unloads, completes with a document and finishes the order', () => {
    const { store, tracker, advance } = setup();
    const statuses: string[] = [];
    const orderStatuses: string[] = [];
    tracker.events.on('deliveryStatus', (e) => statuses.push(e.status));
    tracker.events.on('orderStatus', (e) => orderStatuses.push(e.status));

    // drive far enough to finish the ~11 km route
    for (let i = 0; i < 30; i += 1) advance(60_000);
    const delivery = store.findDelivery(TRACKED_DELIVERY_ID)!;
    expect(['ARRIVED', 'UNLOADING', 'COMPLETED']).toContain(delivery.status);
    expect(statuses[0]).toBe('ARRIVED');
    expect(delivery.etaMinutes).toBe(0);

    // the third delivery (ASSIGNED, no route) must not move
    const third = store.findDelivery('del_104_3')!;
    expect(third.status).toBe('ASSIGNED');

    // dwell → unloading → completed
    advance(60_000);
    advance(120_000);
    expect(delivery.status).toBe('COMPLETED');
    expect(statuses).toEqual(['ARRIVED', 'UNLOADING', 'COMPLETED']);
    expect(store.data.documents.some((d) => d.deliveryId === TRACKED_DELIVERY_ID)).toBe(true);
    // order stays IN_PROGRESS because delivery 3 is still ASSIGNED
    expect(store.findOrder(ORDER_IDS.inProgress)!.status).toBe('IN_PROGRESS');
    expect(orderStatuses).toEqual([]);

    // once the last trip is done the order completes
    third.status = 'EN_ROUTE';
    store.data.routes['del_104_3'] = store.data.routes[TRACKED_DELIVERY_ID]!;
    store.routeProgress.set('del_104_3', 0.99);
    advance(60_000);
    advance(60_000);
    advance(120_000);
    expect(third.status).toBe('COMPLETED');
    expect(store.findOrder(ORDER_IDS.inProgress)!.status).toBe('COMPLETED');
    expect(orderStatuses).toEqual(['COMPLETED']);
  });

  it('starts and stops a real timer', () => {
    jest.useFakeTimers();
    const { tracker, store } = setup();
    const delivery = store.findDelivery(TRACKED_DELIVERY_ID)!;
    const before = delivery.lastLocation;
    tracker.start();
    tracker.start(); // idempotent
    expect(tracker.running).toBe(true);
    jest.advanceTimersByTime(5000);
    expect(delivery.lastLocation).not.toEqual(before);
    tracker.stop();
    tracker.stop();
    expect(tracker.running).toBe(false);
    jest.useRealTimers();
  });
});
