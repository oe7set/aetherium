import Decimal from 'break_eternity.js';
import { ITEM_MAP } from '../data';
import {
  BUILDING_COST_MULT,
  BUILDING_TIME_MULT,
  CAPITAL_FIELD_MAX,
  CELEBRATIONS,
  CP_FOR_VILLAGE,
  CRANNY,
  FIELD_COST_MULT,
  FIELD_DEFS,
  FIELD_MAX,
  FIELD_PROD,
  FIELD_TIME_MULT,
  HARBOR_GOLD_PER_100,
  HARBOR_IMPORTS,
  INVASION_INTERVAL,
  MAIN_SPEED,
  MAX_VILLAGES,
  OASIS_BONUS,
  OASIS_SLOTS,
  SETTLERS_PER_VILLAGE,
  SMITHY_BONUS,
  SPEED,
  STORAGE,
  TROOPS,
  V_BUILDINGS,
  V_RESOURCES,
  VALLEYS,
  type TroopDef,
  type VBuildingDef,
  type VCost,
  type VRes,
} from '../data/village';
import { gainItem, registerTimeEffect } from './actions';
import type { Emit } from './events';
import { itemCount, removeItem } from './inventory';
import { invalidateMods, registerModifierSource } from './modifiers';
import type { Rng } from './rng';
import { earnGold } from './shop';
import {
  addStat,
  type GameState,
  type RaidTarget,
  type VCostState,
  type Village,
  type VMovement,
  type VQueueItem,
  type VReport,
} from './state';
import { createVillage } from './villageWorld';

export const V_BUILDING_MAP = new Map(V_BUILDINGS.map((b) => [b.id, b]));
export const TROOP_MAP = new Map(TROOPS.map((t) => [t.id, t]));
/** Queue entries per lane (one building + one waiting). */
export const QUEUE_SIZE = 2;
/** Island gold per remaining second for "Sofort fertigstellen". */
export const INSTANT_GOLD_PER_SECOND = 4;
/** Gold fee per 10 resources traded with the NPC merchant. */
export const MARKET_FEE = 1;
/** Resources one merchant carries. */
export const MERCHANT_CARRY = 750;

export type VResult = { ok: true } | { ok: false; reason: string };
const OK: VResult = { ok: true };
const fail = (reason: string): VResult => ({ ok: false, reason });

const zero = (): VCostState => ({ wood: 0, clay: 0, iron: 0, crop: 0 });

// --- Lookup ---------------------------------------------------------------------------------------

export function getVillage(s: GameState, id: number): Village | undefined {
  return s.village.villages.find((v) => v.id === id);
}

export function activeVillage(s: GameState): Village {
  return getVillage(s, s.village.active) ?? s.village.villages[0]!;
}

export function buildingLevel(v: Village, id: string): number {
  return v.buildings[id] ?? 0;
}

export function fieldType(v: Village, index: number): VRes {
  return (VALLEYS[v.layout] ?? VALLEYS.standard!).layout[index] ?? 'crop';
}

export function maxFieldLevel(v: Village, res: VRes): number {
  let best = 0;
  v.fields.forEach((lvl, i) => {
    if (fieldType(v, i) === res) best = Math.max(best, lvl);
  });
  return best;
}

/** Highest level of a building across all villages (for global boni). */
export function bestBuilding(s: GameState, id: string): number {
  return s.village.villages.reduce((m, v) => Math.max(m, buildingLevel(v, id)), 0);
}

// --- Economy --------------------------------------------------------------------------------------

export function storageCap(v: Village): number {
  return STORAGE[Math.min(STORAGE.length - 1, buildingLevel(v, 'warehouse'))]!;
}

export function granaryCap(v: Village): number {
  return STORAGE[Math.min(STORAGE.length - 1, buildingLevel(v, 'granary'))]!;
}

export function capFor(v: Village, res: VRes): number {
  return res === 'crop' ? granaryCap(v) : storageCap(v);
}

export function crannyProtection(v: Village): number {
  return CRANNY[Math.min(CRANNY.length - 1, buildingLevel(v, 'cranny'))]!;
}

export function population(v: Village): number {
  let pop = 0;
  v.fields.forEach((lvl, i) => (pop += lvl * FIELD_DEFS[fieldType(v, i)].pop));
  for (const [id, lvl] of Object.entries(v.buildings))
    pop += lvl * (V_BUILDING_MAP.get(id)?.pop ?? 0);
  return pop;
}

export function totalPopulation(s: GameState): number {
  return s.village.villages.reduce((sum, v) => sum + population(v), 0);
}

/** Troops of a village, including those currently on the move. */
export function allTroops(s: GameState, v: Village): Record<string, number> {
  const out: Record<string, number> = { ...v.troops };
  for (const m of s.village.movements) {
    if (m.from !== v.id) continue;
    for (const [id, n] of Object.entries(m.troops)) out[id] = (out[id] ?? 0) + n;
  }
  return out;
}

/** Crop upkeep per hour: population + troops (home and away). */
export function upkeep(s: GameState, v: Village): number {
  let troops = 0;
  for (const [id, n] of Object.entries(allTroops(s, v)))
    troops += n * (TROOP_MAP.get(id)?.upkeep ?? 0);
  return (population(v) + troops) * SPEED;
}

/** Gross production per hour for each resource. */
export function production(s: GameState, v: Village): VCostState {
  const out = zero();
  v.fields.forEach(
    (lvl, i) => (out[fieldType(v, i)] += FIELD_PROD[Math.min(FIELD_PROD.length - 1, lvl)]!),
  );
  const bonus = zero();
  for (const b of V_BUILDINGS) if (b.bonusRes) bonus[b.bonusRes] += 0.05 * buildingLevel(v, b.id);
  for (const id of v.oases) {
    const t = s.village.targets.find((x) => x.id === id);
    if (t?.bonus) bonus[t.bonus] += OASIS_BONUS;
  }
  for (const r of V_RESOURCES) out[r] = out[r] * SPEED * (1 + bonus[r]);
  return out;
}

export function netCrop(s: GameState, v: Village): number {
  return production(s, v).crop - upkeep(s, v);
}

export function canPay(v: Village, cost: VCost): boolean {
  return V_RESOURCES.every((r) => v.res[r] >= cost[r]);
}

function pay(v: Village, cost: VCost): void {
  for (const r of V_RESOURCES) v.res[r] -= cost[r];
}

function add(v: Village, res: VCostState): void {
  for (const r of V_RESOURCES) v.res[r] = Math.min(capFor(v, r), v.res[r] + res[r]);
}

const scaled = (cost: VCost, mult: number, level: number): VCost => {
  const f = Math.pow(mult, level - 1);
  return {
    wood: Math.round((cost.wood * f) / 5) * 5,
    clay: Math.round((cost.clay * f) / 5) * 5,
    iron: Math.round((cost.iron * f) / 5) * 5,
    crop: Math.round((cost.crop * f) / 5) * 5,
  };
};

// --- Construction ---------------------------------------------------------------------------------

export function fieldCost(v: Village, index: number, level: number): VCost {
  return scaled(FIELD_DEFS[fieldType(v, index)].cost, FIELD_COST_MULT, level);
}

export function buildingCost(id: string, level: number): VCost {
  const def = V_BUILDING_MAP.get(id)!;
  return scaled(def.cost, BUILDING_COST_MULT, level);
}

function buildFactor(v: Village): number {
  return Math.pow(MAIN_SPEED, buildingLevel(v, 'main'));
}

export function fieldTime(v: Village, index: number, level: number): number {
  const base = FIELD_DEFS[fieldType(v, index)].time * Math.pow(FIELD_TIME_MULT, level - 1);
  return Math.max(1, Math.round((base * buildFactor(v)) / SPEED));
}

export function buildingTime(v: Village, id: string, level: number): number {
  const base = V_BUILDING_MAP.get(id)!.time * Math.pow(BUILDING_TIME_MULT, level - 1);
  return Math.max(1, Math.round((base * buildFactor(v)) / SPEED));
}

/** Level after everything already queued for this key. */
export function plannedLevel(v: Village, lane: 'field' | 'center', key: string): number {
  const queued = v.queue[lane].filter((q) => q.key === key).map((q) => q.level);
  const current = lane === 'field' ? (v.fields[Number(key)] ?? 0) : buildingLevel(v, key);
  return Math.max(current, ...queued);
}

export function requirementsMet(v: Village, def: VBuildingDef): boolean {
  return Object.entries(def.requires).every(([key, lvl]) =>
    key.startsWith('field:')
      ? maxFieldLevel(v, key.slice(6) as VRes) >= lvl
      : buildingLevel(v, key) >= lvl,
  );
}

export function fieldMax(v: Village): number {
  return v.capital ? CAPITAL_FIELD_MAX : FIELD_MAX;
}

export function canUpgradeField(s: GameState, v: Village, index: number): VResult {
  if (index < 0 || index >= v.fields.length) return fail('illegal');
  const next = plannedLevel(v, 'field', String(index)) + 1;
  if (next > fieldMax(v)) return fail('max');
  if (v.queue.field.length >= QUEUE_SIZE) return fail('queue');
  if (!canPay(v, fieldCost(v, index, next))) return fail('resources');
  const res = fieldType(v, index);
  if (res !== 'crop' && netCrop(s, v) - FIELD_DEFS[res].pop * SPEED < 0) return fail('crop');
  return OK;
}

export function upgradeField(s: GameState, villageId: number, index: number): VResult {
  const v = getVillage(s, villageId);
  if (!v) return fail('illegal');
  const check = canUpgradeField(s, v, index);
  if (!check.ok) return check;
  const level = plannedLevel(v, 'field', String(index)) + 1;
  pay(v, fieldCost(v, index, level));
  const time = fieldTime(v, index, level);
  v.queue.field.push({ key: String(index), level, remaining: time, total: time });
  return OK;
}

export function canUpgradeBuilding(s: GameState, v: Village, id: string): VResult {
  const def = V_BUILDING_MAP.get(id);
  if (!def) return fail('illegal');
  if (!requirementsMet(v, def)) return fail('requires');
  const next = plannedLevel(v, 'center', id) + 1;
  if (next > def.maxLevel) return fail('max');
  if (v.queue.center.length >= QUEUE_SIZE) return fail('queue');
  if (!canPay(v, buildingCost(id, next))) return fail('resources');
  if (netCrop(s, v) - def.pop * SPEED < 0) return fail('crop');
  return OK;
}

export function upgradeBuilding(s: GameState, villageId: number, id: string): VResult {
  const v = getVillage(s, villageId);
  if (!v) return fail('illegal');
  const check = canUpgradeBuilding(s, v, id);
  if (!check.ok) return check;
  const level = plannedLevel(v, 'center', id) + 1;
  pay(v, buildingCost(id, level));
  const time = buildingTime(v, id, level);
  v.queue.center.push({ key: id, level, remaining: time, total: time });
  return OK;
}

/** Cancels the last queued item of a lane and refunds its cost. */
export function cancelQueue(s: GameState, villageId: number, lane: 'field' | 'center'): VResult {
  const v = getVillage(s, villageId);
  const item = v?.queue[lane][v.queue[lane].length - 1];
  if (!v || !item) return fail('illegal');
  v.queue[lane].pop();
  const cost =
    lane === 'field'
      ? fieldCost(v, Number(item.key), item.level)
      : buildingCost(item.key, item.level);
  add(v, cost);
  return OK;
}

export function instantCost(item: VQueueItem): number {
  return Math.ceil(item.remaining * INSTANT_GOLD_PER_SECOND);
}

/** Finishes the running item of a lane with island gold. */
export function instantFinish(
  s: GameState,
  villageId: number,
  lane: 'field' | 'center',
  emit: Emit,
): VResult {
  const v = getVillage(s, villageId);
  const item = v?.queue[lane][0];
  if (!v || !item) return fail('illegal');
  const cost = instantCost(item);
  if (s.gold.lt(cost)) return fail('gold');
  s.gold = s.gold.sub(cost);
  addStat(s, 'goldSpent', cost);
  item.remaining = 0;
  completeQueue(s, v, lane, emit);
  return OK;
}

function completeQueue(s: GameState, v: Village, lane: 'field' | 'center', emit: Emit): void {
  while (v.queue[lane][0] && v.queue[lane][0].remaining <= 1e-9) {
    const item = v.queue[lane].shift()!;
    let name: string;
    if (lane === 'field') {
      const i = Number(item.key);
      v.fields[i] = Math.max(v.fields[i] ?? 0, item.level);
      name = `${FIELD_DEFS[fieldType(v, i)].res === 'crop' ? 'Getreidefarm' : fieldName(fieldType(v, i))}`;
      addStat(s, 'villageFieldLevels');
    } else {
      v.buildings[item.key] = Math.max(buildingLevel(v, item.key), item.level);
      name = V_BUILDING_MAP.get(item.key)?.name ?? item.key;
      addStat(s, 'villageBuildingLevels');
    }
    s.stats.villagePopulation = totalPopulation(s);
    invalidateMods(s);
    emit({
      type: 'villageBuilt',
      village: v.name,
      name,
      level: item.level,
      field: lane === 'field',
    });
  }
}

function fieldName(res: VRes): string {
  return { wood: 'Holzfäller', clay: 'Lehmgrube', iron: 'Eisenmine', crop: 'Getreidefarm' }[res];
}

// --- Troops ----------------------------------------------------------------------------------------

export function troopUnlocked(s: GameState, troop: TroopDef): boolean {
  return !troop.research || s.village.researched.includes(troop.id);
}

export function canResearch(s: GameState, v: Village, troopId: string): VResult {
  const t = TROOP_MAP.get(troopId);
  if (!t?.research) return fail('illegal');
  if (s.village.researched.includes(troopId)) return fail('max');
  if (v.research) return fail('queue');
  if (buildingLevel(v, 'academy') < t.research.academy) return fail('requires');
  if ((t.research.smithy ?? 0) > buildingLevel(v, 'smithy')) return fail('requires');
  if (!canPay(v, t.research.cost)) return fail('resources');
  return OK;
}

export function startResearch(s: GameState, villageId: number, troopId: string): VResult {
  const v = getVillage(s, villageId);
  if (!v) return fail('illegal');
  const check = canResearch(s, v, troopId);
  if (!check.ok) return check;
  const t = TROOP_MAP.get(troopId)!;
  pay(v, t.research!.cost);
  const time = Math.round(t.research!.time / SPEED);
  v.research = { troop: troopId, remaining: time, total: time };
  return OK;
}

export function trainTime(v: Village, t: TroopDef): number {
  const lvl = buildingLevel(v, t.building);
  return Math.max(1, (t.time * Math.pow(0.94, Math.max(0, lvl - 1))) / SPEED);
}

export function maxTrainable(v: Village, t: TroopDef): number {
  return Math.floor(
    Math.min(...V_RESOURCES.map((r) => (t.cost[r] > 0 ? v.res[r] / t.cost[r] : Infinity))),
  );
}

export function canTrain(s: GameState, v: Village, troopId: string, count: number): VResult {
  const t = TROOP_MAP.get(troopId);
  if (!t || count <= 0) return fail('illegal');
  if (!troopUnlocked(s, t)) return fail('research');
  if (buildingLevel(v, t.building) < t.buildingLevel) return fail('requires');
  if (maxTrainable(v, t) < count) return fail('resources');
  if (netCrop(s, v) - t.upkeep * count * SPEED < 0) return fail('crop');
  return OK;
}

export function trainTroops(
  s: GameState,
  villageId: number,
  troopId: string,
  count: number,
): VResult {
  const v = getVillage(s, villageId);
  if (!v) return fail('illegal');
  const check = canTrain(s, v, troopId, count);
  if (!check.ok) return check;
  const t = TROOP_MAP.get(troopId)!;
  for (const r of V_RESOURCES) v.res[r] -= t.cost[r] * count;
  v.training.push({ troop: troopId, count, each: trainTime(v, t), progress: 0 });
  return OK;
}

/** Attack value of a troop set from a village (smithy bonus; mages ×2 vs the rift). */
export function attackValue(v: Village, troops: Record<string, number>, vsRift = false): number {
  let sum = 0;
  for (const [id, n] of Object.entries(troops)) {
    const t = TROOP_MAP.get(id);
    if (t) sum += n * t.attack * (vsRift && id === 'mage' ? 2 : 1);
  }
  return sum * (1 + SMITHY_BONUS * buildingLevel(v, 'smithy'));
}

export function defenseValue(v: Village, troops: Record<string, number>, vsRift = true): number {
  let sum = 0;
  for (const [id, n] of Object.entries(troops)) {
    const t = TROOP_MAP.get(id);
    if (t) sum += n * t.defInf * (vsRift && id === 'mage' ? 2 : 1);
  }
  const wall = buildingLevel(v, 'wall');
  return (
    (sum * (1 + SMITHY_BONUS * buildingLevel(v, 'smithy')) + 30 + 25 * Math.pow(wall, 1.5)) *
    (1 + 0.03 * wall)
  );
}

export function carryOf(troops: Record<string, number>): number {
  let sum = 0;
  for (const [id, n] of Object.entries(troops)) sum += n * (TROOP_MAP.get(id)?.carry ?? 0);
  return sum;
}

export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/** Travel seconds for a troop set (slowest unit, rally point bonus). */
export function travelTime(v: Village, troops: Record<string, number>, dist: number): number {
  let slowest = Infinity;
  for (const [id, n] of Object.entries(troops))
    if (n > 0) slowest = Math.min(slowest, TROOP_MAP.get(id)?.speed ?? 5);
  if (!Number.isFinite(slowest)) slowest = 5;
  const speed = slowest * (1 + 0.05 * buildingLevel(v, 'rally'));
  return Math.max(5, Math.round(((dist / speed) * 3600) / SPEED));
}

function takeTroops(v: Village, troops: Record<string, number>): Record<string, number> | null {
  const clean: Record<string, number> = {};
  for (const [id, n] of Object.entries(troops)) {
    const k = Math.floor(n);
    if (k <= 0) continue;
    if ((v.troops[id] ?? 0) < k) return null;
    clean[id] = k;
  }
  if (!Object.keys(clean).length) return null;
  for (const [id, n] of Object.entries(clean)) v.troops[id] = (v.troops[id] ?? 0) - n;
  return clean;
}

function newMovement(s: GameState, m: Omit<VMovement, 'id'>): void {
  s.village.movements = [...s.village.movements, { ...m, id: s.village.nextId++ }];
}

export function sendRaid(
  s: GameState,
  villageId: number,
  targetId: string,
  troops: Record<string, number>,
): VResult {
  const v = getVillage(s, villageId);
  const target = s.village.targets.find((t) => t.id === targetId);
  if (!v || !target) return fail('illegal');
  if (buildingLevel(v, 'rally') < 1) return fail('rally');
  if (troops.settler) return fail('illegal');
  const taken = takeTroops(v, troops);
  if (!taken) return fail('troops');
  const time = travelTime(v, taken, distance(v.x, v.y, target.x, target.y));
  newMovement(s, {
    kind: 'raid',
    from: v.id,
    target: targetId,
    troops: taken,
    res: zero(),
    remaining: time,
    total: time,
  });
  addStat(s, 'villageRaids');
  return OK;
}

// --- Oases, villages, trade ---------------------------------------------------------------------

export function oasisSlots(v: Village): number {
  const lvl = buildingLevel(v, 'residence');
  return OASIS_SLOTS.filter((x) => lvl >= x).length;
}

export function canAnnex(v: Village, target: RaidTarget): VResult {
  if (target.kind !== 'oasis' || target.owner !== null) return fail('illegal');
  if (target.defense > target.maxDefense * 0.02) return fail('defended');
  if (v.oases.length >= oasisSlots(v)) return fail('slots');
  if (distance(v.x, v.y, target.x, target.y) > 7) return fail('far');
  return OK;
}

export function annexOasis(s: GameState, villageId: number, targetId: string): VResult {
  const v = getVillage(s, villageId);
  const target = s.village.targets.find((t) => t.id === targetId);
  if (!v || !target) return fail('illegal');
  const check = canAnnex(v, target);
  if (!check.ok) return check;
  target.owner = v.id;
  v.oases.push(target.id);
  addStat(s, 'villageOases');
  return OK;
}

export function expansionSlots(s: GameState): number {
  return s.village.villages.reduce(
    (sum, v) => sum + Math.floor(buildingLevel(v, 'residence') / 10),
    0,
  );
}

export function canFound(s: GameState, v: Village, siteId: string): VResult {
  const site = s.village.sites.find((x) => x.id === siteId);
  if (!site) return fail('illegal');
  const owned =
    s.village.villages.length + s.village.movements.filter((m) => m.kind === 'settle').length;
  if (owned >= MAX_VILLAGES) return fail('max');
  if (owned - 1 >= expansionSlots(s)) return fail('residence');
  if (s.village.cp < (CP_FOR_VILLAGE[owned] ?? Infinity)) return fail('cp');
  if ((v.troops.settler ?? 0) < SETTLERS_PER_VILLAGE) return fail('settlers');
  if (s.village.movements.some((m) => m.kind === 'settle' && m.target === siteId))
    return fail('illegal');
  return OK;
}

export function foundVillage(s: GameState, villageId: number, siteId: string): VResult {
  const v = getVillage(s, villageId);
  if (!v) return fail('illegal');
  const check = canFound(s, v, siteId);
  if (!check.ok) return check;
  const site = s.village.sites.find((x) => x.id === siteId)!;
  const troops = takeTroops(v, { settler: SETTLERS_PER_VILLAGE })!;
  const time = travelTime(v, troops, distance(v.x, v.y, site.x, site.y));
  newMovement(s, {
    kind: 'settle',
    from: v.id,
    target: siteId,
    troops,
    res: zero(),
    remaining: time,
    total: time,
  });
  return OK;
}

export function merchants(v: Village): number {
  return buildingLevel(v, 'market');
}

export function busyMerchants(s: GameState, v: Village): number {
  return s.village.movements
    .filter((m) => m.kind === 'trade' && m.from === v.id)
    .reduce(
      (n, m) => n + Math.ceil(V_RESOURCES.reduce((a, r) => a + m.res[r], 0) / MERCHANT_CARRY),
      0,
    );
}

export function sendResources(
  s: GameState,
  fromId: number,
  toId: number,
  res: VCostState,
): VResult {
  const v = getVillage(s, fromId);
  const to = getVillage(s, toId);
  if (!v || !to || v === to) return fail('illegal');
  const total = V_RESOURCES.reduce((a, r) => a + Math.max(0, Math.floor(res[r])), 0);
  if (total <= 0) return fail('illegal');
  if (Math.ceil(total / MERCHANT_CARRY) > merchants(v) - busyMerchants(s, v))
    return fail('merchants');
  const amount = zero();
  for (const r of V_RESOURCES) {
    amount[r] = Math.max(0, Math.floor(res[r]));
    if (v.res[r] < amount[r]) return fail('resources');
  }
  for (const r of V_RESOURCES) v.res[r] -= amount[r];
  const time = Math.max(5, Math.round(((distance(v.x, v.y, to.x, to.y) / 16) * 3600) / SPEED));
  newMovement(s, {
    kind: 'trade',
    from: v.id,
    target: String(to.id),
    troops: {},
    res: amount,
    remaining: time,
    total: time,
  });
  return OK;
}

/** NPC merchant: swap resources 1:1 for a small gold fee. */
export function marketTrade(
  s: GameState,
  villageId: number,
  give: VRes,
  want: VRes,
  amount: number,
): VResult {
  const v = getVillage(s, villageId);
  if (!v || give === want || amount <= 0) return fail('illegal');
  if (buildingLevel(v, 'market') < 1) return fail('requires');
  const n = Math.floor(Math.min(amount, v.res[give], capFor(v, want) - v.res[want]));
  if (n <= 0) return fail('resources');
  const fee = Math.ceil(n / 10) * MARKET_FEE;
  if (s.gold.lt(fee)) return fail('gold');
  s.gold = s.gold.sub(fee);
  v.res[give] -= n;
  v.res[want] += n;
  addStat(s, 'villageTrades');
  return OK;
}

export function harborRate(v: Village): number {
  return 1 + 0.1 * Math.max(0, buildingLevel(v, 'harbor') - 1);
}

/** Best island item to ship for a resource (most in stock). */
export function harborSource(s: GameState, res: VRes): string | null {
  const imp = HARBOR_IMPORTS.find((h) => h.res === res);
  if (!imp) return null;
  const items = imp.items.filter((i) => ITEM_MAP.has(i) && itemCount(s, i) > 0);
  return items.sort((a, b) => itemCount(s, b) - itemCount(s, a))[0] ?? null;
}

/** Ships up to `qty` island items into village resources. */
export function harborImport(s: GameState, villageId: number, res: VRes, qty: number): VResult {
  const v = getVillage(s, villageId);
  if (!v) return fail('illegal');
  if (buildingLevel(v, 'harbor') < 1) return fail('requires');
  const item = harborSource(s, res);
  const imp = HARBOR_IMPORTS.find((h) => h.res === res)!;
  if (!item) return fail('items');
  const per = imp.per * harborRate(v);
  const room = capFor(v, res) - v.res[res];
  const n = Math.min(qty, itemCount(s, item), Math.floor(room / per));
  if (n <= 0) return fail('full');
  removeItem(s, item, n);
  v.res[res] += n * per;
  addStat(s, 'villageImports', n);
  return OK;
}

/** Sells village resources to island merchants for gold. */
export function harborExport(
  s: GameState,
  villageId: number,
  res: VRes,
  amount: number,
  emit: Emit,
): VResult {
  const v = getVillage(s, villageId);
  if (!v) return fail('illegal');
  if (buildingLevel(v, 'harbor') < 1) return fail('requires');
  const n = Math.floor(Math.min(amount, v.res[res]) / 100) * 100;
  if (n <= 0) return fail('resources');
  v.res[res] -= n;
  earnGold(s, new Decimal((n / 100) * HARBOR_GOLD_PER_100 * harborRate(v)), emit);
  return OK;
}

export function startCelebration(s: GameState, villageId: number, id: string): VResult {
  const v = getVillage(s, villageId);
  const def = CELEBRATIONS.find((c) => c.id === id);
  if (!v || !def) return fail('illegal');
  if (v.celebration) return fail('queue');
  if (buildingLevel(v, 'townhall') < def.townhall) return fail('requires');
  if (!canPay(v, def.cost)) return fail('resources');
  pay(v, def.cost);
  v.celebration = { remaining: def.time / SPEED, cp: def.cp };
  return OK;
}

export function renameVillage(s: GameState, villageId: number, name: string): void {
  const v = getVillage(s, villageId);
  const clean = name.trim().slice(0, 24);
  if (v && clean) v.name = clean;
}

export function cpPerHour(s: GameState): number {
  let cp = 0;
  for (const v of s.village.villages)
    for (const [id, lvl] of Object.entries(v.buildings))
      cp += lvl * (V_BUILDING_MAP.get(id)?.cp ?? 0);
  return cp * SPEED;
}

// --- Reports --------------------------------------------------------------------------------------

function report(s: GameState, r: Omit<VReport, 'id' | 'at'>, emit: Emit): void {
  const full: VReport = { ...r, id: s.village.nextId++, at: s.village.clock };
  s.village.reports = [full, ...s.village.reports].slice(0, 30);
  s.village.unread++;
  emit({ type: 'villageReport', kind: r.kind, won: r.won, title: r.title });
}

export function markReportsRead(s: GameState): void {
  s.village.unread = 0;
}

function lossesText(losses: Record<string, number>): string {
  const parts = Object.entries(losses)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${n}× ${TROOP_MAP.get(id)?.icon ?? id}`);
  return parts.length ? `Verluste: ${parts.join(' ')}` : 'Keine Verluste';
}

/** Travian-style battle: returns the loss fractions for attacker and defender. */
export function battle(
  attack: number,
  defense: number,
): { attackerLoss: number; defenderLoss: number; won: boolean } {
  if (attack <= 0) return { attackerLoss: 1, defenderLoss: 0, won: false };
  if (defense <= 0) return { attackerLoss: 0, defenderLoss: 1, won: true };
  const won = attack > defense;
  const x = Math.pow(Math.min(attack, defense) / Math.max(attack, defense), 1.5);
  return won
    ? { attackerLoss: x / (1 + x), defenderLoss: 1 / (1 + x), won }
    : { attackerLoss: 1 / (1 + x), defenderLoss: x / (1 + x), won };
}

function applyLosses(troops: Record<string, number>, frac: number): Record<string, number> {
  const losses: Record<string, number> = {};
  for (const [id, n] of Object.entries(troops)) {
    const lost = Math.min(n, Math.round(n * frac));
    losses[id] = lost;
    troops[id] = n - lost;
  }
  return losses;
}

function resolveRaid(s: GameState, m: VMovement, rng: Rng, emit: Emit): void {
  const v = getVillage(s, m.from);
  const target = s.village.targets.find((t) => t.id === m.target);
  if (!v || !target) return;
  const attack = attackValue(v, m.troops, target.kind === 'ruin');
  const result = battle(attack, target.defense);
  const troops = { ...m.troops };
  const losses = applyLosses(troops, result.attackerLoss);
  target.defense = Math.max(0, target.defense * (1 - result.defenderLoss));
  if (target.defense < target.maxDefense * 0.02) target.defense = 0;
  const loot = zero();
  if (result.won) {
    let carry = carryOf(troops);
    const total = V_RESOURCES.reduce((a, r) => a + target.stock[r], 0);
    if (total > 0 && carry > 0) {
      const share = Math.min(1, carry / total);
      for (const r of V_RESOURCES) {
        loot[r] = Math.floor(target.stock[r] * share);
        target.stock[r] -= loot[r];
        carry -= loot[r];
      }
    }
  }
  const survivors = Object.values(troops).reduce((a, b) => a + b, 0);
  const lootSum = V_RESOURCES.reduce((a, r) => a + loot[r], 0);
  addStat(s, 'villageLoot', lootSum);
  if (result.won) addStat(s, 'villageRaidsWon');
  report(
    s,
    {
      kind: 'raid',
      village: v.id,
      won: result.won,
      title: `${result.won ? 'Sieg' : 'Niederlage'}: ${target.icon} ${target.name} (Stufe ${target.level})`,
      text: `${lossesText(losses)}. ${result.won ? `Beute: ${lootSum} Rohstoffe${target.defense === 0 ? ' – das Ziel ist geräumt!' : ''}` : 'Die Verteidiger halten stand.'}`,
      loot,
      losses,
    },
    emit,
  );
  if (survivors > 0) {
    newMovement(s, {
      kind: 'return',
      from: v.id,
      target: target.id,
      troops,
      res: loot,
      remaining: m.total,
      total: m.total,
    });
  }
  // Rift ruins also guard aether for the island.
  if (result.won && target.kind === 'ruin' && ITEM_MAP.has('aether'))
    gainItem(s, 'aether', target.level + Math.floor(rng() * 3), emit, true);
}

function arrive(s: GameState, m: VMovement, rng: Rng, emit: Emit): void {
  switch (m.kind) {
    case 'raid':
      resolveRaid(s, m, rng, emit);
      break;
    case 'return': {
      const v = getVillage(s, m.from);
      if (!v) return;
      for (const [id, n] of Object.entries(m.troops)) v.troops[id] = (v.troops[id] ?? 0) + n;
      add(v, m.res);
      break;
    }
    case 'trade': {
      const to = getVillage(s, Number(m.target));
      if (to) add(to, m.res);
      break;
    }
    case 'settle': {
      const site = s.village.sites.find((x) => x.id === m.target);
      const from = getVillage(s, m.from);
      if (!site || s.village.villages.length >= MAX_VILLAGES) {
        if (from) from.troops.settler = (from.troops.settler ?? 0) + SETTLERS_PER_VILLAGE;
        return;
      }
      const id = s.village.nextId++;
      const name = `Dorf ${s.village.villages.length + 1}`;
      s.village.villages = [
        ...s.village.villages,
        createVillage(id, name, site.x, site.y, site.layout, false),
      ];
      s.village.sites = s.village.sites.filter((x) => x.id !== site.id);
      addStat(s, 'villagesFounded');
      s.stats.villageCount = s.village.villages.length;
      invalidateMods(s);
      report(
        s,
        {
          kind: 'settle',
          village: id,
          won: true,
          title: `🏡 ${name} gegründet!`,
          text: `Deine Siedler haben ein ${VALLEYS[site.layout]?.name ?? ''}-Tal besiedelt.`,
        },
        emit,
      );
      emit({ type: 'villageFounded', name });
      break;
    }
  }
}

// --- Invasions from the rift --------------------------------------------------------------------

export function invasionStrength(s: GameState): number {
  const pop = totalPopulation(s);
  return Math.round((20 + Math.pow(pop, 1.15) * 2.2) * (1 + 0.06 * s.village.invasionsWon));
}

function invade(s: GameState, rng: Rng, emit: Emit): void {
  const v = s.village.villages.reduce((a, b) => (population(b) > population(a) ? b : a));
  const attack = invasionStrength(s) * (0.8 + rng() * 0.4);
  const defense = defenseValue(v, v.troops);
  const result = battle(attack, defense);
  const losses = applyLosses(v.troops, result.defenderLoss);
  // Defender view: `result.won` is the attacker's win.
  const plunder = zero();
  if (result.won) {
    const protect = crannyProtection(v);
    for (const r of V_RESOURCES) {
      plunder[r] = Math.floor(Math.max(0, v.res[r] - protect) * 0.3 * (1 - result.attackerLoss));
      v.res[r] -= plunder[r];
    }
    s.village.invasionsLost++;
  } else {
    s.village.invasionsWon++;
    addStat(s, 'villageInvasionsRepelled');
    const essence = Math.max(1, Math.round(attack / 40));
    s.rift.essence += essence;
    s.rift.essenceTotal += essence;
    if (ITEM_MAP.has('aether')) gainItem(s, 'aether', 1 + Math.floor(attack / 300), emit);
  }
  const lost = V_RESOURCES.reduce((a, r) => a + plunder[r], 0);
  report(
    s,
    {
      kind: 'invasion',
      village: v.id,
      won: !result.won,
      title: result.won
        ? `🌀 Riss-Horde plündert ${v.name}!`
        : `🛡️ Riss-Horde vor ${v.name} abgewehrt!`,
      text: `Angriff ${Math.round(attack)} gegen Verteidigung ${Math.round(defense)}. ${lossesText(losses)}. ${result.won ? `Geplündert: ${lost} Rohstoffe (Versteck schützt ${crannyProtection(v)} je Sorte).` : 'Die Horde zerfällt zu Äther – Riss-Essenz für dich!'}`,
      losses,
      loot: plunder,
    },
    emit,
  );
}

// --- Time -----------------------------------------------------------------------------------------

function villageNext(s: GameState, v: Village): number {
  let next = Infinity;
  const f = v.queue.field[0];
  if (f) next = Math.min(next, f.remaining);
  const c = v.queue.center[0];
  if (c) next = Math.min(next, c.remaining);
  const tr = v.training[0];
  if (tr) next = Math.min(next, tr.each - tr.progress);
  if (v.research) next = Math.min(next, v.research.remaining);
  if (v.celebration) next = Math.min(next, v.celebration.remaining);
  const net = netCrop(s, v);
  if (net < 0 && v.res.crop > 0) next = Math.min(next, (v.res.crop / -net) * 3600);
  return next;
}

function tickVillage(s: GameState, v: Village, dt: number, emit: Emit): void {
  const prod = production(s, v);
  const use = upkeep(s, v);
  for (const r of V_RESOURCES) {
    const gain = ((r === 'crop' ? prod.crop - use : prod[r]) * dt) / 3600;
    v.res[r] = Math.min(capFor(v, r), v.res[r] + gain);
  }
  if (v.res.crop < 0) starve(s, v, emit);
  for (const lane of ['field', 'center'] as const) {
    const item = v.queue[lane][0];
    if (!item) continue;
    item.remaining -= dt;
    if (item.remaining <= 1e-6) {
      item.remaining = 0;
      completeQueue(s, v, lane, emit);
    }
  }
  let left = dt;
  while (left > 0 && v.training[0]) {
    const tr = v.training[0];
    const need = tr.each - tr.progress;
    if (left + 1e-6 < need) {
      tr.progress += left;
      break;
    }
    left -= need;
    tr.progress = 0;
    tr.count--;
    v.troops[tr.troop] = (v.troops[tr.troop] ?? 0) + 1;
    addStat(s, 'villageTroopsTrained');
    if (tr.count <= 0) {
      v.training.shift();
      emit({ type: 'villageTrained', troop: tr.troop, village: v.name });
    }
  }
  if (v.research) {
    v.research.remaining -= dt;
    if (v.research.remaining <= 1e-6) {
      const troop = v.research.troop;
      v.research = null;
      if (!s.village.researched.includes(troop))
        s.village.researched = [...s.village.researched, troop];
      emit({ type: 'villageResearched', troop });
    }
  }
  if (v.celebration) {
    v.celebration.remaining -= dt;
    if (v.celebration.remaining <= 1e-6) {
      const cp = v.celebration.cp;
      v.celebration = null;
      s.village.cp += cp;
      s.village.cpTotal += cp;
      emit({ type: 'villageCelebration', village: v.name, cp });
    }
  }
}

/** Crop ran out: troops at home starve (biggest eaters first) until the balance is positive. */
function starve(s: GameState, v: Village, emit: Emit): void {
  v.res.crop = 0;
  const losses: Record<string, number> = {};
  const order = Object.keys(v.troops).sort(
    (a, b) => (TROOP_MAP.get(b)?.upkeep ?? 0) - (TROOP_MAP.get(a)?.upkeep ?? 0),
  );
  for (const id of order) {
    while ((v.troops[id] ?? 0) > 0 && netCrop(s, v) < 0) {
      v.troops[id]!--;
      losses[id] = (losses[id] ?? 0) + 1;
    }
  }
  if (Object.keys(losses).length)
    report(
      s,
      {
        kind: 'starve',
        village: v.id,
        won: false,
        title: `🍂 Hungersnot in ${v.name}`,
        text: `Ohne Getreide desertieren Truppen. ${lossesText(losses)}.`,
        losses,
      },
      emit,
    );
}

registerTimeEffect('village', {
  next: (s) => {
    const vs = s.village;
    let next = Infinity;
    for (const v of vs.villages) next = Math.min(next, villageNext(s, v));
    for (const m of vs.movements) next = Math.min(next, m.remaining);
    next = Math.min(next, vs.protection > 0 ? vs.protection : vs.invasionIn);
    return Math.max(0, next);
  },
  apply: (s, dt, emit, rng) => {
    if (dt <= 0) return;
    const vs = s.village;
    vs.clock += dt;
    for (const v of vs.villages) tickVillage(s, v, dt, emit);
    // Culture points.
    const cp = (cpPerHour(s) * dt) / 3600;
    vs.cp += cp;
    vs.cpTotal += cp;
    // Targets recover: defenders regrow 25 %/h, stock refills 50 %/h.
    for (const t of vs.targets) {
      if (t.owner !== null) continue;
      t.defense = Math.min(t.maxDefense, t.defense + (t.maxDefense * 0.25 * dt) / 3600);
      for (const r of V_RESOURCES)
        t.stock[r] = Math.min(t.stockMax / 2, t.stock[r] + (t.stockMax * 0.5 * dt) / 3600 / 4);
    }
    // Movements.
    if (vs.movements.length) {
      for (const m of vs.movements) m.remaining -= dt;
      const arrived = vs.movements.filter((m) => m.remaining <= 1e-6);
      if (arrived.length) {
        vs.movements = vs.movements.filter((m) => m.remaining > 1e-6);
        for (const m of arrived) arrive(s, m, rng, emit);
      }
    }
    // Rift invasions after the beginner protection.
    if (vs.protection > 0) vs.protection = Math.max(0, vs.protection - dt);
    else {
      vs.invasionIn -= dt;
      if (vs.invasionIn <= 1e-6) {
        vs.invasionIn =
          INVASION_INTERVAL[0] + rng() * (INVASION_INTERVAL[1] - INVASION_INTERVAL[0]);
        invade(s, rng, emit);
      }
    }
  },
});

// --- Boni for the island and the rift -----------------------------------------------------------

registerModifierSource('village', (s) => {
  // The first 20 inhabitants are the founding families – the bonus starts after them.
  const pop = Math.max(0, totalPopulation(s) - 20);
  const best = (id: string) => bestBuilding(s, id);
  return [
    {
      xp: Math.min(0.25, pop * 0.0004),
      gold: Math.min(0.15, pop * 0.00025),
      'speed.woodcutting': 0.01 * best('sawmill'),
      'speed.mining': 0.01 * best('brickyard'),
      'speed.smithing': 0.01 * best('foundry'),
      'speed.farming': 0.01 * best('mill'),
      'xp.cooking': 0.02 * best('bakery'),
      'combat.damage': 0.005 * best('smithy'),
      'combat.defence': 0.005 * best('wall'),
      research: 0.02 * best('library'),
    },
  ];
});

/** Rift hero boni from the village (smithy → might, wall → armor). */
export function villageRiftBonus(s: GameState): { might: number; armor: number } {
  return {
    might: 0.005 * bestBuilding(s, 'smithy'),
    armor: Math.floor(bestBuilding(s, 'wall') / 5),
  };
}

/** Rift spoils shipped to the active village. */
export function villageTribute(s: GameState, amount: number): VCostState {
  const v = activeVillage(s);
  const res = { wood: amount, clay: amount, iron: amount, crop: amount };
  add(v, res);
  return res;
}

/** Badge for the tab bar: unread reports + idle build lanes. */
export function villageAttention(s: GameState): number {
  return s.village.unread;
}

export const RESEARCH_TROOPS = TROOPS.filter((t) => t.research);
