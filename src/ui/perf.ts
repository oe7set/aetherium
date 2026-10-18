import { useEffect } from 'react';
import { detectQuality } from '../scene/quality';
import { useGame } from '../store/gameStore';

export type PerfMode = 'eco' | 'smooth';

/** "auto" → eco on phones and modest hardware, smooth on strong desktops. */
export function resolvePerf(setting: 'auto' | 'eco' | 'smooth'): PerfMode {
  if (setting !== 'auto') return setting;
  if (typeof navigator === 'undefined') return 'smooth';
  const touch =
    typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches ?? false);
  return touch || detectQuality(navigator as never, window.innerWidth) !== 'high'
    ? 'eco'
    : 'smooth';
}

export function usePerfMode(): PerfMode {
  return useGame((s) => resolvePerf(s.game.settings.performance));
}

/** Puts `perf-eco` / `perf-smooth` on <html> so CSS can drop costly effects. */
export function usePerfClass(): void {
  const mode = usePerfMode();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('perf-eco', mode === 'eco');
    root.classList.toggle('perf-smooth', mode === 'smooth');
  }, [mode]);
}

/** 3D frame rate: eco 30 / smooth 60, and much lower while a menu covers the island. */
export function sceneFps(mode: PerfMode, covered: boolean): number {
  if (covered) return mode === 'eco' ? 12 : 30;
  return mode === 'eco' ? 30 : 60;
}
