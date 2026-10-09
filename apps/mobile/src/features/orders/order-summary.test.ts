import { renderHook } from '@testing-library/react-native';
import { initI18n } from '@/i18n';
import { useOrderSummary, useSiteContactLabel } from './order-summary';

beforeAll(() => {
  initI18n('az');
});

describe('useOrderSummary', () => {
  it('omits the slump when it is left to the dispatcher', async () => {
    const { result } = await renderHook(() => useOrderSummary());
    expect(result.current('M300', 10, 'P3')).toBe('M300 · 10 m³ · P3');
    expect(result.current('M300', 10, null)).toBe('M300 · 10 m³');
  });
});

describe('useSiteContactLabel', () => {
  it('formats the phone and falls back when the name is missing', async () => {
    const { result } = await renderHook(() => useSiteContactLabel());
    expect(result.current('Orxan', '+994503260343')).toBe('Orxan · +994 50 326 03 43');
    expect(result.current(null, '+994503260343')).toBe('ad göstərilməyib · +994 50 326 03 43');
  });
});
