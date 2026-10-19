import { describe, expect, it } from 'vitest';
import { advance, consumeItem, createRng, shipTier, startAction } from '../src/engine';
import { gameWith, setLevel } from './helpers';

const noop = () => {};

describe('Seefahrt', () => {
  it('Floß reicht für die Küste, ferne Inseln brauchen größere Schiffe', () => {
    const s = gameWith({ inventory: { bread: 10 } });
    expect(shipTier(s)).toBe(0);
    expect(startAction(s, 'sail_shoals', noop).ok).toBe(true);
    advance(s, 25, createRng(1), noop);
    expect(s.inventory.raw_sardine).toBeGreaterThanOrEqual(6);
    setLevel(s, 'sailing', 25);
    expect(startAction(s, 'sail_spice_isles', noop).ok).toBe(false);
  });

  it('Schiffsbausatz lässt das Schiff vom Stapel', () => {
    const s = gameWith({ inventory: { ship_sloop_kit: 1, bread: 5 } });
    setLevel(s, 'sailing', 25);
    consumeItem(s, 'ship_sloop_kit', createRng(1), noop);
    expect(s.equippedTools.sailing).toBe('ship_sloop');
    expect(shipTier(s)).toBe(1);
    expect(startAction(s, 'sail_spice_isles', noop).ok).toBe(true);
  });

  it('Handelsfahrten bringen Gold und Dorf-Rohstoffe', () => {
    const s = gameWith({ inventory: { plank_oak: 30 } });
    setLevel(s, 'sailing', 15);
    s.equippedTools.sailing = 'ship_sloop';
    const gold = s.gold.toNumber();
    const wood = s.village.villages[0]!.res.wood;
    expect(startAction(s, 'trade_timber', noop).ok).toBe(true);
    advance(s, 60, createRng(1), noop);
    expect(s.gold.toNumber()).toBeGreaterThan(gold + 800);
    expect(s.village.villages[0]!.res.wood).toBeGreaterThan(wood);
  });
});
