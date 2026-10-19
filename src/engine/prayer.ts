import {
  maxPrayerPoints,
  PRAYER_MAP,
  PRAYER_PER_RITE,
  PRAYER_REGEN,
  PRAYER_SLOTS,
  type PrayerDef,
} from '../data/prayers';
import { registerCompletionHook, registerTimeEffect } from './actions';
import type { Emit } from './events';
import { invalidateMods, mod, registerModifierSource } from './modifiers';
import { skillLevel } from './skills';
import type { GameState } from './state';

/** Gebete: faith in combat. Points drain per minute while fighting, refill at rest and by rites. */

export function maxPrayer(s: GameState): number {
  // The Gebetsaltar (Baukunst) adds flat points.
  return maxPrayerPoints(skillLevel(s, 'faith')) + mod(s, 'prayer.max');
}

export function activePrayers(s: GameState): PrayerDef[] {
  if (s.prayer.points <= 0) return [];
  return s.prayer.active.map((id) => PRAYER_MAP.get(id)).filter((p): p is PrayerDef => !!p);
}

/** Prayer points per second right now (0 outside of combat). */
export function prayerDrain(s: GameState): number {
  if (!s.combat) return 0;
  return activePrayers(s).reduce((sum, p) => sum + p.drain, 0) / 60;
}

export function protectsFrom(s: GameState, style: string): boolean {
  return activePrayers(s).some((p) => p.protect === style);
}

registerModifierSource('prayer', (s) => activePrayers(s).map((p) => p.mods ?? {}));

export type PrayerResult = 'on' | 'off' | 'level' | 'slots' | 'empty' | 'unknown';

export function togglePrayer(s: GameState, id: string): PrayerResult {
  const def = PRAYER_MAP.get(id);
  if (!def) return 'unknown';
  const active = s.prayer.active;
  if (active.includes(id)) {
    s.prayer.active = active.filter((x) => x !== id);
    invalidateMods(s);
    return 'off';
  }
  if (skillLevel(s, 'faith') < def.level) return 'level';
  if (s.prayer.points <= 0) return 'empty';
  // Only one protection prayer: a new one replaces the old.
  let next = def.protect ? active.filter((x) => !PRAYER_MAP.get(x)?.protect) : [...active];
  if (next.length >= PRAYER_SLOTS) return 'slots';
  next = [...next, id];
  s.prayer.active = next;
  invalidateMods(s);
  return 'on';
}

export function restorePrayer(s: GameState, amount: number): number {
  const before = s.prayer.points;
  s.prayer.points = Math.min(maxPrayer(s), before + amount);
  if (before <= 0 && s.prayer.points > 0) invalidateMods(s);
  return s.prayer.points - before;
}

registerTimeEffect('prayer', {
  next: (s) => {
    const rate = prayerDrain(s);
    return rate > 0 ? s.prayer.points / rate : Infinity;
  },
  apply: (s, dt, emit: Emit) => {
    if (dt <= 0) return;
    const rate = prayerDrain(s);
    if (rate > 0) {
      s.prayer.points -= rate * dt;
      if (s.prayer.points <= 1e-9) {
        s.prayer.points = 0;
        invalidateMods(s);
        emit({ type: 'prayerEmpty' });
      }
    } else if (!s.combat) {
      const max = maxPrayer(s);
      if (s.prayer.points < max) {
        const wasEmpty = s.prayer.points <= 0;
        s.prayer.points = Math.min(max, s.prayer.points + (PRAYER_REGEN * dt) / 60);
        if (wasEmpty && s.prayer.points > 0) invalidateMods(s);
      }
    }
  },
});

// Every rite at the shrine refills a little prayer.
registerCompletionHook('prayer', (s, def) => {
  if (def.skill === 'faith') restorePrayer(s, PRAYER_PER_RITE);
});
