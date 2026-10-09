import { DeliveryStatus, OrderStatus } from '../enums';
import { isPointInPolygon } from '../geo/geo';
import { formatAzn } from '../money/money';
import { calculateQuote } from '../pricing/calculate-quote';
import { CONCRETE_PRICES, createFixtures, ORDER_IDS, TRACKED_DELIVERY_ID } from './index';

const now = new Date('2026-10-09T08:30:00.000Z'); // 12:30 Baku

describe('fixtures (spec §18 seed as data)', () => {
  const fx = createFixtures(now);

  it('carries the real price list and supplier contact', () => {
    expect(fx.products).toHaveLength(11);
    expect(CONCRETE_PRICES[0]).toEqual(['M100', '90.00']);
    expect(CONCRETE_PRICES[10]).toEqual(['M600', '140.00']);
    expect(fx.products.map((p) => p.basePrice)).toEqual(CONCRETE_PRICES.map(([, price]) => price));
    expect(fx.supplier.phone).toBe('+994506209584');
    expect(fx.supplier.email).toBe('info@novxanibeton.az');
    expect(fx.plant.location).toEqual({ lat: 40.4858529, lng: 49.8294278 });
    expect(fx.supplier.settings.vatRate).toBe(0.18);
  });

  it('keeps every site inside the service area and every order consistent', () => {
    for (const site of fx.sites)
      expect(isPointInPolygon(site.location, fx.serviceArea.polygon)).toBe(true);
    for (const order of fx.orders) {
      const product = fx.products.find((p) => p.id === order.productId)!;
      const quote = calculateQuote({
        product,
        volumeM3: order.volumeM3,
        pumpOption: order.pumpRequired ? fx.pumpOptions[0]! : null,
        settings: fx.supplier.settings,
      });
      expect(quote.ok).toBe(true);
      if (quote.ok) expect(order.pricing).toEqual(quote.breakdown);
      expect(order.totalAmount).toBe(order.pricing.total);
      expect(fx.sites.some((s) => s.id === order.siteId)).toBe(true);
      expect(fx.events.some((e) => e.orderId === order.id && e.type === 'CREATED')).toBe(true);
    }
    const pending = fx.orders.find((o) => o.id === ORDER_IDS.pending)!;
    expect(formatAzn(pending.totalAmount)).toBe('1 557,60 ₼'); // 12 m³ × 110 + 18 % VAT
    const confirmed = fx.orders.find((o) => o.id === ORDER_IDS.confirmed)!;
    // 8 m³ × 105 = 840 + 18 % VAT 151,20 + pump 200 (not taxed, D15)
    expect(formatAzn(confirmed.totalAmount)).toBe('1 191,20 ₼');
  });

  it('covers every order status once and sums deliveries to the order volume', () => {
    expect(fx.orders.map((o) => o.status).sort()).toEqual(
      [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.SCHEDULED,
        OrderStatus.IN_PROGRESS,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ].sort(),
    );
    for (const order of fx.orders) {
      const deliveries = fx.deliveries.filter((d) => d.orderId === order.id);
      if (deliveries.length > 0) {
        expect(deliveries.reduce((sum, d) => sum + d.volumeM3, 0)).toBe(order.volumeM3);
        expect(deliveries.map((d) => d.sequence)).toEqual(deliveries.map((_, i) => i + 1));
      }
    }
  });

  it('has one tracked EN_ROUTE delivery with a route, a position and history', () => {
    const tracked = fx.deliveries.find((d) => d.id === TRACKED_DELIVERY_ID)!;
    expect(tracked.status).toBe(DeliveryStatus.EN_ROUTE);
    expect(tracked.lastLocation).not.toBeNull();
    expect(tracked.etaMinutes).toBeGreaterThan(0);
    expect(fx.routes[TRACKED_DELIVERY_ID]!.length).toBeGreaterThan(30);
    const history = fx.locations.filter((l) => l.deliveryId === TRACKED_DELIVERY_ID);
    expect(history.length).toBeGreaterThan(10);
    expect(history.map((l) => l.recordedAt)).toEqual([...history.map((l) => l.recordedAt)].sort());
    expect(fx.documents.map((d) => d.deliveryId).sort()).toEqual(['del_104_1', 'del_105_1']);
  });

  it('is independent per call (mutations do not leak)', () => {
    const a = createFixtures(now);
    const b = createFixtures(now);
    a.orders[0]!.status = OrderStatus.REJECTED;
    expect(b.orders[0]!.status).toBe(OrderStatus.PENDING);
    expect(a.users.map((u) => u.email)).toContain('dispatcher@novxanibeton.az');
  });
});
