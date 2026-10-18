import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import {
  addBuff,
  advance,
  applyOfflineProgress,
  checkAchievements,
  collector,
  consumeItem,
  createRng,
  deserialize,
  MARKET,
  marketMult,
  mod,
  saleRevenue,
  sellItem,
  simulate,
  startAction,
  unitPrice,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

const never = () => 0.999999;

describe('Schmieden', () => {
  it('Erz → Barren → Axt → Werkzeug', () => {
    const s = gameWith({ inventory: { ore_copper: 2, ore_tin: 2 } });
    startAction(s, 'smelt_bronze', () => {});
    simulate(s, 6.1, never);
    expect(s.inventory.bar_bronze).toBe(2);
    expect(s.stats.barsSmelted).toBe(2);
    setLevel(s, 'smithing', 2);
    startAction(s, 'smith_bronze_axe', () => {});
    simulate(s, 3.1, never);
    expect(s.inventory.bronze_axe).toBe(1);
    consumeItem(s, 'bronze_axe', createRng(1), () => {});
    expect(s.ownedTools).toContain('axe_bronze');
    expect(s.equippedTools.woodcutting).toBe('axe_bronze');
  });

  it('Stahl braucht Kohle', () => {
    const s = gameWith({ inventory: { ore_iron: 5, coal: 1 } });
    setLevel(s, 'smithing', 30);
    const res = startAction(s, 'smelt_steel', () => {});
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.missingItem).toBe('coal');
  });
});

describe('Angeln', () => {
  it('fängt Fische, verbraucht Köder und kocht sie', () => {
    const s = gameWith({ inventory: { bait: 2 } });
    setLevel(s, 'fishing', 5);
    startAction(s, 'fish_sardine', () => {});
    simulate(s, 20, never);
    expect(s.inventory.raw_sardine).toBe(2);
    expect(s.inventory.bait).toBeUndefined();
    expect(s.active).toBeNull();
    expect(s.stats.fishCaught).toBe(2);
    s.fire = 100;
    setLevel(s, 'cooking', 5);
    startAction(s, 'cook_sardine', () => {});
    simulate(s, 10, never);
    expect(s.inventory.cooked_sardine).toBe(2);
  });

  it('Schrödingers Fisch kollabiert in genau einen Zustand', () => {
    const s = gameWith({ inventory: { schrodinger_fish: 20 } });
    const rng = createRng(9);
    for (let i = 0; i < 20; i++) consumeItem(s, 'schrodinger_fish', rng, () => {});
    expect((s.inventory.collapsed_fish ?? 0) + (s.inventory.empty_box ?? 0)).toBe(20);
    expect(s.achievements).not.toContain('schrodinger'); // checked by the engine loop / store
    checkAchievements(s, () => {});
    expect(s.achievements).toContain('schrodinger');
  });
});

describe('Markt', () => {
  it('Verkaufen drückt den Preis, der sich mit der Zeit erholt', () => {
    const s = gameWith({ inventory: { log_willow: 500 } });
    const before = unitPrice(s, 'log_willow');
    sellItem(s, 'log_willow', 200, () => {});
    const after = unitPrice(s, 'log_willow');
    expect(after).toBeLessThan(before * 0.6);
    advance(s, MARKET.RECOVERY_TAU * 5, never, () => {});
    expect(marketMult(s, 'log_willow')).toBeCloseTo(1, 1);
  });

  it('Großverkäufe bringen weniger als Stückpreis × Menge, aber nie unter den Boden', () => {
    const s = gameWith();
    const { revenue } = saleRevenue(s, 'log_oak', 10_000);
    expect(revenue).toBeLessThan(10_000);
    expect(revenue).toBeGreaterThanOrEqual(10_000 * MARKET.MIN_MULT * 0.99);
  });

  it('Trends tauchen regelmäßig auf', () => {
    const s = gameWith();
    const { emit, events } = collector();
    advance(s, 3600, createRng(3), emit);
    expect(events.filter((e) => e.type === 'marketTrend').length).toBeGreaterThan(3);
  });
});

describe('Erfolge & Modifikatoren', () => {
  it('schalten frei und geben Boni', () => {
    const s = gameWith();
    startAction(s, 'wc_oak', () => {});
    const { emit, events } = collector();
    simulate(s, 3.01, never);
    advance(s, 0, never, emit);
    expect(s.achievements).toContain('stat_treesFelled_1');
    expect(mod(s, 'speed.woodcutting')).toBeGreaterThan(0);
    void events;
  });

  it('Glücks-Events und Buffs laufen ab', () => {
    const s = gameWith();
    addBuff(s, 'eureka', () => {});
    expect(mod(s, 'xp')).toBeGreaterThanOrEqual(1);
    advance(s, 61, never, () => {});
    expect(s.buffs).toHaveLength(0);
    expect(mod(s, 'xp')).toBe(0);
  });

  it('Glücks-Events passieren beim aktiven Spielen', () => {
    const s = gameWith({ gold: new Decimal(0) });
    startAction(s, 'wc_oak', () => {});
    const summary = applyOfflineProgress(s, 2 * 3600 * 1000, createRng(4));
    expect(s.stats.luckyEvents).toBeGreaterThan(5);
    expect(summary.actionsCompleted).toBeGreaterThan(1000);
  });
});

describe('Spielstand v1 → v2', () => {
  it('ergänzt Markt, Erfolge und Buffs', () => {
    const loaded = deserialize({
      v: 1,
      savedAt: 0,
      data: { gold: '10', inventory: { log_oak: 3 } },
    });
    expect(loaded.market.mults).toEqual({});
    expect(loaded.achievements).toEqual([]);
    expect(loaded.buffs).toEqual([]);
  });
});
