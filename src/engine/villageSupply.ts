import { ACTIONS } from '../data';
import type { ItemStack } from '../data/types';
import { buildingGoods, SUPPLY_CAP_HOURS, VILLAGE_SUPPLY } from '../data/villageGoods';
import { itemCount } from './inventory';
import { gainItem, registerTimeEffect } from './actions';
import type { Emit } from './events';
import { addStat, type GameState } from './state';
import {
  activeVillage,
  buildingLevel,
  canUpgradeBuilding,
  plannedLevel,
  V_BUILDING_MAP,
} from './village';

/** Dorflieferung: the village workshops fill a store of island goods; the player collects it. */

/** Goods per hour, summed over all villages. */
export function supplyRates(s: GameState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const src of VILLAGE_SUPPLY) {
    let levels = 0;
    for (const v of s.village.villages) levels += buildingLevel(v, src.building);
    if (levels > 0) out[src.item] = (out[src.item] ?? 0) + levels * src.perHour;
  }
  return out;
}

/** Whole units ready to collect. */
export function supplyReady(s: GameState): number {
  return Object.values(s.villageSupply).reduce((a, n) => a + Math.floor(n + 1e-9), 0);
}

export function collectVillageSupply(s: GameState, emit: Emit): { item: string; qty: number }[] {
  const got: { item: string; qty: number }[] = [];
  for (const [item, n] of Object.entries(s.villageSupply)) {
    const qty = Math.floor(n + 1e-9);
    if (qty <= 0) continue;
    if (!gainItem(s, item, qty, emit)) continue;
    s.villageSupply[item] = n - qty;
    got.push({ item, qty });
    addStat(s, 'villageSupplyGoods', qty);
  }
  return got;
}

/** The first building of the active village that only waits for island goods, with what is missing. */
export function goodsWanted(s: GameState): { building: string; missing: ItemStack[] } | null {
  const v = activeVillage(s);
  for (const def of V_BUILDING_MAP.values()) {
    const check = canUpgradeBuilding(s, v, def.id);
    if (check.ok || check.reason !== 'goods') continue;
    const next = plannedLevel(v, 'center', def.id) + 1;
    const missing = buildingGoods(def.id, def.maxLevel, next)
      .map((g) => ({ item: g.item, qty: g.qty - itemCount(s, g.item) }))
      .filter((g) => g.qty > 0);
    return { building: def.id, missing };
  }
  return null;
}

/** An action that makes the item (first match). */
export function makerOf(item: string) {
  return ACTIONS.find((a) => a.outputs.some((o) => o.item === item));
}

registerTimeEffect('villageSupply', {
  next: () => Infinity,
  apply: (s, dt) => {
    if (dt <= 0) return;
    const rates = supplyRates(s);
    for (const [item, perHour] of Object.entries(rates)) {
      const cap = perHour * SUPPLY_CAP_HOURS;
      const cur = s.villageSupply[item] ?? 0;
      if (cur < cap) s.villageSupply[item] = Math.min(cap, cur + (perHour * dt) / 3600);
    }
  },
});
