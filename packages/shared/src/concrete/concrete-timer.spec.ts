import { concreteTimer, formatElapsed } from './concrete-timer';

const departedAt = '2026-10-09T08:00:00.000Z';
const at = (minutes: number, seconds = 0) =>
  new Date(Date.parse(departedAt) + minutes * 60_000 + seconds * 1000);

describe('concreteTimer (D7: 90 minutes, warning at 75)', () => {
  it('is fine for the first 75 minutes', () => {
    expect(concreteTimer(departedAt, at(0), 90)).toEqual({
      elapsedSec: 0,
      remainingMin: 90,
      remainingSec: 5400,
      level: 'ok',
    });
    expect(concreteTimer(departedAt, at(74, 59), 90)).toMatchObject({
      remainingMin: 16,
      level: 'ok',
    });
  });

  it('warns from 75 minutes and expires at 90', () => {
    expect(concreteTimer(departedAt, at(75), 90)).toMatchObject({
      remainingMin: 15,
      level: 'warning',
    });
    expect(concreteTimer(departedAt, at(89, 30), 90)).toMatchObject({
      remainingMin: 1,
      level: 'warning',
    });
    expect(concreteTimer(departedAt, at(90), 90)).toMatchObject({
      remainingMin: 0,
      level: 'expired',
    });
    expect(concreteTimer(departedAt, at(120), 90).elapsedSec).toBe(7200);
    expect(concreteTimer(departedAt, at(120), 90).remainingSec).toBe(0);
    expect(concreteTimer(departedAt, at(10, 30), 90).remainingSec).toBe(79 * 60 + 30);
  });

  it('never goes negative and formats minutes past the hour', () => {
    expect(concreteTimer(departedAt, at(-5), 90).elapsedSec).toBe(0);
    expect(formatElapsed(4505)).toBe('75:05');
    expect(formatElapsed(59)).toBe('0:59');
  });
});
