import { describe, expect, it } from 'vitest';
import { ISLAND_BUILDINGS } from '../src/data/construction';
import {
  advance,
  buildIsland,
  canBuildIsland,
  createRng,
  deserialize,
  maxPrayer,
  mod,
  rebirth,
  serialize,
  startAction,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

describe('Baukunst', () => {
  it('sägt Bretter aus Holz', () => {
    const s = gameWith({ inventory: { log_oak: 20 } });
    startAction(s, 'cons_plank_oak', () => {});
    advance(s, 30, createRng(1), () => {});
    expect(s.inventory.plank_oak).toBeGreaterThan(5);
    expect(s.skills.construction!.xp).toBeGreaterThan(0);
  });

  it('Inselbauten brauchen Stufe und Baustoffe und geben Boni', () => {
    const s = gameWith({ inventory: { plank_oak: 20, nails: 40 } });
    expect(canBuildIsland(s, 'workshop')).toBe('level');
    setLevel(s, 'construction', 5);
    expect(canBuildIsland(s, 'workshop')).toBe('ok');
    expect(buildIsland(s, 'workshop', () => {})).toBe('ok');
    expect(s.buildings.workshop).toBe(1);
    expect(s.inventory.plank_oak ?? 0).toBe(0);
    expect(mod(s, 'speed.crafting')).toBeGreaterThanOrEqual(0.04);
    expect(canBuildIsland(s, 'workshop')).toBe('level');
  });

  it('der Gebetsaltar erhöht die Gebetspunkte', () => {
    const s = gameWith();
    const before = maxPrayer(s);
    s.buildings = { altar: 1 };
    expect(maxPrayer(deserialize(serialize(s, 0), 0))).toBe(
      before + ISLAND_BUILDINGS.find((b) => b.id === 'altar')!.levels[0]!.mods['prayer.max']!,
    );
  });

  it('Bauten überleben die Wiedergeburt', () => {
    const s = gameWith();
    s.buildings = { workshop: 2 };
    s.prestige.wisdom = 0;
    for (const k of Object.keys(s.skills)) setLevel(s, k, 60);
    rebirth(s, () => {});
    expect(s.prestige.rebirths).toBe(1);
    expect(s.buildings.workshop).toBe(2);
  });
});
