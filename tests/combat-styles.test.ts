import { describe, expect, it } from 'vitest';
import {
  advance,
  castSpell,
  collector,
  createRng,
  deserialize,
  equipBest,
  equipItem,
  playerStats,
  serialize,
  specialAttack,
  startCombat,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

function mage(inventory: Record<string, number>) {
  const s = gameWith({ inventory: { staff_basic: 1, ...inventory } });
  for (const sk of ['magic', 'defence', 'hitpoints']) setLevel(s, sk, 60);
  s.hp = 60;
  equipItem(s, 'staff_basic');
  return s;
}

describe('Zauber', () => {
  it('stärkere Zauber treffen härter und fallen ohne Zutaten auf den Funken zurück', () => {
    const s = mage({ rune_basic: 100 });
    const spark = playerStats(s).maxHit;
    s.combatSettings.spell = 'fireball';
    expect(castSpell(s)?.id).toBe('spark');
    s.inventory.coal = 10;
    expect(castSpell(s)?.id).toBe('fireball');
    expect(playerStats(s).maxHit).toBeGreaterThan(spark);
  });

  it('Feuerball verbraucht Runen und Kohle', () => {
    const s = mage({ rune_basic: 50, coal: 5, cooked_shark: 50 });
    s.combatSettings.spell = 'fireball';
    startCombat(s, 'monster', 'cow', () => {});
    advance(s, 8, createRng(1), () => {});
    expect(s.inventory.coal ?? 0).toBeLessThan(5);
    expect(s.inventory.rune_basic ?? 0).toBeLessThan(50);
  });

  it('gesperrte Zauber werden nicht gewirkt', () => {
    const s = mage({ rune_basic: 50, void_shard: 5 });
    s.combatSettings.spell = 'void_blast';
    expect(castSpell(s)?.id).toBe('spark');
  });

  it('Lebensraub heilt beim Treffen', () => {
    const s = mage({ rune_basic: 500, ectoplasm: 200 });
    s.combatSettings.spell = 'life_drain';
    s.combatSettings.autoEat = 0;
    startCombat(s, 'monster', 'wolf', () => {});
    s.hp = 20;
    advance(s, 20, createRng(4), () => {});
    expect(s.stats.damageDealt ?? 0).toBeGreaterThan(0);
    // Without drain the wolf would only chip HP away; with it we end up higher than plain regen.
    expect(s.hp).toBeGreaterThan(20);
  });
});

describe('Spezialangriff', () => {
  it('lädt sich beim Kämpfen auf und ist nur voll einsetzbar', () => {
    const s = gameWith({ inventory: { bronze_sword: 1, cooked_shark: 50 } });
    for (const sk of ['melee', 'defence', 'hitpoints']) setLevel(s, sk, 40);
    s.hp = 40;
    equipItem(s, 'bronze_sword');
    startCombat(s, 'monster', 'cow', () => {});
    expect(specialAttack(s, createRng(1), () => {})).toBe('notReady');
    advance(s, 60, createRng(2), () => {});
    expect(s.combat!.energy).toBeGreaterThan(0);
  });

  it('Zerschmetterer trifft sicher, zählt in der Statistik und kostet die Leiste', () => {
    const s = gameWith({ inventory: { bronze_sword: 1 } });
    for (const sk of ['melee', 'defence', 'hitpoints']) setLevel(s, sk, 40);
    equipItem(s, 'bronze_sword');
    startCombat(s, 'monster', 'dragon', () => {});
    const c = s.combat!;
    c.energy = 100;
    const hp = c.monsterHp;
    const { emit, events } = collector();
    expect(specialAttack(s, createRng(3), emit)).toBe('ok');
    expect(c.monsterHp).toBeLessThan(hp);
    expect(hp - c.monsterHp).toBeGreaterThanOrEqual(Math.min(hp, playerStats(s).maxHit * 1.5 - 1));
    expect(c.energy).toBe(0);
    expect(s.stats.specialsUsed).toBe(1);
    expect(events.some((e) => e.type === 'special' && e.style === 'melee')).toBe(true);
  });

  it('Doppelschuss verbraucht zwei Pfeile', () => {
    const s = gameWith({ inventory: { bow_oak: 1, arrow_bronze: 10 } });
    setLevel(s, 'ranged', 30);
    equipItem(s, 'bow_oak');
    equipItem(s, 'arrow_bronze');
    startCombat(s, 'monster', 'dragon', () => {});
    s.combat!.energy = 100;
    specialAttack(s, createRng(5), () => {});
    expect(s.inventory.arrow_bronze).toBe(8);
  });

  it('Energie überlebt Speichern und Laden', () => {
    const s = gameWith();
    startCombat(s, 'monster', 'chicken', () => {});
    s.combat!.energy = 42;
    s.combatSettings.spell = 'gibts_nicht';
    const loaded = deserialize(serialize(s, 0), 0);
    expect(loaded.combat?.energy).toBe(42);
    expect(loaded.combatSettings.spell).toBe('spark');
  });
});

describe('Ausrüstung', () => {
  it('neue Plätze für Hände, Füße und Umhang', () => {
    const s = gameWith({
      inventory: { bronze_gloves: 1, bronze_boots: 1, leather_gloves: 1, bear_cloak: 1 },
    });
    setLevel(s, 'defence', 20);
    expect(equipItem(s, 'bronze_gloves').ok).toBe(true);
    expect(equipItem(s, 'bronze_boots').ok).toBe(true);
    expect(equipItem(s, 'bear_cloak').ok).toBe(true);
    expect(s.equipment.hands).toBe('bronze_gloves');
    expect(s.equipment.feet).toBe('bronze_boots');
    expect(s.equipment.cape).toBe('bear_cloak');
  });

  it('„Beste Rüstung anlegen" nimmt pro Platz das stärkste tragbare Teil', () => {
    const s = gameWith({
      inventory: { bronze_helm: 1, iron_helm: 1, rune_helm: 1, bronze_body: 1, iron_boots: 1 },
    });
    setLevel(s, 'defence', 20);
    expect(equipBest(s)).toBe(3);
    expect(s.equipment.head).toBe('iron_helm');
    expect(s.equipment.body).toBe('bronze_body');
    expect(s.equipment.feet).toBe('iron_boots');
    expect(s.inventory.bronze_helm).toBe(1);
    expect(equipBest(s)).toBe(0);
  });

  it('Stil-Boni wirken nur für ihren Stil', () => {
    const s = gameWith({ inventory: { bow_oak: 1, leather_gloves: 1, bronze_sword: 1 } });
    setLevel(s, 'ranged', 10);
    setLevel(s, 'defence', 10);
    equipItem(s, 'bow_oak');
    const before = playerStats(s).accuracy;
    equipItem(s, 'leather_gloves');
    expect(playerStats(s).accuracy).toBeGreaterThan(before);
    equipItem(s, 'bronze_sword');
    const melee = playerStats(s).accuracy;
    // Gloves stay on, but their ranged bonus no longer counts.
    const s2 = gameWith({ inventory: { bronze_sword: 1 } });
    setLevel(s2, 'ranged', 10);
    setLevel(s2, 'defence', 10);
    equipItem(s2, 'bronze_sword');
    s2.equipment.hands = 'leather_gloves';
    expect(melee).toBeCloseTo(playerStats(s2).accuracy);
  });
});
