import {
  bakuMinutesOfDay,
  formatDateTime,
  formatMoney,
  formatVolume,
  fromBakuLocalInput,
  minutesSince,
  toBakuLocalInput,
  toMoneyString,
  todayIsoDate,
} from './format';

const now = new Date('2026-10-09T08:30:00.000Z'); // 12:30 in Baku

describe('format helpers (Baku time)', () => {
  it('formats dates, volumes and money', () => {
    expect(formatDateTime('2026-10-09T08:30:00.000Z')).toBe('09.10.2026, 12:30');
    expect(todayIsoDate(now, 1)).toBe('2026-10-10');
    expect(formatVolume(12.5)).toBe('12,5 m³');
    expect(formatMoney('1298.00')).toContain('1');
  });

  it('converts between ISO timestamps and datetime-local values', () => {
    expect(toBakuLocalInput('2026-10-09T08:30:00.000Z')).toBe('2026-10-09T12:30');
    expect(fromBakuLocalInput('2026-10-09T12:30')).toBe('2026-10-09T08:30:00.000Z');
    expect(fromBakuLocalInput('2026-10-09T')).toBeNull();
    expect(bakuMinutesOfDay('2026-10-09T08:30:00.000Z')).toBe(12 * 60 + 30);
    expect(minutesSince('2026-10-09T07:00:00.000Z', now)).toBe(90);
  });

  it('parses typed prices', () => {
    expect(toMoneyString('12,5')).toBe('12.50');
    expect(toMoneyString('200')).toBe('200.00');
    expect(toMoneyString('abc')).toBeNull();
  });
});
