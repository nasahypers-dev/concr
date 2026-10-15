import {
  bakuMinutesOfDay,
  formatDateTime,
  formatMoney,
  formatVolume,
  fromBakuLocalInput,
  minutesSince,
  previousMonthRange,
  startOfMonthIso,
  startOfWeekIso,
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
  it('derives the report presets from the Baku calendar', () => {
    // 2026-10-09 is a Friday; 20:30 UTC on the 9th is already the 10th in Baku.
    expect(startOfWeekIso(now)).toBe('2026-10-05');
    expect(startOfWeekIso(new Date('2026-10-11T20:30:00.000Z'))).toBe('2026-10-12');
    expect(startOfMonthIso(now)).toBe('2026-10-01');
    expect(previousMonthRange(now)).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(previousMonthRange(new Date('2026-03-15T08:00:00.000Z'))).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
  });
});
