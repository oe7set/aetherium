/** Length of one in-game day in real seconds (shared by the 2D and 3D world). */
export const DAY_SECONDS = 20 * 60;

/** 0..1 over the day: 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset. */
export function dayPhase(nowMs: number = Date.now()): number {
  return ((nowMs / 1000) % DAY_SECONDS) / DAY_SECONDS;
}

/** 0 at night, 1 at noon, smooth in between. */
export function daylight(phase: number): number {
  return Math.max(0, Math.min(1, Math.sin((phase - 0.25) * Math.PI * 2) * 0.6 + 0.5));
}
