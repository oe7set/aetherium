import { describe, expect, it } from 'vitest';
import {
  advance,
  createRng,
  deserialize,
  disassemble,
  disassembleYield,
  invent,
  mod,
  serialize,
  startAction,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

const noop = () => {};

describe('Erfinden', () => {
  it('Schrott wird zu Schrauben', () => {
    const s = gameWith({ inventory: { old_boot: 5 } });
    startAction(s, 'inv_junk_boot', noop);
    advance(s, 12, createRng(1), noop);
    expect(s.inventory.part_basic).toBe(15);
    expect(s.skills.invention!.xp).toBeGreaterThan(0);
  });

  it('Ausrüstung zerlegen gibt Bauteile und XP, Schmuck auch Zauberteile', () => {
    const s = gameWith({ inventory: { iron_sword: 3, ring_topaz: 1 } });
    expect(disassembleYield('log_oak')).toEqual([]);
    expect(disassemble(s, 'iron_sword', 3, noop)).toBe(3);
    expect(s.inventory.iron_sword ?? 0).toBe(0);
    expect(s.inventory.part_basic).toBeGreaterThan(0);
    disassemble(s, 'ring_topaz', 1, noop);
    expect(s.inventory.part_magic).toBeGreaterThan(0);
    expect(s.skills.invention!.xp).toBeGreaterThan(0);
  });

  it('Erfindungen geben gestaffelte Dauer-Boni und bleiben gespeichert', () => {
    const s = gameWith({ inventory: { part_basic: 100 } });
    const base = mod(s, 'speed.woodcutting');
    expect(invent(s, 'sharp_axe', noop)).toBe('ok');
    expect(invent(s, 'sharp_axe', noop)).toBe('ok');
    expect(s.inventory.part_basic).toBe(40);
    expect(mod(s, 'speed.woodcutting')).toBeCloseTo(base + 0.06);
    expect(invent(s, 'drill_pick', noop)).toBe('level');
    setLevel(s, 'invention', 10);
    expect(invent(s, 'drill_pick', noop)).toBe('ok');
    expect(deserialize(serialize(s, 0), 0).inventions).toEqual({ sharp_axe: 2, drill_pick: 1 });
  });
});
