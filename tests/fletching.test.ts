import { describe, expect, it } from 'vitest';
import {
  advance,
  ammoFits,
  createRng,
  equipItem,
  equipStyle,
  mod,
  playerStats,
  startAction,
  startCombat,
  styleReadiness,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

describe('Bogenbau', () => {
  it('dreht Sehnen und baut daraus einen Langbogen', () => {
    const s = gameWith({ inventory: { cowhide: 2, log_oak: 3 } });
    setLevel(s, 'fletching', 5);
    startAction(s, 'fl_string_hide', () => {});
    advance(s, 6, createRng(1), () => {});
    expect(s.inventory.bowstring).toBe(6);
    startAction(s, 'fl_longbow_oak', () => {});
    advance(s, 4, createRng(1), () => {});
    expect(s.inventory.longbow_oak).toBe(1);
    expect(s.stats.bowsFletched).toBeGreaterThanOrEqual(3);
  });

  it('Armbrüste verschießen nur Bolzen', () => {
    const s = gameWith({ inventory: { crossbow_bronze: 1, arrow_bronze: 50 } });
    setLevel(s, 'ranged', 10);
    expect(equipItem(s, 'crossbow_bronze').ok).toBe(true);
    equipItem(s, 'arrow_bronze');
    expect(ammoFits(s, 'arrow_bronze')).toBe(false);
    const ammoRow = styleReadiness(s, 'ranged')[1]!;
    expect(ammoRow.ok).toBe(false);
    expect(ammoRow.label).toContain('nur Bolzen');
    // Combat stops at the first shot without fitting ammo.
    startCombat(s, 'monster', 'chicken', () => {});
    advance(s, 5, createRng(1), () => {});
    expect(s.combat).toBeNull();
    s.inventory.bolt_bronze = 30;
    expect(equipStyle(s, 'ranged')).toBe(true);
    expect(s.equipment.ammo).toBe('bolt_bronze');
    expect(styleReadiness(s, 'ranged')[1]!.ok).toBe(true);
  });

  it('Edelsteinbolzen wirken nur aus der Armbrust', () => {
    const s = gameWith({ inventory: { crossbow_bronze: 1, bolt_jade: 20, bow_oak: 1 } });
    setLevel(s, 'ranged', 40);
    setLevel(s, 'fletching', 40);
    equipItem(s, 'crossbow_bronze');
    equipItem(s, 'bolt_jade');
    const crit = mod(s, 'combat.crit');
    const hit = playerStats(s).maxHit;
    equipItem(s, 'bow_oak');
    expect(mod(s, 'combat.crit')).toBeLessThan(crit);
    expect(playerStats(s).maxHit).toBeLessThan(hit);
  });
});
