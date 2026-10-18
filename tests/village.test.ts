import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import { ITEM_MAP } from '../src/data';
import { HARBOR_IMPORTS, SPEED, TROOPS, V_BUILDINGS, VILLAGE_ITEMS } from '../src/data/village';
import {
  activeVillage,
  advance,
  annexOasis,
  battle,
  buildingCost,
  canUpgradeBuilding,
  createRng,
  deserialize,
  foundVillage,
  harborExport,
  harborImport,
  instantFinish,
  mod,
  population,
  production,
  rebirth,
  runStats,
  sendRaid,
  serialize,
  startResearch,
  storageCap,
  trainTroops,
  upgradeBuilding,
  upgradeField,
  type GameState,
  invasionDefense,
  invasionTarget,
  agenda,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

const noop = () => {};

function rich(s: GameState): void {
  const v = activeVillage(s);
  v.buildings.warehouse = 20;
  v.buildings.granary = 20;
  v.res = { wood: 80000, clay: 80000, iron: 80000, crop: 80000 };
}

function finishAll(s: GameState, seconds = 3600 * 6): void {
  advance(s, seconds, createRng(1), noop);
}

describe('Dorf: Wirtschaft', () => {
  it('startet mit Hauptgebäude, 18 Feldern und produziert auch offline', () => {
    const s = gameWith();
    const v = activeVillage(s);
    expect(v.fields).toHaveLength(18);
    expect(v.buildings.main).toBe(1);
    const prod = production(s, v);
    expect(prod.crop).toBeGreaterThan(prod.wood); // 6 croplands vs 4 woodcutters
    v.res = { wood: 0, clay: 0, iron: 0, crop: 0 };
    advance(s, 3600, createRng(1), noop);
    expect(v.res.wood).toBeCloseTo(prod.wood, 0);
  });

  it('Lager begrenzen die Rohstoffe', () => {
    const s = gameWith();
    advance(s, 3600 * 100, createRng(1), noop);
    expect(activeVillage(s).res.wood).toBeLessThanOrEqual(storageCap(activeVillage(s)));
  });

  it('Felder und Gebäude werden über die Bauschleife ausgebaut', () => {
    const s = gameWith();
    const v = activeVillage(s);
    expect(upgradeField(s, v.id, 0).ok).toBe(true);
    expect(upgradeField(s, v.id, 0).ok).toBe(true); // one waiting slot
    expect(upgradeField(s, v.id, 1).ok).toBe(false); // lane full
    expect(upgradeBuilding(s, v.id, 'warehouse').ok).toBe(true);
    expect(canUpgradeBuilding(s, v, 'barracks').ok).toBe(false); // needs main 3 + rally
    finishAll(s);
    expect(v.fields[0]).toBe(2);
    expect(v.buildings.warehouse).toBe(1);
    expect(population(v)).toBeGreaterThan(2);
    expect(buildingCost('main', 5).wood).toBeGreaterThan(buildingCost('main', 1).wood);
  });

  it('Sofort fertigstellen kostet Inselgold', () => {
    const s = gameWith();
    const v = activeVillage(s);
    upgradeBuilding(s, v.id, 'main');
    expect(instantFinish(s, v.id, 'center', noop).ok).toBe(false);
    s.gold = new Decimal(1e6);
    expect(instantFinish(s, v.id, 'center', noop).ok).toBe(true);
    expect(v.buildings.main).toBe(2);
    expect(s.gold.lt(1e6)).toBe(true);
  });
});

describe('Dorf: Militär', () => {
  it('Kaserne bildet aus, Akademie erforscht, Raubzug bringt Beute', () => {
    const s = gameWith();
    const v = activeVillage(s);
    rich(s);
    Object.assign(v.buildings, { main: 5, rally: 1, barracks: 3, academy: 3, smithy: 1 });
    v.fields = v.fields.map(() => 5);
    expect(trainTroops(s, v.id, 'axe', 5).ok).toBe(false); // not researched
    expect(startResearch(s, v.id, 'axe').ok).toBe(true);
    expect(trainTroops(s, v.id, 'militia', 40).ok).toBe(true);
    finishAll(s, 3600 * 3);
    expect(s.village.researched).toContain('axe');
    expect(v.troops.militia).toBe(40);
    const target = s.village.targets
      .filter((t) => t.kind === 'camp')
      .sort((a, b) => a.level - b.level)[0]!;
    expect(sendRaid(s, v.id, target.id, { militia: 40 }).ok).toBe(true);
    expect(v.troops.militia).toBe(0);
    v.res = { wood: 0, clay: 0, iron: 0, crop: 80000 };
    finishAll(s, 3600 * 2);
    expect(s.village.reports.some((r) => r.kind === 'raid')).toBe(true);
    expect(v.troops.militia).toBeGreaterThan(30);
    expect(s.stats.villageLoot ?? 0).toBeGreaterThan(0);
  });

  it('Kampfformel: Übermacht verliert wenig', () => {
    const r = battle(1000, 100);
    expect(r.won).toBe(true);
    expect(r.attackerLoss).toBeLessThan(0.05);
    expect(battle(100, 1000).won).toBe(false);
  });

  it('Oasen lassen sich nach dem Räumen annektieren (+25 %)', () => {
    const s = gameWith();
    const v = activeVillage(s);
    v.buildings.residence = 10;
    const oasis = s.village.targets
      .filter((t) => t.kind === 'oasis')
      .sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y))[0]!;
    expect(annexOasis(s, v.id, oasis.id).ok).toBe(false);
    oasis.defense = 0;
    const before = production(s, v)[oasis.bonus!];
    expect(annexOasis(s, v.id, oasis.id).ok).toBe(true);
    expect(production(s, v)[oasis.bonus!]).toBeCloseTo(before * 1.25, 3);
  });

  it('Riss-Invasionen nach dem Schutz: Mauer und Truppen verteidigen', () => {
    const s = gameWith();
    const v = activeVillage(s);
    rich(s);
    v.troops = { militia: 400 };
    v.fields = v.fields.map(() => 8);
    v.buildings.wall = 10;
    s.village.protection = 0;
    s.village.invasionIn = 10;
    advance(s, 20, createRng(2), noop);
    expect(s.village.reports.some((r) => r.kind === 'invasion')).toBe(true);
    expect(s.village.invasionsWon).toBe(1);
    expect(s.rift.essence).toBeGreaterThan(0);
  });

  it('Hunger: ohne Getreide desertieren Truppen', () => {
    const s = gameWith();
    const v = activeVillage(s);
    v.troops = { knight: 200 };
    v.res.crop = 10;
    advance(s, 3600, createRng(1), noop);
    expect(v.troops.knight!).toBeLessThan(200);
    expect(s.village.reports.some((r) => r.kind === 'starve')).toBe(true);
  });
});

describe('Dorf: Expansion & Verflechtung', () => {
  it('Siedler + Kulturpunkte + Residenz gründen ein neues Dorf', () => {
    const s = gameWith();
    const v = activeVillage(s);
    rich(s);
    v.buildings.residence = 10;
    v.troops.settler = 3;
    const site = s.village.sites[0]!;
    expect(foundVillage(s, v.id, site.id).ok).toBe(false); // no culture points
    s.village.cp = 2000;
    expect(foundVillage(s, v.id, site.id).ok).toBe(true);
    finishAll(s, 3600 * 3);
    expect(s.village.villages).toHaveLength(2);
    expect(s.village.villages[1]!.capital).toBe(false);
  });

  it('Hafen: Inselwaren rein, Gold raus; Gebäude geben Insel- und Riss-Boni', () => {
    const s = gameWith();
    const v = activeVillage(s);
    rich(s);
    v.buildings.harbor = 1;
    v.res.wood = 0;
    s.inventory.log_oak = 100;
    expect(harborImport(s, v.id, 'wood', 50).ok).toBe(true);
    expect(v.res.wood).toBe(50 * HARBOR_IMPORTS[0]!.per);
    expect(harborExport(s, v.id, 'clay', 1000, noop).ok).toBe(true);
    expect(s.gold.gt(0)).toBe(true);
    v.buildings.sawmill = 5;
    v.buildings.smithy = 10;
    v.buildings.wall = 10;
    expect(mod(s, 'speed.woodcutting')).toBeGreaterThanOrEqual(0.05);
    expect(runStats(s, 'farmer').armor).toBeGreaterThanOrEqual(2);
  });

  it('Daten sind konsistent', () => {
    for (const h of HARBOR_IMPORTS) for (const i of h.items) expect(ITEM_MAP.has(i), i).toBe(true);
    for (const item of VILLAGE_ITEMS) expect(ITEM_MAP.has(item.id)).toBe(true);
    const ids = new Set(V_BUILDINGS.map((b) => b.id));
    for (const b of V_BUILDINGS)
      for (const key of Object.keys(b.requires))
        if (!key.startsWith('field:')) expect(ids.has(key), key).toBe(true);
    for (const t of TROOPS) expect(t.speed).toBeGreaterThan(0);
    expect(SPEED).toBeGreaterThan(0);
  });

  it('überlebt Speichern, Migration von v8 und Wiedergeburt', () => {
    const s = gameWith();
    const v = activeVillage(s);
    v.fields[3] = 4;
    v.buildings.wall = 2;
    v.troops.militia = 7;
    upgradeField(s, v.id, 5);
    const loaded = deserialize(serialize(s));
    expect(activeVillage(loaded).fields[3]).toBe(4);
    expect(activeVillage(loaded).troops.militia).toBe(7);
    expect(activeVillage(loaded).queue.field).toHaveLength(1);
    const old = deserialize({ v: 8, savedAt: 0, data: { gold: '1', colony: { match: null } } });
    expect(old.village.villages).toHaveLength(1);
    expect((old as unknown as Record<string, unknown>).colony).toBeUndefined();
    s.skills.woodcutting = { xp: 1e7 };
    rebirth(s, noop);
    expect(activeVillage(s).fields[3]).toBe(4);
  });
});

describe('Dorf: Invasionen verzahnt', () => {
  it('Riss-Talente, Held und Inselkampf stärken die Verteidigung', () => {
    const s = gameWith();
    const v = invasionTarget(s);
    const base = invasionDefense(s, v);
    expect(base.total).toBeCloseTo(base.troops + base.hero + base.riftWard + base.militia);
    setLevel(s, 'melee', 40);
    setLevel(s, 'defence', 40);
    expect(invasionDefense(s, v).militia).toBeGreaterThan(base.militia);
    v.troops = { militia: 50 };
    const troopsOnly = invasionDefense(s, v);
    s.rift.talents = { t_might: 5, t_armor: 5 };
    expect(invasionDefense(s, v).riftWard).toBeGreaterThan(troopsOnly.riftWard);
  });

  it('warnt eine halbe Stunde vorher in „Was jetzt?"', () => {
    const s = gameWith();
    s.village.protection = 0;
    s.village.invasionIn = 600;
    expect(agenda(s, Date.now()).some((i) => i.id === 'invasion')).toBe(true);
    s.village.invasionIn = 7200;
    expect(agenda(s, Date.now()).some((i) => i.id === 'invasion')).toBe(false);
  });
});
