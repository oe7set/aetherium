import {
  CROP_MAP,
  DISCOVERY_CHANCE,
  getAction,
  getItem,
  getTech,
  HELPER_MAP,
  MUTATION_CHANCE,
  SKILL_MAP,
  TECH_MAP,
  TECHS,
  type ModifierSet,
  type TechUnlock,
} from '../data';
import {
  actionDuration,
  canPerform,
  completeAction,
  EPS,
  gainItem,
  registerAvailabilityCheck,
  registerCompletionHook,
  registerRunnerFactory,
  registerTimeEffect,
} from './actions';
import { CODEX_COMPLETE_MODS, ELEMENT_GROUPS, type ElementGroupDef } from '../data/science';
import type { Emit } from './events';
import { itemCount, removeItem } from './inventory';
import { invalidateMods, mod, modFor, registerModifierSource } from './modifiers';
import { pick, randInt, type Rng } from './rng';
import { addXp, skillLevel } from './skills';
import { addStat, type GameState, type HelperState } from './state';

// --- Research points ----------------------------------------------------------------------------

/** Research points per base XP of a completed action. */
export const RP_PER_XP = 0.02;
export const BASE_PLOTS = 3;
/** Interns get faster with experience: +1 % per 100 tasks, up to +50 %. */
export const INTERN_LEARNING = { perTasks: 100, step: 0.01, max: 0.5 };

export function addResearch(s: GameState, base: number, emit?: Emit): number {
  const amount = base * (1 + mod(s, 'research'));
  if (amount <= 0) return 0;
  s.research += amount;
  addStat(s, 'researchEarned', amount);
  emit?.({ type: 'research', amount });
  return amount;
}

registerCompletionHook('research', (s, def, _rng, _emit, factor) => {
  addResearch(s, def.xp * RP_PER_XP * factor);
});

// --- Tech tree ----------------------------------------------------------------------------------

registerModifierSource('tech', (s) => s.techs.map((id) => getTech(id).mods ?? {}));

export function hasTech(s: GameState, id: string): boolean {
  return s.techs.includes(id);
}

const unlockCache = new WeakMap<GameState, { size: number; counts: Map<TechUnlock, number> }>();

export function techUnlockCount(s: GameState, unlock: TechUnlock): number {
  let cached = unlockCache.get(s);
  if (!cached || cached.size !== s.techs.length) {
    const counts = new Map<TechUnlock, number>();
    for (const id of s.techs)
      for (const u of getTech(id).unlocks ?? []) counts.set(u, (counts.get(u) ?? 0) + 1);
    cached = { size: s.techs.length, counts };
    unlockCache.set(s, cached);
  }
  return cached.counts.get(unlock) ?? 0;
}

export function techCost(id: string): number {
  return getTech(id).cost;
}

export type TechStatus = 'researched' | 'available' | 'locked';

export function techStatus(s: GameState, id: string): TechStatus {
  if (hasTech(s, id)) return 'researched';
  return getTech(id).requires.every((r) => hasTech(s, r)) ? 'available' : 'locked';
}

export function researchTech(s: GameState, id: string, emit: Emit): boolean {
  if (!TECH_MAP.has(id) || techStatus(s, id) !== 'available') return false;
  const cost = techCost(id);
  if (s.research < cost) return false;
  s.research -= cost;
  s.techs.push(id);
  ensurePlots(s);
  invalidateMods(s);
  addStat(s, 'techsResearched');
  emit({ type: 'techResearched', tech: id });
  return true;
}

/** Skills and actions behind tech locks. */
export function skillUnlocked(s: GameState, skill: string): boolean {
  const tech = SKILL_MAP.get(skill)?.unlockTech;
  return !tech || hasTech(s, tech);
}

registerAvailabilityCheck(
  (s, def) => skillUnlocked(s, def.skill) && (!def.requiresTech || hasTech(s, def.requiresTech)),
);

/** Techs that can be researched right now, cheapest first (UI hint). */
export function affordableTechs(s: GameState): string[] {
  return TECHS.filter((t) => techStatus(s, t.id) === 'available' && s.research >= t.cost).map(
    (t) => t.id,
  );
}

// --- Periodic table codex -----------------------------------------------------------------------

export interface ElementGroupProgress {
  group: ElementGroupDef;
  found: number;
  done: boolean;
}

/** How far each chemical group of the codex is; a complete group grants its bonus. */
export function elementGroupProgress(s: GameState): ElementGroupProgress[] {
  const known = new Set(s.codex);
  return ELEMENT_GROUPS.map((group) => {
    const found = group.symbols.filter((x) => known.has(x)).length;
    return { group, found, done: found >= group.symbols.length };
  });
}

registerModifierSource('codex', (s) => {
  if (!s.codex.length) return [];
  const out: ModifierSet[] = [{ research: s.codex.length * 0.004, xp: s.codex.length * 0.001 }];
  const groups = elementGroupProgress(s);
  for (const g of groups) if (g.done) out.push(g.group.mods);
  if (groups.every((g) => g.done)) out.push(CODEX_COMPLETE_MODS);
  return out;
});

registerCompletionHook('codex', (s, def, rng, emit) => {
  if (!def.elements) return;
  const unknown = def.elements.filter((e) => !s.codex.includes(e));
  if (!unknown.length) return;
  if (rng() >= DISCOVERY_CHANCE * (1 + mod(s, 'rare') * 0.5)) return;
  const symbol = pick(rng, unknown);
  s.codex.push(symbol);
  s.stats.codexSize = s.codex.length;
  invalidateMods(s);
  emit({ type: 'elementDiscovered', symbol });
});

// --- Farming --------------------------------------------------------------------------------------

export function plotCount(s: GameState): number {
  return BASE_PLOTS + techUnlockCount(s, 'plot');
}

export function ensurePlots(s: GameState): void {
  while (s.plots.length < plotCount(s)) s.plots.push({ seed: null, elapsed: 0 });
}

export function growthRate(s: GameState): number {
  return 1 + modFor(s, 'speed', 'farming');
}

export function plotReady(s: GameState, index: number): boolean {
  const p = s.plots[index];
  if (!p?.seed) return false;
  return p.elapsed >= (CROP_MAP.get(p.seed)?.growTime ?? Infinity) - EPS;
}

export type FarmResult =
  { ok: true } | { ok: false; reason: 'locked' | 'level' | 'noSeed' | 'occupied' | 'notReady' };

export function plantSeed(s: GameState, index: number, seed: string, emit: Emit): FarmResult {
  const crop = CROP_MAP.get(seed);
  const plot = s.plots[index];
  if (!crop || !plot) return { ok: false, reason: 'noSeed' };
  if (!skillUnlocked(s, 'farming')) return { ok: false, reason: 'locked' };
  if (plot.seed) return { ok: false, reason: 'occupied' };
  if (skillLevel(s, 'farming') < crop.level) return { ok: false, reason: 'level' };
  if (itemCount(s, seed) <= 0) return { ok: false, reason: 'noSeed' };
  removeItem(s, seed, 1);
  plot.seed = seed;
  plot.elapsed = 0;
  addXp(s, 'farming', crop.xpPlant * (1 + modFor(s, 'xp', 'farming')), emit);
  addStat(s, 'seedsPlanted');
  return { ok: true };
}

export function harvest(s: GameState, index: number, rng: Rng, emit: Emit): FarmResult {
  const plot = s.plots[index];
  if (!plot?.seed) return { ok: false, reason: 'noSeed' };
  if (!plotReady(s, index)) return { ok: false, reason: 'notReady' };
  const crop = CROP_MAP.get(plot.seed)!;
  let qty = randInt(rng, crop.yield[0], crop.yield[1]);
  if (rng() < Math.min(1, modFor(s, 'double', 'farming'))) qty *= 2;
  gainItem(s, crop.product, qty, emit);
  addXp(s, 'farming', crop.xpHarvest * (1 + modFor(s, 'xp', 'farming')), emit);
  addResearch(s, crop.xpHarvest * RP_PER_XP);
  // Seeds come back: one guaranteed, sometimes a spare.
  gainItem(s, crop.seed, 1 + (rng() < 0.3 ? 1 : 0), emit);
  let mutated: string | undefined;
  if (crop.mutatesTo && rng() < MUTATION_CHANCE * (1 + mod(s, 'rare'))) {
    mutated = crop.mutatesTo;
    gainItem(s, mutated, 1, emit, true);
    addStat(s, 'mutations');
  }
  addStat(s, 'harvests');
  plot.seed = null;
  plot.elapsed = 0;
  emit({ type: 'harvested', plot: index, item: crop.product, qty, mutated });
  return { ok: true };
}

registerTimeEffect('farming', {
  next: (s) => {
    if (techUnlockCount(s, 'autoHarvest') <= 0) return Infinity;
    const rate = growthRate(s);
    let best = Infinity;
    for (const p of s.plots) {
      if (!p.seed) continue;
      const left = ((CROP_MAP.get(p.seed)?.growTime ?? Infinity) - p.elapsed) / rate;
      best = Math.min(best, Math.max(0, left));
    }
    return best;
  },
  apply: (s, dt, emit, rng) => {
    const rate = growthRate(s);
    for (const p of s.plots) if (p.seed) p.elapsed += dt * rate;
    if (techUnlockCount(s, 'autoHarvest') <= 0) return;
    s.plots.forEach((p, i) => {
      if (!p.seed || !plotReady(s, i)) return;
      const seed = p.seed;
      harvest(s, i, rng, emit);
      plantSeed(s, i, seed, emit);
    });
  },
});

// --- Helpers --------------------------------------------------------------------------------------

export function helperSlots(s: GameState): number {
  return techUnlockCount(s, 'helperSlot');
}

export function helperSpeed(s: GameState, h: HelperState): number {
  const def = HELPER_MAP.get(h.type);
  if (!def) return 0;
  const learning =
    h.type === 'intern'
      ? Math.min(
          INTERN_LEARNING.max,
          Math.floor(h.done / INTERN_LEARNING.perTasks) * INTERN_LEARNING.step,
        )
      : 0;
  return def.efficiency * (1 + learning) * (1 + mod(s, 'helperSpeed'));
}

export type HelperResult =
  { ok: true } | { ok: false; reason: 'locked' | 'slots' | 'gold' | 'unknown' };

export function hireHelper(s: GameState, type: string): HelperResult {
  const def = HELPER_MAP.get(type);
  if (!def) return { ok: false, reason: 'unknown' };
  if (!hasTech(s, def.requiresTech)) return { ok: false, reason: 'locked' };
  if (s.helpers.length >= helperSlots(s)) return { ok: false, reason: 'slots' };
  if (s.gold.lt(def.cost)) return { ok: false, reason: 'gold' };
  s.gold = s.gold.sub(def.cost);
  s.helpers.push({ type, actionId: null, progress: 0, done: 0 });
  addStat(s, 'helpersHired');
  return { ok: true };
}

export function dismissHelper(s: GameState, index: number): void {
  s.helpers.splice(index, 1);
}

export function assignHelper(s: GameState, index: number, actionId: string | null): boolean {
  const h = s.helpers[index];
  if (!h) return false;
  if (actionId !== null && !canPerform(s, getAction(actionId)).ok) return false;
  h.actionId = actionId;
  h.progress = 0;
  return true;
}

function helperDuration(s: GameState, h: HelperState): number {
  return actionDuration(s, getAction(h.actionId!)) / Math.max(0.01, helperSpeed(s, h));
}

registerRunnerFactory('helpers', (s, rng, emit) =>
  s.helpers
    .map((h, index) => ({ h, index }))
    .filter(({ h }) => h.actionId)
    .map(({ h, index }) => {
      const def = getAction(h.actionId!);
      const share = HELPER_MAP.get(h.type)?.xpShare ?? 0.25;
      return {
        validate: () => {
          const check = canPerform(s, def);
          if (check.ok) return true;
          h.actionId = null;
          h.progress = 0;
          emit({ type: 'helperStopped', helper: index, actionId: def.id, reason: check.reason });
          return false;
        },
        timeLeft: () => Math.max(0, helperDuration(s, h) - h.progress),
        needsFire: () => !!def.requiresFire,
        progress: (dt: number) => {
          h.progress += dt;
        },
        ready: () => h.progress >= helperDuration(s, h) - EPS,
        complete: () => {
          h.progress = 0;
          h.done++;
          addStat(s, 'helperTasks');
          completeAction(s, def, rng, emit, share);
        },
      };
    }),
);

export function itemResearchValue(item: string): number {
  const c = getItem(item).consume;
  return c?.type === 'research' ? c.amount : 0;
}
