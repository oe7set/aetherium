import { describe, expect, it } from 'vitest';
import { getItem, getMonster } from '../src/data';
import { HIGH_ALCH_MULT } from '../src/data/magic';
import {
  advance,
  castUtility,
  createRng,
  maxHp,
  playerHitChance,
  startAction,
  startCombat,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

describe('Magie-Werkstatt', () => {
  it('Hochalchemie verwandelt Barren in Gold und gibt Magie-XP', () => {
    const s = gameWith({ inventory: { bar_iron: 3, rune_fire: 9, rune_basic: 3 } });
    setLevel(s, 'magic', 10);
    const gold = s.gold.toNumber();
    startAction(s, 'alch_bar_iron', () => {});
    advance(s, 20, createRng(1), () => {});
    expect(s.inventory.bar_iron ?? 0).toBe(0);
    expect(s.gold.toNumber() - gold).toBe(
      3 * Math.round(getItem('bar_iron').sellPrice * HIGH_ALCH_MULT),
    );
    expect(s.skills.magic!.xp).toBeGreaterThan(0);
  });
});

describe('Hilfszauber', () => {
  function fighter() {
    const s = gameWith({
      inventory: { rune_basic: 50, rune_chaos: 5, rune_death: 5, rune_blood: 5, rune_soul: 5 },
    });
    for (const sk of ['melee', 'defence', 'hitpoints']) setLevel(s, sk, 30);
    setLevel(s, 'magic', 80);
    s.hp = 30;
    startCombat(s, 'monster', 'dragon', () => {});
    return s;
  }

  it('Schwächen erhöht die Trefferchance, mit Abklingzeit', () => {
    const s = fighter();
    const m = getMonster('dragon');
    const before = playerHitChance(s, m);
    expect(castUtility(s, 'weaken', () => {})).toBe('ok');
    expect(playerHitChance(s, m)).toBeGreaterThan(before);
    expect(castUtility(s, 'weaken', () => {})).toBe('cooldown');
    expect(s.inventory.rune_chaos).toBe(4);
  });

  it('Blutpakt heilt, Seelenschild blockt, ohne Runen geht nichts', () => {
    const s = fighter();
    s.hp = 5;
    expect(castUtility(s, 'blood_pact', () => {})).toBe('ok');
    expect(s.hp).toBeGreaterThan(5 + maxHp(s) * 0.3);
    expect(castUtility(s, 'soul_shield', () => {})).toBe('ok');
    expect(s.combat!.shield).toBe(3);
    s.inventory.rune_death = 0;
    expect(castUtility(s, 'curse', () => {})).toBe('runes');
  });
});
