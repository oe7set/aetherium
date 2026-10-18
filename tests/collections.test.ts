import { describe, expect, it } from 'vitest';
import { ACTIONS, DUNGEONS, ITEM_MAP, ITEMS, MONSTERS } from '../src/data';
import { COLLECTIONS } from '../src/data/collections';
import {
  addItem,
  claimCollection,
  collectionsClaimable,
  createRng,
  deserialize,
  gainItem,
  type GameEvent,
  mod,
  modFor,
  removeItem,
  serialize,
} from '../src/engine';
import { gameWith } from './helpers';

const noop = () => {};

describe('Sammelbuch', () => {
  it('Sets verweisen nur auf existierende, eindeutige Gegenstände', () => {
    const ids = new Set<string>();
    for (const c of COLLECTIONS) {
      expect(ids.has(c.id), c.id).toBe(false);
      ids.add(c.id);
      expect(new Set(c.items).size, c.id).toBe(c.items.length);
      for (const i of c.items) expect(ITEM_MAP.has(i), `${c.id}: ${i}`).toBe(true);
    }
  });

  it('jeder Set-Gegenstand ist im Spiel erhältlich', () => {
    // Everything that names an item as output, drop or loot; burnt food comes from the burn roll.
    const reachable = new Set<string>(['burnt_food']);
    const json = JSON.stringify([ACTIONS, ITEMS, MONSTERS, DUNGEONS]);
    for (const m of json.matchAll(/"item":"([a-z_]+)"/g)) reachable.add(m[1]!);
    for (const c of COLLECTIONS)
      for (const i of c.items) expect(reachable.has(i), `${c.id}: ${i}`).toBe(true);
  });

  it('merkt sich Funde dauerhaft und gibt nach dem Abschluss einen Bonus', () => {
    const s = gameWith();
    s.inventorySlots = 50;
    const gems = COLLECTIONS.find((c) => c.id === 'gems')!;
    for (const i of gems.items) {
      addItem(s, i, 1);
      removeItem(s, i, 1);
    }
    expect(collectionsClaimable(s).map((c) => c.id)).toEqual(['gems']);
    const before = mod(s, 'gold');
    const lines = claimCollection(s, 'gems', createRng(1), noop);
    expect(lines?.length).toBeGreaterThan(0);
    expect(mod(s, 'gold')).toBeCloseTo(before + 0.05);
    expect(claimCollection(s, 'gems', createRng(1), noop)).toBeNull();
    expect(collectionsClaimable(s)).toEqual([]);
  });

  it('meldet den ersten Fund eines Set-Gegenstands genau einmal', () => {
    const s = gameWith();
    const events: GameEvent[] = [];
    gainItem(s, 'fossil', 1, (e) => events.push(e));
    gainItem(s, 'fossil', 1, (e) => events.push(e));
    const album = events.filter((e) => e.type === 'albumFound');
    expect(album).toEqual([
      { type: 'albumFound', item: 'fossil', set: 'relics', have: 1, total: 7 },
    ]);
  });

  it('unvollständige Sets lassen sich nicht abschließen', () => {
    const s = gameWith();
    addItem(s, 'pottery_shard', 1);
    expect(claimCollection(s, 'relics', createRng(1), noop)).toBeNull();
    expect(modFor(s, 'xp', 'archaeology')).toBe(modFor(gameWith(), 'xp', 'archaeology'));
  });

  it('übersteht Speichern und Laden, Migration zählt vorhandene Gegenstände', () => {
    const s = gameWith();
    addItem(s, 'fossil', 2);
    s.progress.sets = ['gems'];
    const back = deserialize(serialize(s));
    expect(back.progress.found).toContain('fossil');
    expect(back.progress.sets).toEqual(['gems']);
    const old = serialize(gameWith()) as { v: number; data: Record<string, unknown> };
    const data = { ...old.data, inventory: { ancient_coin: 3 }, progress: { streak: 2 } };
    const migrated = deserialize({ ...old, v: 11, data });
    expect(migrated.progress.found).toEqual(['ancient_coin']);
    expect(migrated.progress.streak).toBe(2);
  });
});
