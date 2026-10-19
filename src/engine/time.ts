// Day/night cycle shared by engine (Sternkunde: nights pay double) and the 2D/3D world.

/** Length of one in-game day in real seconds. */
export const DAY_SECONDS = 20 * 60;

/** 0..1 over the day: 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset. */
export function dayPhase(nowMs: number = Date.now()): number {
  return ((nowMs / 1000) % DAY_SECONDS) / DAY_SECONDS;
}

/** 0 at night, 1 at noon, smooth in between. */
export function daylight(phase: number): number {
  return Math.max(0, Math.min(1, Math.sin((phase - 0.25) * Math.PI * 2) * 0.6 + 0.5));
}

/** Dark enough for stars (the same threshold the world uses for its night look). */
export function isNight(nowMs: number): boolean {
  return daylight(dayPhase(nowMs)) < 0.25;
}

/** Seconds until the next night starts (0 while it is night). */
export function secondsToNight(nowMs: number): number {
  for (let t = 0; t < DAY_SECONDS; t += 10) if (isNight(nowMs + t * 1000)) return t;
  return 0;
}
