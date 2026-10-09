import { calculateQuote } from '@concr/shared';
import { render, screen } from '@testing-library/react-native';
import { initI18n } from '@/i18n';
import { PriceBreakdown } from './price-breakdown';

beforeAll(() => {
  initI18n('az');
});

const settings = { vatRate: 0.18, minOrderM3: 3, deliveryIncluded: true };

describe('PriceBreakdown', () => {
  it('shows the spec example with VAT and the included delivery', async () => {
    const quote = calculateQuote({
      product: { basePrice: '110.00', minQty: null },
      volumeM3: 10,
      pumpOption: null,
      settings,
    });
    if (!quote.ok) throw new Error(quote.code);
    await render(<PriceBreakdown breakdown={quote.breakdown} grade="M300" pumpRequired={false} />);
    expect(screen.getByText('M300 · 10 m³ × 110,00 ₼')).toBeTruthy();
    expect(screen.getByText('1 100,00 ₼')).toBeTruthy();
    expect(screen.getByText('ƏDV 18%')).toBeTruthy();
    expect(screen.getByText('198,00 ₼')).toBeTruthy();
    expect(screen.getByText('1 298,00 ₼')).toBeTruthy();
    expect(screen.getByText('Qiymətə daxildir')).toBeTruthy();
    expect(screen.queryByText(/Pompa/)).toBeNull();
  });

  it('marks an unknown pump price instead of showing 0', async () => {
    const quote = calculateQuote({
      product: { basePrice: '110.00', minQty: null },
      volumeM3: 8,
      pumpOption: { pricePerOrder: null, pricePerM3: null },
      settings,
    });
    if (!quote.ok) throw new Error(quote.code);
    await render(
      <PriceBreakdown
        breakdown={quote.breakdown}
        grade="M300"
        pumpRequired
        pumpPriceKnown={quote.pumpPriceKnown}
      />,
    );
    expect(screen.getByText(/Qiymət dispetçer tərəfindən təsdiqlənəcək/)).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('adds the pump after VAT: 8 m³ of M200 with a 24 m pump', async () => {
    const quote = calculateQuote({
      product: { basePrice: '100.00', minQty: null },
      volumeM3: 8,
      pumpOption: { pricePerOrder: '200.00', pricePerM3: null },
      settings,
    });
    if (!quote.ok) throw new Error(quote.code);
    await render(<PriceBreakdown breakdown={quote.breakdown} grade="M200" pumpRequired />);
    expect(screen.getByText('800,00 ₼')).toBeTruthy();
    expect(screen.getByText('144,00 ₼')).toBeTruthy();
    expect(screen.getByText('Pompa (ƏDV-siz)')).toBeTruthy();
    expect(screen.getByText('200,00 ₼')).toBeTruthy();
    expect(screen.getByText('1 144,00 ₼')).toBeTruthy();
  });
});
