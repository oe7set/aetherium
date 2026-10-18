import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import {
  bigBang,
  buyMultiverseUpgrade,
  buyWisdomUpgrade,
  canBigBang,
  canParadigmShift,
  canRebirth,
  deserialize,
  levelCap,
  mod,
  paradigmShift,
  rebirth,
  skillLevel,
  totalLevel,
  wisdomGain,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

function strongGame() {
  const s = gameWith({
    gold: new Decimal(1e6),
    inventory: { log_oak: 500 },
    techs: ['sharp_stones'],
    research: 50,
  });
  for (const id of Object.keys(s.skills)) setLevel(s, id, 40);
  s.achievements.push('stat_treesFelled_1');
  return s;
}

describe('Wiedergeburt', () => {
  it('braucht Gesamtlevel und gibt Weisheit', () => {
    expect(canRebirth(gameWith()).ok).toBe(false);
    const s = strongGame();
    expect(canRebirth(s).ok).toBe(true);
    const gain = wisdomGain(s);
    expect(gain).toBeGreaterThanOrEqual(5);
    expect(rebirth(s, () => {})).toBe(gain);
    expect(s.prestige.wisdom).toBe(gain);
    expect(skillLevel(s, 'woodcutting')).toBe(1);
    expect(skillLevel(s, 'hitpoints')).toBe(10);
    expect(s.gold.eq(0)).toBe(true);
    expect(s.inventory).toEqual({});
    // Kept: techs, research, achievements.
    expect(s.techs).toEqual(['sharp_stones']);
    expect(s.research).toBe(50);
    expect(s.achievements).toContain('stat_treesFelled_1');
    expect(mod(s, 'xp')).toBeGreaterThanOrEqual(gain * 0.04);
    expect(wisdomGain(s)).toBe(0);
  });

  it('Ahnen-Talente formen den nächsten Start', () => {
    const s = strongGame();
    s.prestige.wisdom = 1000;
    expect(buyWisdomUpgrade(s, 'head_start')).toBe(true);
    expect(buyWisdomUpgrade(s, 'heirlooms')).toBe(true);
    expect(buyWisdomUpgrade(s, 'starting_gold')).toBe(true);
    expect(buyWisdomUpgrade(s, 'transcendence')).toBe(true);
    expect(levelCap(s)).toBe(120);
    s.ownedTools.push('axe_iron');
    rebirth(s, () => {});
    expect(skillLevel(s, 'mining')).toBe(6);
    expect(s.ownedTools).toContain('axe_iron');
    expect(s.gold.eq(1000)).toBe(true);
    expect(wisdomGain(s)).toBe(0);
  });
});

describe('Paradigmenwechsel & Urknall', () => {
  it('setzt den Tech-Baum zurück und aktiviert Naturgesetze', () => {
    const s = strongGame();
    rebirth(s, () => {});
    expect(canParadigmShift(s).ok).toBe(false);
    s.techs = Array.from(
      { length: 20 },
      (_, i) =>
        [
          'sharp_stones',
          'fire_control',
          'agriculture',
          'traps',
          'wheel',
          'writing',
          'interns',
          'proto_alchemy',
          'irrigation',
          'runes',
          'blast_furnace',
          'guilds',
          'gnomes',
          'crop_rotation',
          'chainmail',
          'printing',
          'scientific_method',
          'gunpowder',
          'optics',
          'clockwork',
        ][i]!,
    );
    expect(canParadigmShift(s).ok).toBe(true);
    expect(paradigmShift(s, ['weak_gravity', 'fast_light'], () => {})).toBe(true);
    expect(s.techs).toEqual([]);
    expect(s.prestige.laws).toEqual(['weak_gravity']); // only one slot
    expect(mod(s, 'speed.mining')).toBeCloseTo(0.5);
    expect(mod(s, 'combat.accuracy')).toBeCloseTo(-0.2);
  });

  it('Urknall gibt Splitter und setzt fast alles zurück', () => {
    const s = strongGame();
    s.prestige.paradigms = 3;
    s.prestige.wisdomTotal = 100;
    s.prestige.upgrades = { fast_hands: 2 };
    s.codex = ['H', 'He'];
    expect(canBigBang(s).ok).toBe(true);
    const shards = bigBang(s, () => {});
    expect(shards).toBeGreaterThan(0);
    expect(s.prestige.wisdomTotal).toBe(0);
    expect(s.prestige.upgrades).toEqual({});
    expect(s.codex).toEqual([]);
    expect(totalLevel(s)).toBeLessThan(40);
    s.prestige.shards = 10;
    expect(buyMultiverseUpgrade(s, 'second_law')).toBe(true);
    expect(buyMultiverseUpgrade(s, 'dark_energy')).toBe(true);
    expect(mod(s, 'speed')).toBeCloseTo(0.25);
  });
});

describe('Spielstand v4 → v5', () => {
  it('zählt bestehende XP für die erste Wiedergeburt', () => {
    const s = deserialize({
      v: 4,
      savedAt: 0,
      data: { gold: '1', skills: { mining: { xp: 5_000_000 } } },
    });
    expect(s.prestige.rebirths).toBe(0);
    expect(wisdomGain(s)).toBeGreaterThan(5);
  });
});
