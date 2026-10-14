import { concreteTimer, type ConcreteTimerState } from '@concr/shared';
import { useEffect, useState } from 'react';

export interface ConcreteTimerInput {
  departedAt: string | null;
  /** When set the timer freezes at that moment (the trip ended). */
  endedAt: string | null;
  /** `settings.concreteLifetimeMin`; null until the settings have loaded. */
  lifetimeMin: number | null;
  /** Injectable clock for tests. */
  now?: () => Date;
}

/**
 * Seconds since departure with the D7 levels (ok → warning at 75 → expired at 90). Ticks once a
 * second while the trip is running; derived from timestamps so a throttled interval cannot drift.
 */
export function useConcreteTimer({
  departedAt,
  endedAt,
  lifetimeMin,
  now = () => new Date(),
}: ConcreteTimerInput): ConcreteTimerState | null {
  const running = departedAt !== null && endedAt === null;
  const [tick, setTick] = useState(() => now().getTime());

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setTick(now().getTime()), 1000);
    return () => clearInterval(timer);
  }, [running, now]);

  if (departedAt === null || lifetimeMin === null) return null;
  const at = endedAt !== null ? new Date(endedAt) : new Date(Math.max(tick, now().getTime()));
  return concreteTimer(departedAt, at, lifetimeMin);
}
