import {
  COSTS,
  DEV_DECK,
  HAND_LIMIT,
  HARBOR_BAG,
  LIMITS,
  NUMBER_BAG,
  pips,
  RESOURCES,
  TILE_BAG,
  type Cost,
  type Resource,
} from '../../data/colony';
import { createRng, type Rng } from '../rng';
import type { ColonyMatch, ColonyPlayer, ColonyRes } from '../state';
import { BOARD, hexNeighbors } from './board';

// Pure Catan rules on a ColonyMatch. No knowledge of the island game.

export const PLAYER_INDEX = 0;

export function emptyRes(): ColonyRes {
  return { wood: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
}

function shuffle<T>(list: T[], rng: Rng): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Generates a fresh board. 6 and 8 are kept apart where possible (re-rolls a few times). */
export function generateMatch(seed: number, personas: string[]): ColonyMatch {
  const rng = createRng(seed);
  const terrain = shuffle(TILE_BAG, rng);
  let numbers: (number | null)[] = [];
  for (let attempt = 0; attempt < 40; attempt++) {
    const bag = shuffle(NUMBER_BAG, rng);
    numbers = terrain.map((t) => (t === 'desert' ? null : bag.pop()!));
    const hot = (i: number) => numbers[i] === 6 || numbers[i] === 8;
    const clash = numbers.some((_, i) => hot(i) && hexNeighbors(i).some(hot));
    if (!clash) break;
  }
  const coast = BOARD.coast;
  const step = coast.length / HARBOR_BAG.length;
  const kinds = shuffle(HARBOR_BAG, rng);
  const harbors = kinds.map((kind, i) => ({
    edge: coast[Math.floor(i * step + step / 2) % coast.length]!,
    kind,
  }));
  const players: ColonyPlayer[] = personas.map((persona) => ({
    persona,
    res: emptyRes(),
    settlements: [],
    cities: [],
    roads: [],
    devHand: [],
    knights: 0,
    victoryCards: 0,
  }));
  const n = players.length;
  const order = Array.from({ length: n }, (_, i) => i);
  return {
    seed,
    terrain,
    numbers,
    harbors,
    robber: terrain.indexOf('desert'),
    players,
    deck: shuffle(DEV_DECK, rng),
    phase: 'setup',
    setupQueue: [...order, ...[...order].reverse()],
    setupVertex: null,
    rolls: 0,
    lastRoll: null,
    turn: 0,
    longestRoad: null,
    largestArmy: null,
    offers: [],
    winner: null,
    buildings: {},
    freeRoads: 0,
    robberMode: false,
  };
}

// --- Ownership ---------------------------------------------------------------------------------------

export function vertexOwner(m: ColonyMatch, v: number): number | null {
  for (let i = 0; i < m.players.length; i++) {
    const p = m.players[i]!;
    if (p.settlements.includes(v) || p.cities.includes(v)) return i;
  }
  return null;
}

export function edgeOwner(m: ColonyMatch, e: number): number | null {
  for (let i = 0; i < m.players.length; i++) if (m.players[i]!.roads.includes(e)) return i;
  return null;
}

// --- Resources ---------------------------------------------------------------------------------------

export function canAfford(p: ColonyPlayer, cost: Cost): boolean {
  return RESOURCES.every((r) => p.res[r] >= (cost[r] ?? 0));
}

export function pay(p: ColonyPlayer, cost: Cost): void {
  for (const r of RESOURCES) p.res[r] -= cost[r] ?? 0;
}

export function handSize(p: ColonyPlayer): number {
  return RESOURCES.reduce((sum, r) => sum + p.res[r], 0);
}

/** What a cost is still missing. */
export function missing(p: ColonyPlayer, cost: Cost): Partial<ColonyRes> {
  const out: Partial<ColonyRes> = {};
  for (const r of RESOURCES) {
    const need = (cost[r] ?? 0) - p.res[r];
    if (need > 0) out[r] = need;
  }
  return out;
}

// --- Placement rules ---------------------------------------------------------------------------------

export function canPlaceSettlement(m: ColonyMatch, pi: number, v: number, setup = false): boolean {
  const vert = BOARD.vertices[v];
  if (!vert || vertexOwner(m, v) !== null) return false;
  if (vert.neighbors.some((n) => vertexOwner(m, n) !== null)) return false;
  const p = m.players[pi]!;
  if (!setup) {
    if (p.settlements.length >= LIMITS.settlements) return false;
    if (!vert.edges.some((e) => p.roads.includes(e))) return false;
  }
  return true;
}

export function canPlaceRoad(
  m: ColonyMatch,
  pi: number,
  e: number,
  setupVertex: number | null = null,
): boolean {
  const edge = BOARD.edges[e];
  if (!edge || edgeOwner(m, e) !== null) return false;
  const p = m.players[pi]!;
  if (p.roads.length >= LIMITS.roads) return false;
  if (setupVertex !== null) return edge.a === setupVertex || edge.b === setupVertex;
  return [edge.a, edge.b].some((v) => {
    const owner = vertexOwner(m, v);
    if (owner === pi) return true;
    if (owner !== null) return false; // blocked by an opponent building
    return BOARD.vertices[v]!.edges.some((oe) => oe !== e && p.roads.includes(oe));
  });
}

export function canPlaceCity(m: ColonyMatch, pi: number, v: number): boolean {
  const p = m.players[pi]!;
  return p.settlements.includes(v) && p.cities.length < LIMITS.cities;
}

export function legalSettlementSpots(m: ColonyMatch, pi: number, setup = false): number[] {
  return BOARD.vertices.filter((v) => canPlaceSettlement(m, pi, v.id, setup)).map((v) => v.id);
}

export function legalRoads(
  m: ColonyMatch,
  pi: number,
  setupVertex: number | null = null,
): number[] {
  return BOARD.edges.filter((e) => canPlaceRoad(m, pi, e.id, setupVertex)).map((e) => e.id);
}

/** Value of a vertex for settling: sum of pips plus a bonus for resource variety. */
export function vertexScore(m: ColonyMatch, v: number, prefer: Resource[] = []): number {
  const vert = BOARD.vertices[v]!;
  const kinds = new Set<string>();
  let score = 0;
  for (const h of vert.hexes) {
    const t = m.terrain[h]!;
    const n = m.numbers[h];
    if (t === 'desert' || n == null) continue;
    kinds.add(t);
    score += pips(n) * (prefer.includes(t as Resource) ? 1.3 : 1);
  }
  const harbor = m.harbors.find((hb) => {
    const e = BOARD.edges[hb.edge]!;
    return e.a === v || e.b === v;
  });
  return score + kinds.size * 1.2 + (harbor ? 1.5 : 0);
}

// --- Production -------------------------------------------------------------------------------------

/** Distributes resources for a roll. Returns what each player gained. */
export function produce(m: ColonyMatch, roll: number): ColonyRes[] {
  const gains = m.players.map(() => emptyRes());
  m.terrain.forEach((t, hi) => {
    if (t === 'desert' || m.numbers[hi] !== roll || m.robber === hi) return;
    const res = t as Resource;
    for (const v of BOARD.vertices) {
      if (!v.hexes.includes(hi)) continue;
      const owner = vertexOwner(m, v.id);
      if (owner === null) continue;
      const amount = m.players[owner]!.cities.includes(v.id) ? 2 : 1;
      m.players[owner]!.res[res] += amount;
      gains[owner]![res] += amount;
    }
  });
  return gains;
}

/** Starting resources from the second setup settlement. */
export function grantSetupResources(m: ColonyMatch, pi: number, v: number): void {
  for (const h of BOARD.vertices[v]!.hexes) {
    const t = m.terrain[h]!;
    if (t !== 'desert') m.players[pi]!.res[t as Resource] += 1;
  }
}

/** Robber discard: players above their hand limit lose half (largest stacks first). */
export function robberDiscard(m: ColonyMatch, limits: number[]): number[] {
  return m.players.map((p, i) => {
    const total = handSize(p);
    if (total <= (limits[i] ?? HAND_LIMIT)) return 0;
    let toLose = Math.floor(total / 2);
    const lost = toLose;
    while (toLose > 0) {
      const most = [...RESOURCES].sort((a, b) => p.res[b] - p.res[a])[0]!;
      p.res[most]--;
      toLose--;
    }
    return lost;
  });
}

/** Moves the robber and steals one random card from a player adjacent to the hex. */
export function moveRobber(
  m: ColonyMatch,
  thief: number,
  hex: number,
  rng: Rng,
): { victim: number | null; res: Resource | null } {
  m.robber = hex;
  const victims = new Set<number>();
  for (const v of BOARD.vertices) {
    if (!v.hexes.includes(hex)) continue;
    const owner = vertexOwner(m, v.id);
    if (owner !== null && owner !== thief && handSize(m.players[owner]!) > 0) victims.add(owner);
  }
  const list = [...victims];
  if (!list.length) return { victim: null, res: null };
  const victim = list[Math.floor(rng() * list.length)]!;
  const vp = m.players[victim]!;
  const pool = RESOURCES.flatMap((r) => Array<Resource>(vp.res[r]).fill(r));
  const res = pool[Math.floor(rng() * pool.length)]!;
  vp.res[res]--;
  m.players[thief]!.res[res]++;
  return { victim, res };
}

/** Best robber hex against a given target: their highest-pip producing hex. */
export function robberTarget(m: ColonyMatch, against: number, avoid: number): number {
  let best = m.robber;
  let bestScore = -1;
  m.terrain.forEach((t, hi) => {
    if (t === 'desert' || hi === m.robber) return;
    let score = 0;
    for (const v of BOARD.vertices) {
      if (!v.hexes.includes(hi)) continue;
      const owner = vertexOwner(m, v.id);
      const weight = m.players[owner ?? -1]?.cities.includes(v.id) ? 2 : 1;
      if (owner === against) score += pips(m.numbers[hi] ?? 7) * weight;
      if (owner === avoid) score -= 10;
    }
    if (score > bestScore) {
      bestScore = score;
      best = hi;
    }
  });
  return best;
}

// --- Trading ------------------------------------------------------------------------------------------

/** Bank rate for giving `res`: 4, 3 with a generic harbor (or Hafenkontor), 2 with a matching harbor. */
export function tradeRate(m: ColonyMatch, pi: number, res: Resource, office = false): number {
  const p = m.players[pi]!;
  const own = new Set([...p.settlements, ...p.cities]);
  let rate = office ? 3 : 4;
  for (const hb of m.harbors) {
    const e = BOARD.edges[hb.edge]!;
    if (!own.has(e.a) && !own.has(e.b)) continue;
    if (hb.kind === res) rate = Math.min(rate, 2);
    else if (hb.kind === 'any') rate = Math.min(rate, 3);
  }
  return rate;
}

// --- Victory points & awards ------------------------------------------------------------------------

/** Longest continuous road (edges), interrupted by opponents' buildings. */
export function longestRoad(m: ColonyMatch, pi: number): number {
  const p = m.players[pi]!;
  const own = new Set(p.roads);
  let best = 0;
  const dfs = (v: number, used: Set<number>, length: number) => {
    best = Math.max(best, length);
    const owner = vertexOwner(m, v);
    if (length > 0 && owner !== null && owner !== pi) return;
    for (const e of BOARD.vertices[v]!.edges) {
      if (!own.has(e) || used.has(e)) continue;
      const edge = BOARD.edges[e]!;
      used.add(e);
      dfs(edge.a === v ? edge.b : edge.a, used, length + 1);
      used.delete(e);
    }
  };
  for (const e of p.roads) {
    const edge = BOARD.edges[e]!;
    dfs(edge.a, new Set(), 0);
    dfs(edge.b, new Set(), 0);
  }
  return best;
}

export function updateAwards(m: ColonyMatch): void {
  const roads = m.players.map((_, i) => longestRoad(m, i));
  const holderRoad = m.longestRoad;
  let roadBest = holderRoad !== null ? roads[holderRoad]! : 4;
  roads.forEach((len, i) => {
    if (len >= 5 && len > roadBest) {
      roadBest = len;
      m.longestRoad = i;
    }
  });
  if (holderRoad !== null && roads[holderRoad]! < 5) m.longestRoad = null;
  const holderArmy = m.largestArmy;
  let armyBest = holderArmy !== null ? m.players[holderArmy]!.knights : 2;
  m.players.forEach((p, i) => {
    if (p.knights >= 3 && p.knights > armyBest) {
      armyBest = p.knights;
      m.largestArmy = i;
    }
  });
}

export function victoryPoints(m: ColonyMatch, pi: number, includeHidden = true): number {
  const p = m.players[pi]!;
  return (
    p.settlements.length +
    p.cities.length * 2 +
    (m.longestRoad === pi ? 2 : 0) +
    (m.largestArmy === pi ? 2 : 0) +
    (includeHidden ? p.victoryCards : 0)
  );
}

// --- Building -------------------------------------------------------------------------------------------

export function buildSettlement(m: ColonyMatch, pi: number, v: number, setup = false): boolean {
  const p = m.players[pi]!;
  if (!canPlaceSettlement(m, pi, v, setup)) return false;
  if (!setup) {
    if (!canAfford(p, COSTS.settlement)) return false;
    pay(p, COSTS.settlement);
  }
  p.settlements.push(v);
  return true;
}

export function buildRoad(
  m: ColonyMatch,
  pi: number,
  e: number,
  free = false,
  setupVertex: number | null = null,
): boolean {
  const p = m.players[pi]!;
  if (!canPlaceRoad(m, pi, e, setupVertex)) return false;
  if (!free) {
    if (!canAfford(p, COSTS.road)) return false;
    pay(p, COSTS.road);
  }
  p.roads.push(e);
  return true;
}

export function buildCity(m: ColonyMatch, pi: number, v: number): boolean {
  const p = m.players[pi]!;
  if (!canPlaceCity(m, pi, v) || !canAfford(p, COSTS.city)) return false;
  pay(p, COSTS.city);
  p.settlements = p.settlements.filter((x) => x !== v);
  p.cities.push(v);
  return true;
}

export function buyDevCard(m: ColonyMatch, pi: number): string | null {
  const p = m.players[pi]!;
  if (!m.deck.length || !canAfford(p, COSTS.devCard)) return null;
  pay(p, COSTS.devCard);
  const card = m.deck.pop()!;
  if (card === 'victory') p.victoryCards++;
  else p.devHand.push(card);
  return card;
}
