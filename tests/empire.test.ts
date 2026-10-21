import { describe, expect, it } from 'vitest';
import { EMPIRE_RANKS, EMPIRE_SOURCES } from '../src/data/empire';
import {
  claimEmpireRank,
  createRng,
  deserialize,
  empireRankReached,
  empireScore,
  empireValues,
  mod,
  rebirth,
  serialize,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

const noop = () => {};

describe('Reichsränge', () => {
  it('jede Quelle hat einen Wert, die Ränge steigen streng', () => {
    const s = gameWith();
    const v = empireValues(s);
    for (const src of EMPIRE_SOURCES) expect(v[src.key]).toBeTypeOf('number');
    for (let i = 1; i < EMPIRE_RANKS.length; i++)
      expect(EMPIRE_RANKS[i]!.score).toBeGreaterThan(EMPIRE_RANKS[i - 1]!.score);
  });

  it('Punkte aus Skills heben den Rang, der Aufstieg gibt Bonus und Belohnung genau einmal', () => {
    const s = gameWith();
    expect(claimEmpireRank(s, createRng(1), noop)).toBeNull();
    const before = empireScore(s);
    setLevel(s, 'mining', 99);
    setLevel(s, 'fishing', 99);
    expect(empireScore(s)).toBeGreaterThan(before);
    expect(empireRankReached(s)).toBeGreaterThanOrEqual(1);
    const xp = mod(s, 'xp');
    const gold = s.gold;
    expect(claimEmpireRank(s, createRng(1), noop)).not.toBeNull();
    expect(s.empireRank).toBe(1);
    expect(s.gold.gt(gold)).toBe(true);
    expect(mod(s, 'xp')).toBeCloseTo(xp + 0.01, 5);
    if (empireRankReached(s) === 1) expect(claimEmpireRank(s, createRng(1), noop)).toBeNull();
  });

  it('bleibt über Speichern und Wiedergeburt erhalten', () => {
    const s = gameWith({ empireRank: 3 });
    expect(deserialize(serialize(s, 0), 0).empireRank).toBe(3);
    rebirth(s, noop);
    expect(s.empireRank).toBe(3);
  });
});
