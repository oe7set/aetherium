import { describe, expect, it } from 'vitest';
import { buildingGoods, goodsLevels } from '../src/data/villageGoods';
import {
  activeVillage,
  advance,
  canUpgradeBuilding,
  cancelQueue,
  collectVillageSupply,
  createRng,
  deserialize,
  serialize,
  supplyRates,
  upgradeBuilding,
} from '../src/engine';
import { gameWith } from './helpers';

const noop = () => {};

describe('Dorf ↔ Insel', () => {
  it('hohe Gebäudestufen brauchen Inselwaren, Abbrechen gibt sie zurück', () => {
    const s = gameWith();
    const v = activeVillage(s);
    expect(goodsLevels(20)).toEqual([10, 15, 20]);
    expect(buildingGoods('warehouse', 20, 9)).toEqual([]);
    const goods = buildingGoods('warehouse', 20, 10);
    expect(goods.length).toBeGreaterThan(0);
    v.buildings.warehouse = 9;
    v.res = { wood: 1e6, clay: 1e6, iron: 1e6, crop: 1e6 };
    expect(canUpgradeBuilding(s, v, 'warehouse')).toEqual({ ok: false, reason: 'goods' });
    for (const g of goods) s.inventory[g.item] = g.qty;
    expect(upgradeBuilding(s, v.id, 'warehouse').ok).toBe(true);
    for (const g of goods) expect(s.inventory[g.item] ?? 0).toBe(0);
    cancelQueue(s, v.id, 'center');
    for (const g of goods) expect(s.inventory[g.item]).toBe(g.qty);
  });

  it('Werkstätten im Dorf liefern Waren auf die Insel (mit Obergrenze)', () => {
    const s = gameWith();
    const v = activeVillage(s);
    v.buildings.mill = 2;
    v.buildings.smithy = 1;
    expect(supplyRates(s)).toEqual({ flour: 4, nails: 3 });
    advance(s, 3600 * 2, createRng(1), noop);
    expect(s.villageSupply.flour).toBeCloseTo(8, 5);
    advance(s, 3600 * 100, createRng(1), noop);
    expect(s.villageSupply.flour).toBeCloseTo(4 * 24, 5);
    const back = deserialize(serialize(s, 0), 0);
    expect(back.villageSupply.flour).toBeCloseTo(96, 5);
    const got = collectVillageSupply(s, noop);
    expect(got.find((g) => g.item === 'flour')?.qty).toBe(96);
    expect(s.inventory.flour).toBe(96);
    expect(s.villageSupply.flour).toBeLessThan(1);
  });
});
