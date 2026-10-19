import { describe, expect, it } from 'vitest';
import {
  advance,
  createRng,
  DAY_SECONDS,
  deserialize,
  isNight,
  mod,
  serialize,
  startAction,
  studyConstellation,
  toggleConstellation,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

const noop = () => {};

/** A wall time at midnight / noon of the in-game day. */
const MIDNIGHT = DAY_SECONDS * 1000 * 1000;
const NOON = MIDNIGHT + (DAY_SECONDS / 2) * 1000;

describe('Sternkunde', () => {
  it('nachts doppelter Sternenstaub', () => {
    expect(isNight(MIDNIGHT)).toBe(true);
    expect(isNight(NOON)).toBe(false);
    const day = gameWith({ lastUpdate: NOON });
    startAction(day, 'astro_evening', noop);
    advance(day, 40, createRng(1), noop);
    const night = gameWith({ lastUpdate: MIDNIGHT });
    startAction(night, 'astro_evening', noop);
    advance(night, 40, createRng(1), noop);
    expect(night.inventory.stardust).toBeGreaterThanOrEqual(2 * (day.inventory.stardust ?? 0) - 2);
    expect(night.skills.astronomy!.xp).toBeGreaterThan(day.skills.astronomy!.xp);
  });

  it('Offline-Zeit läuft durch Tag und Nacht', () => {
    const s = gameWith({ lastUpdate: NOON });
    startAction(s, 'astro_evening', noop);
    advance(s, DAY_SECONDS, createRng(1), noop);
    const done = s.stats.starsWatched ?? 0;
    // About a third of a day is night: more than 1×, less than 2× stardust per observation.
    expect(s.inventory.stardust).toBeGreaterThan(done * 1.1);
    expect(s.inventory.stardust).toBeLessThan(done * 1.9);
  });

  it('Sternbilder kosten Sternenstaub, leuchten in begrenzten Plätzen und bleiben gespeichert', () => {
    const s = gameWith({ inventory: { stardust: 500 } });
    setLevel(s, 'astronomy', 20);
    const base = mod(s, 'speed.woodcutting');
    expect(studyConstellation(s, 'lumberjack')).toBe('ok');
    expect(studyConstellation(s, 'lumberjack')).toBe('ok');
    expect(s.stars.active).toEqual(['lumberjack']);
    expect(mod(s, 'speed.woodcutting')).toBeCloseTo(base + 0.04);
    expect(studyConstellation(s, 'pickaxe')).toBe('ok');
    expect(s.stars.active).toEqual(['lumberjack', 'pickaxe']);
    expect(studyConstellation(s, 'fish')).toBe('ok');
    expect(toggleConstellation(s, 'fish')).toBe('slots');
    expect(toggleConstellation(s, 'lumberjack')).toBe('ok');
    expect(toggleConstellation(s, 'fish')).toBe('ok');
    const back = deserialize(serialize(s, 0), 0);
    expect(back.stars).toEqual(s.stars);
  });
});
