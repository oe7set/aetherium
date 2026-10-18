import { describe, expect, it } from 'vitest';
import {
  ACTIONS,
  ITEM_MAP,
  ITEMS,
  SHOP_OFFERS,
  SKILL_MAP,
  STARTER_TOOLS,
  TOOL_MAP,
  TOOLS,
} from '../src/data';
import { FLAVOR_POOLS } from '../src/data/flavor';

describe('Datenintegrität', () => {
  it('alle Aktionen referenzieren existierende Skills und Items', () => {
    for (const a of ACTIONS) {
      expect(SKILL_MAP.has(a.skill), `${a.id}: skill ${a.skill}`).toBe(true);
      for (const st of [...a.inputs, ...a.outputs])
        expect(ITEM_MAP.has(st.item), `${a.id}: ${st.item}`).toBe(true);
      for (const d of a.drops ?? [])
        expect(ITEM_MAP.has(d.item), `${a.id}: drop ${d.item}`).toBe(true);
      if (a.burn) expect(ITEM_MAP.has(a.burn.burntItem)).toBe(true);
      expect(a.levelReq).toBeGreaterThanOrEqual(1);
      expect(a.levelReq).toBeLessThanOrEqual(99);
      expect(a.baseTime).toBeGreaterThan(0);
    }
  });

  it('Items in Loot-Tabellen und Shop existieren', () => {
    for (const item of ITEMS) {
      if (item.consume?.type === 'loot') {
        for (const e of item.consume.table)
          expect(ITEM_MAP.has(e.item), `${item.id}: ${e.item}`).toBe(true);
      }
    }
    for (const o of SHOP_OFFERS) expect(ITEM_MAP.has(o.item)).toBe(true);
  });

  it('Werkzeuge sind konsistent', () => {
    for (const t of TOOLS) expect(SKILL_MAP.get(t.skill)?.usesTools).toBe(true);
    for (const id of Object.values(STARTER_TOOLS)) expect(TOOL_MAP.has(id)).toBe(true);
  });

  it('jeder Skill hat eine Aktion auf Level 1', () => {
    for (const id of SKILL_MAP.keys()) {
      expect(
        ACTIONS.some((a) => a.skill === id && a.levelReq === 1),
        id,
      ).toBe(true);
    }
  });

  it('kein Kochrezept ist mit Shop-Zutaten ein Gold-Exploit', () => {
    // Buying all inputs and selling the result must not be wildly profitable (≤ 2× margin).
    for (const a of ACTIONS.filter((x) => x.skill === 'cooking')) {
      const cost = a.inputs.reduce((sum, i) => {
        const offer = SHOP_OFFERS.find((o) => o.item === i.item);
        return offer ? sum + offer.price * i.qty : Infinity;
      }, 0);
      if (!Number.isFinite(cost)) continue;
      const value = a.outputs.reduce((sum, o) => sum + ITEM_MAP.get(o.item)!.sellPrice * o.qty, 0);
      expect(value, a.id).toBeLessThanOrEqual(cost * 2);
    }
  });

  it('genug Flavor-Texte für gute Laune', () => {
    const total = Object.values(FLAVOR_POOLS).reduce((n, pool) => n + pool.length, 0);
    expect(total).toBeGreaterThanOrEqual(150);
  });
});
