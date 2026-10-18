import { getItem } from '../data';
import type { Emit } from './events';
import { addItem, itemCount, removeItem } from './inventory';
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
      emit({ type: 'intelligence', amount: effect.amount });
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
        if (addItem(s, entry.item, rolled)) {
          if (entry.rare) emit({ type: 'rareDrop', item: entry.item, qty: rolled });
          emit({ type: 'itemGained', item: entry.item, qty: rolled });
        } else {
          emit({ type: 'itemLost', item: entry.item, qty: rolled });
        }
      }
      break;
    }
  }
  return { ok: true };
}
