import { ISLAND_BUILDING_MAP, ISLAND_BUILDINGS, type BuildingLevel } from '../data/construction';
import type { Emit } from './events';
import { itemCount, removeItem } from './inventory';
import { invalidateMods, registerModifierSource } from './modifiers';
import { addXp, skillLevel } from './skills';
import { addStat, type GameState } from './state';
import { xpMultiplierFor } from './actions';

/** Baukunst: island buildings with three levels each; bonuses stay through every prestige. */

export function buildingLevelOf(s: GameState, id: string): number {
  return s.buildings[id] ?? 0;
}

export function nextBuildingLevel(s: GameState, id: string): BuildingLevel | null {
  const def = ISLAND_BUILDING_MAP.get(id);
  return def?.levels[buildingLevelOf(s, id)] ?? null;
}

export type BuildResult = 'ok' | 'max' | 'level' | 'items' | 'unknown';

export function canBuildIsland(s: GameState, id: string): BuildResult {
  if (!ISLAND_BUILDING_MAP.has(id)) return 'unknown';
  const next = nextBuildingLevel(s, id);
  if (!next) return 'max';
  if (skillLevel(s, 'construction') < next.level) return 'level';
  if (next.cost.some((c) => itemCount(s, c.item) < c.qty)) return 'items';
  return 'ok';
}

export function buildIsland(s: GameState, id: string, emit: Emit): BuildResult {
  const check = canBuildIsland(s, id);
  if (check !== 'ok') return check;
  const next = nextBuildingLevel(s, id)!;
  for (const c of next.cost) removeItem(s, c.item, c.qty);
  s.buildings = { ...s.buildings, [id]: buildingLevelOf(s, id) + 1 };
  addXp(s, 'construction', next.xp * xpMultiplierFor(s, 'construction'), emit);
  addStat(s, 'buildingsBuilt');
  invalidateMods(s);
  emit({ type: 'islandBuilt', building: id, level: s.buildings[id]! });
  return 'ok';
}

registerModifierSource('buildings', (s) =>
  ISLAND_BUILDINGS.flatMap((b) => {
    const lvl = buildingLevelOf(s, b.id);
    return lvl > 0 ? [b.levels[lvl - 1]!.mods] : [];
  }),
);
