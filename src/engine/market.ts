import { getItem, ITEMS } from '../data';
import { registerTimeEffect } from './actions';
import type { Emit } from './events';
import { mod } from './modifiers';
import { pick, type Rng } from './rng';
import type { GameState } from './state';

// Dynamic NPC market: selling lowers an item's price, which recovers over time.
// Random trends make one item temporarily hot (or not).

export const MARKET = {
  /** Lowest multiplier dumping can push a price to. */
  MIN_MULT: 0.35,
  /** Recovery time constant in seconds (63 % back to normal after this long). */
  RECOVERY_TAU: 15 * 60,
  /** Average seconds between trends. */
  TREND_INTERVAL: 8 * 60,
  TREND_DURATION: 5 * 60,
};

/** Units that can be sold before the price drops to ~37 %. Cheap items have deeper markets. */
export function marketDepth(basePrice: number): number {
  return 400 / Math.sqrt(1 + basePrice);
}

export function marketMult(s: GameState, item: string): number {
  return s.market.mults[item] ?? 1;
}

export function trendMult(s: GameState, item: string): number {
  return s.market.trend?.item === item ? s.market.trend.mult : 1;
}

/** Current price for one unit (before the sale moves the market). */
export function unitPrice(s: GameState, item: string): number {
  return getItem(item).sellPrice * marketMult(s, item) * trendMult(s, item) * (1 + mod(s, 'gold'));
}

/**
 * Revenue for selling `qty` units, integrating the price decline across the sale:
 * mult(q) = m0 · e^(−q/depth) (floored at MIN_MULT).
 */
export function saleRevenue(
  s: GameState,
  item: string,
  qty: number,
): { revenue: number; newMult: number } {
  const base = getItem(item).sellPrice;
  if (base <= 0 || qty <= 0) return { revenue: 0, newMult: marketMult(s, item) };
  const m0 = marketMult(s, item);
  const depth = marketDepth(base);
  const factor = trendMult(s, item) * (1 + mod(s, 'gold')) * base;
  // Units sold before hitting the floor.
  const qFloor = m0 > MARKET.MIN_MULT ? depth * Math.log(m0 / MARKET.MIN_MULT) : 0;
  const q1 = Math.min(qty, qFloor);
  const decaying = m0 * depth * (1 - Math.exp(-q1 / depth));
  const flat = Math.max(0, qty - q1) * MARKET.MIN_MULT;
  const newMult = Math.max(MARKET.MIN_MULT, m0 * Math.exp(-qty / depth));
  return { revenue: (decaying + flat) * factor, newMult };
}

export function applySale(s: GameState, item: string, newMult: number): void {
  s.market.mults[item] = newMult;
}

function recover(s: GameState, dt: number): void {
  const k = Math.exp(-dt / MARKET.RECOVERY_TAU);
  for (const [item, m] of Object.entries(s.market.mults)) {
    const next = 1 + (m - 1) * k;
    if (Math.abs(next - 1) < 0.002) delete s.market.mults[item];
    else s.market.mults[item] = next;
  }
}

const TRENDABLE = ITEMS.filter((i) => i.sellPrice >= 2 && i.category !== 'junk');

function rollTrend(s: GameState, rng: Rng, emit: Emit): void {
  // Prefer items the player has actually seen, so trends feel relevant.
  const seen = TRENDABLE.filter((i) => (s.stats[`obtained.${i.id}`] ?? 0) > 0);
  const pool = seen.length >= 3 ? seen : TRENDABLE;
  const item = pick(rng, pool).id;
  const boom = rng() < 0.8;
  const mult = boom ? 1.5 + rng() * 1.5 : 0.5 + rng() * 0.2;
  s.market.trend = { item, mult, remaining: MARKET.TREND_DURATION };
  emit({ type: 'marketTrend', item, mult });
}

registerTimeEffect('market', {
  next: (s) => Math.min(s.market.nextTrend, s.market.trend?.remaining ?? Infinity),
  apply: (s, dt, emit, rng) => {
    recover(s, dt);
    const m = s.market;
    if (m.trend) {
      m.trend.remaining -= dt;
      if (m.trend.remaining <= 1e-9) m.trend = null;
    }
    m.nextTrend -= dt;
    if (m.nextTrend <= 1e-9) {
      m.nextTrend = MARKET.TREND_INTERVAL * (0.6 + rng() * 0.8);
      rollTrend(s, rng, emit);
    }
  },
});
