import { describe, expect, it } from 'vitest';
import { WEEKLY_MINUTES, WEEKLY_MUTATORS } from '../src/data/weekly';
import { chooseUpgrade, closeChest, createRun, stepRun } from '../src/rift/sim';
import {
  createRng,
  deserialize,
  finishWeekly,
  prepareWeekly,
  serialize,
  weeklyChallenge,
} from '../src/engine';
import type { RunResult } from '../src/rift/sim';
import { gameWith } from './helpers';

const noop = () => {};
const monday = new Date('2026-03-02T10:00:00').getTime();
const DAY = 24 * 3600 * 1000;

function result(won: boolean): RunResult {
  return {
    hero: 'farmer',
    biome: 'meadow',
    time: won ? 360 : 120,
    kills: 300,
    level: 12,
    bossKills: won ? 2 : 0,
    elites: 1,
    won,
    evolutions: [],
    foodEaten: 0,
    bonusEssence: 0,
    mode: 'dungeon',
  };
}

describe('Wochenboss', () => {
  it('ist pro Woche fest und wechselt mit der Woche', () => {
    const s = gameWith();
    const a = weeklyChallenge(s, monday);
    expect(weeklyChallenge(s, monday + 5 * DAY).mutator.id).toBe(a.mutator.id);
    const ids = new Set<string>();
    for (let w = 0; w < 30; w++) ids.add(weeklyChallenge(s, monday + w * 7 * DAY).mutator.id);
    expect(ids.size).toBeGreaterThan(2);
    expect(WEEKLY_MUTATORS.map((m) => m.id)).toContain(a.mutator.id);
  });

  it('wendet die Wochenregel an und zahlt den ersten Sieg einmal aus', () => {
    const s = gameWith();
    const cfg = prepareWeekly(s, 'farmer', monday, createRng(1));
    expect(cfg?.trial).toBe(true);
    expect(cfg?.mode).toBe('dungeon');
    expect(cfg?.difficulty).toBeGreaterThanOrEqual(1);
    const first = finishWeekly(s, result(true), monday, createRng(2), noop);
    expect(first.firstWin).toBe(true);
    expect(first.lines?.length).toBeGreaterThan(0);
    expect(s.progress.avatars).toContain('🦹');
    expect(s.rift.weekly.wins).toBe(1);
    s.hero.status = 'home';
    s.hero.health = 100;
    prepareWeekly(s, 'farmer', monday, createRng(3));
    const again = finishWeekly(s, result(true), monday, createRng(4), noop);
    expect(again.firstWin).toBe(false);
    expect(again.lines).toBeNull();
    // Next week: fresh challenge, a little harder.
    const next = weeklyChallenge(s, monday + 7 * DAY);
    expect(next.difficulty / next.mutator.difficulty).toBeGreaterThan(1);
    prepareWeekly(s, 'farmer', monday + 7 * DAY, createRng(5));
    expect(s.rift.weekly.won).toBe(false);
    expect(s.rift.weekly.attempts).toBe(1);
  });

  it('Trostpreis nur beim ersten Fehlversuch, Stand übersteht Speichern', () => {
    const s = gameWith();
    prepareWeekly(s, 'farmer', monday, createRng(1));
    expect(finishWeekly(s, result(false), monday, createRng(2), noop).lines).not.toBeNull();
    s.hero.status = 'home';
    s.hero.health = 100;
    prepareWeekly(s, 'farmer', monday, createRng(3));
    expect(finishWeekly(s, result(false), monday, createRng(4), noop).lines).toBeNull();
    const back = deserialize(serialize(s));
    expect(back.rift.weekly.attempts).toBe(2);
    expect(back.rift.weekly.bestKills).toBe(300);
  });
});

describe('Montagsfürst', () => {
  it('bewacht das Ende der Wochenprüfung und feuert Geschossringe', () => {
    const s = gameWith();
    const cfg = prepareWeekly(s, 'farmer', monday, createRng(1))!;
    cfg.stats.maxHp = 1e12;
    const run = createRun(cfg);
    let shots = 0;
    for (let t = 0; t < (WEEKLY_MINUTES * 60 + 30) * 5; t++) {
      if (run.phase === 'levelup') chooseUpgrade(run, 0);
      if (run.phase === 'chest') closeChest(run);
      stepRun(run, 0.2, { x: 0, y: 0 });
      shots = Math.max(shots, run.shots.length);
    }
    const boss = run.enemies.find((e) => e.final);
    expect(boss?.def.id).toBe('rb_warlord');
    expect(shots).toBeGreaterThanOrEqual(12);
  }, 20000);
});
