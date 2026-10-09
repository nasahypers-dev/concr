import {
  formatPhoneAz,
  dayOffsetFromToday,
  formatDate,
  formatDateTime,
  formatTime,
  formatVolume,
  formatWindow,
  todayIsoDate,
} from './format';

const now = new Date('2026-10-09T08:30:00.000Z'); // 12:30 in Baku

describe('format helpers (Baku time)', () => {
  it('formats dates and times in supplier local time', () => {
    expect(formatDate('2026-10-09T21:30:00.000Z')).toBe('10.10.2026'); // 01:30 next day in Baku
    expect(formatDate('2026-10-09')).toBe('09.10.2026');
    expect(formatTime('2026-10-09T08:30:00.000Z')).toBe('12:30');
    expect(formatDateTime('2026-10-09T08:30:00.000Z')).toBe('09.10.2026, 12:30');
    expect(formatWindow('08:00', '10:00')).toBe('08:00–10:00');
  });

  it('computes today and day offsets', () => {
    expect(todayIsoDate(now)).toBe('2026-10-09');
    expect(todayIsoDate(now, 1)).toBe('2026-10-10');
    expect(dayOffsetFromToday('2026-10-10', now)).toBe(1);
    expect(dayOffsetFromToday('2026-10-08', now)).toBe(-1);
    expect(dayOffsetFromToday('2026-10-09', now)).toBe(0);
  });

  it('formats volumes', () => {
    expect(formatVolume(12)).toBe('12 m³');
    expect(formatVolume(7.5)).toBe('7,5 m³');
    expect(formatVolume(7.25)).toBe('7,25 m³');
  });
});

describe('formatPhoneAz', () => {
  it('groups Azerbaijani numbers', () => {
    expect(formatPhoneAz('+994503260343')).toBe('+994 50 326 03 43');
    expect(formatPhoneAz('+994506209584')).toBe('+994 50 620 95 84');
  });
});
