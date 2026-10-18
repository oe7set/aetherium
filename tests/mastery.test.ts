import { describe, expect, it } from 'vitest';
import { getAction } from '../src/data';
import {
  actionDuration,
  completeAction,
  createRng,
  doubleChance,
  type GameEvent,
  masteryCompletionsFor,
  masteryLevel,
  masteryLevelFromCount,
  masteryProgress,
} from '../src/engine';
import { gameWith } from './helpers';

describe('Meisterschaft', () => {
  it('Stufenkurve: monoton, Stufe 10 nach ~800, 99 nach ~123 000 Abschlüssen', () => {
    for (let l = 2; l <= 99; l++)
      expect(masteryCompletionsFor(l)).toBeGreaterThan(masteryCompletionsFor(l - 1));
    expect(masteryLevelFromCount(0)).toBe(1);
    expect(masteryLevelFromCount(masteryCompletionsFor(10))).toBe(10);
    expect(masteryLevelFromCount(masteryCompletionsFor(10) - 1)).toBe(9);
    expect(masteryLevelFromCount(1e9)).toBe(99);
    expect(masteryCompletionsFor(10)).toBeGreaterThan(600);
    expect(masteryCompletionsFor(99)).toBeGreaterThan(100_000);
  });

  it('macht die Aktion schneller und öfter doppelt', () => {
    const s = gameWith();
    const def = getAction('wc_oak');
    const t0 = actionDuration(s, def);
    const d0 = doubleChance(s, def);
    s.stats['action.wc_oak'] = masteryCompletionsFor(50);
    expect(masteryLevel(s, 'wc_oak')).toBe(50);
    expect(actionDuration(s, def)).toBeLessThan(t0);
    expect(doubleChance(s, def)).toBeGreaterThan(d0);
    expect(masteryProgress(s, 'wc_oak').fraction).toBe(0);
  });

  it('meldet einen Stufenaufstieg genau beim Überschreiten', () => {
    const s = gameWith();
    s.stats['action.wc_oak'] = masteryCompletionsFor(2) - 1;
    const events: GameEvent[] = [];
    completeAction(s, getAction('wc_oak'), createRng(1), (e) => events.push(e));
    expect(events.filter((e) => e.type === 'mastery')).toEqual([
      { type: 'mastery', actionId: 'wc_oak', level: 2 },
    ]);
    expect(s.stats.masteryLevels).toBe(1);
  });
});
