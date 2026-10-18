import { describe, expect, it } from 'vitest';
import { getMonster } from '../src/data';
import {
  advance,
  applyOfflineProgress,
  collector,
  combatLevel,
  createRng,
  deserialize,
  equipItem,
  hitChance,
  maxHp,
  playerStats,
  simulate,
  startAction,
  startCombat,
  unequip,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

describe('Kampfwerte', () => {
  it('Startwerte wie in alten MMOs', () => {
    const s = gameWith();
    expect(maxHp(s)).toBe(10);
    expect(combatLevel(s)).toBe(3);
    expect(playerStats(s).maxHit).toBe(1);
  });

  it('Trefferchance steigt mit Angriff und sinkt mit Verteidigung', () => {
    expect(hitChance(1000, 500)).toBeGreaterThan(hitChance(500, 500));
    expect(hitChance(500, 1000)).toBeLessThan(0.3);
    expect(hitChance(500, 500)).toBeCloseTo(0.5, 2);
  });

  it('Ausrüstung erhöht die Werte und kann wieder abgelegt werden', () => {
    const s = gameWith({ inventory: { bronze_sword: 1, bronze_helm: 1 } });
    const before = playerStats(s);
    expect(equipItem(s, 'bronze_sword').ok).toBe(true);
    expect(equipItem(s, 'bronze_helm').ok).toBe(true);
    const after = playerStats(s);
    expect(after.accuracy).toBeGreaterThan(before.accuracy);
    expect(after.defenceRating).toBeGreaterThan(before.defenceRating);
    expect(s.inventory.bronze_sword).toBeUndefined();
    expect(unequip(s, 'weapon').ok).toBe(true);
    expect(s.inventory.bronze_sword).toBe(1);
  });

  it('verweigert zu schwere Ausrüstung', () => {
    const s = gameWith({ inventory: { rune_sword: 1 } });
    expect(equipItem(s, 'rune_sword')).toEqual({ ok: false, reason: 'level' });
  });
});

describe('Kampf', () => {
  it('besiegt Hühner, bekommt Beute und XP', () => {
    const s = gameWith();
    startCombat(s, 'monster', 'chicken', () => {});
    const { emit, events } = collector();
    advance(s, 120, createRng(1), emit);
    expect(s.stats.monstersKilled).toBeGreaterThan(3);
    expect(s.inventory.feather).toBeGreaterThan(5);
    expect(s.skills.melee!.xp).toBeGreaterThan(0);
    expect(s.skills.hitpoints!.xp).toBeGreaterThan(1154);
    expect(events.some((e) => e.type === 'monsterKilled')).toBe(true);
  });

  it('isst automatisch und stirbt ohne Essen', () => {
    const fed = gameWith({ inventory: { cooked_shark: 50 } });
    startCombat(fed, 'monster', 'wolf', () => {});
    advance(fed, 300, createRng(2), () => {});
    expect(fed.stats.foodEaten).toBeGreaterThan(0);

    const hungry = gameWith();
    startCombat(hungry, 'monster', 'dragon', () => {});
    const { emit, events } = collector();
    advance(hungry, 300, createRng(2), emit);
    expect(events.some((e) => e.type === 'playerDied')).toBe(true);
    expect(hungry.combat).toBeNull();
    expect(hungry.hp).toBe(10);
    expect(hungry.stats.deaths).toBe(1);
  });

  it('Fernkampf verbraucht Pfeile und stoppt ohne', () => {
    const s = gameWith({ inventory: { bow_oak: 1, arrow_bronze: 5 } });
    equipItem(s, 'bow_oak');
    equipItem(s, 'arrow_bronze');
    startCombat(s, 'monster', 'chicken', () => {});
    const { emit, events } = collector();
    advance(s, 120, createRng(3), emit);
    expect(s.inventory.arrow_bronze).toBeUndefined();
    expect(events.some((e) => e.type === 'combatStopped' && e.reason === 'noAmmo')).toBe(true);
    expect(s.skills.ranged!.xp).toBeGreaterThan(0);
  });

  it('Boss wechselt Phasen und Dungeon wird abgeschlossen', () => {
    const s = gameWith({ inventory: { cooked_shark: 2000 } });
    for (const sk of ['melee', 'defence', 'hitpoints']) setLevel(s, sk, 99);
    s.hp = 99;
    s.inventory.rune_sword = 1;
    equipItem(s, 'rune_sword');
    startCombat(s, 'dungeon', 'rejection_archive', () => {});
    const { emit, events } = collector();
    advance(s, 3600, createRng(5), emit);
    expect(events.some((e) => e.type === 'bossPhase' && e.phase === 1)).toBe(true);
    expect(s.stats.dungeonsCompleted).toBeGreaterThan(0);
    expect(s.stats['kills.peer_reviewer_2']).toBeGreaterThan(0);
    expect(s.inventory.dungeon_chest).toBeGreaterThan(0);
  });

  it('Skilling beendet den Kampf und umgekehrt', () => {
    const s = gameWith();
    startCombat(s, 'monster', 'chicken', () => {});
    startAction(s, 'wc_oak', () => {});
    expect(s.combat).toBeNull();
    startCombat(s, 'monster', 'cow', () => {});
    expect(s.active).toBeNull();
  });

  it('Kampf läuft offline identisch weiter', () => {
    const a = gameWith({ lastUpdate: 0 });
    const b = gameWith({ lastUpdate: 0 });
    startCombat(a, 'monster', 'cow', () => {});
    startCombat(b, 'monster', 'cow', () => {});
    applyOfflineProgress(a, 600_000, createRng(8));
    simulate(b, 600, createRng(8));
    expect(a.stats.monstersKilled).toBe(b.stats.monstersKilled);
    expect(a.inventory).toEqual(b.inventory);
  });

  it('Monsterwerte sind sinnvoll', () => {
    expect(getMonster('peer_reviewer_2').phases?.length).toBe(3);
  });
});

describe('Spielstand v2 → v3', () => {
  it('gibt bestehenden Spielern 10 Lebenspunkte', () => {
    const s = deserialize({
      v: 2,
      savedAt: 0,
      data: { gold: '1', skills: { mining: { xp: 50 } } },
    });
    expect(maxHp(s)).toBe(10);
    expect(s.combat).toBeNull();
    expect(s.equipment).toEqual({});
  });
});
