import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import {
  buyItem,
  buySlot,
  buyTool,
  createRng,
  equipTool,
  slotPrice,
  sellItem,
  useItem,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

describe('Krämer', () => {
  it('verkauft Items gegen Gold', () => {
    const s = gameWith({ inventory: { log_oak: 10 } });
    expect(sellItem(s, 'log_oak', 4, () => {}).ok).toBe(true);
    expect(s.inventory.log_oak).toBe(6);
    expect(s.gold.eq(4)).toBe(true);
    sellItem(s, 'log_oak', 999, () => {});
    expect(s.inventory.log_oak).toBeUndefined();
  });

  it('kauft Werkzeuge nur mit Gold und Level, rüstet sie aus', () => {
    const s = gameWith({ gold: new Decimal(1000) });
    expect(buyTool(s, 'axe_iron')).toEqual({ ok: false, reason: 'level' });
    expect(buyTool(s, 'axe_bronze').ok).toBe(true);
    expect(s.equippedTools.woodcutting).toBe('axe_bronze');
    expect(buyTool(s, 'axe_bronze')).toEqual({ ok: false, reason: 'owned' });
    setLevel(s, 'woodcutting', 10);
    expect(buyTool(s, 'axe_iron').ok).toBe(true);
    expect(s.equippedTools.woodcutting).toBe('axe_iron');
    expect(equipTool(s, 'axe_stone').ok).toBe(true);
    expect(s.gold.eq(1000 - 60 - 400)).toBe(true);
  });

  it('Inventarplätze werden teurer', () => {
    const s = gameWith({ gold: new Decimal(1e6) });
    const first = slotPrice(s);
    expect(buySlot(s).ok).toBe(true);
    expect(s.inventorySlots).toBe(21);
    expect(slotPrice(s).gt(first)).toBe(true);
  });

  it('Zutaten kaufen kostet Gold', () => {
    const s = gameWith({ gold: new Decimal(10) });
    expect(buyItem(s, 'potato', 1).ok).toBe(true);
    expect(buyItem(s, 'potato', 1)).toEqual({ ok: false, reason: 'gold' });
    expect(s.inventory.potato).toBe(1);
  });
});

describe('Benutzbare Items', () => {
  it('Newton-Apfel gibt Intelligenz', () => {
    const s = gameWith({ inventory: { newton_apple: 1 } });
    expect(useItem(s, 'newton_apple', createRng(1), () => {}).ok).toBe(true);
    expect(s.intelligence).toBe(1);
    expect(s.inventory.newton_apple).toBeUndefined();
  });

  it('Vogelnester enthalten immer etwas', () => {
    const s = gameWith({ inventory: { bird_nest: 50 } });
    const rng = createRng(5);
    for (let i = 0; i < 50; i++) useItem(s, 'bird_nest', rng, () => {});
    expect(s.inventory.bird_nest).toBeUndefined();
    const total = Object.values(s.inventory).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(50);
  });

  it('nicht benutzbare Items werden abgelehnt', () => {
    const s = gameWith({ inventory: { log_oak: 1 } });
    expect(useItem(s, 'log_oak', createRng(1), () => {}).ok).toBe(false);
  });
});
