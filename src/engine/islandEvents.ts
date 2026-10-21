import Decimal from 'break_eternity.js';
import {
  ISLAND_EVENT_GAP,
  ISLAND_EVENT_MAP,
  ISLAND_EVENTS,
  TRADER_DEALS,
} from '../data/islandEvents';
import { gainItem, registerCompletionHook, registerTimeEffect } from './actions';
import type { Emit } from './events';
import { invalidateMods, registerModifierSource } from './modifiers';
import type { Rng } from './rng';
import { addStat, type GameState } from './state';

/** Insel-Ereignisse: random, time-limited island happenings (one at a time). */

export function activeIslandEvent(s: GameState) {
  const id = s.islandEvent.id;
  return id ? ISLAND_EVENT_MAP.get(id) : undefined;
}

function gap(rng: Rng): number {
  const [a, b] = ISLAND_EVENT_GAP;
  return a + rng() * (b - a);
}

/** Starts an event (random unless `id` is given; never the same one twice in a row). */
export function startIslandEvent(s: GameState, rng: Rng, emit: Emit, id?: string): void {
  const pool = ISLAND_EVENTS.filter((e) => e.id !== s.islandEvent.lastId);
  const def = (id && ISLAND_EVENT_MAP.get(id)) || pool[Math.floor(rng() * pool.length)]!;
  const deals: GameState['islandEvent']['deals'] = [];
  if (def.trader) {
    const stock = [...TRADER_DEALS];
    for (let i = 0; i < 3 && stock.length; i++) {
      const d = stock.splice(Math.floor(rng() * stock.length), 1)[0]!;
      deals.push({ ...d, bought: false });
    }
  }
  s.islandEvent = { ...s.islandEvent, id: def.id, lastId: def.id, left: def.duration, deals };
  addStat(s, 'islandEvents');
  invalidateMods(s);
  emit({ type: 'islandEvent', event: def.id, phase: 'start' });
}

function endIslandEvent(s: GameState, rng: Rng, emit: Emit): void {
  const id = s.islandEvent.id;
  s.islandEvent = { ...s.islandEvent, id: null, left: 0, next: gap(rng), deals: [] };
  invalidateMods(s);
  if (id) emit({ type: 'islandEvent', event: id, phase: 'end' });
}

/** Buys one of the Wanderhändler's deals. */
export function buyTraderDeal(s: GameState, index: number, emit: Emit): boolean {
  const deal = s.islandEvent.deals[index];
  if (!activeIslandEvent(s)?.trader || !deal || deal.bought || s.gold.lt(deal.price)) return false;
  s.gold = s.gold.sub(deal.price);
  addStat(s, 'goldSpent', new Decimal(deal.price).toNumber());
  s.islandEvent.deals = s.islandEvent.deals.map((d, i) =>
    i === index ? { ...d, bought: true } : d,
  );
  gainItem(s, deal.item, deal.qty, emit, true);
  addStat(s, 'traderDeals');
  return true;
}

registerTimeEffect('islandEvent', {
  next: (s) => Math.max(0, s.islandEvent.id ? s.islandEvent.left : s.islandEvent.next),
  apply: (s, dt, emit, rng) => {
    const ev = s.islandEvent;
    if (ev.id) {
      ev.left -= dt;
      if (ev.left <= 1e-6) endIslandEvent(s, rng, emit);
    } else {
      ev.next -= dt;
      if (ev.next <= 1e-6) startIslandEvent(s, rng, emit);
    }
  },
});

registerCompletionHook('islandEvent', (s, def, rng, emit) => {
  const ev = activeIslandEvent(s);
  if (!ev?.drop || !ev.skills.includes(def.skill)) return;
  if (rng() < ev.drop.chance) {
    gainItem(s, ev.drop.item, 1, emit, ev.drop.chance < 0.1);
    addStat(s, 'islandEventDrops');
  }
});

registerModifierSource('islandEvent', (s) => {
  const ev = activeIslandEvent(s);
  return ev ? [ev.mods] : [];
});
