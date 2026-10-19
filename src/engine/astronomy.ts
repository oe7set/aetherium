import {
  CONSTELLATION_MAP,
  CONSTELLATION_MAX_RANK,
  CONSTELLATIONS,
  constellationCost,
  constellationSlots,
  NIGHT_MULT,
} from '../data/astronomy';
import { actionXp, gainItem, registerCompletionHook, simNow } from './actions';
import { itemCount, removeItem } from './inventory';
import { invalidateMods, registerModifierSource } from './modifiers';
import { addXp, skillLevel } from './skills';
import { addStat, type GameState } from './state';
import { isNight } from './time';

/** Sternkunde: nights pay double, constellations turn stardust into lasting boni. */

export function starRank(s: GameState, id: string): number {
  return s.stars.ranks[id] ?? 0;
}

export function starSlots(s: GameState): number {
  return constellationSlots(skillLevel(s, 'astronomy'));
}

export type StarResult = 'ok' | 'level' | 'max' | 'items' | 'unknown' | 'slots';

export function canStudy(s: GameState, id: string): StarResult {
  const c = CONSTELLATION_MAP.get(id);
  if (!c) return 'unknown';
  if (skillLevel(s, 'astronomy') < c.level) return 'level';
  const rank = starRank(s, id);
  if (rank >= CONSTELLATION_MAX_RANK) return 'max';
  if (constellationCost(rank).some((x) => itemCount(s, x.item) < x.qty)) return 'items';
  return 'ok';
}

/** Raises a constellation by one rank; the first rank also lights it up if a slot is free. */
export function studyConstellation(s: GameState, id: string): StarResult {
  const check = canStudy(s, id);
  if (check !== 'ok') return check;
  const rank = starRank(s, id);
  for (const x of constellationCost(rank)) removeItem(s, x.item, x.qty);
  s.stars = { ...s.stars, ranks: { ...s.stars.ranks, [id]: rank + 1 } };
  if (rank === 0 && s.stars.active.length < starSlots(s))
    s.stars = { ...s.stars, active: [...s.stars.active, id] };
  addStat(s, 'constellationRanks');
  invalidateMods(s);
  return 'ok';
}

/** Lights a studied constellation up (or dims it). */
export function toggleConstellation(s: GameState, id: string): StarResult {
  if (!starRank(s, id)) return 'level';
  const active = s.stars.active.includes(id);
  if (!active && s.stars.active.length >= starSlots(s)) return 'slots';
  s.stars = {
    ...s.stars,
    active: active ? s.stars.active.filter((x) => x !== id) : [...s.stars.active, id],
  };
  invalidateMods(s);
  return 'ok';
}

registerModifierSource('constellations', (s) =>
  s.stars.active.flatMap((id) => {
    const c = CONSTELLATION_MAP.get(id);
    const rank = starRank(s, id);
    if (!c || !rank) return [];
    return [Object.fromEntries(Object.entries(c.perRank).map(([k, v]) => [k, (v ?? 0) * rank]))];
  }),
);

// Nights pay double: the same stardust (and XP) once more.
registerCompletionHook('astronomy', (s, def, _rng, emit) => {
  if (def.skill !== 'astronomy' || !isNight(simNow(s))) return;
  for (const o of def.outputs) gainItem(s, o.item, o.qty * (NIGHT_MULT - 1), emit);
  addXp(s, 'astronomy', actionXp(s, def) * (NIGHT_MULT - 1), emit);
  addStat(s, 'nightObservations');
});

export { CONSTELLATIONS };
