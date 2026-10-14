import type { IsoDateTime } from '../domain/common';

/** D7: concrete lives `settings.concreteLifetimeMin` (90) from departure; warn this long before the end (75). */
export const CONCRETE_WARNING_BEFORE_MIN = 15;

export type ConcreteLevel = 'ok' | 'warning' | 'expired';

export interface ConcreteTimerState {
  /** Whole seconds since departure. */
  elapsedSec: number;
  /** Whole minutes left before the concrete expires (0 once expired). */
  remainingMin: number;
  level: ConcreteLevel;
}

/** Pure: the driver app ticks it every second, the panel evaluates it per snapshot. */
export function concreteTimer(
  departedAt: IsoDateTime,
  now: Date,
  lifetimeMin: number,
  warningBeforeMin: number = CONCRETE_WARNING_BEFORE_MIN,
): ConcreteTimerState {
  const elapsedSec = Math.max(0, Math.floor((now.getTime() - Date.parse(departedAt)) / 1000));
  const elapsedMin = elapsedSec / 60;
  const remainingMin = Math.max(0, Math.ceil(lifetimeMin - elapsedMin));
  const level: ConcreteLevel =
    elapsedMin >= lifetimeMin
      ? 'expired'
      : elapsedMin >= lifetimeMin - warningBeforeMin
        ? 'warning'
        : 'ok';
  return { elapsedSec, remainingMin, level };
}

/** 4505 → "75:05" (minutes keep growing past 59 so the driver reads one number). */
export function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
