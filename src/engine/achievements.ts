import { ACHIEVEMENTS, getAchievement } from '../data';
import type { AchievementCondition } from '../data/types';
import { registerAfterAdvance, registerAfterComplete } from './actions';
import type { Emit } from './events';
import { invalidateMods, registerModifierSource } from './modifiers';
import { skillLevel, takeLevelChange, totalLevel } from './skills';
import type { GameState } from './state';

registerModifierSource('achievements', (s) =>
  s.achievements.map((id) => getAchievement(id).reward),
);

/** Current value towards a condition (for progress bars). */
export function conditionValue(s: GameState, c: AchievementCondition): number {
  switch (c.type) {
    case 'stat':
      return s.stats[c.key ?? ''] ?? 0;
    case 'level':
      return skillLevel(s, c.key ?? '');
    case 'totalLevel':
      return totalLevel(s);
    case 'item':
      return s.stats[`obtained.${c.key ?? ''}`] ?? 0;
    case 'gold':
      return s.gold.gte(1e300) ? Infinity : s.gold.toNumber();
    case 'achievements':
      return s.achievements.length;
  }
}

/** Checks all locked achievements and unlocks those whose condition is met. */
export function checkAchievements(s: GameState, emit: Emit): string[] {
  const unlocked = new Set(s.achievements);
  const fresh: string[] = [];
  // Loop until stable: unlocking some can satisfy "unlock N achievements".
  let changed = true;
  while (changed) {
    changed = false;
    for (const a of ACHIEVEMENTS) {
      if (unlocked.has(a.id)) continue;
      if (conditionValue(s, a.condition) >= a.condition.gte) {
        unlocked.add(a.id);
        s.achievements.push(a.id);
        fresh.push(a.id);
        emit({ type: 'achievement', id: a.id });
        changed = true;
      }
    }
  }
  if (fresh.length) invalidateMods(s);
  return fresh;
}

/**
 * Cheap pre-check: for each condition series only the lowest locked threshold matters, and its
 * lookup key is resolved once. The full check runs only when one of those thresholds is reached.
 */
interface FrontierEntry {
  c: AchievementCondition;
  /** Resolved stats key for 'stat' and 'item' conditions. */
  stat?: string;
}
const frontiers = new WeakMap<GameState, { count: number; list: FrontierEntry[] }>();

function frontier(s: GameState): FrontierEntry[] {
  const cached = frontiers.get(s);
  if (cached && cached.count === s.achievements.length) return cached.list;
  const unlocked = new Set(s.achievements);
  const best = new Map<string, AchievementCondition>();
  for (const a of ACHIEVEMENTS) {
    if (unlocked.has(a.id)) continue;
    const k = `${a.condition.type}:${a.condition.key ?? ''}`;
    const cur = best.get(k);
    if (!cur || a.condition.gte < cur.gte) best.set(k, a.condition);
  }
  const list = [...best.values()].map((c) => ({
    c,
    stat: c.type === 'stat' ? c.key : c.type === 'item' ? `obtained.${c.key}` : undefined,
  }));
  frontiers.set(s, { count: s.achievements.length, list });
  return list;
}

function goldValue(s: GameState): number {
  // Avoids allocating Decimals in the hot path: layer 0 means the value is just `mag`.
  return s.gold.layer === 0 ? s.gold.sign * s.gold.mag : Infinity;
}

export function checkAchievementsFast(s: GameState, emit: Emit): void {
  // Level conditions only need a look after a level-up.
  const levels = takeLevelChange(s);
  for (const { c, stat } of frontier(s)) {
    let reached: boolean;
    if (stat !== undefined) reached = (s.stats[stat] ?? 0) >= c.gte;
    else if (c.type === 'gold') reached = goldValue(s) >= c.gte;
    else if (c.type === 'achievements') reached = s.achievements.length >= c.gte;
    else if (!levels) continue;
    else reached = conditionValue(s, c) >= c.gte;
    if (reached) {
      checkAchievements(s, emit);
      return;
    }
  }
}

registerAfterComplete('achievements', checkAchievementsFast);
registerAfterAdvance('achievements', checkAchievementsFast);
