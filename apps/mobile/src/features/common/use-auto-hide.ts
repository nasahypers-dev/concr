import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION_MS = 6000;

/**
 * Visibility flag that turns itself off after `durationMs` (success banners). `hide` cancels the
 * timer early (leaving the screen, editing again); unmounting clears it too.
 */
export function useAutoHide(
  durationMs = DEFAULT_DURATION_MS,
): [visible: boolean, show: () => void, hide: () => void] {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clear();
    setVisible(false);
  }, [clear]);

  const show = useCallback(() => {
    clear();
    setVisible(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setVisible(false);
    }, durationMs);
  }, [clear, durationMs]);

  useEffect(() => clear, [clear]);

  return [visible, show, hide];
}
