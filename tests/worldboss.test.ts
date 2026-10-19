import { describe, expect, it } from 'vitest';
import { WORLD_BOSS } from '../src/data/worldboss';
import {
  advance,
  createRng,
  deserialize,
  equipItem,
  serialize,
  strikeWorldBoss,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

const noop = () => {};

function fighter() {
  const s = gameWith({ inventory: { iron_sword: 1 } });
  for (const sk of ['melee', 'defence', 'hitpoints']) setLevel(s, sk, 40);
  equipItem(s, 'iron_sword');
  return s;
}

describe('Weltbosse', () => {
  it('erscheint nach der Wartezeit erst ab Kampfstufe 10', () => {
    const weak = gameWith();
    advance(weak, 4000, createRng(1), noop);
    expect(weak.worldBoss.fight).toBeNull();
    const s = fighter();
    advance(s, s.worldBoss.next + 1, createRng(1), noop);
    expect(s.worldBoss.fight).not.toBeNull();
    expect(s.worldBoss.fight!.rates.island).toBeGreaterThan(0);
  });

  it('Insel, Dorf, Held und Schläge machen Schaden; Flucht nach Ablauf', () => {
    const s = fighter();
    s.worldBoss.next = 0;
    advance(s, 1, createRng(1), noop);
    const f = s.worldBoss.fight!;
    expect(strikeWorldBoss(s, createRng(2), noop)).toBeGreaterThan(0);
    expect(strikeWorldBoss(s, createRng(2), noop)).toBe(0);
    const back = deserialize(serialize(s, 0), 0);
    expect(back.worldBoss.fight?.boss).toBe(f.boss);
    f.maxHp = f.hp = 1e9;
    advance(s, WORLD_BOSS.duration + 5, createRng(3), noop);
    expect(s.worldBoss.fight).toBeNull();
    expect(s.worldBoss.history[0]!.won).toBe(false);
    expect(s.worldBoss.kills).toBe(0);
  });

  it('ein Sieg zählt und bringt Beute', () => {
    const s = fighter();
    s.worldBoss.next = 0;
    advance(s, 1, createRng(1), noop);
    s.worldBoss.fight!.hp = 10;
    advance(s, 60, createRng(1), noop);
    expect(s.worldBoss.kills).toBe(1);
    expect(s.inventory.imprint_stone).toBe(1);
    expect(s.worldBoss.next).toBeGreaterThan(WORLD_BOSS.interval - 120);
  });
});
