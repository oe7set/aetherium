import { ACTIONS, getAction, getTool, SKILL_MAP } from '../data';
import { COLLECTION_BY_ITEM } from '../data/collections';
import { BALANCE } from '../data/balance';
import type { ActionDef, LootEntry } from '../data/types';
import type { Emit, GameEvent, StopReason } from './events';
import { addItem, firstMissing, freeSlots, hasRoomFor, itemCount, removeItem } from './inventory';
import { invalidateMods, mod, modFor, registerModifierSource } from './modifiers';
import type { Rng } from './rng';
import { randInt } from './rng';
import { masteryDouble, masteryLevel, masterySpeed } from './mastery';
import { addXp, skillLevel } from './skills';
import { addStat, type GameState } from './state';

export const EPS = 1e-9;
/** Hard guard against pathological loops (e.g. 24 h offline at minimum action time). */
const MAX_STEPS = 3_000_000;

// Built-in modifier sources: campfire warmth and intelligence.
registerModifierSource('fire', (s) => (s.fire > 0 ? [{ xp: BALANCE.FIRE_XP_BONUS }] : []));
registerModifierSource('intelligence', (s) =>
  s.intelligence > 0 ? [{ xp: s.intelligence * BALANCE.INTELLIGENCE_XP_BONUS }] : [],
);

/** Speed multiplier from the equipped tool of the action's skill. */
export function toolSpeed(s: GameState, skill: string): number {
  if (!SKILL_MAP.get(skill)?.usesTools) return 1;
  const toolId = s.equippedTools[skill];
  return toolId ? getTool(toolId).speed : 1;
}

/** Combined XP multiplier for a skill (1 = no bonus). */
export function xpMultiplierFor(s: GameState, skill: string): number {
  return 1 + modFor(s, 'xp', skill);
}

/** Seconds one cycle of `def` takes for this player right now (before helper slowdowns). */
export function actionDuration(s: GameState, def: ActionDef): number {
  const levelsAbove = Math.max(0, skillLevel(s, def.skill) - def.levelReq);
  const levelBonus = Math.min(
    BALANCE.LEVEL_SPEED_BONUS_CAP,
    levelsAbove * BALANCE.LEVEL_SPEED_BONUS,
  );
  const speed =
    toolSpeed(s, def.skill) *
    (1 + levelBonus) *
    (1 + modFor(s, 'speed', def.skill)) *
    (1 + masterySpeed(masteryLevel(s, def.id)));
  return Math.max(BALANCE.MIN_ACTION_TIME, def.baseTime / speed);
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
  chance *= 1 - Math.min(0.9, mod(s, 'burn'));
  return Math.max(0, chance);
}

/** XP one completion grants, after multipliers. */
export function actionXp(s: GameState, def: ActionDef): number {
  return def.xp * xpMultiplierFor(s, def.skill);
}

/** Chance that a completion yields double output. */
export function doubleChance(s: GameState, def: ActionDef): number {
  return Math.min(1, modFor(s, 'double', def.skill) + masteryDouble(masteryLevel(s, def.id)));
}

export type CheckResult = { ok: true } | { ok: false; reason: StopReason; missingItem?: string };

export function canPerform(s: GameState, def: ActionDef): CheckResult {
  for (const check of availabilityChecks)
    if (!check(s, def)) return { ok: false, reason: 'locked' };
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

/** Hooks run on every completed action (research points, element discovery …). */
type CompletionHook = (
  s: GameState,
  def: ActionDef,
  rng: Rng,
  emit: Emit,
  xpFactor: number,
) => void;
const completionHooks: { name: string; fn: CompletionHook }[] = [];
export function registerCompletionHook(name: string, fn: CompletionHook): void {
  if (!completionHooks.some((h) => h.name === name)) completionHooks.push({ name, fn });
}

/** Extra availability checks registered by other modules (tech locks). */
type AvailabilityCheck = (s: GameState, def: ActionDef) => boolean;
const availabilityChecks: AvailabilityCheck[] = [];
export function registerAvailabilityCheck(fn: AvailabilityCheck): void {
  availabilityChecks.push(fn);
}

/** Hook for other modules (combat) to stop when the player starts skilling and vice versa. */
const startHooks: ((s: GameState, emit: Emit) => void)[] = [];
export function onActionStart(fn: (s: GameState, emit: Emit) => void): void {
  startHooks.push(fn);
}

export function startAction(s: GameState, actionId: string, emit: Emit): CheckResult {
  const def = getAction(actionId);
  const check = canPerform(s, def);
  if (!check.ok) {
    emit({ type: 'actionStopped', actionId, reason: check.reason, missingItem: check.missingItem });
    return check;
  }
  if (s.active?.actionId === actionId) return check;
  for (const hook of startHooks) hook(s, emit);
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

/** Rolls a loot table: each entry is checked independently. `rareBonus` scales rare chances. */
export function rollDrops(
  rng: Rng,
  table: readonly LootEntry[],
  rareBonus = 0,
): { entry: LootEntry; qty: number }[] {
  const out: { entry: LootEntry; qty: number }[] = [];
  for (const entry of table) {
    const chance = entry.rare ? entry.chance * (1 + rareBonus) : entry.chance;
    if (rng() < chance) out.push({ entry, qty: rollQty(rng, entry) });
  }
  return out;
}

/** Adds an item, emitting gain/rare/lost events and tracking lifetime totals for achievements. */
export function gainItem(
  s: GameState,
  item: string,
  qty: number,
  emit: Emit,
  rare = false,
): boolean {
  const known = s.progress.found.includes(item);
  if (addItem(s, item, qty)) {
    if (!known) {
      const set = COLLECTION_BY_ITEM.get(item);
      if (set) {
        const found = new Set(s.progress.found);
        const have = set.items.filter((i) => found.has(i)).length;
        emit({ type: 'albumFound', item, set: set.id, have, total: set.items.length });
      }
    }
    if (rare) emit({ type: 'rareDrop', item, qty });
    emit({ type: 'itemGained', item, qty });
    addStat(s, `obtained.${item}`, qty);
    return true;
  }
  emit({ type: 'itemLost', item, qty });
  addStat(s, 'itemsLostFullInventory', qty);
  return false;
}

export function addFuel(s: GameState, seconds: number, emit: Emit): void {
  const wasOut = s.fire <= EPS;
  s.fire = Math.min(BALANCE.FIRE_MAX_SECONDS * (1 + mod(s, 'fireDuration')), s.fire + seconds);
  if (wasOut && s.fire > EPS) {
    invalidateMods(s);
    emit({ type: 'fireLit' });
  }
}

/** Per-skill completion counters used by stats, achievements and the 3D feedback. */
const SKILL_STATS: Record<string, string> = {
  woodcutting: 'treesFelled',
  mining: 'oresMined',
  firemaking: 'fuelBurned',
  fishing: 'fishCaught',
};

/**
 * Applies one completed cycle: consume inputs, produce outputs, roll drops, grant XP.
 * `xpFactor` lets helpers earn reduced XP.
 */
export function completeAction(
  s: GameState,
  def: ActionDef,
  rng: Rng,
  emit: Emit,
  xpFactor = 1,
): void {
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
    addXp(s, def.skill, actionXp(s, def) * 0.1 * xpFactor, emit);
  } else {
    const mult = rng() < doubleChance(s, def) ? 2 : 1;
    if (mult > 1) addStat(s, 'doubleOutputs');
    for (const output of def.outputs) gainItem(s, output.item, output.qty * mult, emit);
    addXp(s, def.skill, actionXp(s, def) * xpFactor, emit);
    if (def.skill === 'cooking') addStat(s, 'foodCooked');
    if (def.skill === 'smithing')
      addStat(s, def.category === 'Barren' ? 'barsSmelted' : 'itemsSmithed');
  }

  if (def.fuelSeconds) addFuel(s, def.fuelSeconds * (1 + mod(s, 'fireDuration')), emit);

  if (def.drops) {
    for (const { entry, qty } of rollDrops(rng, def.drops, mod(s, 'rare'))) {
      gainItem(s, entry.item, qty, emit, entry.rare);
      if (entry.item === 'bird_nest') addStat(s, 'nestsFound');
    }
  }

  for (const h of completionHooks) h.fn(s, def, rng, emit, xpFactor);
  const masteryBefore = masteryLevel(s, def.id);
  addStat(s, `action.${def.id}`);
  const masteryAfter = masteryLevel(s, def.id);
  if (masteryAfter > masteryBefore) {
    addStat(s, 'masteryLevels');
    invalidateMods(s); // the skill's mastery pool may cross a tier
    emit({ type: 'mastery', actionId: def.id, level: masteryAfter });
  }
  addStat(s, `skillActions.${def.skill}`);
  const stat = SKILL_STATS[def.skill];
  if (stat) addStat(s, stat);
  emit({ type: 'actionComplete', actionId: def.id });
}

// --- Simulation runners ---------------------------------------------------------------------

/**
 * Anything that progresses over time and completes in discrete events: the player's action,
 * combat, helpers. `advance` steps all runners in lockstep from event to event.
 */
export interface Runner {
  /** Validate before progressing. Return false after stopping itself (emit the reason). */
  validate(): boolean;
  /** Seconds until the next completion. */
  timeLeft(): number;
  /** Whether progressing requires the campfire. */
  needsFire(): boolean;
  progress(dt: number): void;
  ready(): boolean;
  complete(): void;
}

/**
 * Continuous effects that are not runners: fire burning, buff timers, market recovery …
 * `next` returns seconds until something discrete happens (Infinity if nothing).
 */
export interface TimeEffect {
  next(s: GameState): number;
  apply(s: GameState, dt: number, emit: Emit, rng: Rng): void;
}

type RunnerFactory = (s: GameState, rng: Rng, emit: Emit) => Runner[];

const runnerFactories: { name: string; fn: RunnerFactory }[] = [];
const timeEffects: { name: string; effect: TimeEffect }[] = [];
const afterAdvanceHooks: { name: string; fn: (s: GameState, emit: Emit) => void }[] = [];

export function registerRunnerFactory(name: string, fn: RunnerFactory): void {
  if (!runnerFactories.some((r) => r.name === name)) runnerFactories.push({ name, fn });
}

export function registerTimeEffect(name: string, effect: TimeEffect): void {
  if (!timeEffects.some((t) => t.name === name)) timeEffects.push({ name, effect });
}

const afterCompleteHooks: { name: string; fn: (s: GameState, emit: Emit) => void }[] = [];

/** Runs after every runner completion (must be cheap: offline runs it ~100k times). */
export function registerAfterComplete(name: string, fn: (s: GameState, emit: Emit) => void): void {
  if (!afterCompleteHooks.some((h) => h.name === name)) afterCompleteHooks.push({ name, fn });
}

/** Runs once at the end of every advance call (achievements, quests …). */
export function registerAfterAdvance(name: string, fn: (s: GameState, emit: Emit) => void): void {
  if (!afterAdvanceHooks.some((h) => h.name === name)) afterAdvanceHooks.push({ name, fn });
}

/** The player's own skilling action as a runner. */
function mainActionRunner(s: GameState, rng: Rng, emit: Emit): Runner[] {
  const active = s.active;
  if (!active) return [];
  const def = getAction(active.actionId);
  // Duration is computed once per simulation step (the factory runs every step).
  let duration = -1;
  const getDuration = () => (duration >= 0 ? duration : (duration = actionDuration(s, def)));
  return [
    {
      validate: () => {
        const check = canPerform(s, def);
        if (check.ok) return true;
        s.active = null;
        emit({
          type: 'actionStopped',
          actionId: def.id,
          reason: check.reason,
          missingItem: check.missingItem,
        });
        return false;
      },
      timeLeft: () => Math.max(0, getDuration() - active.progress),
      needsFire: () => !!def.requiresFire,
      progress: (dt) => {
        active.progress += dt;
      },
      ready: () => active.progress >= getDuration() - EPS,
      complete: () => {
        active.progress = 0;
        completeAction(s, def, rng, emit);
      },
    },
  ];
}
registerRunnerFactory('main', mainActionRunner);

function burnFire(s: GameState, seconds: number, emit: Emit): void {
  if (s.fire <= 0) return;
  s.fire -= seconds;
  if (s.fire <= EPS) {
    s.fire = 0;
    invalidateMods(s);
    emit({ type: 'fireOut' });
  }
}

registerTimeEffect('fire', {
  next: (s) => (s.fire > 0 ? s.fire : Infinity),
  apply: (s, dt, emit) => burnFire(s, dt, emit),
});

/**
 * Advances the simulation by `dt` seconds. Event-driven: jumps from event to event,
 * so the live tick, offline progress and the debug fast-forward share the exact same code path.
 */
export function advance(s: GameState, dt: number, rng: Rng, emit: Emit): void {
  let remaining = Math.max(0, dt);
  let steps = 0;
  // Boundary hooks also run at the start so state changes made outside advance (selling,
  // equipping …) take effect before the first step – keeps live and offline identical.
  for (const h of afterAdvanceHooks) h.fn(s, emit);
  outer: while (steps++ < MAX_STEPS) {
    const runners: Runner[] = [];
    for (const f of runnerFactories) runners.push(...f.fn(s, rng, emit));

    for (const r of runners) if (!r.validate()) continue outer;
    for (const r of runners) {
      if (r.ready()) {
        r.complete();
        for (const h of afterCompleteHooks) h.fn(s, emit);
        continue outer;
      }
    }
    if (remaining <= EPS) break;

    let step = remaining;
    let fireNeeded = false;
    for (const r of runners) {
      step = Math.min(step, r.timeLeft());
      if (r.needsFire()) fireNeeded = true;
    }
    for (const { effect } of timeEffects) step = Math.min(step, Math.max(EPS, effect.next(s)));
    if (fireNeeded) step = Math.min(step, s.fire);
    step = Math.max(step, 0);

    for (const r of runners) {
      if (!r.needsFire() || s.fire > EPS) r.progress(step);
    }
    for (const { effect } of timeEffects) effect.apply(s, step, emit, rng);
    remaining -= step;
  }
  for (const h of afterAdvanceHooks) h.fn(s, emit);
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
