import { ACTIONS, getItem, ITEM_MAP } from '../data';
import { GUILD, GUILD_MAP, GUILD_MASTER_BONUS, GUILDS } from '../data/guilds';
import type { ActionDef } from '../data/types';
import { actionUnlocked, registerTimeEffect } from './actions';
import type { Emit } from './events';
import { itemCount, removeItem } from './inventory';
import { applyReward } from './progress';
import type { Rng } from './rng';
import { earnGold } from './shop';
import { addXp } from './skills';
import { addStat, type GameState, type GuildOrder, type GuildOrderLine } from './state';

/** Zunftaufträge: orders over several skills, reputation per guild, refreshed over time. */

export function guildRep(s: GameState, guild: string): number {
  return s.guilds.rep[guild] ?? 0;
}

export function guildRank(s: GameState, guild: string): number {
  return Math.min(GUILD.maxRank, Math.floor(guildRep(s, guild) / GUILD.repPerRank));
}

export function guildSlots(s: GameState): number {
  return GUILD.slots + (GUILDS.some((g) => guildRank(s, g.id) >= GUILD.extraSlotRank) ? 1 : 0);
}

/** Actions whose product a guild may order: unlocked, with an output, no gear or junk. */
function orderable(s: GameState, guild: string): ActionDef[] {
  const g = GUILD_MAP.get(guild);
  if (!g) return [];
  return ACTIONS.filter((a) => {
    if (!g.skills.includes(a.skill) || !a.outputs.length || a.alchemy || a.steal) return false;
    const item = ITEM_MAP.get(a.outputs[0]!.item);
    if (!item || item.category === 'gear' || item.category === 'junk' || item.sellPrice <= 0)
      return false;
    return actionUnlocked(s, a);
  });
}

/** Builds a new order for a random guild that has something to order (null: nothing yet). */
export function rollOrder(s: GameState, rng: Rng): GuildOrder | null {
  const guilds = GUILDS.map((g) => ({ g, pool: orderable(s, g.id) })).filter((x) => x.pool.length);
  if (!guilds.length) return null;
  const { g, pool } = guilds[Math.floor(rng() * guilds.length)]!;
  const rank = guildRank(s, g.id);
  const want = Math.min(rank >= 2 ? 3 : 2, new Set(pool.map((a) => a.skill)).size + 1);
  const lines: GuildOrderLine[] = [];
  const used = new Set<string>();
  for (let tries = 0; lines.length < want && tries < 20; tries++) {
    // Prefer the better recipes of a skill: pick among its top six by level.
    const skills = [...new Set(pool.map((a) => a.skill))];
    const skill = skills[Math.floor(rng() * skills.length)]!;
    const top = pool
      .filter((a) => a.skill === skill)
      .sort((a, b) => b.levelReq - a.levelReq)
      .slice(0, 6);
    const a = top[Math.floor(rng() * top.length)];
    if (!a) continue;
    const out = a.outputs[0]!;
    if (used.has(out.item)) continue;
    used.add(out.item);
    const qty = Math.max(1, Math.round((GUILD.lineSeconds / a.baseTime) * out.qty));
    const xp = Math.round(a.xp * (qty / out.qty) * GUILD.xpMult);
    lines.push({ item: out.item, qty, skill: a.skill, xp });
  }
  if (!lines.length) return null;
  const value = lines.reduce((sum, l) => sum + l.qty * getItem(l.item).sellPrice, 0);
  const bonus = 1 + GUILD.rankBonus * rank;
  return {
    id: s.guilds.seq++,
    guild: g.id,
    lines,
    gold: Math.max(50, Math.round(value * GUILD.goldMult * bonus)),
    rep: 10 + 5 * lines.length,
    left: GUILD.duration,
  };
}

/** Fills the board up to its slots. */
export function fillOrders(s: GameState, rng: Rng): void {
  while (s.guilds.orders.length < guildSlots(s)) {
    const o = rollOrder(s, rng);
    if (!o) return;
    s.guilds.orders.push(o);
  }
}

export function canDeliver(s: GameState, o: GuildOrder): boolean {
  return o.lines.every((l) => itemCount(s, l.item) >= l.qty);
}

export function deliverOrder(s: GameState, id: number, rng: Rng, emit: Emit): boolean {
  const o = s.guilds.orders.find((x) => x.id === id);
  if (!o || !canDeliver(s, o)) return false;
  for (const l of o.lines) removeItem(s, l.item, l.qty);
  earnGold(s, o.gold, emit);
  for (const l of o.lines) addXp(s, l.skill, l.xp, emit);
  const before = guildRank(s, o.guild);
  s.guilds.rep = { ...s.guilds.rep, [o.guild]: guildRep(s, o.guild) + o.rep };
  if (before >= 5) applyReward(s, GUILD_MASTER_BONUS, rng, emit);
  s.guilds.orders = s.guilds.orders.filter((x) => x.id !== id);
  s.guilds.done++;
  addStat(s, 'guildOrders');
  const after = guildRank(s, o.guild);
  emit({ type: 'guildOrder', guild: o.guild, gold: o.gold, rank: after > before ? after : 0 });
  fillOrders(s, rng);
  return true;
}

/** Throws an order away (it comes back as a new one). */
export function dropOrder(s: GameState, id: number, rng: Rng): boolean {
  if (!s.guilds.orders.some((o) => o.id === id)) return false;
  s.guilds.orders = s.guilds.orders.filter((o) => o.id !== id);
  fillOrders(s, rng);
  return true;
}

/** Orders expire over time (also offline) and new ones arrive. */
const REFILL_EVERY = 300;

registerTimeEffect('guilds', {
  next: (s) => {
    const refill = s.guilds.orders.length < guildSlots(s) ? Math.max(0, s.guilds.refill) : Infinity;
    return Math.min(refill, ...s.guilds.orders.map((o) => Math.max(0, o.left)));
  },
  apply: (s, dt, _emit, rng) => {
    const full = s.guilds.orders.length >= guildSlots(s);
    for (const o of s.guilds.orders) o.left -= dt;
    const before = s.guilds.orders.length;
    s.guilds.orders = s.guilds.orders.filter((o) => o.left > 1e-6);
    // The refill clock only runs while a slot is free; expired orders are replaced soon.
    if (!full) s.guilds.refill -= dt;
    if (s.guilds.orders.length < before) s.guilds.refill = Math.min(s.guilds.refill, 30);
    if (s.guilds.refill <= 1e-6) {
      // New orders trickle in (empty boards fill up within a few minutes, also offline).
      s.guilds.refill = REFILL_EVERY;
      fillOrders(s, rng);
    }
  },
});
