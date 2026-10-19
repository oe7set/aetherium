import { describe, expect, it } from 'vitest';
import { advance, consumeItem, createRng, heroTravelTime, mod, startAction } from '../src/engine';
import { gameWith, setLevel } from './helpers';

describe('Kartografie', () => {
  it('kartiert Regionen auf Pergament', () => {
    const s = gameWith({ inventory: { parchment: 30 } });
    startAction(s, 'carto_coast', () => {});
    advance(s, 60, createRng(1), () => {});
    expect(s.inventory.map_coast).toBeGreaterThan(5);
    expect(s.stats.mapsDrawn).toBeGreaterThan(5);
  });

  it('Schatzkarten enthalten Schätze', () => {
    const s = gameWith({ inventory: { treasure_map_1: 1 } });
    expect(consumeItem(s, 'treasure_map_1', createRng(2), () => {}).ok).toBe(true);
    expect(Object.keys(s.inventory).length).toBeGreaterThan(0);
  });

  it('jede Stufe verkürzt die Reisen des Helden', () => {
    const s = gameWith();
    const before = heroTravelTime(s, 10);
    const t = gameWith();
    setLevel(t, 'cartography', 61);
    expect(mod(t, 'hero.travel')).toBeGreaterThan(0.25);
    expect(heroTravelTime(t, 10)).toBeLessThan(before);
  });
});
