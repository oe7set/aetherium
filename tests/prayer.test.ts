import { describe, expect, it } from 'vitest';
import {
  activePrayers,
  advance,
  applyLoadout,
  collector,
  createRng,
  deserialize,
  equipItem,
  maxPrayer,
  mod,
  saveLoadout,
  serialize,
  startAction,
  startCombat,
  togglePrayer,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

function fighter() {
  const s = gameWith({ inventory: { cooked_shark: 200 } });
  for (const sk of ['melee', 'defence', 'hitpoints', 'faith']) setLevel(s, sk, 50);
  s.hp = 50;
  s.prayer.points = maxPrayer(s);
  return s;
}

describe('Gebete', () => {
  it('brauchen Glaube-Stufe, höchstens drei, nur ein Schutzgebet', () => {
    const s = fighter();
    setLevel(s, 'faith', 30);
    expect(togglePrayer(s, 'holy_fury')).toBe('level');
    expect(togglePrayer(s, 'thick_skin')).toBe('on');
    expect(togglePrayer(s, 'burst_strength')).toBe('on');
    expect(mod(s, 'combat.damage')).toBeGreaterThanOrEqual(0.05);
    expect(togglePrayer(s, 'clear_sight')).toBe('on');
    expect(togglePrayer(s, 'steel_skin')).toBe('slots');
    expect(togglePrayer(s, 'thick_skin')).toBe('off');
    setLevel(s, 'faith', 50);
    expect(togglePrayer(s, 'protect_melee')).toBe('on');
    s.prayer.active = ['protect_melee'];
    expect(togglePrayer(s, 'protect_magic')).toBe('on');
    expect(s.prayer.active).toEqual(['protect_magic']);
  });

  it('verbrauchen Punkte nur im Kampf und gehen bei 0 aus', () => {
    const s = fighter();
    togglePrayer(s, 'steel_skin');
    const full = s.prayer.points;
    advance(s, 60, createRng(1), () => {});
    expect(s.prayer.points).toBe(full);
    startCombat(s, 'monster', 'cow', () => {});
    const { emit, events } = collector();
    advance(s, 60 * 60, createRng(2), emit);
    expect(s.prayer.points).toBe(0);
    expect(activePrayers(s)).toEqual([]);
    expect(events.some((e) => e.type === 'prayerEmpty')).toBe(true);
  });

  it('Schutzgebete halbieren den Schaden des passenden Stils', () => {
    const run = (protect: boolean) => {
      const s = fighter();
      s.prayer.points = 1e9;
      if (protect) togglePrayer(s, 'protect_melee');
      startCombat(s, 'monster', 'wolf', () => {});
      advance(s, 600, createRng(5), () => {});
      return s.stats.damageTaken ?? 0;
    };
    expect(run(true)).toBeLessThan(run(false) * 0.75);
  });

  it('Weihtrunk wird automatisch getrunken, Rituale füllen nach', () => {
    const s = fighter();
    s.inventory.prayer_draught = 3;
    togglePrayer(s, 'steel_skin');
    s.prayer.points = 5;
    startCombat(s, 'monster', 'wolf', () => {});
    advance(s, 30, createRng(3), () => {});
    expect(s.inventory.prayer_draught ?? 0).toBeLessThan(3);

    const r = fighter();
    r.prayer.points = 0;
    r.inventory.bones = 5;
    startAction(r, 'bury_bones', () => {});
    advance(r, 20, createRng(4), () => {});
    expect(r.prayer.points).toBeGreaterThan(0);
  });
});

describe('Loadouts und Auto-Trank', () => {
  it('speichert und wechselt Ausrüstung samt Zauber', () => {
    const s = gameWith({ inventory: { bronze_sword: 1, bow_oak: 1, bronze_helm: 1 } });
    setLevel(s, 'ranged', 10);
    equipItem(s, 'bronze_sword');
    equipItem(s, 'bronze_helm');
    saveLoadout(s, 0);
    equipItem(s, 'bow_oak');
    saveLoadout(s, 1);
    expect(applyLoadout(s, 0)).toBe(0);
    expect(s.equipment.weapon).toBe('bronze_sword');
    expect(applyLoadout(s, 1)).toBe(0);
    expect(s.equipment.weapon).toBe('bow_oak');
    const loaded = deserialize(serialize(s, 0), 0);
    expect(loaded.loadouts[0]!.gear.weapon).toBe('bronze_sword');
  });

  it('Auto-Trank hält den Buff im Kampf aufrecht', () => {
    const s = fighter();
    s.inventory.mead = 5;
    s.combatSettings.potion = 'mead';
    startCombat(s, 'monster', 'cow', () => {});
    advance(s, 20, createRng(9), () => {});
    expect(s.inventory.mead).toBe(4);
    expect(s.buffs.some((b) => b.id === 'courage')).toBe(true);
  });
});
