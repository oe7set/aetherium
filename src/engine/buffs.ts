import { getBuff, LUCKY_EVENTS } from '../data';
import { registerTimeEffect } from './actions';
import type { Emit } from './events';
import { invalidateMods, registerModifierSource } from './modifiers';
import { pick, type Rng } from './rng';
import type { GameState } from './state';

registerModifierSource('buffs', (s) => s.buffs.map((b) => getBuff(b.id).mods));

/** Average seconds between lucky events while something is running. */
export const LUCKY_EVENT_INTERVAL = 9 * 60;

export function addBuff(
  s: GameState,
  id: string,
  emit: Emit,
  duration = getBuff(id).duration,
): void {
  const existing = s.buffs.find((b) => b.id === id);
  if (existing) existing.remaining = Math.max(existing.remaining, duration);
  else s.buffs.push({ id, remaining: duration });
  invalidateMods(s);
  emit({ type: 'buffStarted', id });
}

registerTimeEffect('buffs', {
  next: (s) => s.buffs.reduce((m, b) => Math.min(m, b.remaining), Infinity),
  apply: (s, dt, emit) => {
    if (!s.buffs.length) return;
    let expired = false;
    for (const b of s.buffs) b.remaining -= dt;
    s.buffs = s.buffs.filter((b) => {
      if (b.remaining > 1e-9) return true;
      emit({ type: 'buffExpired', id: b.id });
      expired = true;
      return false;
    });
    if (expired) invalidateMods(s);
  },
});

/**
 * Lucky events: a countdown that only runs while the player is doing something. Event times are
 * exact (the countdown is a time effect), so live play and offline simulation behave identically.
 */
registerTimeEffect('lucky', {
  next: (s) => (s.active ? s.nextLucky : Infinity),
  apply: (s: GameState, dt: number, emit: Emit, rng: Rng) => {
    if (!s.active || dt <= 0) return;
    s.nextLucky -= dt;
    if (s.nextLucky <= 1e-9) {
      s.nextLucky = LUCKY_EVENT_INTERVAL * (0.5 + rng());
      addBuff(s, pick(rng, LUCKY_EVENTS).id, emit);
      s.stats.luckyEvents = (s.stats.luckyEvents ?? 0) + 1;
    }
  },
});
