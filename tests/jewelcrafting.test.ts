import { describe, expect, it } from 'vitest';
import { ACTION_MAP, getMonster, ITEM_MAP } from '../src/data';
import { GEAR_SETS } from '../src/data/sets';
import { advance, createRng, equipItem, mod, setProgress, startAction } from '../src/engine';
import { gameWith, setLevel } from './helpers';

describe('Juwelierkunst', () => {
  it('Kiesel sieben liefert Quarz, Geoden geben Edelsteine', () => {
    const s = gameWith();
    startAction(s, 'jc_gravel', () => {});
    advance(s, 60, createRng(1), () => {});
    expect(s.inventory.gem_quartz).toBeGreaterThan(5);
    expect(s.skills.jewelcrafting!.xp).toBeGreaterThan(0);
    expect(s.stats.jewelsCrafted).toBeGreaterThan(5);

    const g = gameWith({ inventory: { geode: 30 } });
    setLevel(g, 'jewelcrafting', 10);
    startAction(g, 'jc_geode', () => {});
    advance(g, 200, createRng(2), () => {});
    expect(g.inventory.gem_opal).toBeGreaterThan(10);
  });

  it('Schmuck verbindet Barren und Steine, Bergbau findet Geoden', () => {
    expect(ACTION_MAP.get('jc_ring_topaz')!.inputs.map((i) => i.item)).toContain('gem_topaz');
    expect(ACTION_MAP.get('mine_iron')!.drops!.some((d) => d.item === 'geode')).toBe(true);
    expect(ITEM_MAP.get('bar_aetherite')).toBeDefined();
    expect(ITEM_MAP.get('aetherite_body')?.equip?.defence).toBeGreaterThan(
      ITEM_MAP.get('rune_body')!.equip!.defence!,
    );
  });
});

describe('Ausrüstungs-Sets und Boss-Unikate', () => {
  it('Set-Boni greifen ab der nötigen Teilezahl', () => {
    const set = GEAR_SETS.find((x) => x.id === 'set_bronze')!;
    const s = gameWith({ inventory: Object.fromEntries(set.pieces.map((p) => [p, 1])) });
    setLevel(s, 'defence', 10);
    const base = mod(s, 'combat.defence');
    equipItem(s, 'bronze_helm');
    equipItem(s, 'bronze_body');
    expect(mod(s, 'combat.defence')).toBe(base);
    equipItem(s, 'bronze_legs');
    expect(mod(s, 'combat.defence')).toBeGreaterThan(base);
    for (const p of set.pieces) equipItem(s, p);
    expect(setProgress(s)[0]!.count).toBe(6);
    expect(mod(s, 'combat.damage.melee')).toBeGreaterThan(0);
  });

  it('Bosse können Unikate fallen lassen', () => {
    expect(getMonster('elder_dragon').loot.some((l) => l.item === 'dragonfire_bow')).toBe(true);
    expect(getMonster('yeti').loot.some((l) => l.item === 'yeti_mitts')).toBe(true);
  });
});
