import { describe, expect, it } from 'vitest';
import { advance, createRng, invalidateMods, mod, startAction } from '../src/engine';
import { gameWith, setLevel } from './helpers';

describe('Viehzucht', () => {
  it('Hühner fressen Weizen und legen Eier', () => {
    const s = gameWith({ inventory: { wheat: 5 } });
    startAction(s, 'hb_chickens', () => {});
    advance(s, 15, createRng(3), () => {});
    expect(s.inventory.egg ?? 0).toBeGreaterThanOrEqual(8);
    expect(s.stats.animalsTended).toBeGreaterThanOrEqual(4);
  });

  it('Kühe brauchen den Stall', () => {
    const s = gameWith({ inventory: { wheat: 10, potato: 10 } });
    setLevel(s, 'husbandry', 25);
    expect(startAction(s, 'hb_cows', () => {}).ok).toBe(false);
    s.buildings = { barn: 1 };
    expect(startAction(s, 'hb_cows', () => {}).ok).toBe(true);
    advance(s, 9, createRng(1), () => {});
    expect(s.inventory.milk ?? 0).toBeGreaterThan(0);
  });

  it('jede Stufe stärkt das Dorf', () => {
    const s = gameWith();
    const before = mod(s, 'village.prod');
    setLevel(s, 'husbandry', 51);
    invalidateMods(s);
    expect(mod(s, 'village.prod')).toBeCloseTo(before + 0.1);
  });
});
