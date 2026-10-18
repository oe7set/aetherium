import { describe, expect, it } from 'vitest';
import { BIOMES } from '../src/data/rift';
import {
  activeVillage,
  advance,
  assignPoints,
  autoChance,
  canStartRun,
  createRng,
  deserialize,
  dismantleItem,
  equipHeroItem,
  finishDungeon,
  gainHeroXp,
  heroStrength,
  hurtHero,
  prepareDungeon,
  reviveHero,
  rollHeroItem,
  runStats,
  sendRaid,
  serialize,
  spawnAdventure,
  startAdventure,
  type GameState,
} from '../src/engine';
import { createRun, runResult, stepRun } from '../src/rift/sim';
import { gameWith } from './helpers';

const noop = () => {};

function withAdventure(s: GameState) {
  const adv = spawnAdventure(s, createRng(3))!;
  expect(startAdventure(s, adv.id).ok).toBe(true);
  advance(s, s.hero.trip!.total + 1, createRng(1), noop);
  expect(s.hero.status).toBe('adventure');
  return adv;
}

describe('Held', () => {
  it('steigt auf, verteilt Punkte und wird stärker', () => {
    const s = gameWith();
    const before = heroStrength(s);
    gainHeroXp(s, 5000, noop);
    expect(s.hero.level).toBeGreaterThan(3);
    expect(s.hero.points).toBeGreaterThan(8);
    expect(assignPoints(s, 'power', 5).ok).toBe(true);
    expect(heroStrength(s)).toBeGreaterThan(before + 200);
    expect(runStats(s, 'farmer').might).toBeGreaterThan(1);
  });

  it('Abenteuer: hinlaufen, automatisch erkunden, heimkehren', () => {
    const s = gameWith();
    const adv = withAdventure(s);
    expect(autoChance(s, adv)).toBeGreaterThan(0);
    advance(s, 31 * 60, createRng(2), noop); // waiting too long → auto-resolve
    expect(s.hero.adventures.some((a) => a.id === adv.id)).toBe(false);
    expect(s.hero.xp + (s.hero.level - 1) * 1000).toBeGreaterThan(0);
    advance(s, 3600, createRng(2), noop);
    expect(['home', 'dead']).toContain(s.hero.status);
  });

  it('Abenteuer als Echtzeit-Dungeon: Wächter am Ende, Belohnung beim Sieg', () => {
    const s = gameWith();
    withAdventure(s);
    const cfg = prepareDungeon(s, createRng(5))!;
    expect(cfg.mode).toBe('dungeon');
    expect(cfg.minutes).toBeLessThan(10);
    const run = createRun({ ...cfg, revives: 99 });
    run.time = cfg.minutes! * 60 - 0.01;
    stepRun(run, 0.1, { x: 0, y: 0 });
    const guardian = run.enemies.find((e) => e.final)!;
    expect(guardian.def.id).toBe(BIOMES.find((b) => b.id === cfg.biome)!.bosses[1]!.id);
    const reward = finishDungeon(
      s,
      { ...runResult(run), won: true, kills: 500 },
      createRng(1),
      noop,
    )!;
    expect(reward.success).toBe(true);
    expect(reward.xp).toBeGreaterThan(0);
    expect(s.hero.status).toBe('moving');
  });

  it('fällt bei 0 Gesundheit, Riss gesperrt, Wiederbelebung kostet Rohstoffe oder Zeit', () => {
    const s = gameWith();
    hurtHero(s, 200, noop);
    expect(s.hero.status).toBe('dead');
    expect(canStartRun(s, 'farmer', 'meadow').ok).toBe(false);
    expect(reviveHero(s).ok).toBe(true);
    advance(s, 3600, createRng(1), noop);
    expect(s.hero.status).toBe('home');
    hurtHero(s, 200, noop);
    activeVillage(s).res = { wood: 0, clay: 0, iron: 0, crop: 0 };
    advance(s, 4 * 3600 + 10, createRng(1), noop);
    expect(s.hero.status).toBe('home');
    expect(s.hero.health).toBe(100);
  });

  it('Ausrüstung wirkt im Riss und lässt sich zu Essenz zerlegen', () => {
    const s = gameWith();
    s.hero.bag = [
      { uid: 1, base: 'weapon_blade', tier: 2 },
      { uid: 2, base: 'boots_swift', tier: 1 },
    ];
    s.hero.nextUid = 3;
    const item = s.hero.bag[0]!;
    const before = runStats(s, 'farmer').might;
    expect(equipHeroItem(s, item.uid).ok).toBe(true);
    expect(runStats(s, 'farmer').might).toBeGreaterThan(before);
    expect(dismantleItem(s, item.uid).ok).toBe(false); // equipped
    const spare = s.hero.bag.find((i) => i.uid !== item.uid)!;
    expect(dismantleItem(s, spare.uid).ok).toBe(true);
    expect(s.rift.essence).toBeGreaterThan(0);
  });

  it('begleitet Raubzüge (Kampfkraft + XP) und hält Oasen nur, wenn er daheim ist', () => {
    const s = gameWith();
    const v = activeVillage(s);
    v.buildings.rally = 1;
    const camp = s.village.targets
      .filter((t) => t.kind === 'camp')
      .sort((a, b) => a.level - b.level)[0]!;
    expect(sendRaid(s, v.id, camp.id, {}, true).ok).toBe(true);
    expect(s.hero.status).toBe('raid');
    advance(s, 3 * 3600, createRng(1), noop);
    expect(s.hero.status).toBe('home');
    expect(s.hero.xp > 0 || s.hero.level > 1).toBe(true);
  });

  it('überlebt Speichern und Laden', () => {
    const s = gameWith();
    s.hero.name = 'Hildegard';
    gainHeroXp(s, 2000, noop);
    rollHeroItem(s, createRng(1), 5, false);
    equipHeroItem(s, s.hero.bag[0]!.uid);
    const loaded = deserialize(serialize(s));
    expect(loaded.hero.name).toBe('Hildegard');
    expect(loaded.hero.level).toBe(s.hero.level);
    expect(Object.values(loaded.hero.equipped)).toContain(s.hero.bag[0]!.uid);
  });
});
