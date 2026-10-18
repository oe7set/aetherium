import { describe, expect, it } from 'vitest';
import { BASE_STATS, RIFT_WEAPONS } from '../src/data/rift';
import {
  advance,
  biomeUnlocked,
  buyRiftTalent,
  createRng,
  deserialize,
  essenceFor,
  finishRun,
  heroUnlocked,
  itemCount,
  mod,
  prepareRun,
  rebirth,
  runStats,
  serialize,
  weaponPool,
} from '../src/engine';
import {
  chooseUpgrade,
  closeChest,
  createRun,
  evolutionFor,
  runResult,
  stepRun,
  upgradeOptions,
  xpForLevel,
  type RunConfig,
  type RunState,
} from '../src/rift/sim';
import { gameWith, setLevel } from './helpers';

const noop = () => {};

function config(over: Partial<RunConfig> = {}): RunConfig {
  return {
    hero: 'farmer',
    biome: 'meadow',
    seed: 7,
    stats: { ...BASE_STATS },
    startWeaponLevel: 1,
    pool: RIFT_WEAPONS.filter((w) => !w.evolvesFrom).map((w) => w.id),
    rerolls: 0,
    skips: 0,
    banishes: 0,
    revives: 0,
    provisions: [],
    ...over,
  };
}

/** A simple kiting bot: dodge close enemies, collect gems, take the first upgrade. */
function botRun(run: RunState, seconds: number): void {
  const end = run.time + seconds;
  while (run.time < end && run.phase !== 'dead' && run.phase !== 'won') {
    let mx = 0;
    let my = 0;
    for (const e of run.enemies) {
      const dx = run.hero.x - e.x;
      const dy = run.hero.y - e.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 130 * 130) {
        mx += dx / Math.max(100, d2);
        my += dy / Math.max(100, d2);
      }
    }
    const l = Math.hypot(mx, my);
    stepRun(run, 1 / 30, l > 1e-9 ? { x: mx / l, y: my / l } : { x: 0, y: 0 });
    if (run.phase === 'levelup') chooseUpgrade(run, 0);
    if (run.phase === 'chest') closeChest(run);
  }
}

describe('Ätherriss: Simulation', () => {
  it('ist deterministisch für gleichen Seed und gleiche Eingaben', () => {
    const a = createRun(config());
    const b = createRun(config());
    botRun(a, 90);
    botRun(b, 90);
    expect(a.kills).toBe(b.kills);
    expect(a.hero.x).toBeCloseTo(b.hero.x, 6);
    expect(a.kills).toBeGreaterThan(5);
  });

  it('Level-Up bietet 3–4 Optionen und wendet die Wahl an', () => {
    const run = createRun(config());
    run.gems.push({ x: 0, y: 0, xp: xpForLevel(1), magnet: true });
    stepRun(run, 0.05, { x: 0, y: 0 });
    expect(run.phase).toBe('levelup');
    expect(run.choices.length).toBeGreaterThanOrEqual(3);
    const weaponsBefore = run.weapons.length + run.passives.length;
    const levelsBefore = run.weapons.reduce((sum, w) => sum + w.level, 0);
    chooseUpgrade(run, 0);
    expect(run.phase).toBe('playing');
    const after = run.weapons.length + run.passives.length;
    const levelsAfter = run.weapons.reduce((sum, w) => sum + w.level, 0);
    expect(
      after > weaponsBefore || levelsAfter > levelsBefore || run.passives.some((p) => p.level > 1),
    ).toBe(true);
  });

  it('Evolution: maximale Waffe + passendes Passiv + Truhe', () => {
    const run = createRun(config());
    run.weapons[0]!.level = 8;
    run.passives.push({ id: 'might', level: 1 });
    expect(evolutionFor(run, run.weapons[0]!)?.id).toBe('axe_tornado');
    run.pickups.push({ kind: 'chest', x: 0, y: 0 });
    stepRun(run, 0.05, { x: 0, y: 0 });
    expect(run.phase).toBe('chest');
    expect(run.chest?.evolved).toBe('axe_tornado');
    expect(run.weapons[0]!.id).toBe('axe_tornado');
    closeChest(run);
    expect(upgradeOptions(run).some((c) => c.kind === 'weapon' && c.id === 'axe')).toBe(false);
  });

  it('Der Prüfer erscheint nach 15 Minuten, Gegner skalieren', () => {
    const run = createRun(config({ revives: 99 }));
    run.time = 15 * 60 - 0.01;
    stepRun(run, 0.1, { x: 0, y: 0 });
    expect(run.enemies.some((e) => e.final)).toBe(true);
  });

  it('ein Bot-Lauf übersteht die erste Minute und tötet Gegner', () => {
    const run = createRun(config({ hero: 'ranger' }));
    run.weapons[0]!.id = 'arrows';
    botRun(run, 60);
    expect(run.phase === 'playing' || run.phase === 'levelup').toBe(true);
    expect(run.kills).toBeGreaterThan(10);
  });
});

describe('Ätherriss: Meta', () => {
  it('Helden, Waffen und Biome werden über das Hauptspiel freigeschaltet', () => {
    const s = gameWith();
    expect(heroUnlocked(s, 'farmer')).toBe(true);
    expect(heroUnlocked(s, 'smith')).toBe(false);
    setLevel(s, 'smithing', 15);
    expect(heroUnlocked(s, 'smith')).toBe(true);
    expect(weaponPool(s, 'farmer')).not.toContain('particle');
    s.techs.push('accelerator');
    expect(weaponPool(s, 'farmer')).toContain('particle');
    expect(biomeUnlocked(s, 'darkwood')).toBe(false);
    s.rift.best.meadow = { time: 600, kills: 1, level: 1 };
    expect(biomeUnlocked(s, 'darkwood')).toBe(true);
  });

  it('Proviant kommt aus dem Inventar, Kampfskills stärken den Helden', () => {
    const s = gameWith();
    s.inventory.cooked_rabbit = 3;
    s.rift.talents.t_provisions = 1;
    setLevel(s, 'hitpoints', 30);
    expect(runStats(s, 'farmer').maxHp).toBeGreaterThan(BASE_STATS.maxHp + 20);
    const cfg = prepareRun(s, 'farmer', 'meadow', createRng(1))!;
    expect(cfg.provisions).toHaveLength(2);
    expect(itemCount(s, 'cooked_rabbit')).toBe(1);
    expect(s.rift.runs).toBe(1);
  });

  it('Lauf-Ende gibt Essenz, Rekord, Beute; Talente kosten Essenz', () => {
    const s = gameWith();
    const run = createRun(config());
    botRun(run, 120);
    const result = { ...runResult(run), won: false };
    const expected = essenceFor(s, result);
    const reward = finishRun(s, result, createRng(3), noop);
    expect(reward.essence).toBe(expected);
    expect(s.rift.essence).toBe(expected);
    expect(s.rift.best.meadow!.time).toBeCloseTo(run.time, 3);
    expect(mod(s, 'combat.damage')).toBeGreaterThan(0);
    s.rift.essence = 1000;
    expect(buyRiftTalent(s, 't_might').ok).toBe(true);
    expect(runStats(s, 'farmer').might).toBeGreaterThan(1.04);
  });

  it('Echo-Läufe bringen Essenz im Idle', () => {
    const s = gameWith();
    s.rift.talents.t_echo = 1;
    advance(s, 1200, createRng(1), noop);
    expect(s.rift.essence).toBeGreaterThan(0);
  });

  it('überlebt Speichern, alte Spielstände und Wiedergeburt', () => {
    const s = gameWith();
    s.rift.essence = 50;
    s.rift.best.meadow = { time: 300, kills: 400, level: 20 };
    s.rift.evolutions.push('tesla');
    const loaded = deserialize(serialize(s));
    expect(loaded.rift.best.meadow!.kills).toBe(400);
    expect(loaded.rift.evolutions).toEqual(['tesla']);
    expect(deserialize({ v: 7, savedAt: 0, data: { gold: '1' } }).rift.essence).toBe(0);
    s.skills.woodcutting = { xp: 1e7 };
    rebirth(s, noop);
    expect(s.rift.essence).toBe(50);
  });
});

describe('Endlos-Riss', () => {
  it('erst nach dem ersten Sieg, kein Prüfer, Boss alle 5 Minuten, Bestzeit wird gemerkt', () => {
    const s = gameWith();
    expect(prepareRun(s, 'farmer', 'meadow', createRng(1), true)).toBeNull();
    s.rift.wins = 1;
    const cfg = prepareRun(s, 'farmer', 'meadow', createRng(1), true)!;
    expect(cfg.endless).toBe(true);
    cfg.stats.maxHp = 1e12;
    const run = createRun(cfg);
    for (let t = 0; t < 11 * 60 * 5; t++) {
      if (run.phase === 'levelup') chooseUpgrade(run, 0);
      if (run.phase === 'chest') closeChest(run);
      stepRun(run, 0.2, { x: 0, y: 0 });
    }
    expect(run.phase).toBe('playing');
    expect(run.examinerSpawned).toBe(false);
    expect(run.endlessWave).toBe(2);
    const result = runResult(run);
    expect(result.endless).toBe(true);
    finishRun(s, result, createRng(2), () => {});
    expect(s.stats.riftEndlessMinutes).toBe(Math.floor(run.time / 60));
    expect(run.time).toBeGreaterThan(10 * 60);
  }, 20000);
});
