import { describe, expect, it } from 'vitest';
import { getMonster } from '../src/data';
import {
  activeFamiliar,
  advance,
  collector,
  consumeItem,
  createRng,
  deserialize,
  equipItem,
  mod,
  serialize,
  startAction,
  startCombat,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

describe('Beschwörung', () => {
  it('Monster lassen Talismane fallen, Bosse nicht', () => {
    expect(getMonster('cow').loot.some((l) => l.item === 'charm_gold')).toBe(true);
    expect(getMonster('dragon').loot.some((l) => l.item === 'charm_crimson')).toBe(true);
    expect(getMonster('peer_reviewer_2').loot.some((l) => l.item.startsWith('charm_'))).toBe(false);
  });

  it('Beutel fertigen, öffnen, Vertrauter gibt Boni und geht nach Ablauf', () => {
    const s = gameWith({ inventory: { charm_green: 2, spirit_shard: 40, ore_iron: 10 } });
    setLevel(s, 'summoning', 20);
    startAction(s, 'sm_giant_mole', () => {});
    advance(s, 8, createRng(1), () => {});
    expect(s.inventory.pouch_giant_mole).toBeGreaterThanOrEqual(1);
    s.active = null;
    consumeItem(s, 'pouch_giant_mole', createRng(2), () => {});
    expect(activeFamiliar(s)?.id).toBe('giant_mole');
    expect(mod(s, 'speed.mining')).toBeGreaterThanOrEqual(0.1);
    const { emit, events } = collector();
    advance(s, 41 * 60, createRng(3), emit);
    expect(s.familiar).toBeNull();
    expect(mod(s, 'speed.mining')).toBeLessThan(0.1);
    expect(events.some((e) => e.type === 'familiarLeft')).toBe(true);
  });

  it('Kampf-Vertraute schlagen mit und alles überlebt das Laden', () => {
    const fight = (withWolf: boolean) => {
      const s = gameWith({
        inventory: { bronze_sword: 1, cooked_shark: 200, pouch_spirit_wolf: 1 },
      });
      for (const sk of ['melee', 'defence', 'hitpoints']) setLevel(s, sk, 20);
      s.hp = 20;
      equipItem(s, 'bronze_sword');
      if (withWolf) consumeItem(s, 'pouch_spirit_wolf', createRng(4), () => {});
      startCombat(s, 'monster', 'cow', () => {});
      advance(s, 600, createRng(5), () => {});
      return s;
    };
    expect(fight(true).stats.monstersKilled ?? 0).toBeGreaterThan(
      fight(false).stats.monstersKilled ?? 0,
    );
    const s = fight(true);
    const loaded = deserialize(serialize(s, 0), 0);
    expect(loaded.familiar?.id).toBe('spirit_wolf');
  });
});
