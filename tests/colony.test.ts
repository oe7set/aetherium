import { describe, expect, it } from 'vitest';
import {
  advance,
  bankTrade,
  BOARD,
  buildBuilding,
  canPlaceRoad,
  canPlaceSettlement,
  claimMatch,
  collector,
  createRng,
  deserialize,
  generateMatch,
  importResource,
  itemCount,
  longestRoad,
  mod,
  PLAYER_INDEX,
  produce,
  rebirth,
  serialize,
  setupAuto,
  setupPlaceRoad,
  setupPlaceSettlement,
  startMatch,
  updateAwards,
  victoryPoints,
  type GameState,
} from '../src/engine';
import { COLONY_BUILDINGS, TILE_BAG, WIN_POINTS } from '../src/data/colony';
import { gameWith } from './helpers';

const noop = () => {};

function running(seed = 1): GameState {
  const s = gameWith();
  const rng = createRng(seed);
  startMatch(s, rng, noop);
  while (s.colony.match!.phase === 'setup') setupAuto(s, noop);
  return s;
}

describe('Kolonie: Spielbrett', () => {
  it('hat 19 Felder, 54 Ecken, 72 Kanten', () => {
    expect(BOARD.hexes).toHaveLength(19);
    expect(BOARD.vertices).toHaveLength(54);
    expect(BOARD.edges).toHaveLength(72);
    expect(BOARD.coast).toHaveLength(30);
  });

  it('erzeugt reproduzierbare Partien mit kompletter Felder- und Zahlenverteilung', () => {
    const a = generateMatch(42, ['you', 'gnomes', 'paladin', 'expansion']);
    const b = generateMatch(42, ['you', 'gnomes', 'paladin', 'expansion']);
    expect(a.terrain).toEqual(b.terrain);
    expect([...a.terrain].sort()).toEqual([...TILE_BAG].sort());
    expect(a.numbers.filter((n) => n === null)).toHaveLength(1);
    expect(a.numbers[a.terrain.indexOf('desert')]).toBeNull();
    expect(a.robber).toBe(a.terrain.indexOf('desert'));
    expect(a.harbors).toHaveLength(9);
  });
});

describe('Kolonie: Regeln', () => {
  it('erzwingt die Abstandsregel und Straßenanbindung', () => {
    const m = generateMatch(3, ['you', 'gnomes', 'paladin', 'expansion']);
    m.players[0]!.settlements.push(0);
    const neighbour = BOARD.vertices[0]!.neighbors[0]!;
    expect(canPlaceSettlement(m, 1, neighbour, true)).toBe(false);
    // Outside the setup a settlement needs an own road.
    const far = BOARD.vertices.find((v) => canPlaceSettlement(m, 0, v.id, true))!;
    expect(canPlaceSettlement(m, 0, far.id)).toBe(false);
    const edge = BOARD.vertices[0]!.edges[0]!;
    expect(canPlaceRoad(m, 0, edge)).toBe(true);
    expect(canPlaceRoad(m, 1, edge)).toBe(false);
  });

  it('Städte produzieren doppelt, der Räuber blockiert', () => {
    const m = generateMatch(5, ['you', 'gnomes', 'paladin', 'expansion']);
    const hex = m.numbers.findIndex((n) => n === 6);
    const v = BOARD.vertices.find((x) => x.hexes.includes(hex))!;
    m.players[0]!.cities.push(v.id);
    const res = m.terrain[hex] as 'wood';
    const before = m.players[0]!.res[res];
    produce(m, 6);
    expect(m.players[0]!.res[res]).toBeGreaterThanOrEqual(before + 2);
    m.robber = hex;
    const mid = m.players[0]!.res[res];
    produce(m, 6);
    // Other 6-hexes may still produce, but never the robbed one; with only one 6-hex at v the count holds.
    expect(m.players[0]!.res[res]).toBeLessThanOrEqual(
      mid + v.hexes.filter((h) => h !== hex && m.numbers[h] === 6).length * 2,
    );
  });

  it('berechnet die längste Handelsstraße und vergibt sie ab 5', () => {
    const m = generateMatch(7, ['you', 'gnomes', 'paladin', 'expansion']);
    // Walk a simple path of 5 edges.
    let v = 0;
    const used = new Set<number>();
    for (let i = 0; i < 5; i++) {
      const e = BOARD.vertices[v]!.edges.find((x) => !used.has(x))!;
      used.add(e);
      m.players[0]!.roads.push(e);
      const edge = BOARD.edges[e]!;
      v = edge.a === v ? edge.b : edge.a;
    }
    expect(longestRoad(m, 0)).toBe(5);
    updateAwards(m);
    expect(m.longestRoad).toBe(0);
    expect(victoryPoints(m, 0)).toBe(2);
  });
});

describe('Kolonie: Partie', () => {
  it('Aufbau in Schlangenreihenfolge: der Spieler setzt per Tipp', () => {
    const s = gameWith();
    startMatch(s, createRng(9), noop);
    const m = s.colony.match!;
    expect(m.phase).toBe('setup');
    expect(m.setupQueue[0]).toBe(PLAYER_INDEX);
    const spot = BOARD.vertices.find((v) => canPlaceSettlement(m, 0, v.id, true))!.id;
    expect(setupPlaceSettlement(s, spot).ok).toBe(true);
    expect(setupPlaceRoad(s, BOARD.vertices[spot]!.edges[0]!, noop).ok).toBe(true);
    // The three AIs placed twice in a row (snake), now it is our second turn.
    expect(m.setupQueue).toEqual([PLAYER_INDEX]);
    expect(m.players.slice(1).every((p) => p.settlements.length === 2)).toBe(true);
    setupAuto(s, noop);
    expect(m.phase).toBe('running');
    expect(m.players[0]!.settlements).toHaveLength(2);
  });

  it('würfelt über die Zeit (auch offline) und endet mit einem Sieger', () => {
    const s = running(11);
    const rng = createRng(11);
    const { emit, events } = collector();
    for (let i = 0; i < 400 && s.colony.match!.phase === 'running'; i++) advance(s, 30, rng, emit);
    const m = s.colony.match!;
    expect(m.rolls).toBeGreaterThan(10);
    expect(events.some((e) => e.type === 'colonyRoll')).toBe(true);
    expect(m.phase).toBe('finished');
    expect(victoryPoints(m, m.winner!)).toBeGreaterThanOrEqual(WIN_POINTS);
    claimMatch(s, noop);
    expect(s.colony.match).toBeNull();
    expect(s.colony.fame).toBeGreaterThan(0);
    expect(mod(s, 'xp')).toBeGreaterThan(0);
  });

  it('Verwalter spielt komplett automatisch weiter', () => {
    const s = gameWith();
    s.colony.talents.steward = 1;
    const rng = createRng(4);
    startMatch(s, rng, noop);
    expect(s.colony.match!.phase).toBe('running');
    for (let i = 0; i < 120; i++) advance(s, 60, rng, noop);
    expect(s.colony.matches).toBeGreaterThan(1);
    expect(s.colony.fameTotal).toBeGreaterThan(0);
  });

  it('Bank-Tausch 4:1, Import von Inselwaren, Siedler-Gebäude erzeugen Waren', () => {
    const s = running(2);
    const m = s.colony.match!;
    const p = m.players[0]!;
    p.res = { wood: 4, brick: 0, wool: 0, grain: 0, ore: 0 };
    expect(bankTrade(s, 'wood', 'ore').ok).toBe(true);
    expect(p.res.ore).toBe(1);
    s.inventory.wheat = 8;
    expect(importResource(s, 'grain').ok).toBe(true);
    expect(p.res.grain).toBe(1);
    expect(itemCount(s, 'wheat')).toBe(0);
    p.res = { wood: 5, brick: 5, wool: 0, grain: 0, ore: 0 };
    const v = p.settlements[0]!;
    expect(buildBuilding(s, v, 'sawmill', noop).ok).toBe(true);
    expect(buildBuilding(s, v, 'sawmill', noop).ok).toBe(false); // settlement: one slot
    expect(mod(s, 'speed.woodcutting')).toBeGreaterThan(0);
    const rng = createRng(1);
    advance(s, s.colony.nextRoll + 0.01, rng, noop);
    expect(itemCount(s, 'colony_planks')).toBeGreaterThanOrEqual(1);
    expect(COLONY_BUILDINGS.length).toBeGreaterThanOrEqual(9);
  });

  it('überlebt Speichern/Laden und Wiedergeburt', () => {
    const s = running(6);
    s.colony.fame = 12;
    const loaded = deserialize(serialize(s));
    expect(loaded.colony.match!.terrain).toEqual(s.colony.match!.terrain);
    expect(loaded.colony.match!.players[0]!.settlements).toEqual(
      s.colony.match!.players[0]!.settlements,
    );
    expect(loaded.colony.fame).toBe(12);
    // Old saves (v6) get an empty colony.
    const old = deserialize({ v: 6, savedAt: 0, data: { gold: '1' } });
    expect(old.colony.match).toBeNull();
    s.skills.woodcutting = { xp: 1e7 };
    rebirth(s, noop);
    expect(s.colony.fame).toBe(12);
    expect(s.colony.match).not.toBeNull();
  });
});
