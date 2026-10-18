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
