import { describe, expect, it } from 'vitest';
import { ELEMENTS, getAction, getItem } from '../src/data';
import { ELEMENT_GROUPS } from '../src/data/science';
import {
  activeVillage,
  canPerform,
  completeAction,
  consumeItem,
  createRng,
  elementGroupProgress,
  faithBonus,
  harborImport,
  invalidateMods,
  mod,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

const noop = () => {};

describe('Glaube', () => {
  it('Knochen vergraben verbraucht Knochen und gibt Glaube-XP', () => {
    const s = gameWith({ inventory: { bones: 3 } });
    expect(canPerform(s, getAction('bury_bones')).ok).toBe(true);
    completeAction(s, getAction('bury_bones'), createRng(1), noop);
    expect(s.inventory.bones).toBe(2);
    expect(s.skills.faith?.xp ?? 0).toBeGreaterThan(0);
  });

  it('jede Stufe stärkt Kampf, Riss-Held und Dorf', () => {
    const s = gameWith();
    const before = {
      def: mod(s, 'combat.defence'),
      hp: mod(s, 'rift.hp'),
      village: mod(s, 'village.defense'),
    };
    setLevel(s, 'faith', 51);
    invalidateMods(s);
    expect(faithBonus(s).defence).toBeCloseTo(0.2, 5);
    expect(mod(s, 'combat.defence')).toBeCloseTo(before.def + 0.2, 5);
    expect(mod(s, 'rift.hp')).toBeCloseTo(before.hp + 0.15, 5);
    expect(mod(s, 'village.defense')).toBeCloseTo(before.village + 0.1, 5);
  });

  it('Weihwasser gibt den Segen', () => {
    const s = gameWith({ inventory: { holy_water: 1 } });
    expect(consumeItem(s, 'holy_water', createRng(1), noop).ok).toBe(true);
    expect(s.buffs.some((b) => b.id === 'blessing')).toBe(true);
  });
});

describe('Brauen', () => {
  it('Bier braucht ein brennendes Lagerfeuer', () => {
    const s = gameWith({ inventory: { wheat: 6 } });
    setLevel(s, 'brewing', 15);
    s.fire = 0;
    expect(canPerform(s, getAction('brew_wheat_beer')).ok).toBe(false);
    s.fire = 120;
    expect(canPerform(s, getAction('brew_wheat_beer')).ok).toBe(true);
    completeAction(s, getAction('brew_wheat_beer'), createRng(1), noop);
    expect(s.inventory.wheat_beer).toBeGreaterThanOrEqual(1);
  });

  it('Getränke heilen im Kampf und gehen über den Hafen als Getreide ins Dorf', () => {
    expect(getItem('mead').heal).toBeGreaterThan(0);
    const s = gameWith({ inventory: { wheat_beer: 20 } });
    const v = activeVillage(s);
    v.buildings.harbor = 1;
    const crop = v.res.crop;
    const r = harborImport(s, v.id, 'crop', 20);
    expect(r.ok).toBe(true);
    expect(v.res.crop).toBeGreaterThan(crop);
  });
});

describe('Periodensystem: Elementgruppen', () => {
  it('die Gruppen decken alle 118 Elemente genau einmal ab', () => {
    const all = ELEMENT_GROUPS.flatMap((g) => g.symbols);
    expect(all).toHaveLength(118);
    expect(new Set(all).size).toBe(118);
    for (const e of ELEMENTS) expect(all).toContain(e.symbol);
  });

  it('eine vollständige Gruppe gibt ihren Bonus', () => {
    const s = gameWith();
    const noble = ELEMENT_GROUPS.find((g) => g.id === 'noble')!;
    s.codex = noble.symbols.slice(0, -1);
    invalidateMods(s);
    const before = mod(s, 'research');
    expect(elementGroupProgress(s).find((g) => g.group.id === 'noble')?.done).toBe(false);
    s.codex = [...noble.symbols];
    invalidateMods(s);
    expect(elementGroupProgress(s).find((g) => g.group.id === 'noble')?.done).toBe(true);
    expect(mod(s, 'research')).toBeCloseTo(before + 0.004 + 0.15, 5);
  });
});
