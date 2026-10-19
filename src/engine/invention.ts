import { ITEM_MAP } from '../data';
import {
  DISASSEMBLE_XP,
  INVENTION_MAP,
  INVENTION_MAX,
  INVENTIONS,
  inventionCost,
  type PartId,
} from '../data/invention';
import type { Emit } from './events';
import { addItem, itemCount, removeItem } from './inventory';
import { invalidateMods, registerModifierSource } from './modifiers';
import { xpMultiplierFor } from './actions';
import { addXp, skillLevel } from './skills';
import { addStat, type GameState } from './state';

/** Erfinden: gear → components → inventions with lasting boni. */

/** Components one piece of gear yields (empty for anything that is not gear). */
export function disassembleYield(itemId: string): { item: PartId; qty: number }[] {
  const it = ITEM_MAP.get(itemId);
  const eq = it?.equip;
  if (!it || !eq || it.category !== 'gear') return [];
  const root = Math.sqrt(Math.max(1, it.sellPrice));
  const out: { item: PartId; qty: number }[] = [
    { item: 'part_basic', qty: Math.max(1, Math.round(root / 2)) },
  ];
  const combat = eq.slot === 'weapon' || (eq.defence ?? 0) > 0 || (eq.attack ?? 0) > 0;
  if (combat && it.sellPrice >= 50)
    out.push({ item: 'part_precise', qty: Math.max(1, Math.round(root / 6)) });
  const magic =
    eq.slot === 'ring' ||
    eq.slot === 'amulet' ||
    eq.style === 'magic' ||
    Object.keys(eq.mods ?? {}).some((k) => k.includes('magic') || k.includes('rune'));
  if (magic) out.push({ item: 'part_magic', qty: 1 + Math.round(root / 10) });
  if (it.rarity === 'epic' || it.rarity === 'legendary')
    out.push({ item: 'part_ancient', qty: it.rarity === 'legendary' ? 2 : 1 });
  return out;
}

/** Takes `qty` pieces from the bag apart (never the worn ones). Returns how many were taken apart. */
export function disassemble(s: GameState, itemId: string, qty: number, emit: Emit): number {
  const parts = disassembleYield(itemId);
  const n = Math.min(Math.floor(qty), itemCount(s, itemId));
  if (!parts.length || n <= 0) return 0;
  removeItem(s, itemId, n);
  let xp = 0;
  for (const p of parts) {
    addItem(s, p.item, p.qty * n);
    xp += DISASSEMBLE_XP[p.item] * p.qty * n;
  }
  addXp(s, 'invention', xp * xpMultiplierFor(s, 'invention'), emit);
  addStat(s, 'itemsDisassembled', n);
  return n;
}

export function inventionLevel(s: GameState, id: string): number {
  return s.inventions[id] ?? 0;
}

export type InventResult = 'ok' | 'level' | 'max' | 'items' | 'unknown';

export function canInvent(s: GameState, id: string): InventResult {
  const def = INVENTION_MAP.get(id);
  if (!def) return 'unknown';
  if (skillLevel(s, 'invention') < def.level) return 'level';
  const lvl = inventionLevel(s, id);
  if (lvl >= INVENTION_MAX) return 'max';
  if (inventionCost(def, lvl).some((c) => itemCount(s, c.item) < c.qty)) return 'items';
  return 'ok';
}

export function invent(s: GameState, id: string, emit: Emit): InventResult {
  const check = canInvent(s, id);
  if (check !== 'ok') return check;
  const def = INVENTION_MAP.get(id)!;
  const lvl = inventionLevel(s, id);
  for (const c of inventionCost(def, lvl)) removeItem(s, c.item, c.qty);
  s.inventions = { ...s.inventions, [id]: lvl + 1 };
  addXp(s, 'invention', def.xp * (lvl + 1) * xpMultiplierFor(s, 'invention'), emit);
  addStat(s, 'inventionsBuilt');
  invalidateMods(s);
  emit({ type: 'invented', invention: id, level: lvl + 1 });
  return 'ok';
}

registerModifierSource('inventions', (s) =>
  INVENTIONS.flatMap((d) => {
    const lvl = inventionLevel(s, d.id);
    return lvl
      ? [Object.fromEntries(Object.entries(d.perLevel).map(([k, v]) => [k, (v ?? 0) * lvl]))]
      : [];
  }),
);
