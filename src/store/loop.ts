import { BALANCE } from '../data/balance';
import { useGame } from './gameStore';

/** Gaps longer than this (tab throttled, phone asleep) are treated as offline time. */
const CATCH_UP_THRESHOLD_S = 5;

let running = false;

/**
 * Starts the fixed-rate simulation loop, autosave and lifecycle hooks.
 * Rendering (progress bars, later the 3D scene) runs separately via requestAnimationFrame.
 */
export function startGameLoop(): () => void {
  if (running) return () => {};
  running = true;
  let last = performance.now();

  const tickMs = 1000 / BALANCE.TICKS_PER_SECOND;
  const interval = window.setInterval(() => {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    if (dt > CATCH_UP_THRESHOLD_S) useGame.getState().catchUp(Date.now());
    else useGame.getState().tick(dt);
  }, tickMs);

  const autosave = window.setInterval(() => useGame.getState().save(), BALANCE.AUTOSAVE_MS);

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      useGame.getState().save();
    } else {
      // Resync immediately instead of waiting for the next (possibly throttled) tick.
      last = performance.now();
      useGame.getState().catchUp(Date.now());
    }
  };
  const onLeave = () => useGame.getState().save();

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onLeave);
  window.addEventListener('beforeunload', onLeave);

  return () => {
    running = false;
    window.clearInterval(interval);
    window.clearInterval(autosave);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onLeave);
    window.removeEventListener('beforeunload', onLeave);
  };
}
