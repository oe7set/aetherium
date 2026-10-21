import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import { getAction } from '../src/data';
import { ISLAND_EVENTS } from '../src/data/islandEvents';
import {
  activeIslandEvent,
  advance,
  buyTraderDeal,
  completeAction,
  createRng,
  deserialize,
  mod,
  serialize,
  startIslandEvent,
} from '../src/engine';
import { gameWith } from './helpers';

const noop = () => {};

describe('Insel-Ereignisse', () => {
  it('das erste Ereignis kommt von selbst und endet wieder', () => {
    const s = gameWith();
    const events: string[] = [];
    advance(s, s.islandEvent.next + 1, createRng(3), (e) => {
      if (e.type === 'islandEvent') events.push(e.phase);
    });
    expect(activeIslandEvent(s)).toBeDefined();
    const left = s.islandEvent.left;
    advance(s, left + 1, createRng(4), (e) => {
      if (e.type === 'islandEvent') events.push(e.phase);
    });
    expect(s.islandEvent.id).toBeNull();
    expect(s.islandEvent.next).toBeGreaterThan(0);
    expect(events).toEqual(['start', 'end']);
  });

  it('jedes Ereignis gibt seine Boni nur solange es läuft', () => {
    for (const ev of ISLAND_EVENTS) {
      const s = gameWith();
      const [key, value] = Object.entries(ev.mods)[0]!;
      const before = mod(s, key as never);
      startIslandEvent(s, createRng(1), noop, ev.id);
      expect(mod(s, key as never)).toBeCloseTo(before + (value ?? 0), 5);
    }
  });

  it('nie zweimal hintereinander dasselbe Ereignis', () => {
    const s = gameWith();
    for (let i = 0; i < 30; i++) {
      const last = s.islandEvent.id;
      startIslandEvent(s, createRng(i), noop);
      expect(s.islandEvent.id).not.toBe(last);
    }
  });

  it('der Goldader-Fund fällt beim Bergbau', () => {
    const s = gameWith();
    startIslandEvent(s, createRng(1), noop, 'gold_vein');
    const rng = createRng(9);
    for (let i = 0; i < 40; i++) completeAction(s, getAction('mine_copper'), rng, noop);
    expect(s.stats.islandEventDrops ?? 0).toBeGreaterThan(0);
  });

  it('der Wanderhändler verkauft jedes Angebot einmal und bleibt im Spielstand', () => {
    const s = gameWith({ gold: new Decimal(100_000) });
    startIslandEvent(s, createRng(2), noop, 'trader');
    expect(s.islandEvent.deals).toHaveLength(3);
    const d = s.islandEvent.deals[0]!;
    expect(buyTraderDeal(s, 0, noop)).toBe(true);
    expect(s.inventory[d.item]).toBe(d.qty);
    expect(buyTraderDeal(s, 0, noop)).toBe(false);
    const back = deserialize(serialize(s, 0), 0);
    expect(back.islandEvent.id).toBe('trader');
    expect(back.islandEvent.deals[0]?.bought).toBe(true);
  });
});
