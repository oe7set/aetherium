import { describe, expect, it } from 'vitest';
import { agenda, claimDaily, createRng, startAction } from '../src/engine';
import { gameWith } from './helpers';

const now = new Date('2026-03-02T10:00:00').getTime();
const ids = (s: ReturnType<typeof gameWith>) => agenda(s, now).map((i) => i.id);

describe('Was jetzt?', () => {
  it('ein neues Spiel zeigt Belohnung, freie Baumeister und die untätige Figur', () => {
    const s = gameWith();
    const list = agenda(s, now);
    expect(list[0]?.id).toBe('daily');
    expect(list[0]?.kind).toBe('reward');
    expect(ids(s)).toEqual(expect.arrayContaining(['village-fields', 'idle']));
    // Every entry points somewhere.
    for (const it of list) expect(it.target.area).toBeTruthy();
  });

  it('erledigte Dinge verschwinden', () => {
    const s = gameWith();
    claimDaily(s, now, createRng(1), () => {});
    expect(ids(s)).not.toContain('daily');
    startAction(s, 'wc_oak', () => {});
    expect(ids(s)).not.toContain('idle');
    s.hero.points = 3;
    expect(ids(s)).toContain('hero-points');
    s.hero.points = 0;
    s.inventorySlots = 0;
    expect(ids(s)).toContain('bag-full');
  });
});

describe('Was jetzt? – Anfängerschutz', () => {
  it('warnt sechs Stunden vor Schutzende, wenn die Verteidigung nicht reicht', () => {
    const s = gameWith();
    const v = s.village.villages[0]!;
    v.fields = v.fields.map(() => 6);
    v.buildings.main = 10;
    s.hero.status = 'moving';
    s.village.protection = 3 * 3600;
    expect(agenda(s, now).some((i) => i.id === 'protection-ending')).toBe(true);
    s.village.protection = 20 * 3600;
    expect(agenda(s, now).some((i) => i.id === 'protection-ending')).toBe(false);
  });
});
