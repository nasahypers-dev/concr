import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Second-by-second countdown from `seconds` to 0 (OTP validity). `onExpire` fires once per run
 * when 0 is reached; `restart()` starts over. The remaining time is derived from timestamps, so
 * a throttled interval cannot drift.
 */
export function useCountdown(
  seconds: number,
  onExpire?: () => void,
): { remaining: number; restart: () => void } {
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const expireRef = useRef(onExpire);
  const firedFor = useRef<number | null>(null);

  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const remaining = Math.max(0, seconds - Math.round((now - startedAt) / 1000));

  useEffect(() => {
    if (remaining === 0 && firedFor.current !== startedAt) {
      firedFor.current = startedAt;
      expireRef.current?.();
    }
  }, [remaining, startedAt]);

  const restart = useCallback(() => {
    const at = Date.now();
    setStartedAt(at);
    setNow(at);
  }, []);

  return { remaining, restart };
}

/** 60 → "1:00", 59 → "0:59". */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
