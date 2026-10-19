import { describe, expect, it } from 'vitest';
import { ACTION_MAP } from '../src/data';
import {
  advance,
  collector,
  createRng,
  equipItem,
  mod,
  startAction,
  stealFailChance,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

describe('Diebeskunst', () => {
  it('stiehlt Gold, wird manchmal erwischt und verliert dabei Zeit und LP', () => {
    const s = gameWith();
    const gold = s.gold.toNumber();
    const { emit, events } = collector();
    startAction(s, 'thieve_farmer', emit);
    advance(s, 300, createRng(1), emit);
    expect(s.gold.toNumber()).toBeGreaterThan(gold);
    expect(s.stats.thefts).toBeGreaterThan(10);
    expect(s.stats.timesCaught).toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'caught')).toBe(true);
    expect(s.skills.thieving!.xp).toBeGreaterThan(0);
  });

  it('höhere Stufe und Diebesmaske senken die Erwischt-Chance', () => {
    const def = ACTION_MAP.get('thieve_guard')!;
    const s = gameWith({ inventory: { thief_mask: 1 } });
    setLevel(s, 'thieving', 25);
    const fresh = stealFailChance(s, def);
    setLevel(s, 'thieving', 55);
    const pro = stealFailChance(s, def);
    expect(pro).toBeLessThan(fresh);
    expect(equipItem(s, 'thief_mask').ok).toBe(true);
    expect(stealFailChance(s, def)).toBeLessThan(pro);
  });

  it('Stufen geben kritische Treffer und Dorfabwehr', () => {
    expect(mod(gameWith(), 'combat.crit')).toBe(0);
    const t = gameWith();
    setLevel(t, 'thieving', 61);
    expect(mod(t, 'combat.crit')).toBeGreaterThan(0.05);
    expect(mod(t, 'village.defense')).toBeGreaterThan(0.05);
  });
});
