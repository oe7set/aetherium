import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import {
  createRng,
  deserialize,
  equipItem,
  forgeSlot,
  imprintSlot,
  mod,
  playerStats,
  serialize,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

const noop = () => {};

function smith() {
  const s = gameWith({
    inventory: { iron_sword: 1, bar_iron: 500, bar_mithril: 500, bar_rune: 500, gem_diamond: 20 },
  });
  s.gold = new Decimal(10_000_000);
  setLevel(s, 'melee', 30);
  equipItem(s, 'iron_sword');
  return s;
}

describe('Schmiede-Verstärkung', () => {
  it('+1 bis +3 gelingt immer und stärkt die Waffe im Platz', () => {
    const s = smith();
    const before = playerStats(s).maxHit;
    for (let i = 0; i < 3; i++)
      expect(forgeSlot(s, 'weapon', false, createRng(i), noop)).toBe('ok');
    expect(s.forge.levels.weapon).toBe(3);
    expect(playerStats(s).maxHit).toBeGreaterThanOrEqual(before);
    expect(s.gold.toNumber()).toBeLessThan(10_000_000);
  });

  it('über +5 kann ein Fehlschlag eine Stufe kosten – die Schutzrune verhindert das', () => {
    const s = smith();
    s.forge.levels.weapon = 8;
    // rng always 0.99 → every attempt above +3 fails.
    const fail = () => 0.99;
    expect(forgeSlot(s, 'weapon', false, fail, noop)).toBe('dropped');
    expect(s.forge.levels.weapon).toBe(7);
    s.inventory.protect_rune = 1;
    expect(forgeSlot(s, 'weapon', true, fail, noop)).toBe('failed');
    expect(s.forge.levels.weapon).toBe(7);
    expect(s.inventory.protect_rune ?? 0).toBe(0);
  });

  it('Prägungen wirken nur mit angelegtem Teil und bleiben gespeichert', () => {
    const s = smith();
    s.inventory.imprint_stone = 1;
    expect(imprintSlot(s, 'weapon', createRng(4))).toBe(true);
    const a = s.forge.affixes.weapon!;
    expect(mod(s, a.key)).toBeGreaterThan(0);
    const back = deserialize(serialize(s, 0), 0);
    expect(back.forge).toEqual(s.forge);
  });
});
