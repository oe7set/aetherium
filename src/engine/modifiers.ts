import type { ModifierSet } from '../data/types';
import type { GameState } from './state';

/**
 * Modifier aggregation. Every bonus source (achievements, tech, buffs, pets, equipment, prestige)
 * contributes a ModifierSet; `mod(state, key)` returns the summed value.
 * Results are cached per state object; call `invalidateMods(state)` after changing a source.
 */
export type ModifierSource = (s: GameState) => ModifierSet[];

const sources: { name: string; fn: ModifierSource }[] = [];
const cache = new WeakMap<GameState, Map<string, number>>();

/** Registers a bonus source. Modules call this at import time. Idempotent per name. */
export function registerModifierSource(name: string, fn: ModifierSource): void {
  const existing = sources.findIndex((s) => s.name === name);
  if (existing >= 0) sources[existing] = { name, fn };
  else sources.push({ name, fn });
}

function compute(s: GameState): Map<string, number> {
  const out = new Map<string, number>();
  for (const { fn } of sources) {
    for (const set of fn(s)) {
      for (const [k, v] of Object.entries(set)) {
        if (v) out.set(k, (out.get(k) ?? 0) + v);
      }
    }
  }
  return out;
}

export function allMods(s: GameState): Map<string, number> {
  let m = cache.get(s);
  if (!m) {
    m = compute(s);
    cache.set(s, m);
  }
  return m;
}

export function mod(s: GameState, key: string): number {
  return allMods(s).get(key) ?? 0;
}

/** Global + skill-specific value, e.g. modFor(s, 'xp', 'mining') = xp + xp.mining. */
export function modFor(s: GameState, key: string, skill: string): number {
  const m = allMods(s);
  return (m.get(key) ?? 0) + (m.get(`${key}.${skill}`) ?? 0);
}

export function invalidateMods(s: GameState): void {
  cache.delete(s);
}

/** Merges modifier sets (for display). */
export function sumMods(sets: ModifierSet[]): ModifierSet {
  const out: ModifierSet = {};
  for (const set of sets)
    for (const [k, v] of Object.entries(set)) out[k] = (out[k] ?? 0) + (v ?? 0);
  return out;
}
