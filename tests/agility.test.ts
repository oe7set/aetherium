import { describe, expect, it } from 'vitest';
import { advance, createRng, fallChance, invalidateMods, mod, startAction } from '../src/engine';
import { getAction } from '../src/data';
import { gameWith, setLevel } from './helpers';

const noop = () => {};

describe('Gewandtheit', () => {
  it('Runden geben XP, manchmal gibt es Stürze', () => {
    const s = gameWith();
    s.hp = 10;
    startAction(s, 'agi_beach', noop);
    advance(s, 600, createRng(5), noop);
    expect(s.skills.agility!.xp).toBeGreaterThan(500);
    expect(s.stats.agilityFalls ?? 0).toBeGreaterThan(0);
    expect(s.stats.lapsRun ?? 0).toBeGreaterThan(50);
  });

  it('Sturzrisiko sinkt mit der Stufe', () => {
    const s = gameWith();
    const def = getAction('agi_beach');
    const low = fallChance(s, def);
    setLevel(s, 'agility', 40);
    expect(fallChance(s, def)).toBeLessThan(low / 2);
  });

  it('jede Stufe macht alles etwas schneller', () => {
    const s = gameWith();
    const base = mod(s, 'speed');
    setLevel(s, 'agility', 51);
    invalidateMods(s);
    expect(mod(s, 'speed')).toBeCloseTo(base + 0.04);
  });
});
