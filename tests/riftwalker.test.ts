import { describe, expect, it } from 'vitest';
import { RELICS } from '../src/data/riftwalker';
import {
  createRng,
  finishRun,
  invalidateMods,
  mod,
  prepareRun,
  runStats,
  skillLevel,
} from '../src/engine';
import type { RunResult } from '../src/rift/sim';
import { gameWith, setLevel } from './helpers';

const noop = () => {};

function result(over: Partial<RunResult> = {}): RunResult {
  return {
    hero: 'farmer',
    biome: 'meadow',
    time: 900,
    kills: 1500,
    level: 30,
    bossKills: 3,
    elites: 4,
    won: true,
    evolutions: [],
    foodEaten: 0,
    bonusEssence: 0,
    mode: 'rift',
    ...over,
  };
}

describe('Rissläufer', () => {
  it('jeder Lauf gibt Rissläufer-XP', () => {
    const s = gameWith();
    const reward = finishRun(s, result(), createRng(1), noop);
    expect(reward.walkerXp).toBeGreaterThan(500);
    expect(skillLevel(s, 'riftwalker')).toBeGreaterThan(5);
  });

  it('Meilensteine wirken im nächsten Lauf', () => {
    const s = gameWith();
    const before = prepareRun(s, 'farmer', 'meadow', createRng(1))!;
    s.hero.status = 'home';
    setLevel(s, 'riftwalker', 40);
    const after = prepareRun(s, 'farmer', 'meadow', createRng(1))!;
    expect(after.rerolls).toBe(before.rerolls + 1);
    expect(after.revives).toBe(before.revives + 1);
    expect(after.startWeaponLevel).toBe(before.startWeaponLevel + 1);
    expect(after.stats.might).toBeGreaterThan(before.stats.might);
  });
});

describe('Relikte', () => {
  it('Bosse lassen Relikte fallen, keine doppelt', () => {
    const s = gameWith();
    for (let i = 0; i < 80; i++) finishRun(s, result({ bossKills: 5 }), createRng(i), noop);
    expect(s.rift.relics.length).toBeGreaterThan(3);
    expect(new Set(s.rift.relics).size).toBe(s.rift.relics.length);
    // Biome relics only drop in their biome.
    const foreign = RELICS.filter((r) => r.biome && r.biome !== 'meadow').map((r) => r.id);
    expect(s.rift.relics.some((id) => foreign.includes(id))).toBe(false);
  });

  it('Relikte wirken im Riss und auf der Insel', () => {
    const s = gameWith();
    const base = runStats(s, 'farmer');
    const xp = mod(s, 'xp.husbandry');
    s.rift.relics = ['hen_feather', 'wolf_fang'];
    invalidateMods(s);
    const stats = runStats(s, 'farmer');
    expect(stats.speed).toBeGreaterThan(base.speed);
    expect(stats.might).toBeCloseTo(base.might + 0.06);
    expect(mod(s, 'xp.husbandry')).toBeCloseTo(xp + 0.05);
  });
});
