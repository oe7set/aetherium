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
  MONSTER_MAP,
  MONSTERS,
  TECHS,
} from '../src/data';
import { FLAVOR_POOLS } from '../src/data/flavor';
import { PETS, QUESTS } from '../src/data/meta';

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
    for (const [id, skill] of SKILL_MAP) {
      if (skill.group === 'combat' || id === 'farming') continue;
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

  it('Quests, Haustiere und Techs referenzieren existierende Inhalte', () => {
    for (const q of QUESTS) {
      for (const o of q.objectives) {
        if (o.type === 'deliver') expect(ITEM_MAP.has(o.item), `${q.id}: ${o.item}`).toBe(true);
        if (o.type === 'level') expect(SKILL_MAP.has(o.skill)).toBe(true);
      }
      for (const it of q.rewards.items ?? [])
        expect(ITEM_MAP.has(it.item), `${q.id}: ${it.item}`).toBe(true);
      for (const r of q.requires ?? []) expect(QUESTS.some((x) => x.id === r)).toBe(true);
    }
    for (const p of PETS) {
      if (p.source.skill) expect(SKILL_MAP.has(p.source.skill), p.id).toBe(true);
      if (p.source.monster) expect(MONSTER_MAP.has(p.source.monster), p.id).toBe(true);
    }
    for (const t of TECHS)
      for (const r of t.requires)
        expect(
          TECHS.some((x) => x.id === r),
          `${t.id}: ${r}`,
        ).toBe(true);
    for (const a of ACTIONS)
      if (a.requiresTech) expect(TECHS.some((x) => x.id === a.requiresTech)).toBe(true);
    for (const m of MONSTERS)
      for (const l of m.loot) expect(ITEM_MAP.has(l.item), `${m.id}: ${l.item}`).toBe(true);
    for (const i of ITEMS)
      if (i.equip?.req) expect(SKILL_MAP.has(i.equip.req.skill), i.id).toBe(true);
  });

  it('genug Flavor-Texte für gute Laune', () => {
    const total = Object.values(FLAVOR_POOLS).reduce((n, pool) => n + pool.length, 0);
    expect(total).toBeGreaterThanOrEqual(150);
  });
});
