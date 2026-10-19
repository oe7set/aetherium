import { describe, expect, it } from 'vitest';
import { ACTION_MAP } from '../src/data';
import { castSpell, equipItem, equipStyle, playerStats, styleReadiness } from '../src/engine';
import { gameWith, setLevel } from './helpers';

describe('Kampf-Assistent', () => {
  it('erklärt, was für Fernkampf fehlt, und legt mit einem Tipp an', () => {
    const s = gameWith();
    const empty = styleReadiness(s, 'ranged');
    expect(empty.every((c) => !c.ok)).toBe(true);
    for (const c of empty)
      if (c.fix?.kind === 'craft') expect(ACTION_MAP.has(c.fix.action)).toBe(true);
    s.inventory.bow_oak = 1;
    s.inventory.arrow_bronze = 50;
    expect(styleReadiness(s, 'ranged').some((c) => c.fix?.kind === 'equip')).toBe(true);
    expect(equipStyle(s, 'ranged')).toBe(true);
    expect(playerStats(s).style).toBe('ranged');
    expect(styleReadiness(s, 'ranged').every((c) => c.ok)).toBe(true);
  });

  it('Magie ohne Runen meldet die Lücke', () => {
    const s = gameWith({ inventory: { staff_basic: 1 } });
    setLevel(s, 'magic', 10);
    equipItem(s, 'staff_basic');
    const checks = styleReadiness(s, 'magic');
    expect(checks[0]!.ok).toBe(true);
    expect(checks[1]!.ok).toBe(false);
    expect(checks[1]!.fix).toEqual({ kind: 'shop', item: 'rune_basic' });
  });

  it('Element-Stäbe liefern ihre Rune unbegrenzt', () => {
    const s = gameWith({ inventory: { staff_fire: 1, rune_basic: 10 } });
    setLevel(s, 'magic', 40);
    equipItem(s, 'staff_fire');
    s.combatSettings.spell = 'fire_strike';
    expect(castSpell(s)?.id).toBe('fire_strike');
  });
});
