import { BALANCE } from '../data/balance';
import type { Emit } from './events';
import type { GameState } from './state';
import { levelForXp } from './xp';

export function skillXp(s: GameState, skill: string): number {
  return s.skills[skill]?.xp ?? 0;
}

export function skillLevel(s: GameState, skill: string): number {
  return levelForXp(skillXp(s, skill), BALANCE.MAX_LEVEL);
}

export function totalLevel(s: GameState): number {
  return Object.keys(s.skills).reduce((sum, id) => sum + skillLevel(s, id), 0);
}

/** Global XP multiplier from all sources. */
export function xpMultiplier(s: GameState): number {
  let mult = 1 + s.intelligence * BALANCE.INTELLIGENCE_XP_BONUS;
  if (s.fire > 0) mult *= 1 + BALANCE.FIRE_XP_BONUS;
  return mult;
}

/** Adds raw XP (multipliers already applied) and emits level-ups. */
export function addXp(s: GameState, skill: string, amount: number, emit: Emit): void {
  if (amount <= 0) return;
  const entry = (s.skills[skill] ??= { xp: 0 });
  const before = levelForXp(entry.xp);
  entry.xp += amount;
  const after = levelForXp(entry.xp);
  emit({ type: 'xp', skill, amount });
  for (let lvl = before + 1; lvl <= after; lvl++) emit({ type: 'levelUp', skill, level: lvl });
}
