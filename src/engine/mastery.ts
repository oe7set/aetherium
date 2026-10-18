import { ACTIONS } from '../data';
import type { ModifierSet } from '../data/types';
import { registerModifierSource } from './modifiers';
import type { GameState } from './state';

/**
 * Meisterschaft: every action levels up on its own (1–99), derived from how often it was completed
 * (stat `action.<id>`, kept through rebirths). Higher mastery = faster and more often double.
 */
export const MASTERY_MAX = 99;

/** Completions needed for a mastery level: ~800 for 10, ~27 000 for 50, ~123 000 for 99. */
export function masteryCompletionsFor(level: number): number {
  return level <= 1 ? 0 : Math.round(5 * Math.pow(level, 2.2));
}

export function masteryLevelFromCount(count: number): number {
  let level = Math.max(1, Math.min(MASTERY_MAX, Math.floor(Math.pow(count / 5, 1 / 2.2))));
  while (level < MASTERY_MAX && count >= masteryCompletionsFor(level + 1)) level++;
  while (level > 1 && count < masteryCompletionsFor(level)) level--;
  return level;
}

export function masteryCount(s: GameState, actionId: string): number {
  return s.stats[`action.${actionId}`] ?? 0;
}

export function masteryLevel(s: GameState, actionId: string): number {
  return masteryLevelFromCount(masteryCount(s, actionId));
}

export interface MasteryProgress {
  level: number;
  count: number;
  next: number;
  fraction: number;
}

export function masteryProgress(s: GameState, actionId: string): MasteryProgress {
  const count = masteryCount(s, actionId);
  const level = masteryLevelFromCount(count);
  if (level >= MASTERY_MAX) return { level, count, next: count, fraction: 1 };
  const from = masteryCompletionsFor(level);
  const next = masteryCompletionsFor(level + 1);
  return { level, count, next, fraction: (count - from) / (next - from) };
}

/** +0.2 % speed per mastery level (max +19.8 %). */
export function masterySpeed(level: number): number {
  return (level - 1) * 0.002;
}

/** +0.1 % double chance per level, +5 % extra at 99. */
export function masteryDouble(level: number): number {
  return (level - 1) * 0.001 + (level >= MASTERY_MAX ? 0.05 : 0);
}

// --- Meisterschafts-Pool je Skill -------------------------------------------------------------

export interface PoolTier {
  /** Share of the pool (0–1) needed. */
  at: number;
  label: string;
  mods: (skill: string) => ModifierSet;
}

/** Skill-wide bonuses once the actions of a skill are mastered on average. */
export const POOL_TIERS: PoolTier[] = [
  { at: 0.1, label: '+3 % XP', mods: (k) => ({ [`xp.${k}`]: 0.03 }) },
  { at: 0.25, label: '+5 % Tempo', mods: (k) => ({ [`speed.${k}`]: 0.05 }) },
  { at: 0.5, label: '+5 % Doppelte Ausbeute', mods: (k) => ({ [`double.${k}`]: 0.05 }) },
  {
    at: 0.95,
    label: '+10 % XP und +5 % Tempo',
    mods: (k) => ({ [`xp.${k}`]: 0.1, [`speed.${k}`]: 0.05 }),
  },
];

const ACTIONS_BY_SKILL = new Map<string, string[]>();
for (const a of ACTIONS) {
  const list = ACTIONS_BY_SKILL.get(a.skill) ?? [];
  list.push(a.id);
  ACTIONS_BY_SKILL.set(a.skill, list);
}

/** Pool fill 0–1: mastery levels of all actions of the skill, relative to all at 99. */
export function masteryPool(s: GameState, skill: string): number {
  const ids = ACTIONS_BY_SKILL.get(skill);
  if (!ids?.length) return 0;
  let sum = 0;
  for (const id of ids) sum += masteryLevel(s, id) - 1;
  return sum / (ids.length * (MASTERY_MAX - 1));
}

export function hasMasteryPool(skill: string): boolean {
  return (ACTIONS_BY_SKILL.get(skill)?.length ?? 0) > 0;
}

registerModifierSource('masteryPool', (s) => {
  const out: ModifierSet[] = [];
  for (const skill of ACTIONS_BY_SKILL.keys()) {
    const fill = masteryPool(s, skill);
    for (const tier of POOL_TIERS) if (fill >= tier.at) out.push(tier.mods(skill));
  }
  return out;
});
