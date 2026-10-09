import { renderHook } from '@testing-library/react-native';
import { initI18n } from '@/i18n';
import { formatVolume } from '@/lib/format';
import { siteContactLines, useOrderSummary } from './order-summary';

beforeAll(() => {
  initI18n('az');
});

describe('useOrderSummary', () => {
  it('omits the slump when it is left to the dispatcher', async () => {
    const { result } = await renderHook(() => useOrderSummary());
    expect(result.current('M300', 10, 'P3')).toBe(`M300 · ${formatVolume(10)} · P3`);
    expect(result.current('M300', 10, null)).toBe(`M300 · ${formatVolume(10)}`);
  });
});

describe('siteContactLines', () => {
  it('puts the phone under the name, or shows the phone alone', () => {
    expect(siteContactLines('Orxan', '+994503260343')).toEqual({
      title: 'Orxan',
      subtitle: '+994 50 326 03 43',
    });
    expect(siteContactLines(null, '+994503260343')).toEqual({ title: '+994 50 326 03 43' });
  });
});
