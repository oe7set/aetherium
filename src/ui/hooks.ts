import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { DecimalSource } from 'break_eternity.js';
import { formatInt, formatNumber } from '../engine';
import { useGame } from '../store/gameStore';

const DESKTOP_QUERY = '(min-width: 1024px)';

function subscribeMedia(cb: () => void): () => void {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeMedia,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

/** Number formatters bound to the player's chosen format. */
export function useFmt(): {
  num: (v: DecimalSource, digits?: number) => string;
  int: (v: number) => string;
} {
  const format = useGame((s) => s.game.settings.numberFormat);
  return {
    num: useCallback(
      (v: DecimalSource, digits?: number) => formatNumber(v, format, digits),
      [format],
    ),
    int: useCallback((v: number) => formatInt(v, format), [format]),
  };
}

/** Re-renders every `ms` milliseconds (for clocks and countdowns). */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

/**
 * Long-press for touch tooltips (no hover dependence). Returns handlers to spread on an element.
 * A normal tap still triggers `onTap`.
 */
export function useLongPress(onLongPress: () => void, onTap?: () => void, delay = 450) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);

  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  return {
    onPointerDown: () => {
      fired.current = false;
      clear();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLongPress();
      }, delay);
    },
    onPointerUp: () => {
      clear();
      if (!fired.current) onTap?.();
    },
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  };
}
