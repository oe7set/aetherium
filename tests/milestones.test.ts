import { describe, expect, it } from 'vitest';
import {
  claimableMilestones,
  claimMilestone,
  createRng,
  deserialize,
  invalidateMods,
  mod,
  serialize,
} from '../src/engine';
import { getItem } from '../src/data';
import { gameWith, setLevel } from './helpers';

const noop = () => {};

describe('Skill-Meilensteine', () => {
  it('Boni wirken ab der Stufe, Belohnungen einmal abholbar', () => {
    const s = gameWith();
    const base = mod(s, 'speed.mining');
    setLevel(s, 'mining', 26);
    invalidateMods(s);
    expect(mod(s, 'speed.mining')).toBeCloseTo(base + 0.03);
    const open = claimableMilestones(s).filter((m) => m.skill === 'mining');
    expect(open.map((m) => m.level)).toEqual([10, 25]);
    const gold = s.gold.toNumber();
    expect(claimMilestone(s, 'mining', 25, createRng(1), noop)).not.toBeNull();
    expect(s.gold.toNumber()).toBeGreaterThan(gold);
    expect(claimMilestone(s, 'mining', 25, createRng(1), noop)).toBeNull();
    expect(claimMilestone(s, 'mining', 50, createRng(1), noop)).toBeNull();
    expect(deserialize(serialize(s, 0), 0).milestones).toEqual(['mining:25']);
  });

  it('Stufe 99 bringt den Meisterumhang', () => {
    const s = gameWith();
    setLevel(s, 'fishing', 99);
    claimMilestone(s, 'fishing', 99, createRng(1), noop);
    expect(s.inventory.cape_fishing).toBe(1);
    expect(getItem('cape_fishing').equip?.slot).toBe('cape');
  });

  it('Kampf-Skills bekommen eigene Werte statt Tempo', () => {
    const s = gameWith();
    const base = mod(s, 'combat.damage.melee');
    setLevel(s, 'melee', 10);
    invalidateMods(s);
    expect(mod(s, 'combat.damage.melee')).toBeGreaterThan(base);
  });
});
