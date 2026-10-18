import {
  COLONY_BUILDINGS,
  COSTS,
  FAME_TALENTS,
  HAND_LIMIT,
  IMPORT_RATES,
  PERSONAS,
  RESOURCES,
  ROLL_INTERVAL,
  WIN_POINTS,
  type Resource,
} from '../../data/colony';
import { gainItem, registerTimeEffect } from '../actions';
import type { Emit } from '../events';
import { itemCount, removeItem } from '../inventory';
import { invalidateMods, registerModifierSource } from '../modifiers';
import type { Rng } from '../rng';
import { earnGold } from '../shop';
import { addStat, type ColonyMatch, type GameState } from '../state';
import {
  aiOffer,
  aiTurn,
  chooseRoad,
  chooseSetup,
  chooseSetupRoad,
  leaderAgainst,
  tradeTowards,
} from './ai';
import { BOARD } from './board';
import {
  buildCity,
  buildRoad,
  buildSettlement,
  buyDevCard,
  canAfford,
  generateMatch,
  grantSetupResources,
  handSize,
  legalSettlementSpots,
  moveRobber,
  PLAYER_INDEX,
  produce,
  robberDiscard,
  robberTarget,
  tradeRate,
  updateAwards,
  vertexOwner,
  vertexScore,
  victoryPoints,
} from './rules';

export * from './ai';
export * from './board';
export * from './rules';

export const COLONY_BUILDING_MAP = new Map(COLONY_BUILDINGS.map((b) => [b.id, b]));
export const FAME_TALENT_MAP = new Map(FAME_TALENTS.map((t) => [t.id, t]));
/** Gold per colony resource sold to island merchants. */
export const EXPORT_GOLD = 30;
/** AI trade offers stay open this many rolls. */
export const OFFER_ROLLS = 3;
/** Ruhm per finishing place (1st … 4th). */
export const PLACE_FAME = [30, 14, 8, 4];

export type ColonyResult = { ok: true } | { ok: false; reason: string };
const OK: ColonyResult = { ok: true };
const fail = (reason: string): ColonyResult => ({ ok: false, reason });

export function talentLevel(s: GameState, id: string): number {
  return s.colony.talents[id] ?? 0;
}

export function rollInterval(s: GameState): number {
  return ROLL_INTERVAL * Math.max(0.3, 1 - 0.1 * talentLevel(s, 'fast_dice'));
}

export function buildingCount(m: ColonyMatch, id: string): number {
  let n = 0;
  for (const list of Object.values(m.buildings)) for (const b of list) if (b === id) n++;
  return n;
}

export function handLimit(s: GameState): number {
  const m = s.colony.match;
  return (
    HAND_LIMIT + 2 * talentLevel(s, 'big_pockets') + (m ? 4 * buildingCount(m, 'warehouse') : 0)
  );
}

export function hasHarborOffice(m: ColonyMatch): boolean {
  return buildingCount(m, 'harbor_office') > 0;
}

export function playerRate(s: GameState, res: Resource): number {
  const m = s.colony.match;
  return m ? tradeRate(m, PLAYER_INDEX, res, hasHarborOffice(m)) : 4;
}

export function hasSteward(s: GameState): boolean {
  return talentLevel(s, 'steward') > 0;
}

// --- Bonuses into the island ------------------------------------------------------------------

registerModifierSource('colony', (s) => {
  const out = [];
  const m = s.colony.match;
  if (m)
    for (const list of Object.values(m.buildings))
      for (const id of list) {
        const mods = COLONY_BUILDING_MAP.get(id)?.mods;
        if (mods) out.push(mods);
      }
  if (s.colony.fameTotal > 0) {
    // Lifetime Ruhm: a small permanent island bonus (capped).
    out.push({
      xp: Math.min(0.25, s.colony.fameTotal * 0.0008),
      gold: Math.min(0.15, s.colony.fameTotal * 0.0005),
    });
  }
  return out;
});

// --- Match lifecycle ----------------------------------------------------------------------------

export function startMatch(s: GameState, rng: Rng, emit: Emit): ColonyResult {
  if (s.colony.match && s.colony.match.phase !== 'finished') return fail('running');
  const pool = [...PERSONAS];
  const opponents: string[] = [];
  while (opponents.length < 3 && pool.length)
    opponents.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!.id);
  const m = generateMatch(Math.floor(rng() * 2 ** 31), ['you', ...opponents]);
  const kit = talentLevel(s, 'start_kit');
  if (kit)
    for (const r of ['wood', 'brick', 'wool', 'grain'] as const)
      m.players[PLAYER_INDEX]!.res[r] += kit;
  s.colony.match = m;
  s.colony.matches++;
  s.colony.nextRoll = rollInterval(s);
  addStat(s, 'colonyMatches');
  invalidateMods(s);
  emit({ type: 'colonyStarted' });
  runSetup(s, emit);
  return OK;
}

/** Advances the setup queue: AIs place instantly, the player only via steward or input. */
function runSetup(s: GameState, emit: Emit): void {
  const m = s.colony.match;
  if (!m || m.phase !== 'setup') return;
  while (m.setupQueue.length) {
    const pi = m.setupQueue[0]!;
    if (pi === PLAYER_INDEX && !hasSteward(s)) return;
    const choice = chooseSetup(m, pi);
    if (!choice) break;
    placeSetupPiece(s, pi, choice.vertex, choice.road, emit);
  }
  if (!m.setupQueue.length) {
    m.phase = 'running';
    m.setupVertex = null;
    emit({ type: 'colonySetupDone' });
  }
}

function placeSetupPiece(s: GameState, pi: number, vertex: number, road: number, emit: Emit): void {
  const m = s.colony.match!;
  const second = m.setupQueue.length <= m.players.length;
  buildSettlement(m, pi, vertex, true);
  buildRoad(m, pi, road, true, vertex);
  if (second) grantSetupResources(m, pi, vertex);
  m.setupQueue.shift();
  m.setupVertex = null;
  emit({ type: 'colonyBuilt', player: pi, kind: 'settlement' });
}

/** Player setup: first tap places the settlement, second tap its road. */
export function setupPlaceSettlement(s: GameState, vertex: number): ColonyResult {
  const m = s.colony.match;
  if (!m || m.phase !== 'setup' || m.setupQueue[0] !== PLAYER_INDEX) return fail('notYourTurn');
  if (m.setupVertex !== null) return fail('placeRoad');
  if (!legalSettlementSpots(m, PLAYER_INDEX, true).includes(vertex)) return fail('illegal');
  m.setupVertex = vertex;
  return OK;
}

export function setupPlaceRoad(s: GameState, edge: number, emit: Emit): ColonyResult {
  const m = s.colony.match;
  if (!m || m.phase !== 'setup' || m.setupQueue[0] !== PLAYER_INDEX || m.setupVertex === null)
    return fail('notYourTurn');
  const e = BOARD.edges[edge];
  if (
    !e ||
    (e.a !== m.setupVertex && e.b !== m.setupVertex) ||
    m.players.some((p) => p.roads.includes(edge))
  )
    return fail('illegal');
  placeSetupPiece(s, PLAYER_INDEX, m.setupVertex, edge, emit);
  runSetup(s, emit);
  return OK;
}

/** "Automatisch platzieren": the player's setup turn picked by the AI heuristics. */
export function setupAuto(s: GameState, emit: Emit): ColonyResult {
  const m = s.colony.match;
  if (!m || m.phase !== 'setup' || m.setupQueue[0] !== PLAYER_INDEX) return fail('notYourTurn');
  if (m.setupVertex !== null) {
    placeSetupPiece(
      s,
      PLAYER_INDEX,
      m.setupVertex,
      chooseSetupRoad(m, PLAYER_INDEX, m.setupVertex),
      emit,
    );
  } else {
    const choice = chooseSetup(m, PLAYER_INDEX);
    if (!choice) return fail('illegal');
    placeSetupPiece(s, PLAYER_INDEX, choice.vertex, choice.road, emit);
  }
  runSetup(s, emit);
  return OK;
}

/** Finished-match placement of the player (1 = winner). */
export function playerPlace(m: ColonyMatch): number {
  const mine = victoryPoints(m, PLAYER_INDEX);
  if (m.winner === PLAYER_INDEX) return 1;
  return (
    1 +
    m.players.filter(
      (_, i) => i !== PLAYER_INDEX && (i === m.winner || victoryPoints(m, i) >= mine),
    ).length
  );
}

export function fameFor(s: GameState, m: ColonyMatch): number {
  const base = (PLACE_FAME[playerPlace(m) - 1] ?? 4) + victoryPoints(m, PLAYER_INDEX);
  return Math.round(base * (1 + 0.25 * talentLevel(s, 'glory')));
}

export function claimMatch(s: GameState, emit: Emit): ColonyResult {
  const m = s.colony.match;
  if (!m || m.phase !== 'finished') return fail('notFinished');
  const fame = fameFor(s, m);
  const place = playerPlace(m);
  s.colony.fame += fame;
  s.colony.fameTotal += fame;
  addStat(s, 'colonyFame', fame);
  if (place === 1) {
    s.colony.wins++;
    addStat(s, 'colonyWins');
    gainItem(s, 'colony_chest', 1, emit, true);
  }
  s.colony.match = null;
  invalidateMods(s);
  emit({ type: 'colonyClaimed', fame, place });
  return OK;
}

/** Gives up the running match (counts as 4th place, no Ruhm). */
export function abandonMatch(s: GameState): void {
  s.colony.match = null;
  invalidateMods(s);
}

function checkWin(s: GameState, emit: Emit): boolean {
  const m = s.colony.match;
  if (!m || m.phase !== 'running') return false;
  const winner = m.players.findIndex((_, i) => victoryPoints(m, i) >= WIN_POINTS);
  if (winner < 0) return false;
  m.phase = 'finished';
  m.winner = winner;
  m.offers = [];
  emit({ type: 'colonyFinished', winner, place: playerPlace(m) });
  return true;
}

// --- Dice ---------------------------------------------------------------------------------------

export function rollDice(s: GameState, rng: Rng, emit: Emit): void {
  const m = s.colony.match;
  if (!m || m.phase !== 'running') return;
  const d1 = 1 + Math.floor(rng() * 6);
  const d2 = 1 + Math.floor(rng() * 6);
  const roll = d1 + d2;
  m.lastRoll = [d1, d2];
  m.rolls++;
  addStat(s, 'colonyRolls');
  let gained = 0;
  if (roll === 7) {
    const limits = m.players.map((_, i) => (i === PLAYER_INDEX ? handLimit(s) : HAND_LIMIT));
    const lost = robberDiscard(m, limits);
    // The robber is moved by whoever's turn it is; on the player's turn it targets the leader.
    const thief = m.turn;
    const { victim, res } = moveRobber(
      m,
      thief,
      robberTarget(m, leaderAgainst(m, thief), thief),
      rng,
    );
    emit({ type: 'colonyRobber', by: thief, victim, res, lost: lost[PLAYER_INDEX] ?? 0 });
  } else {
    const gains = produce(m, roll);
    const mine = gains[PLAYER_INDEX]!;
    gained = RESOURCES.reduce((sum, r) => sum + mine[r], 0);
    addStat(s, 'colonyResources', gained);
  }
  emit({ type: 'colonyRoll', roll, gained });

  runConverters(s, emit);

  for (let pi = 1; pi < m.players.length; pi++) {
    const actions = aiTurn(m, pi, rng);
    for (const a of actions)
      if (a.kind === 'settlement' || a.kind === 'city')
        emit({ type: 'colonyBuilt', player: pi, kind: a.kind });
    if (actions.length && rng() < 0.15) emit({ type: 'colonyQuip', player: pi });
    if (checkWin(s, emit)) return;
  }
  if (hasSteward(s)) stewardTurn(s, emit);
  updateOffers(s, rng, emit);
  m.turn = (m.turn + 1) % m.players.length;
  checkWin(s, emit);
}

/** Siedler production chains: each building turns one resource into an island good per roll. */
function runConverters(s: GameState, emit: Emit): void {
  const m = s.colony.match!;
  const p = m.players[PLAYER_INDEX]!;
  for (const list of Object.values(m.buildings)) {
    for (const id of list) {
      const convert = COLONY_BUILDING_MAP.get(id)?.convert;
      if (!convert || p.res[convert.from] <= 0) continue;
      // Keep one card of each kind for building, unless the hand is getting dangerous.
      if (p.res[convert.from] <= 1 && handSize(p) <= handLimit(s)) continue;
      p.res[convert.from]--;
      if (gainItem(s, convert.to, 1, emit)) addStat(s, 'colonyGoods');
    }
  }
}

function updateOffers(s: GameState, rng: Rng, emit: Emit): void {
  const m = s.colony.match!;
  m.offers = m.offers.filter((o) => --o.expires > 0 && m.players[o.from]!.res[o.give] >= o.giveQty);
  if (m.offers.length >= 3) return;
  const pi = 1 + Math.floor(rng() * (m.players.length - 1));
  const trader = m.players[pi]!.persona === 'gnomes';
  if (rng() > (trader ? 0.7 : 0.35)) return;
  // Nobody trades with a player who is about to win.
  if (victoryPoints(m, PLAYER_INDEX, false) >= WIN_POINTS - 2) return;
  const offer = aiOffer(m, pi, talentLevel(s, 'diplomat') + (trader ? 1 : 0));
  if (!offer || m.offers.some((o) => o.from === pi)) return;
  m.offers.push({ id: s.colony.nextOfferId++, from: pi, ...offer, expires: OFFER_ROLLS });
  emit({ type: 'colonyOffer', from: pi });
}

registerTimeEffect('colony', {
  next: (s) => {
    const phase = s.colony.match?.phase;
    if (phase === 'running') return Math.max(0, s.colony.nextRoll);
    return phase === 'finished' && hasSteward(s) ? 0 : Infinity;
  },
  apply: (s, dt, emit, rng) => {
    const m = s.colony.match;
    if (!m) return;
    if (m.phase === 'finished' && hasSteward(s)) {
      // The steward cashes in and starts the next match, so the colony keeps going offline.
      claimMatch(s, emit);
      startMatch(s, rng, emit);
      return;
    }
    if (m.phase !== 'running') return;
    s.colony.nextRoll -= dt;
    if (s.colony.nextRoll <= 1e-9) {
      s.colony.nextRoll = rollInterval(s);
      rollDice(s, rng, emit);
    }
  },
});

// --- Player actions -----------------------------------------------------------------------------

function running(s: GameState): ColonyMatch | null {
  const m = s.colony.match;
  return m && m.phase === 'running' ? m : null;
}

export function playerBuildRoad(s: GameState, edge: number, emit: Emit): ColonyResult {
  const m = running(s);
  if (!m) return fail('notRunning');
  const free = m.freeRoads > 0;
  if (!free && !canAfford(m.players[PLAYER_INDEX]!, COSTS.road)) return fail('resources');
  if (!buildRoad(m, PLAYER_INDEX, edge, free)) return fail('illegal');
  if (free) m.freeRoads--;
  updateAwards(m);
  emit({ type: 'colonyBuilt', player: PLAYER_INDEX, kind: 'road' });
  checkWin(s, emit);
  return OK;
}

export function playerBuildSettlement(s: GameState, vertex: number, emit: Emit): ColonyResult {
  const m = running(s);
  if (!m) return fail('notRunning');
  if (!canAfford(m.players[PLAYER_INDEX]!, COSTS.settlement)) return fail('resources');
  if (!buildSettlement(m, PLAYER_INDEX, vertex)) return fail('illegal');
  updateAwards(m);
  addStat(s, 'colonySettlements');
  emit({ type: 'colonyBuilt', player: PLAYER_INDEX, kind: 'settlement' });
  checkWin(s, emit);
  return OK;
}

export function playerBuildCity(s: GameState, vertex: number, emit: Emit): ColonyResult {
  const m = running(s);
  if (!m) return fail('notRunning');
  if (!canAfford(m.players[PLAYER_INDEX]!, COSTS.city)) return fail('resources');
  if (!buildCity(m, PLAYER_INDEX, vertex)) return fail('illegal');
  addStat(s, 'colonyCities');
  emit({ type: 'colonyBuilt', player: PLAYER_INDEX, kind: 'city' });
  checkWin(s, emit);
  return OK;
}

export function playerBuyDev(s: GameState, emit: Emit): ColonyResult {
  const m = running(s);
  if (!m) return fail('notRunning');
  const card = buyDevCard(m, PLAYER_INDEX);
  if (!card) return fail(m.deck.length ? 'resources' : 'empty');
  emit({ type: 'colonyDevCard', card });
  checkWin(s, emit);
  return OK;
}

/** Plays a development card from the hand. `res` is needed for plenty (two) and monopoly (one). */
export function playDevCard(
  s: GameState,
  card: string,
  emit: Emit,
  res: Resource[] = [],
): ColonyResult {
  const m = running(s);
  if (!m) return fail('notRunning');
  const p = m.players[PLAYER_INDEX]!;
  const index = p.devHand.indexOf(card);
  if (index < 0) return fail('noCard');
  if (card === 'knight') {
    if (m.robberMode) return fail('robber');
    p.knights++;
    m.robberMode = true;
    updateAwards(m);
  } else if (card === 'roadBuilding') {
    m.freeRoads += 2;
  } else if (card === 'plenty') {
    const [a, b] = res;
    if (!a || !b) return fail('choose');
    p.res[a]++;
    p.res[b]++;
  } else if (card === 'monopoly') {
    const r = res[0];
    if (!r) return fail('choose');
    m.players.forEach((o, i) => {
      if (i === PLAYER_INDEX) return;
      p.res[r] += o.res[r];
      o.res[r] = 0;
    });
  } else return fail('noCard');
  p.devHand.splice(index, 1);
  addStat(s, 'colonyDevPlayed');
  emit({ type: 'colonyDevPlayed', card });
  checkWin(s, emit);
  return OK;
}

export function placeRobber(s: GameState, hex: number, rng: Rng, emit: Emit): ColonyResult {
  const m = running(s);
  if (!m || !m.robberMode) return fail('notRobber');
  if (hex === m.robber || hex < 0 || hex >= m.terrain.length) return fail('illegal');
  m.robberMode = false;
  const { victim, res } = moveRobber(m, PLAYER_INDEX, hex, rng);
  emit({ type: 'colonyRobber', by: PLAYER_INDEX, victim, res, lost: 0 });
  return OK;
}

export function bankTrade(s: GameState, give: Resource, want: Resource): ColonyResult {
  const m = running(s);
  if (!m || give === want) return fail('illegal');
  const p = m.players[PLAYER_INDEX]!;
  const rate = playerRate(s, give);
  if (p.res[give] < rate) return fail('resources');
  p.res[give] -= rate;
  p.res[want]++;
  addStat(s, 'colonyTrades');
  return OK;
}

export function acceptOffer(s: GameState, id: number): ColonyResult {
  const m = running(s);
  if (!m) return fail('notRunning');
  const offer = m.offers.find((o) => o.id === id);
  if (!offer) return fail('gone');
  const p = m.players[PLAYER_INDEX]!;
  const ai = m.players[offer.from]!;
  if (p.res[offer.want] < offer.wantQty) return fail('resources');
  if (ai.res[offer.give] < offer.giveQty) return fail('gone');
  p.res[offer.want] -= offer.wantQty;
  ai.res[offer.want] += offer.wantQty;
  ai.res[offer.give] -= offer.giveQty;
  p.res[offer.give] += offer.giveQty;
  m.offers = m.offers.filter((o) => o.id !== id);
  addStat(s, 'colonyTrades');
  return OK;
}

export function declineOffer(s: GameState, id: number): void {
  const m = s.colony.match;
  if (m) m.offers = m.offers.filter((o) => o.id !== id);
}

// --- Siedler buildings ----------------------------------------------------------------------------

export function buildingSlots(m: ColonyMatch, vertex: number): number {
  const p = m.players[PLAYER_INDEX]!;
  if (p.cities.includes(vertex)) return 2;
  if (p.settlements.includes(vertex)) return 1;
  return 0;
}

export function canBuildBuilding(s: GameState, vertex: number, id: string): ColonyResult {
  const m = running(s);
  const def = COLONY_BUILDING_MAP.get(id);
  if (!m || !def) return fail('illegal');
  const here = m.buildings[vertex] ?? [];
  if (here.length >= buildingSlots(m, vertex)) return fail('slots');
  if (buildingCount(m, id) >= def.maxCount) return fail('max');
  if (!canAfford(m.players[PLAYER_INDEX]!, def.cost)) return fail('resources');
  return OK;
}

export function buildBuilding(s: GameState, vertex: number, id: string, emit: Emit): ColonyResult {
  const check = canBuildBuilding(s, vertex, id);
  if (!check.ok) return check;
  const m = s.colony.match!;
  const def = COLONY_BUILDING_MAP.get(id)!;
  const p = m.players[PLAYER_INDEX]!;
  for (const r of RESOURCES) p.res[r] -= def.cost[r] ?? 0;
  (m.buildings[vertex] ??= []).push(id);
  addStat(s, 'colonyBuildings');
  invalidateMods(s);
  emit({ type: 'colonyBuilt', player: PLAYER_INDEX, kind: 'building', id });
  return OK;
}

// --- Island ↔ colony trade ------------------------------------------------------------------------

export function importSource(s: GameState, res: Resource): string | null {
  const rate = IMPORT_RATES.find((r) => r.resource === res);
  return rate?.items.find((item) => itemCount(s, item) >= rate.qty) ?? null;
}

/** Ships island goods to the colony: e.g. 10 logs → 1 wood. */
export function importResource(s: GameState, res: Resource): ColonyResult {
  const m = running(s);
  const rate = IMPORT_RATES.find((r) => r.resource === res);
  if (!m || !rate) return fail('notRunning');
  const item = importSource(s, res);
  if (!item) return fail('resources');
  removeItem(s, item, rate.qty);
  m.players[PLAYER_INDEX]!.res[res]++;
  addStat(s, 'colonyImports');
  return OK;
}

/** Sells a colony resource to island merchants for gold. */
export function exportResource(s: GameState, res: Resource, emit: Emit): ColonyResult {
  const m = running(s);
  if (!m) return fail('notRunning');
  const p = m.players[PLAYER_INDEX]!;
  if (p.res[res] <= 0) return fail('resources');
  p.res[res]--;
  earnGold(s, EXPORT_GOLD, emit);
  return OK;
}

// --- Ruhm talents ---------------------------------------------------------------------------------

export function talentCost(s: GameState, id: string): number {
  const def = FAME_TALENT_MAP.get(id);
  return def ? def.cost(talentLevel(s, id) + 1) : Infinity;
}

export function buyTalent(s: GameState, id: string, emit: Emit): ColonyResult {
  const def = FAME_TALENT_MAP.get(id);
  if (!def) return fail('illegal');
  if (talentLevel(s, id) >= def.maxLevel) return fail('max');
  const cost = talentCost(s, id);
  if (s.colony.fame < cost) return fail('fame');
  s.colony.fame -= cost;
  s.colony.talents[id] = talentLevel(s, id) + 1;
  if (id === 'steward') runSetup(s, emit);
  return OK;
}

// --- Steward ------------------------------------------------------------------------------------

/** The steward builds for the player after each roll: city > settlement > road > buildings. */
function stewardTurn(s: GameState, emit: Emit): void {
  const m = s.colony.match!;
  const p = m.players[PLAYER_INDEX]!;
  for (let guard = 0; guard < 6; guard++) {
    if (canAfford(p, COSTS.city) && p.settlements.length) {
      const v = p.settlements.reduce((a, b) => (vertexScore(m, b) > vertexScore(m, a) ? b : a));
      if (playerBuildCity(s, v, emit).ok) continue;
    }
    if (canAfford(p, COSTS.settlement)) {
      const spots = legalSettlementSpots(m, PLAYER_INDEX);
      if (spots.length) {
        const v = spots.reduce((a, b) => (vertexScore(m, b) > vertexScore(m, a) ? b : a));
        if (playerBuildSettlement(s, v, emit).ok) continue;
      }
    }
    if (canAfford(p, COSTS.road) && !legalSettlementSpots(m, PLAYER_INDEX).length) {
      const e = chooseRoad(m, PLAYER_INDEX);
      if (e !== null && playerBuildRoad(s, e, emit).ok) continue;
    }
    // Nothing affordable: swap surplus at the bank towards the next goal.
    const target =
      p.settlements.length && !legalSettlementSpots(m, PLAYER_INDEX).length
        ? COSTS.city
        : legalSettlementSpots(m, PLAYER_INDEX).length
          ? COSTS.settlement
          : COSTS.road;
    if (tradeTowards(m, PLAYER_INDEX, target, hasHarborOffice(m))) continue;
    break;
  }
  if (m.phase !== 'running') return;
  // Knights in hand: keep the robber off our own hexes.
  if (p.devHand.includes('knight')) {
    const blocked = BOARD.vertices.some(
      (v) => v.hexes.includes(m.robber) && vertexOwner(m, v.id) === PLAYER_INDEX,
    );
    if (blocked && playDevCard(s, 'knight', emit).ok) {
      m.robberMode = false;
      const { victim, res } = moveRobber(
        m,
        PLAYER_INDEX,
        robberTarget(m, leaderAgainst(m, PLAYER_INDEX), PLAYER_INDEX),
        () => 0.5,
      );
      emit({ type: 'colonyRobber', by: PLAYER_INDEX, victim, res, lost: 0 });
    }
  }
}

/** Convenience for the UI: hand, VP and status of every player. */
export function colonySummary(m: ColonyMatch) {
  return m.players.map((p, i) => ({
    persona: p.persona,
    vp: victoryPoints(m, i, i === PLAYER_INDEX),
    cards: handSize(p),
    dev: p.devHand.length,
    knights: p.knights,
    longestRoad: m.longestRoad === i,
    largestArmy: m.largestArmy === i,
  }));
}
