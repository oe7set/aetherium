import {
  COSTS,
  PERSONAS,
  RESOURCES,
  type AiStyle,
  type Cost,
  type Resource,
} from '../../data/colony';
import type { Rng } from '../rng';
import type { ColonyMatch } from '../state';
import { BOARD } from './board';
import {
  buildCity,
  buildRoad,
  buildSettlement,
  buyDevCard,
  canAfford,
  canPlaceSettlement,
  legalRoads,
  legalSettlementSpots,
  moveRobber,
  robberTarget,
  tradeRate,
  updateAwards,
  vertexOwner,
  vertexScore,
  victoryPoints,
} from './rules';

export type AiAction =
  | { kind: 'road' | 'settlement' | 'city' | 'dev'; at?: number }
  | { kind: 'knight'; victim: number | null }
  | { kind: 'trade'; give: Resource; want: Resource };

export function styleOf(persona: string): AiStyle {
  return PERSONAS.find((p) => p.id === persona)?.style ?? 'city';
}

/** Index of the opponent with the most (visible) victory points. */
export function leaderAgainst(m: ColonyMatch, pi: number): number {
  let best = -1;
  let bestVp = -1;
  m.players.forEach((_, i) => {
    if (i === pi) return;
    const vp = victoryPoints(m, i, false);
    if (vp > bestVp) {
      bestVp = vp;
      best = i;
    }
  });
  return best;
}

/** Best free spot for a setup settlement and the road pointing towards the best neighbour. */
export function chooseSetup(m: ColonyMatch, pi: number): { vertex: number; road: number } | null {
  const spots = legalSettlementSpots(m, pi, true);
  if (!spots.length) return null;
  const vertex = spots.reduce((a, b) => (vertexScore(m, b) > vertexScore(m, a) ? b : a));
  return { vertex, road: chooseSetupRoad(m, pi, vertex) };
}

export function chooseSetupRoad(m: ColonyMatch, pi: number, vertex: number): number {
  const roads = legalRoads(m, pi, vertex);
  const far = (e: number) => {
    const edge = BOARD.edges[e]!;
    return edge.a === vertex ? edge.b : edge.a;
  };
  return roads.reduce(
    (a, b) => (vertexScore(m, far(b)) > vertexScore(m, far(a)) ? b : a),
    roads[0]!,
  );
}

/** Road that brings the player closest to a good free settlement spot (two steps lookahead). */
export function chooseRoad(m: ColonyMatch, pi: number): number | null {
  const roads = legalRoads(m, pi);
  if (!roads.length) return null;
  const spotValue = (v: number) =>
    vertexOwner(m, v) === null &&
    BOARD.vertices[v]!.neighbors.every((n) => vertexOwner(m, n) === null)
      ? vertexScore(m, v)
      : 0;
  let best: number | null = null;
  let bestScore = -1;
  for (const e of roads) {
    const edge = BOARD.edges[e]!;
    let score = 0;
    for (const v of [edge.a, edge.b]) {
      score = Math.max(score, spotValue(v));
      for (const n of BOARD.vertices[v]!.neighbors) score = Math.max(score, spotValue(n) * 0.6);
    }
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  return bestScore > 0 ? best : null;
}

/** Trades surplus with the bank to complete `target`. Returns the trade made, if any. */
export function tradeTowards(
  m: ColonyMatch,
  pi: number,
  target: Cost,
  office = false,
): AiAction | null {
  const p = m.players[pi]!;
  const want = RESOURCES.find((r) => p.res[r] < (target[r] ?? 0));
  if (!want) return null;
  for (const give of RESOURCES) {
    if (give === want) continue;
    const rate = tradeRate(m, pi, give, office);
    if (p.res[give] - (target[give] ?? 0) >= rate) {
      p.res[give] -= rate;
      p.res[want]++;
      return { kind: 'trade', give, want };
    }
  }
  return null;
}

const PRIORITIES: Record<AiStyle, ('city' | 'settlement' | 'road' | 'dev')[]> = {
  city: ['city', 'settlement', 'dev', 'road'],
  expander: ['settlement', 'road', 'city', 'dev'],
  knight: ['dev', 'city', 'settlement', 'road'],
  trader: ['settlement', 'city', 'road', 'dev'],
};

/** One AI turn after a dice roll. Mutates the match and returns what happened (for the feed). */
export function aiTurn(m: ColonyMatch, pi: number, rng: Rng): AiAction[] {
  const p = m.players[pi]!;
  const style = styleOf(p.persona);
  const done: AiAction[] = [];

  // Knights: play one if the robber blocks us, or (knight style) whenever it hurts the leader.
  const knight = p.devHand.indexOf('knight');
  const blocked = BOARD.vertices.some(
    (v) => v.hexes.includes(m.robber) && vertexOwner(m, v.id) === pi,
  );
  if (knight >= 0 && (blocked || style === 'knight')) {
    p.devHand.splice(knight, 1);
    p.knights++;
    const leader = leaderAgainst(m, pi);
    const { victim } = moveRobber(m, pi, robberTarget(m, leader, pi), rng);
    updateAwards(m);
    done.push({ kind: 'knight', victim });
  }
  // Simple progress cards are played immediately.
  for (let i = p.devHand.length - 1; i >= 0; i--) {
    const card = p.devHand[i]!;
    if (card === 'plenty') {
      p.res.ore++;
      p.res.grain++;
    } else if (card === 'roadBuilding') {
      for (let k = 0; k < 2; k++) {
        const road = chooseRoad(m, pi);
        if (road !== null) buildRoad(m, pi, road, true);
      }
    } else if (card === 'monopoly') {
      const res = RESOURCES[Math.floor(rng() * RESOURCES.length)]!;
      m.players.forEach((o, oi) => {
        if (oi === pi) return;
        const take = Math.min(2, o.res[res]); // AIs are polite monopolists
        o.res[res] -= take;
        p.res[res] += take;
      });
    } else continue;
    p.devHand.splice(i, 1);
  }

  for (let guard = 0; guard < 8; guard++) {
    let acted = false;
    for (const kind of PRIORITIES[style]) {
      if (kind === 'city' && canAfford(p, COSTS.city) && p.settlements.length) {
        const v = p.settlements.reduce((a, b) => (vertexScore(m, b) > vertexScore(m, a) ? b : a));
        if (buildCity(m, pi, v)) {
          done.push({ kind: 'city', at: v });
          acted = true;
        }
      } else if (kind === 'settlement' && canAfford(p, COSTS.settlement)) {
        const spots = legalSettlementSpots(m, pi);
        if (spots.length) {
          const v = spots.reduce((a, b) => (vertexScore(m, b) > vertexScore(m, a) ? b : a));
          if (buildSettlement(m, pi, v)) {
            done.push({ kind: 'settlement', at: v });
            acted = true;
          }
        }
      } else if (kind === 'road' && canAfford(p, COSTS.road)) {
        // Only build roads when there is nowhere to settle yet (or the expander just loves roads).
        if (legalSettlementSpots(m, pi).length === 0 || style === 'expander') {
          const e = chooseRoad(m, pi);
          if (e !== null && buildRoad(m, pi, e)) {
            done.push({ kind: 'road', at: e });
            acted = true;
          }
        }
      } else if (kind === 'dev' && canAfford(p, COSTS.devCard) && m.deck.length) {
        // Don't eat the city budget unless dev cards are our thing.
        if (style === 'knight' || p.res.ore >= 4 || p.cities.length >= 3) {
          if (buyDevCard(m, pi)) {
            done.push({ kind: 'dev' });
            acted = true;
          }
        }
      }
      if (acted) break;
    }
    if (!acted) {
      const target =
        style === 'city' && p.settlements.length
          ? COSTS.city
          : legalSettlementSpots(m, pi).length
            ? COSTS.settlement
            : COSTS.road;
      const trade = tradeTowards(m, pi, target);
      if (!trade) break;
      done.push(trade);
    }
  }
  if (done.some((d) => d.kind === 'road' || d.kind === 'settlement')) updateAwards(m);
  return done;
}

/** A trade offer an AI would make to the player: surplus for something it lacks. */
export function aiOffer(
  m: ColonyMatch,
  pi: number,
  generosity: number,
): { give: Resource; giveQty: number; want: Resource; wantQty: number } | null {
  const p = m.players[pi]!;
  const surplus = [...RESOURCES].sort((a, b) => p.res[b] - p.res[a])[0]!;
  if (p.res[surplus] < 2) return null;
  const target =
    p.settlements.length && canPlaceSettlementAnywhere(m, pi) ? COSTS.settlement : COSTS.city;
  const want = RESOURCES.find((r) => r !== surplus && p.res[r] < (target[r] ?? 0));
  if (!want) return null;
  const giveQty = Math.min(p.res[surplus], 1 + generosity);
  return { give: surplus, giveQty, want, wantQty: 1 };
}

function canPlaceSettlementAnywhere(m: ColonyMatch, pi: number): boolean {
  return BOARD.vertices.some((v) => canPlaceSettlement(m, pi, v.id));
}
