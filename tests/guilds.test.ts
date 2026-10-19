import { describe, expect, it } from 'vitest';
import { GUILD } from '../src/data/guilds';
import {
  advance,
  canDeliver,
  createRng,
  deliverOrder,
  deserialize,
  fillOrders,
  guildRank,
  serialize,
} from '../src/engine';
import { skillLinks } from '../src/ui/recipes';
import { gameWith } from './helpers';

describe('Zunftaufträge', () => {
  it('das Brett füllt sich mit Aufträgen über mehrere Skills', () => {
    const s = gameWith();
    advance(s, 600, createRng(1), () => {});
    expect(s.guilds.orders.length).toBe(GUILD.slots);
    for (const o of s.guilds.orders) {
      expect(o.lines.length).toBeGreaterThan(0);
      expect(o.gold).toBeGreaterThan(0);
    }
    // Survives saving.
    const back = deserialize(serialize(s, 0), 0);
    expect(back.guilds.orders).toEqual(s.guilds.orders);
  });

  it('Liefern zahlt Gold, XP und Ruf; Aufträge laufen ab', () => {
    const s = gameWith();
    fillOrders(s, createRng(3));
    const o = s.guilds.orders[0]!;
    for (const l of o.lines) s.inventory[l.item] = l.qty;
    expect(canDeliver(s, o)).toBe(true);
    const gold = s.gold.toNumber();
    expect(deliverOrder(s, o.id, createRng(1), () => {})).toBe(true);
    expect(s.gold.toNumber()).toBe(gold + o.gold);
    expect(s.guilds.rep[o.guild]).toBe(o.rep);
    expect(s.guilds.orders.some((x) => x.id === o.id)).toBe(false);
    s.guilds.rep[o.guild] = 3 * GUILD.repPerRank;
    expect(guildRank(s, o.guild)).toBe(3);
    advance(s, GUILD.duration + 60, createRng(2), () => {});
    expect(s.guilds.orders.every((x) => x.id !== o.id)).toBe(true);
    expect(s.guilds.orders.length).toBe(GUILD.slots + 1);
  });
});

describe('Verbindungen', () => {
  it('Kochen braucht Fischerei und liefert an andere Skills', () => {
    const links = skillLinks('cooking');
    expect(links.from.some((l) => l.skill === 'fishing')).toBe(true);
    expect(skillLinks('husbandry').to.some((l) => l.skill === 'cooking')).toBe(true);
    expect(skillLinks('fletching').from.some((l) => l.skill === 'jewelcrafting')).toBe(true);
  });
});

describe('Sonderaufträge', () => {
  it('ab Rang 5 kommen eilige Sonderaufträge mit Extra-Belohnung', () => {
    const s = gameWith();
    for (const g of ['smiths', 'kitchen', 'arcane', 'explorers']) s.guilds.rep[g] = 600;
    let special = null;
    for (let i = 0; i < 40 && !special; i++) {
      s.guilds.orders = [];
      fillOrders(s, createRng(i));
      special = s.guilds.orders.find((o) => o.special) ?? null;
    }
    expect(special).not.toBeNull();
    expect(special!.left).toBeLessThan(GUILD.duration);
    for (const l of special!.lines) s.inventory[l.item] = l.qty;
    const extra = special!.special!.item;
    const before = s.inventory[extra] ?? 0;
    expect(deliverOrder(s, special!.id, createRng(1), () => {})).toBe(true);
    expect(s.inventory[extra]).toBeGreaterThan(before);
  });
});
