import { getItem } from '../data';
import {
  AFFIX_MAP,
  AFFIXES,
  FORGE_MAX,
  FORGE_SAFE_LEVEL,
  FORGE_SLOTS,
  FORGE_STAT_PER_LEVEL,
  forgeChance,
  forgeCost,
} from '../data/forge';
import type { EquipSlot } from '../data/types';
import type { Emit } from './events';
import { itemCount, removeItem } from './inventory';
import { invalidateMods, registerModifierSource } from './modifiers';
import type { Rng } from './rng';
import { addStat, type GameState } from './state';

/** Item-Aufwertung: reinforcement and imprints belong to the slot, not to one item. */

export function forgeLevel(s: GameState, slot: string): number {
  return s.forge.levels[slot] ?? 0;
}

/** Multiplier on attack/strength/defence of the item worn in `slot`. */
export function forgeMult(s: GameState, slot: string): number {
  return 1 + FORGE_STAT_PER_LEVEL * forgeLevel(s, slot);
}

export type ForgeResult = 'ok' | 'failed' | 'dropped' | 'max' | 'gold' | 'items' | 'slot';

export function canForge(s: GameState, slot: EquipSlot): ForgeResult {
  if (!FORGE_SLOTS.includes(slot)) return 'slot';
  const level = forgeLevel(s, slot);
  if (level >= FORGE_MAX) return 'max';
  const cost = forgeCost(level);
  if (s.gold.lt(cost.gold)) return 'gold';
  if (cost.items.some((c) => itemCount(s, c.item) < c.qty)) return 'items';
  return 'ok';
}

/** One reinforcement attempt; `protect` spends a protection rune against losing a level. */
export function forgeSlot(
  s: GameState,
  slot: EquipSlot,
  protect: boolean,
  rng: Rng,
  emit: Emit,
): ForgeResult {
  const check = canForge(s, slot);
  if (check !== 'ok') return check;
  const level = forgeLevel(s, slot);
  const cost = forgeCost(level);
  s.gold = s.gold.sub(cost.gold);
  for (const c of cost.items) removeItem(s, c.item, c.qty);
  addStat(s, 'forgeAttempts');
  let result: ForgeResult;
  let next = level;
  if (rng() < forgeChance(level)) {
    next = level + 1;
    result = 'ok';
    addStat(s, 'forgeSuccesses');
  } else if (level > FORGE_SAFE_LEVEL && !(protect && itemCount(s, 'protect_rune') > 0)) {
    next = level - 1;
    result = 'dropped';
  } else {
    if (level > FORGE_SAFE_LEVEL) removeItem(s, 'protect_rune', 1);
    result = 'failed';
  }
  s.forge = { ...s.forge, levels: { ...s.forge.levels, [slot]: next } };
  s.stats.forgeBest = Math.max(s.stats.forgeBest ?? 0, next);
  emit({ type: 'forged', slot, level: next, result });
  return result;
}

/** Rolls a random imprint for a slot (costs one imprint stone, replaces the old one). */
export function imprintSlot(s: GameState, slot: EquipSlot, rng: Rng): boolean {
  if (!FORGE_SLOTS.includes(slot) || itemCount(s, 'imprint_stone') <= 0) return false;
  const pool = AFFIXES.filter((a) => !a.slots || a.slots.includes(slot));
  const a = pool[Math.floor(rng() * pool.length)]!;
  const value = Math.round((a.min + rng() * (a.max - a.min)) * 1000) / 1000;
  removeItem(s, 'imprint_stone', 1);
  s.forge = { ...s.forge, affixes: { ...s.forge.affixes, [slot]: { key: a.key, value } } };
  addStat(s, 'imprints');
  invalidateMods(s);
  return true;
}

/** Imprints only count while something is worn in the slot. */
registerModifierSource('imprints', (s) =>
  Object.entries(s.forge.affixes).flatMap(([slot, a]) =>
    s.equipment[slot as EquipSlot] && AFFIX_MAP.has(a.key) ? [{ [a.key]: a.value }] : [],
  ),
);

/** Text for the UI, e.g. "+4,2 % Schaden". */
export function affixText(a: { key: string; value: number }): string {
  const def = AFFIX_MAP.get(a.key);
  return `+${(a.value * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} % ${def?.label ?? a.key}`;
}

export function forgeItemName(s: GameState, slot: EquipSlot): string | null {
  const id = s.equipment[slot];
  return id ? getItem(id).name : null;
}
