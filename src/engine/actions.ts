import { ACTIONS, getAction, getTool, SKILL_MAP } from '../data';
import { BALANCE } from '../data/balance';
import type { ActionDef, LootEntry } from '../data/types';
import type { Emit, GameEvent, StopReason } from './events';
import { addItem, firstMissing, freeSlots, hasRoomFor, itemCount, removeItem } from './inventory';
import type { Rng } from './rng';
import { randInt } from './rng';
import { addXp, skillLevel, xpMultiplier } from './skills';
import { addStat, type GameState } from './state';

const EPS = 1e-9;
/** Hard guard against pathological loops (e.g. 24 h offline at minimum action time). */
const MAX_STEPS = 2_000_000;

/** Speed multiplier from the equipped tool of the action's skill. */
export function toolSpeed(s: GameState, skill: string): number {
  if (!SKILL_MAP.get(skill)?.usesTools) return 1;
  const toolId = s.equippedTools[skill];
  return toolId ? getTool(toolId).speed : 1;
}

/** Seconds one cycle of `def` takes for this player right now. */
export function actionDuration(s: GameState, def: ActionDef): number {
  const levelsAbove = Math.max(0, skillLevel(s, def.skill) - def.levelReq);
  const levelBonus = Math.min(
    BALANCE.LEVEL_SPEED_BONUS_CAP,
    levelsAbove * BALANCE.LEVEL_SPEED_BONUS,
  );
  const time = def.baseTime / (toolSpeed(s, def.skill) * (1 + levelBonus));
  return Math.max(BALANCE.MIN_ACTION_TIME, time);
}

/** Burn chance for cooking-type actions: linear from `chanceAtReq` down to 0 at `stopBurnLevel`. */
export function burnChance(s: GameState, def: ActionDef): number {
  if (!def.burn) return 0;
  const { chanceAtReq, stopBurnLevel } = def.burn;
  const level = skillLevel(s, def.skill);
  const span = Math.max(1, stopBurnLevel - def.levelReq);
  const t = Math.min(1, Math.max(0, (level - def.levelReq) / span));
  let chance = chanceAtReq * (1 - t);
  if (s.fire > BALANCE.FIRE_GOOD_SECONDS) chance *= BALANCE.FIRE_GOOD_BURN_FACTOR;
  return Math.max(0, chance);
}

/** XP one completion grants, after multipliers. */
export function actionXp(s: GameState, def: ActionDef): number {
  return def.xp * xpMultiplier(s);
}

export type CheckResult = { ok: true } | { ok: false; reason: StopReason; missingItem?: string };

export function canPerform(s: GameState, def: ActionDef): CheckResult {
  if (skillLevel(s, def.skill) < def.levelReq) return { ok: false, reason: 'levelTooLow' };
  const missing = firstMissing(s, def.inputs);
  if (missing) return { ok: false, reason: 'noInputs', missingItem: missing };
  if (def.requiresFire && s.fire <= EPS) return { ok: false, reason: 'noFire' };
  // Guaranteed outputs need room. Inputs that get used up completely free their slot first.
  const outputs = def.outputs.map((o) => o.item);
  if (!hasRoomFor(s, outputs)) {
    const freed = def.inputs.filter((i) => itemCount(s, i.item) === i.qty).length;
    const newTypes = new Set(outputs.filter((o) => itemCount(s, o) <= 0)).size;
    if (newTypes > freeSlots(s) + freed) return { ok: false, reason: 'inventoryFull' };
  }
  return { ok: true };
}

export function startAction(s: GameState, actionId: string, emit: Emit): CheckResult {
  const def = getAction(actionId);
  const check = canPerform(s, def);
  if (!check.ok) {
    emit({ type: 'actionStopped', actionId, reason: check.reason, missingItem: check.missingItem });
    return check;
  }
  if (s.active?.actionId === actionId) return check;
  s.active = { actionId, progress: 0 };
  emit({ type: 'actionStarted', actionId });
  return check;
}

export function stopAction(s: GameState, emit: Emit, reason: StopReason = 'manual'): void {
  if (!s.active) return;
  const actionId = s.active.actionId;
  s.active = null;
  emit({ type: 'actionStopped', actionId, reason });
}

function rollQty(rng: Rng, entry: LootEntry): number {
  const min = entry.min ?? 1;
  const max = entry.max ?? min;
  return randInt(rng, min, max);
}

/** Rolls a loot table: each entry is checked independently. */
export function rollDrops(
  rng: Rng,
  table: readonly LootEntry[],
): { entry: LootEntry; qty: number }[] {
  const out: { entry: LootEntry; qty: number }[] = [];
  for (const entry of table)
    if (rng() < entry.chance) out.push({ entry, qty: rollQty(rng, entry) });
  return out;
}

function gainItem(s: GameState, item: string, qty: number, emit: Emit, rare = false): void {
  if (addItem(s, item, qty)) {
    emit({ type: rare ? 'rareDrop' : 'itemGained', item, qty });
    if (rare) emit({ type: 'itemGained', item, qty });
  } else {
    emit({ type: 'itemLost', item, qty });
    addStat(s, 'itemsLostFullInventory', qty);
  }
}

function addFuel(s: GameState, seconds: number, emit: Emit): void {
  const wasOut = s.fire <= EPS;
  s.fire = Math.min(BALANCE.FIRE_MAX_SECONDS, s.fire + seconds);
  if (wasOut && s.fire > EPS) emit({ type: 'fireLit' });
}

/** Applies one completed cycle: consume inputs, produce outputs, roll drops, grant XP. */
function completeAction(s: GameState, def: ActionDef, rng: Rng, emit: Emit): void {
  for (const input of def.inputs) {
    removeItem(s, input.item, input.qty);
    emit({ type: 'itemConsumed', item: input.item, qty: input.qty });
  }

  const burnt = def.burn ? rng() < burnChance(s, def) : false;
  if (burnt && def.burn) {
    const first = def.outputs[0];
    emit({ type: 'burnt', item: first?.item ?? def.burn.burntItem });
    gainItem(s, def.burn.burntItem, 1, emit);
    addStat(s, 'foodBurnt');
    // Burning still teaches you something: a tenth of the XP.
    addXp(s, def.skill, actionXp(s, def) * 0.1, emit);
  } else {
    for (const output of def.outputs) gainItem(s, output.item, output.qty, emit);
    addXp(s, def.skill, actionXp(s, def), emit);
    if (def.skill === 'cooking') addStat(s, 'foodCooked');
  }

  if (def.fuelSeconds) addFuel(s, def.fuelSeconds, emit);

  if (def.drops) {
    for (const { entry, qty } of rollDrops(rng, def.drops)) {
      gainItem(s, entry.item, qty, emit, entry.rare);
      if (entry.item === 'bird_nest') addStat(s, 'nestsFound');
    }
  }

  addStat(s, `action.${def.id}`);
  addStat(s, `skillActions.${def.skill}`);
  if (def.skill === 'woodcutting') addStat(s, 'treesFelled');
  if (def.skill === 'mining') addStat(s, 'oresMined');
  if (def.skill === 'firemaking') addStat(s, 'fuelBurned');
  emit({ type: 'actionComplete', actionId: def.id });
}

function burnFire(s: GameState, seconds: number, emit: Emit): void {
  if (s.fire <= 0) return;
  s.fire -= seconds;
  if (s.fire <= EPS) {
    s.fire = 0;
    emit({ type: 'fireOut' });
  }
}

/**
 * Advances the simulation by `dt` seconds. Event-driven: jumps from completion to completion,
 * so the live tick, offline progress and the debug fast-forward share the exact same code path.
 */
export function advance(s: GameState, dt: number, rng: Rng, emit: Emit): void {
  let remaining = Math.max(0, dt);
  let steps = 0;
  while (steps++ < MAX_STEPS) {
    const active = s.active;
    if (!active) {
      burnFire(s, remaining, emit);
      remaining = 0;
      break;
    }
    const def = getAction(active.actionId);
    const check = canPerform(s, def);
    if (!check.ok) {
      s.active = null;
      emit({
        type: 'actionStopped',
        actionId: def.id,
        reason: check.reason,
        missingItem: check.missingItem,
      });
      continue;
    }
    const duration = actionDuration(s, def);
    const needed = Math.max(0, duration - active.progress);
    if (needed <= EPS) {
      active.progress = 0;
      completeAction(s, def, rng, emit);
      continue;
    }
    if (remaining <= EPS) break;
    let step = Math.min(remaining, needed);
    if (def.requiresFire) step = Math.min(step, s.fire);
    active.progress += step;
    remaining -= step;
    burnFire(s, step, emit);
  }
}

/** A tap on the active action: pushes progress forward. Returns true if the tap counted. */
export function clickAction(s: GameState, rng: Rng, emit: Emit): boolean {
  const active = s.active;
  if (!active) return false;
  const def = getAction(active.actionId);
  active.progress += actionDuration(s, def) * BALANCE.CLICK_PROGRESS;
  addStat(s, 'clicks');
  advance(s, 0, rng, emit);
  return true;
}

/** Collected events of a simulation run. Handy for tests and summaries. */
export function simulate(s: GameState, dt: number, rng: Rng): GameEvent[] {
  const events: GameEvent[] = [];
  advance(s, dt, rng, (e) => events.push(e));
  return events;
}

/** Highest-level action of a skill the player can perform right now (used by world taps). */
export function bestAvailableAction(s: GameState, skill: string): ActionDef | undefined {
  let best: ActionDef | undefined;
  for (const def of ACTIONS) {
    if (def.skill !== skill || !canPerform(s, def).ok) continue;
    if (!best || def.levelReq > best.levelReq) best = def;
  }
  return best;
}
