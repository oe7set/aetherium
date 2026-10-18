import { BALANCE } from '../data/balance';
import type { Emit } from './events';
import type { GameState } from './state';
import { levelForXp } from './xp';

export function skillXp(s: GameState, skill: string): number {
  return s.skills[skill]?.xp ?? 0;
}

/** Level cap: 99, or 120 with the „Transzendenz" prestige talent. */
export function levelCap(s: GameState): number {
  return (s.prestige?.upgrades.transcendence ?? 0) > 0
    ? BALANCE.XP_TABLE_MAX_LEVEL
    : BALANCE.MAX_LEVEL;
}

export function skillLevel(s: GameState, skill: string): number {
  return levelForXp(skillXp(s, skill), levelCap(s));
}

export function totalLevel(s: GameState): number {
  return Object.keys(s.skills).reduce((sum, id) => sum + skillLevel(s, id), 0);
}

/** Adds raw XP (multipliers already applied) and emits level-ups. */
export function addXp(s: GameState, skill: string, amount: number, emit: Emit): void {
  if (amount <= 0) return;
  const entry = (s.skills[skill] ??= { xp: 0 });
  const cap = levelCap(s);
  const before = levelForXp(entry.xp, cap);
  entry.xp += amount;
  const after = levelForXp(entry.xp, cap);
  emit({ type: 'xp', skill, amount });
  for (let lvl = before + 1; lvl <= after; lvl++) emit({ type: 'levelUp', skill, level: lvl });
}
