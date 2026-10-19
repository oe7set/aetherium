import { describe, expect, it } from 'vitest';
import {
  createRng,
  essenceFor,
  finishDaily,
  prepareDaily,
  prepareRun,
  toggleCurse,
} from '../src/engine';
import { chooseShrine, createRun, runResult, stepRun } from '../src/rift/sim';
import { gameWith } from './helpers';

const noop = () => {};
const NOW = Date.UTC(2026, 9, 19, 12);

describe('Flüche', () => {
  it('erst nach drei Läufen wählbar, machen den Lauf härter und lohnender', () => {
    const s = gameWith({ inventory: { bread: 5 } });
    expect(toggleCurse(s, 'horde')).toBe(false);
    s.rift.runs = 3;
    expect(toggleCurse(s, 'horde')).toBe(true);
    expect(toggleCurse(s, 'hunger')).toBe(true);
    const cfg = prepareRun(s, 'farmer', 'meadow', createRng(1))!;
    expect(cfg.spawnMult).toBeCloseTo(1.5);
    expect(cfg.provisions).toEqual([]);
    expect(s.inventory.bread).toBe(5);
    const r = runResult(createRun(cfg));
    const plain = { ...r, curses: [], time: 600, kills: 500 };
    expect(essenceFor(s, { ...plain, curses: ['horde', 'hunger'] })).toBeGreaterThan(
      essenceFor(s, plain),
    );
  });
});

describe('Schreine', () => {
  it('erscheinen im Lauf und geben eine Wahl', () => {
    const s = gameWith();
    const run = createRun(prepareRun(s, 'farmer', 'meadow', createRng(2))!);
    run.shrineTimer = 0.01;
    stepRun(run, 0.1, { x: 0, y: 0 });
    const shrine = run.pickups.find((p) => p.kind === 'shrine')!;
    expect(shrine).toBeTruthy();
    run.hero.x = shrine.x;
    run.hero.y = shrine.y;
    run.hero.invuln = 99;
    stepRun(run, 0.05, { x: 0, y: 0 });
    expect(run.phase).toBe('shrine');
    expect(run.shrine).toHaveLength(3);
    const might = run.stats.might;
    run.shrine![0] = { kind: 'might', icon: '⚔️', name: 'Stärke', desc: '' };
    chooseShrine(run, 0);
    expect(run.phase).toBe('playing');
    expect(run.stats.might).toBeCloseTo(might + 0.15);
    expect(runResult(run).shrines).toBe(1);
  });
});

describe('Tagesriss', () => {
  it('fester Seed pro Tag, Bonus nur beim ersten Lauf', () => {
    const s = gameWith();
    const a = prepareDaily(s, 'farmer', NOW, createRng(1))!;
    s.hero.status = 'home';
    const b = prepareDaily(s, 'farmer', NOW + 1000, createRng(99))!;
    expect(a.seed).toBe(b.seed);
    expect(a.daily).toBe(true);
    expect(a.curses).toHaveLength(1);
    const r = { ...runResult(createRun(a)), time: 300 };
    expect(finishDaily(s, r, NOW, createRng(1), noop).lines).not.toBeNull();
    s.hero.status = 'home';
    expect(finishDaily(s, r, NOW, createRng(1), noop).lines).toBeNull();
    expect(s.rift.daily.days).toBe(1);
  });
});
