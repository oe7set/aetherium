import { getItem, getTool } from '../data';
import { addBuff } from './buffs';
import { restorePrayer } from './prayer';
import { summonFamiliar } from './summoning';
import { addResearch } from './science';
import { invalidateMods } from './modifiers';
import { skillLevel } from './skills';
import type { Emit, GameEvent } from './events';
import { gainItem } from './actions';
import { itemCount, removeItem } from './inventory';
import { randInt, type Rng } from './rng';
import { earnGold } from './shop';
import { addStat, type GameState } from './state';

export type UseResult = { ok: true } | { ok: false; reason: 'notUsable' | 'notEnough' };

/** Uses/opens one item from the inventory (nests, Newton apples …). */
export function consumeItem(s: GameState, itemId: string, rng: Rng, emit: Emit): UseResult {
  const def = getItem(itemId);
  const effect = def.consume;
  if (!effect) return { ok: false, reason: 'notUsable' };
  if (itemCount(s, itemId) <= 0) return { ok: false, reason: 'notEnough' };
  removeItem(s, itemId, 1);
  emit({ type: 'itemConsumed', item: itemId, qty: 1 });
  addStat(s, `used.${itemId}`);

  switch (effect.type) {
    case 'intelligence':
      s.intelligence += effect.amount;
      invalidateMods(s);
      emit({ type: 'intelligence', amount: effect.amount });
      break;
    case 'tool': {
      if (!s.ownedTools.includes(effect.tool)) s.ownedTools.push(effect.tool);
      const tool = getTool(effect.tool);
      const current = s.equippedTools[tool.skill];
      if (
        skillLevel(s, tool.skill) >= tool.levelReq &&
        (!current || getTool(current).tier < tool.tier)
      ) {
        s.equippedTools[tool.skill] = effect.tool;
      }
      emit({ type: 'toolUnlocked', tool: effect.tool });
      break;
    }
    case 'research':
      addResearch(s, effect.amount, emit);
      break;
    case 'buff':
      addBuff(s, effect.buff, emit);
      break;
    case 'familiar':
      summonFamiliar(s, effect.familiar, emit);
      break;
    case 'prayer':
      restorePrayer(s, effect.amount);
      break;
    case 'gold':
      earnGold(s, randInt(rng, effect.min, effect.max), emit);
      break;
    case 'loot': {
      // Exactly one entry per roll, weighted by chance (nests always contain something).
      const total = effect.table.reduce((sum, e) => sum + e.chance, 0);
      for (let i = 0; i < effect.rolls; i++) {
        let r = rng() * total;
        const entry = effect.table.find((e) => (r -= e.chance) < 0) ?? effect.table[0];
        if (!entry) break;
        const min = entry.min ?? 1;
        const rolled = randInt(rng, min, entry.max ?? min);
        gainItem(s, entry.item, rolled, emit, entry.rare);
      }
      break;
    }
  }
  return { ok: true };
}

/** Consumables where using a whole stack makes sense (buffs only refresh, tools unlock once). */
export function canUseAll(itemId: string): boolean {
  const type = getItem(itemId).consume?.type;
  return type === 'intelligence' || type === 'research' || type === 'gold' || type === 'loot';
}

/**
 * Uses up to `max` of an item at once. Events are merged (one "+120 Gold", one line per looted
 * item) so opening 300 bird nests does not flood the feed. Returns how many were used.
 */
export function consumeAll(s: GameState, itemId: string, rng: Rng, emit: Emit, max = 1000): number {
  if (!canUseAll(itemId)) return 0;
  const merged = new Map<string, GameEvent>();
  const collect: Emit = (e) => {
    const key = 'item' in e ? `${e.type}:${e.item}` : e.type;
    const prev = merged.get(key);
    if (prev && 'qty' in prev && 'qty' in e) prev.qty += e.qty;
    else if (prev && 'amount' in prev && 'amount' in e) prev.amount += e.amount;
    else if (!prev) merged.set(key, { ...e });
  };
  let used = 0;
  while (used < max && itemCount(s, itemId) > 0) {
    if (!consumeItem(s, itemId, rng, collect).ok) break;
    used++;
  }
  for (const e of merged.values()) emit(e);
  return used;
}
