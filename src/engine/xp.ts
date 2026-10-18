import { BALANCE } from '../data/balance';

/**
 * OSRS-style experience curve:
 *   xp(L) = floor( 1/4 * sum_{l=1}^{L-1} floor(l + 300 * 2^(l/7)) )
 * Level 99 ≈ 13,034,431 XP. The table goes to 120 for future prestige content.
 */
function buildXpTable(maxLevel: number): number[] {
  const table: number[] = [0, 0]; // index = level; table[1] = 0
  let points = 0;
  for (let level = 1; level < maxLevel; level++) {
    points += Math.floor(level + 300 * Math.pow(2, level / 7));
    table[level + 1] = Math.floor(points / 4);
  }
  return table;
}

export const XP_TABLE: readonly number[] = buildXpTable(BALANCE.XP_TABLE_MAX_LEVEL);

/** Total XP required to reach `level`. */
export function xpForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(BALANCE.XP_TABLE_MAX_LEVEL, Math.floor(level)));
  return XP_TABLE[clamped] ?? 0;
}

/** Level for a given total XP, capped at `maxLevel`. Binary search over the table. */
export function levelForXp(xp: number, maxLevel: number = BALANCE.MAX_LEVEL): number {
  let lo = 1;
  let hi = Math.min(maxLevel, BALANCE.XP_TABLE_MAX_LEVEL);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if ((XP_TABLE[mid] ?? Infinity) <= xp) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export interface LevelProgress {
  level: number;
  /** XP gained inside the current level. */
  current: number;
  /** XP span of the current level (0 at max level). */
  needed: number;
  /** 0..1, 1 at max level. */
  fraction: number;
  /** XP remaining to the next level. */
  remaining: number;
}

export function levelProgress(xp: number, maxLevel: number = BALANCE.MAX_LEVEL): LevelProgress {
  const level = levelForXp(xp, maxLevel);
  if (level >= maxLevel) return { level, current: 0, needed: 0, fraction: 1, remaining: 0 };
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const current = xp - base;
  const needed = next - base;
  return { level, current, needed, fraction: current / needed, remaining: next - xp };
}
