import { OrderStatus } from '../../enums';
import {
  bakuDate,
  createFixtures,
  CUSTOMER_IDS,
  DRIVER_IDS,
  ORDER_IDS,
  SITE_IDS,
  STAFF,
  TRUCK_IDS,
} from '../../fixtures';
import { formatAzn } from '../../money/money';
import { windowStartToDate } from '../../state-machines/order-state.machine';
import { ApiClientError } from '../errors';
import { createMockApiClient, type MockApiClient } from './mock-api-client';

const NOW = new Date('2026-10-09T08:30:00.000Z'); // 12:30 Baku

function setup(): { api: MockApiClient; setToken: (t: string | null) => void } {
  let token: string | null = null;
  const api = createMockApiClient({
    tokenProvider: () => token,
    fixtures: createFixtures(NOW),
    now: () => NOW,
    latencyMs: 0,
  });
  return { api, setToken: (t) => (token = t) };
}

async function loginAsOrxan(
  api: MockApiClient,
  setToken: (t: string | null) => void,
): Promise<void> {
  await api.auth.requestOtp({ phone: '+994500000001' });
  const session = await api.auth.verifyOtp({ phone: '+994500000001', code: '123456' });
  setToken(session.accessToken);
}

async function loginAsDriver(
  api: MockApiClient,
  setToken: (t: string | null) => void,
  phone: string,
): Promise<void> {
  await api.auth.requestOtp({ phone });
  const session = await api.auth.verifyOtp({ phone, code: '123456' });
  setToken(session.accessToken);
}

const RAUF = '+994500000012';
const ELSHAN = '+994500000011';

async function expectApiError(promise: Promise<unknown>, code: string): Promise<ApiClientError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiClientError);
    const apiError = error as ApiClientError;
    expect(apiError.code).toBe(code);
    return apiError;
  }
  throw new Error(`expected ${code}`);
}

describe('mock api client — auth', () => {
  it('signs a known customer in with the dev OTP and rejects a wrong code', async () => {
    const { api, setToken } = setup();
    const otp = await api.auth.requestOtp({ phone: '+994500000001' });
    expect(otp.devCode).toBe('123456');
    await expectApiError(
      api.auth.verifyOtp({ phone: '+994500000001', code: '000000' }),
      'OTP_INVALID',
    );
    const session = await api.auth.verifyOtp({ phone: '+994500000001', code: '123456' });
    expect(session.user.id).toBe(CUSTOMER_IDS.orxan);
    expect(session.customer?.customerType).toBe('INDIVIDUAL');
    setToken(session.accessToken);
    expect((await api.auth.me()).fullName).toBe('Orxan Məmmədli');
  });

  it('creates a new customer for an unknown phone and lets them update their profile', async () => {
    const { api, setToken } = setup();
    const session = await api.auth.verifyOtp({ phone: '+994559998877', code: '123456' });
    expect(session.user.role).toBe('CUSTOMER');
    expect(session.user.fullName).toBeNull();
    setToken(session.accessToken);
    const updated = await api.auth.updateProfile({ fullName: 'Yeni Müştəri', locale: 'ru' });
    expect(updated.fullName).toBe('Yeni Müştəri');
    expect(updated.locale).toBe('ru');
    expect(await api.orders.list()).toEqual({ items: [], total: 0, page: 1, limit: 20 });
  });

  it('signs staff in with email + password, rotates refresh tokens, and requires auth', async () => {
    const { api, setToken } = setup();
    await expectApiError(
      api.auth.staffLogin({ email: STAFF.dispatcher.email, password: 'wrong-pass' }),
      'UNAUTHORIZED',
    );
    const session = await api.auth.staffLogin({
      email: STAFF.dispatcher.email,
      password: STAFF.dispatcher.password,
    });
    expect(session.user.role).toBe('DISPATCHER');
    const refreshed = await api.auth.refresh(session.refreshToken);
    expect(refreshed.accessToken).not.toBe(session.accessToken);
    await expectApiError(api.auth.refresh(session.refreshToken), 'UNAUTHORIZED'); // rotated
    await api.auth.logout(refreshed.refreshToken);
    await expectApiError(api.auth.refresh(refreshed.refreshToken), 'UNAUTHORIZED');
    setToken(null);
    await expectApiError(api.auth.me(), 'UNAUTHORIZED');
    await expectApiError(api.orders.list(), 'UNAUTHORIZED');
    await expectApiError(
      api.auth.verifyOtp({ phone: '+994506209584', code: '123456' }),
      'FORBIDDEN',
    ); // staff phone
  });
});

describe('mock api client — catalog', () => {
  it('lists the 11 grades in order and quotes with VAT and the earliest slot', async () => {
    const { api } = setup();
    const products = await api.catalog.listProducts();
    expect(products.map((p) => p.grade)).toEqual([
      'M100',
      'M150',
      'M200',
      'M250',
      'M300',
      'M350',
      'M400',
      'M450',
      'M500',
      'M550',
      'M600',
    ]);
    const m300 = products.find((p) => p.grade === 'M300')!;
    const quote = await api.catalog.quote({ productId: m300.id, volumeM3: 10, pumpOptionId: null });
    expect(formatAzn(quote.breakdown.total)).toBe('1 298,00 ₼');
    expect(quote.pumpPriceKnown).toBe(true);
    // 12:30 Baku + 2 h lead = 14:30 → next 2-hour slot 16:00–18:00 today (owner, 2026-10-12)
    expect(quote.earliestSlot).toEqual({
      date: '2026-10-09',
      timeWindowStart: '16:00',
      timeWindowEnd: '18:00',
    });
    const pumped = await api.catalog.quote({
      productId: m300.id,
      volumeM3: 10,
      pumpOptionId: 'pump_24m',
    });
    expect(pumped.pumpPriceKnown).toBe(true);
    expect(pumped.breakdown.pumpFee).toBe('200.00');
    expect(pumped.breakdown.vat).toBe('198.00'); // VAT on the concrete only (D15)
    expect(pumped.breakdown.total).toBe('1498.00');
    await expectApiError(
      api.catalog.quote({ productId: m300.id, volumeM3: 1, pumpOptionId: null }),
      'MIN_VOLUME_NOT_MET',
    );
    await expectApiError(
      api.catalog.quote({
        productId: m300.id,
        volumeM3: 10,
        pumpOptionId: null,
        location: { lat: 41.5, lng: 48.5 },
      }),
      'OUT_OF_SERVICE_AREA',
    );
    await expectApiError(
      api.catalog.quote({ productId: 'nope', volumeM3: 10, pumpOptionId: null }),
      'NOT_FOUND',
    );
    await expectApiError(
      api.catalog.quote({ productId: m300.id, volumeM3: -1, pumpOptionId: null }),
      'VALIDATION_ERROR',
    );
  });
});

describe('mock api client — sites', () => {
  it('scopes sites to the signed-in customer', async () => {
    const { api, setToken } = setup();
    await loginAsOrxan(api, setToken);
    const sites = await api.sites.list();
    expect(sites).toHaveLength(3);
    expect(sites[0]!.id).toBe(SITE_IDS.yasamal);
    await expectApiError(api.sites.get(SITE_IDS.binagadi), 'NOT_FOUND'); // other customer's site

    const created = await api.sites.create({
      name: 'Yeni obyekt',
      addressLine: 'Nərimanov, Atatürk pr. 1',
      location: { lat: 40.4, lng: 49.87 },
      accessNotes: null,
      contactName: null,
      contactPhone: '+994501234567',
    });
    expect(created.customerId).toBe(CUSTOMER_IDS.orxan);
    expect(await api.sites.list()).toHaveLength(4);
    const updated = await api.sites.update(created.id, { name: 'Nərimanov' });
    expect(updated.name).toBe('Nərimanov');
    await api.sites.remove(created.id);
    await expectApiError(api.sites.get(created.id), 'NOT_FOUND');
    await expectApiError(
      api.sites.create({
        name: '',
        addressLine: 'x',
        location: { lat: 0, lng: 0 },
        accessNotes: null,
        contactName: null,
        contactPhone: '+994501234567',
      }),
      'VALIDATION_ERROR',
    );
    // the contact phone is mandatory (owner, 2026-10-09)
    await expectApiError(
      api.sites.create({
        name: 'Ok',
        addressLine: 'x',
        location: { lat: 40.4, lng: 49.87 },
        accessNotes: null,
        contactName: null,
        contactPhone: '',
      }),
      'VALIDATION_ERROR',
    );
  });
});

describe('mock api client — orders', () => {
  it('lists, filters and paginates the customer orders newest first', async () => {
    const { api, setToken } = setup();
    await loginAsOrxan(api, setToken);
    const page = await api.orders.list({ limit: 4 });
    expect(page.total).toBe(6);
    expect(page.items).toHaveLength(4);
    expect(page.items[0]!.id).toBe(ORDER_IDS.pending);
    expect(page.items[0]!.productGrade).toBe('M300');
    expect(page.items[0]!.siteName).toContain('Yasamal');
    const active = await api.orders.list({ status: [OrderStatus.IN_PROGRESS] });
    expect(active.items.map((o) => o.id)).toEqual([ORDER_IDS.inProgress]);
    expect(active.items[0]!.deliveriesTotal).toBe(3);
    expect(active.items[0]!.deliveriesCompleted).toBe(1);
    expect(active.items[0]!.activeEtaMinutes).toBeGreaterThan(0);
  });

  it('returns the full detail with crew, documents and events, and hides other customers', async () => {
    const { api, setToken } = setup();
    await loginAsOrxan(api, setToken);
    const detail = await api.orders.get(ORDER_IDS.inProgress);
    expect(detail.product.grade).toBe('M300');
    expect(detail.site.id).toBe(SITE_IDS.yasamal);
    expect(detail.deliveries.map((d) => d.status)).toEqual(['COMPLETED', 'EN_ROUTE', 'ASSIGNED']);
    expect(detail.deliveries[1]!.driver?.fullName).toBe('Elşən Məmmədov');
    expect(detail.deliveries[0]!.document?.receivedByName).toBe('Orxan Məmmədli');
    expect(detail.events[0]!.type).toBe('CREATED');
    await expectApiError(api.orders.get('ord_999'), 'NOT_FOUND');
    expect(await api.orders.listDocuments(ORDER_IDS.inProgress)).toHaveLength(1);
  });

  it('creates a PENDING order with the server-side price snapshot', async () => {
    const { api, setToken } = setup();
    await loginAsOrxan(api, setToken);
    const created = await api.orders.create({
      productId: 'prod_m300',
      siteId: SITE_IDS.yasamal,
      volumeM3: 10,
      slump: 'P3',
      pumpRequired: false,
      pumpOptionId: null,
      requestedDate: '2026-10-10',
      timeWindowStart: '08:00',
      timeWindowEnd: '10:00',
      paymentMethod: 'CASH',
      customerNote: null,
    });
    expect(created.status).toBe('PENDING');
    expect(created.number).toBe('CN-2026-000107');
    expect(created.totalAmount).toBe('1298.00');
    expect(created.siteContactName).toBe('Orxan');
    expect(created.siteContactPhone).toBe('+994500000001');
    expect(created.events).toHaveLength(1);
    expect((await api.orders.list()).items[0]!.id).toBe(created.id);
  });

  it('validates the window, the lead time, the site owner and the pump option', async () => {
    const { api, setToken } = setup();
    await loginAsOrxan(api, setToken);
    const base = {
      productId: 'prod_m300',
      siteId: SITE_IDS.yasamal,
      volumeM3: 10,
      slump: 'P3' as const,
      pumpRequired: false,
      pumpOptionId: null,
      requestedDate: '2026-10-10',
      timeWindowStart: '08:00',
      timeWindowEnd: '10:00',
      paymentMethod: 'CASH' as const,
      customerNote: null,
    };
    const tooSoon = await expectApiError(
      api.orders.create({
        ...base,
        requestedDate: '2026-10-09',
        timeWindowStart: '14:00',
        timeWindowEnd: '16:00',
      }),
      'VALIDATION_ERROR',
    );
    expect((tooSoon.details as { field: string }).field).toBe('requestedDate');
    await expectApiError(
      api.orders.create({ ...base, timeWindowEnd: '07:00' }),
      'VALIDATION_ERROR',
    );
    await expectApiError(api.orders.create({ ...base, siteId: SITE_IDS.binagadi }), 'NOT_FOUND');
    await expectApiError(api.orders.create({ ...base, pumpRequired: true }), 'VALIDATION_ERROR');
    await expectApiError(
      api.orders.create({ ...base, pumpRequired: true, pumpOptionId: 'pump_99' }),
      'NOT_FOUND',
    );
    await expectApiError(api.orders.create({ ...base, volumeM3: 2 }), 'MIN_VOLUME_NOT_MET');
    await expectApiError(
      api.orders.create({ ...base, customerNote: 'x'.repeat(501) }),
      'VALIDATION_ERROR',
    );
    const night = await api.orders.create({
      ...base,
      requestedDate: '2026-10-10',
      timeWindowStart: '22:00',
      timeWindowEnd: '00:00',
    });
    expect(night.timeWindowEnd).toBe('00:00');
    const noSlump = await api.orders.create({ ...base, slump: null });
    expect(noSlump.slump).toBeNull();
  });

  it('applies the cancellation rules of the state machine', async () => {
    const { api, setToken } = setup();
    await loginAsOrxan(api, setToken);
    const cancelled = await api.orders.cancel(ORDER_IDS.pending, { reason: 'Plan dəyişdi' });
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancelledBy).toBe('CUSTOMER');
    expect(cancelled.events.at(-1)?.payload).toEqual({ reason: 'Plan dəyişdi' });
    // confirmed order 2 days out: allowed (cutoff 12 h)
    expect((await api.orders.cancel(ORDER_IDS.confirmed)).status).toBe('CANCELLED');
    // scheduled tomorrow 14:00 → 25.5 h away but customers cannot cancel SCHEDULED
    const denied = await expectApiError(
      api.orders.cancel(ORDER_IDS.scheduled),
      'INVALID_STATE_TRANSITION',
    );
    expect((denied.details as { denial: string }).denial).toBe('ACTOR_NOT_ALLOWED');
    await expectApiError(api.orders.cancel(ORDER_IDS.completed), 'INVALID_STATE_TRANSITION');
  });

  it('prefills a reorder draft on the earliest slot', async () => {
    const { api, setToken } = setup();
    await loginAsOrxan(api, setToken);
    const draft = await api.orders.reorder(ORDER_IDS.completed);
    expect(draft).toMatchObject({
      productId: 'prod_m200',
      siteId: SITE_IDS.xirdalan,
      volumeM3: 12,
      requestedDate: '2026-10-09',
    });
  });
});

describe('mock api client — tracking', () => {
  it('returns live positions and streams movement to subscribers', async () => {
    const { api, setToken } = setup();
    await loginAsOrxan(api, setToken);
    const live = await api.tracking.getOrderLive(ORDER_IDS.inProgress);
    expect(live).toHaveLength(1);
    expect(live[0]!.deliveryId).toBe('del_104_2');

    const locations: number[] = [];
    const unsubscribe = api.tracking.subscribeOrder(ORDER_IDS.inProgress, {
      onLocation: (e) => locations.push(e.etaMinutes ?? -1),
    });
    expect(api.tracker.running).toBe(true);
    const before = live[0]!.etaMinutes!;
    api.tracker.tick(60_000);
    expect(locations).toHaveLength(1);
    expect(locations[0]).toBeLessThan(before);
    unsubscribe();
    expect(api.tracker.running).toBe(false);
    api.tracker.tick(60_000);
    expect(locations).toHaveLength(1); // no listener any more
    await expectApiError(api.tracking.getOrderLive('ord_999'), 'NOT_FOUND');
  });
});
describe('mock api client — driver', () => {
  it("lists the signed-in driver's trips for the day with order and site facts", async () => {
    const { api, setToken } = setup();
    await loginAsDriver(api, setToken, RAUF);
    const today = await api.driver.listDeliveries();
    expect(today.map((d) => d.id)).toEqual(['del_104_1', 'del_104_3']);
    const trip = today[1]!;
    expect(trip.order.number).toBe('CN-2026-000104');
    expect(trip.order.productGrade).toBe('M300');
    expect(trip.order.totalVolumeM3).toBe(25);
    expect(trip.volumeM3).toBe(5);
    expect(trip.site.name).toBe('Yasamal, ev tikintisi');
    expect(trip.site.contactPhone).toBe('+994500000001');
    expect(trip.order.customerPhone).toBe('+994500000001');
    expect(trip.truck?.plateNumber).toBe('90-AA-005');

    await loginAsDriver(api, setToken, ELSHAN);
    expect((await api.driver.listDeliveries()).map((d) => d.id)).toEqual(['del_104_2']);
    expect((await api.driver.listDeliveries('2026-10-10')).map((d) => d.id)).toEqual(['del_103_1']);
    await expectApiError(api.driver.getDelivery('del_104_3'), 'NOT_FOUND'); // Rauf's trip

    await loginAsOrxan(api, setToken);
    await expectApiError(api.driver.listDeliveries(), 'FORBIDDEN');
  });

  it('walks the happy path through the state machine, records the act and completes the order', async () => {
    const { api, setToken } = setup();
    const statuses: string[] = [];
    const orderStatuses: string[] = [];
    api.tracker.events.on('deliveryStatus', (e) => statuses.push(`${e.deliveryId}:${e.status}`));
    api.tracker.events.on('orderStatus', (e) => orderStatuses.push(e.status));

    await loginAsDriver(api, setToken, RAUF);
    let trip = await api.driver.setStatus('del_104_3', { to: 'LOADING' });
    expect(trip.status).toBe('LOADING');
    trip = await api.driver.setStatus('del_104_3', { to: 'EN_ROUTE' });
    expect(trip.departedAt).toBe(NOW.toISOString());
    expect(api.store.driverControlled.has('del_104_3')).toBe(true);

    const pushed = await api.driver.pushLocations('del_104_3', [
      {
        lat: 40.47,
        lng: 49.83,
        speedKmh: 30,
        heading: 150,
        accuracyM: 150,
        recordedAt: '2026-10-09T08:31:00.000Z',
      },
      {
        lat: 40.46,
        lng: 49.825,
        speedKmh: 32,
        heading: 160,
        accuracyM: 12,
        recordedAt: '2026-10-09T08:32:00.000Z',
      },
      {
        lat: 40.46,
        lng: 49.825,
        speedKmh: 32,
        heading: 160,
        accuracyM: 12,
        recordedAt: '2026-10-09T08:32:00.000Z',
      },
    ]);
    expect(pushed.accepted).toBe(1); // inaccurate point dropped, duplicate ignored
    trip = await api.driver.getDelivery('del_104_3');
    expect(trip.lastLocation).toEqual({ lat: 40.46, lng: 49.825 });
    expect(trip.etaMinutes).toBeGreaterThan(0);
    api.tracker.tick(60_000); // the simulation must not touch a driver-controlled trip
    expect((await api.driver.getDelivery('del_104_3')).status).toBe('EN_ROUTE');

    trip = await api.driver.setStatus('del_104_3', { to: 'ARRIVED' });
    expect(trip.etaMinutes).toBe(0);
    await api.driver.setStatus('del_104_3', { to: 'UNLOADING' });
    await expectApiError(
      api.driver.setStatus('del_104_3', { to: 'COMPLETED' }),
      'VALIDATION_ERROR',
    );
    trip = await api.driver.complete('del_104_3', {
      receivedByName: 'Usta Vüqar',
      photoUris: ['file:///tmp/act.jpg'],
    });
    expect(trip.status).toBe('COMPLETED');
    expect(trip.document).toMatchObject({
      number: 'TA-2026-000104-3',
      receivedByName: 'Usta Vüqar',
      photoUrls: ['file:///tmp/act.jpg'],
    });
    expect(statuses).toEqual([
      'del_104_3:LOADING',
      'del_104_3:EN_ROUTE',
      'del_104_3:ARRIVED',
      'del_104_3:UNLOADING',
      'del_104_3:COMPLETED',
    ]);
    // trip 2 is still en route, so the order stays IN_PROGRESS
    expect(orderStatuses).toEqual([]);

    await loginAsDriver(api, setToken, ELSHAN);
    await api.driver.setStatus('del_104_2', { to: 'ARRIVED' });
    await api.driver.setStatus('del_104_2', { to: 'UNLOADING' });
    await api.driver.complete('del_104_2', { receivedByName: 'Orxan Məmmədli' });
    expect(orderStatuses).toEqual(['COMPLETED']);

    await loginAsOrxan(api, setToken);
    const order = await api.orders.get(ORDER_IDS.inProgress);
    expect(order.status).toBe('COMPLETED');
    expect(order.deliveries.map((d) => d.document?.number)).toEqual([
      'TA-2026-000104-1',
      'TA-2026-000104-2',
      'TA-2026-000104-3',
    ]);
  });

  it('rejects transitions and batches the driver may not make', async () => {
    const { api, setToken } = setup();
    await loginAsDriver(api, setToken, RAUF);
    const skipped = await expectApiError(
      api.driver.setStatus('del_104_3', { to: 'ARRIVED' }),
      'INVALID_STATE_TRANSITION',
    );
    expect((skipped.details as { denial: string }).denial).toBe('INVALID_TRANSITION');
    await expectApiError(
      api.driver.pushLocations('del_104_3', [
        {
          lat: 40.4,
          lng: 49.8,
          speedKmh: null,
          heading: null,
          accuracyM: null,
          recordedAt: '2026-10-09T08:31:00.000Z',
        },
      ]),
      'INVALID_STATE_TRANSITION',
    );
    await api.driver.setStatus('del_104_3', { to: 'LOADING' });
    await api.driver.setStatus('del_104_3', { to: 'EN_ROUTE' });
    await api.driver.setStatus('del_104_3', { to: 'ARRIVED' });
    const noReason = await expectApiError(
      api.driver.setStatus('del_104_3', { to: 'FAILED' }),
      'INVALID_STATE_TRANSITION',
    );
    expect((noReason.details as { denial: string }).denial).toBe('REASON_REQUIRED');
    const failed = await api.driver.setStatus('del_104_3', {
      to: 'FAILED',
      reason: 'Obyektə giriş yoxdur',
    });
    expect(failed.failReason).toBe('Obyektə giriş yoxdur');
    const tooMany = Array.from({ length: 501 }, (_, i) => ({
      lat: 40.4,
      lng: 49.8,
      speedKmh: null,
      heading: null,
      accuracyM: null,
      recordedAt: new Date(NOW.getTime() + i * 1000).toISOString(),
    }));
    await expectApiError(api.driver.pushLocations('del_104_3', tooMany), 'VALIDATION_ERROR');
  });

  it('toggles the shift and the truck', async () => {
    const { api, setToken } = setup();
    await loginAsDriver(api, setToken, RAUF);
    const me = await api.driver.me();
    expect(me).toMatchObject({
      id: DRIVER_IDS.rauf,
      isOnShift: true,
      currentTruckId: TRUCK_IDS.mixer12a,
    });
    expect((await api.driver.setShift({ onShift: false })).isOnShift).toBe(false);
    const moved = await api.driver.setShift({ onShift: true, truckId: TRUCK_IDS.mixer10b });
    expect(moved.currentTruckId).toBe(TRUCK_IDS.mixer10b);
    expect(api.store.data.trucks.find((t) => t.id === TRUCK_IDS.mixer10b)?.currentDriverId).toBe(
      DRIVER_IDS.rauf,
    );
    expect(
      api.store.data.trucks.find((t) => t.id === TRUCK_IDS.mixer12a)?.currentDriverId,
    ).toBeNull();
    await expectApiError(api.driver.setShift({ onShift: true, truckId: 'truck_99' }), 'NOT_FOUND');
  });
});

describe('mock api client — dispatch', () => {
  async function loginAsDispatcher(
    api: MockApiClient,
    setToken: (t: string | null) => void,
  ): Promise<void> {
    const session = await api.auth.staffLogin({
      email: STAFF.dispatcher.email,
      password: STAFF.dispatcher.password,
    });
    setToken(session.accessToken);
  }

  it('lists, filters and searches the supplier orders for staff only', async () => {
    const { api, setToken } = setup();
    await loginAsOrxan(api, setToken);
    await expectApiError(api.dispatch.listOrders(), 'FORBIDDEN');

    await loginAsDispatcher(api, setToken);
    const inbox = await api.dispatch.listOrders({ status: ['PENDING'] });
    expect(inbox.items.map((o) => o.id)).toEqual([ORDER_IDS.pending]);
    expect(inbox.items[0]!.customerName).toBe('Orxan Məmmədli');
    expect(inbox.items[0]!.pumpPriceKnown).toBe(true);
    expect((await api.dispatch.listOrders()).total).toBe(6);
    const tomorrow = await api.dispatch.listOrders({ date: bakuDate(NOW, 1) });
    expect(tomorrow.items.map((o) => o.id)).toEqual([ORDER_IDS.pending, ORDER_IDS.scheduled]);
    const found = await api.dispatch.listOrders({ search: '000104' });
    expect(found.items.map((o) => o.id)).toEqual([ORDER_IDS.inProgress]);
    const detail = await api.dispatch.getOrder(ORDER_IDS.inProgress);
    expect(detail.customer.phone).toBe('+994500000001');
    expect(detail.deliveries).toHaveLength(3);
    await expectApiError(api.dispatch.getOrder('ord_999'), 'NOT_FOUND');
  });

  it('confirms with a window change and a price override, and rejects with a reason', async () => {
    const { api, setToken } = setup();
    const statuses: string[] = [];
    api.tracker.events.on('orderStatus', (e) => statuses.push(e.orderId + ':' + e.status));
    await loginAsDispatcher(api, setToken);
    const date = bakuDate(NOW, 1);
    const confirmed = await api.dispatch.confirm(ORDER_IDS.pending, {
      schedule: {
        requestedDate: date,
        timeWindowStart: '09:00',
        timeWindowEnd: '11:00',
        reason: 'Səhər növbəsi doludur',
      },
      priceOverride: { total: '1500.00', reason: 'Daimi müştəri endirimi' },
      internalNote: 'Usta 8-də gəlir',
    });
    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.confirmedAt).toBe(NOW.toISOString());
    expect(confirmed.timeWindowStart).toBe('09:00');
    expect(confirmed.pricing.total).toBe('1500.00');
    expect(confirmed.totalAmount).toBe('1500.00');
    expect(confirmed.pricing.overrideReason).toBe('Daimi müştəri endirimi');
    expect(confirmed.internalNote).toBe('Usta 8-də gəlir');
    expect(confirmed.events.map((e) => e.type)).toEqual([
      'CREATED',
      'SCHEDULE_CHANGED',
      'PRICE_OVERRIDDEN',
      'STATUS_CHANGED',
    ]);
    expect(statuses).toEqual([ORDER_IDS.pending + ':CONFIRMED']);
    await expectApiError(api.dispatch.confirm(ORDER_IDS.pending), 'INVALID_STATE_TRANSITION');
    await expectApiError(
      api.dispatch.confirm(ORDER_IDS.scheduled, { pumpFee: '100.00' }),
      'INVALID_STATE_TRANSITION',
    );

    const fresh = setup();
    await loginAsDispatcher(fresh.api, fresh.setToken);
    await expectApiError(
      fresh.api.dispatch.confirm(ORDER_IDS.pending, { pumpFee: '100.00' }),
      'VALIDATION_ERROR',
    ); // no pump on that order
    await expectApiError(
      fresh.api.dispatch.reject(ORDER_IDS.pending, { reason: 'x' }),
      'VALIDATION_ERROR',
    );
    const rejected = await fresh.api.dispatch.reject(ORDER_IDS.pending, {
      reason: 'Həcm kifayət deyil',
    });
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.cancelReason).toBe('Həcm kifayət deyil');
    expect(rejected.cancelledBy).toBe('DISPATCHER');
    await expectApiError(
      fresh.api.dispatch.reject(ORDER_IDS.confirmed, { reason: 'Gec oldu' }),
      'INVALID_STATE_TRANSITION',
    );
  });

  it('suggests a plan, schedules the trips and cancels an order with its planned trips', async () => {
    const { api, setToken } = setup();
    const tripEvents: string[] = [];
    api.tracker.events.on('deliveryStatus', (e) => tripEvents.push(e.deliveryId + ':' + e.status));
    await loginAsDispatcher(api, setToken);

    const plan = await api.dispatch.suggestPlan(ORDER_IDS.confirmed); // 8 m³, day after tomorrow
    expect(plan).toEqual([
      {
        sequence: 1,
        volumeM3: 8,
        truckId: TRUCK_IDS.mixer8a,
        driverId: null,
        plannedDepartureAt: windowStartToDate(bakuDate(NOW, 2), '10:00').toISOString(),
      },
    ]);
    await expectApiError(
      api.dispatch.schedule(ORDER_IDS.confirmed, { trips: [{ ...plan[0]!, volumeM3: 6 }] }),
      'VALIDATION_ERROR',
    );
    const scheduled = await api.dispatch.schedule(ORDER_IDS.confirmed, { trips: plan });
    expect(scheduled.status).toBe('SCHEDULED');
    expect(scheduled.deliveries.map((d) => [d.id, d.status, d.truck?.plateNumber])).toEqual([
      ['del_102_1', 'PLANNED', '90-AA-001'],
    ]);
    await expectApiError(api.dispatch.suggestPlan(ORDER_IDS.confirmed), 'INVALID_STATE_TRANSITION');

    const cancelled = await api.dispatch.cancel(ORDER_IDS.scheduled, {
      reason: 'Mikser xarab oldu',
    });
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancelledBy).toBe('DISPATCHER');
    expect(cancelled.deliveries.map((d) => d.status)).toEqual(['CANCELLED', 'CANCELLED']);
    expect(tripEvents).toEqual(['del_103_1:CANCELLED', 'del_103_2:CANCELLED']);
    await expectApiError(
      api.dispatch.cancel(ORDER_IDS.completed, { reason: 'Gec oldu' }),
      'INVALID_STATE_TRANSITION',
    );

    // The customer sees the dispatcher's decision in the same store.
    await loginAsOrxan(api, setToken);
    expect((await api.orders.get(ORDER_IDS.scheduled)).status).toBe('CANCELLED');
  });

  it('reassigns planned trips, builds the board and the live snapshot with alerts', async () => {
    const { api, setToken } = setup();
    await loginAsDispatcher(api, setToken);
    const moved = await api.dispatch.reassignDelivery('del_103_2', {
      truckId: TRUCK_IDS.mixer8a,
      driverId: DRIVER_IDS.kamran,
    });
    expect(moved.status).toBe('ASSIGNED');
    expect(moved.truck?.plateNumber).toBe('90-AA-001');
    expect(moved.driver?.fullName).toBe('Kamran Hüseynov');
    expect(moved.orderNumber).toBe('CN-2026-000103');
    await expectApiError(
      api.dispatch.reassignDelivery('del_104_2', { driverId: DRIVER_IDS.kamran }),
      'INVALID_STATE_TRANSITION',
    );
    await expectApiError(
      api.dispatch.reassignDelivery('del_103_1', { truckId: TRUCK_IDS.pump24 }),
      'NOT_FOUND',
    );

    const today = await api.dispatch.board();
    expect(today.trucks).toHaveLength(6);
    expect(today.deliveries.map((d) => d.id)).toEqual(['del_104_1', 'del_104_2', 'del_104_3']);
    const tomorrow = await api.dispatch.board(bakuDate(NOW, 1));
    expect(tomorrow.deliveries.map((d) => d.id)).toEqual(['del_103_1', 'del_103_2']);

    const live = await api.dispatch.live();
    const elshan = live.trucks.find((t) => t.truck.id === TRUCK_IDS.mixer10a)!;
    expect(elshan.onShift).toBe(true);
    expect(elshan.delivery?.id).toBe('del_104_2');
    expect(elshan.location).not.toBeNull();
    expect(elshan.signalLost).toBe(false);
    expect(live.alerts).toEqual({ late: [], concreteRisk: [], noSignal: [] });

    const trip = api.store.findDelivery('del_104_2')!;
    trip.etaMinutes = 120;
    trip.departedAt = new Date(NOW.getTime() - 80 * 60_000).toISOString();
    trip.lastLocationAt = new Date(NOW.getTime() - 5 * 60_000).toISOString();
    expect((await api.dispatch.live()).alerts).toEqual({
      late: ['del_104_2'],
      concreteRisk: ['del_104_2'],
      noSignal: ['del_104_2'],
    });

    const locations: string[] = [];
    const unsubscribe = api.dispatch.subscribeLive({
      onLocation: (e) => locations.push(e.deliveryId),
    });
    expect(api.tracker.running).toBe(true);
    api.tracker.tick(60_000);
    expect(locations).toEqual(['del_104_2']);
    unsubscribe();
    expect(api.tracker.running).toBe(false);
  });
});
