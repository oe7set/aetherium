import { describe, expect, it } from 'vitest';
import {
  advance,
  castSpell,
  dodge,
  spellAffinity,
  estimateKillTime,
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
import { getMonster, SPELL_MAP } from '../src/data';
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
    s.inventory.rune_fire = 10;
    expect(castSpell(s)?.id).toBe('fireball');
    expect(playerStats(s).maxHit).toBeGreaterThan(spark);
  });

  it('Feuerball verbraucht Grund- und Feuerrunen', () => {
    const s = mage({ rune_basic: 50, rune_fire: 20, cooked_shark: 50 });
    s.combatSettings.spell = 'fireball';
    startCombat(s, 'monster', 'cow', () => {});
    advance(s, 8, createRng(1), () => {});
    expect(s.inventory.rune_fire ?? 0).toBeLessThan(20);
    expect(s.inventory.rune_basic ?? 0).toBeLessThan(50);
  });

  it('gesperrte Zauber werden nicht gewirkt', () => {
    const s = mage({ rune_basic: 50, void_shard: 5 });
    s.combatSettings.spell = 'void_blast';
    expect(castSpell(s)?.id).toBe('spark');
  });

  it('Lebensraub heilt beim Treffen', () => {
    const s = mage({ rune_basic: 500, rune_shadow: 500, ectoplasm: 200 });
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

describe('Elemente und Wuchtschläge', () => {
  it('Frost ist gegen Feuerwesen effektiv, Feuer schwach', () => {
    expect(spellAffinity(SPELL_MAP.get('frost_lance')!, 'fire_elemental')).toBe('weak');
    expect(spellAffinity(SPELL_MAP.get('fireball')!, 'fire_elemental')).toBe('resist');
    expect(spellAffinity(SPELL_MAP.get('spark')!, 'chicken')).toBeNull();
    const s = mage({ rune_basic: 100, rune_fire: 100, rune_frost: 100 });
    const m = getMonster('fire_elemental');
    s.combatSettings.spell = 'frost_lance';
    const frost = estimateKillTime(s, m);
    s.combatSettings.spell = 'fireball';
    expect(estimateKillTime(s, m)).toBeGreaterThan(frost);
  });

  it('Monster holen aus; Ausweichen vermeidet den Schlag und lädt die Leiste', () => {
    const s = gameWith({ inventory: { cooked_shark: 100 } });
    for (const sk of ['melee', 'defence', 'hitpoints']) setLevel(s, sk, 30);
    s.hp = 30;
    startCombat(s, 'monster', 'wolf', () => {});
    const { emit, events } = collector();
    const rng = createRng(9);
    let guard = 0;
    while (!s.combat!.windup && guard++ < 2000) advance(s, 0.1, rng, emit);
    expect(s.combat!.windup).toBe(true);
    expect(events.some((e) => e.type === 'windup')).toBe(true);
    expect(dodge(s)).toBe(true);
    const hp = s.hp;
    const energy = s.combat!.energy;
    guard = 0;
    while (s.combat!.windup && guard++ < 2000) advance(s, 0.1, rng, emit);
    expect(events.some((e) => e.type === 'dodged')).toBe(true);
    expect(s.stats.dodges).toBe(1);
    expect(s.hp).toBeGreaterThanOrEqual(hp);
    expect(s.combat!.energy).toBeGreaterThan(energy);
  });
});

describe('Magie 2.0: Runen, Element-Pfeile, Element-Stäbe', () => {
  it('jedes Element hat vier Stufen, Zauber kosten Element-Runen', async () => {
    const { SPELLS, ELEMENT_RUNES } = await import('../src/data/spells');
    for (const el of Object.keys(ELEMENT_RUNES)) {
      const list = SPELLS.filter((sp) => sp.element === el);
      expect(list.map((sp) => sp.tier).sort()).toEqual([0, 1, 2, 3]);
      for (const sp of list) {
        expect(sp.cost[0]!.item).toBe('rune_basic');
        if (el !== 'arcane')
          expect(sp.cost.some((c) => c.item === ELEMENT_RUNES[el as 'fire'])).toBe(true);
      }
    }
  });

  it('Element-Pfeile nutzen Anfälligkeiten', () => {
    const shoot = (ammo: string) => {
      const s = gameWith({ inventory: { bow_oak: 1, [ammo]: 2000, cooked_shark: 500 } });
      for (const sk of ['ranged', 'defence', 'hitpoints']) setLevel(s, sk, 70);
      s.hp = 70;
      equipItem(s, 'bow_oak');
      equipItem(s, ammo);
      return estimateKillTime(s, getMonster('fire_elemental'));
    };
    // Frost arrows: weakness (+35 %) beats the slightly stronger fire arrows (resisted).
    expect(shoot('arrow_frost')).toBeLessThan(shoot('arrow_fire'));
  });

  it('Element-Stäbe verstärken ihr Element', () => {
    const s = mage({ rune_basic: 100, rune_fire: 100, staff_fire: 1 });
    s.combatSettings.spell = 'fire_strike';
    const m = getMonster('wolf');
    const plain = estimateKillTime(s, m);
    expect(equipItem(s, 'staff_fire').ok).toBe(true);
    expect(estimateKillTime(s, m)).toBeLessThan(plain);
  });
});
