import { OrderStatus } from '../../enums';
import { createFixtures, CUSTOMER_IDS, ORDER_IDS, SITE_IDS, STAFF } from '../../fixtures';
import { formatAzn } from '../../money/money';
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
    // 12:30 Baku + 6 h lead = 18:30 → next 2-hour slot 20:00–22:00 today
    expect(quote.earliestSlot).toEqual({
      date: '2026-10-09',
      timeWindowStart: '20:00',
      timeWindowEnd: '22:00',
    });
    const pumped = await api.catalog.quote({
      productId: m300.id,
      volumeM3: 10,
      pumpOptionId: 'pump_24m',
    });
    expect(pumped.pumpPriceKnown).toBe(false);
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
    expect(sites[0]!.isDefault).toBe(true);
    await expectApiError(api.sites.get(SITE_IDS.binagadi), 'NOT_FOUND'); // other customer's site

    const created = await api.sites.create({
      name: 'Yeni obyekt',
      addressLine: 'Nərimanov, Atatürk pr. 1',
      location: { lat: 40.4, lng: 49.87 },
      accessNotes: null,
      contactName: null,
      contactPhone: null,
      isDefault: true,
    });
    expect(created.customerId).toBe(CUSTOMER_IDS.orxan);
    expect((await api.sites.list()).filter((s) => s.isDefault)).toHaveLength(1);
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
        contactPhone: null,
        isDefault: false,
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
