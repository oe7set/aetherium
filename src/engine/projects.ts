import { PROJECT_MAP, PROJECTS } from '../data/projects';
import type { Emit } from './events';
import { itemCount, removeItem } from './inventory';
import { invalidateMods, registerModifierSource } from './modifiers';
import { xpMultiplierFor } from './actions';
import { addXp } from './skills';
import { addStat, type GameState } from './state';

/** Großprojekte: stages filled bit by bit with goods from many skills. */

export function projectStage(s: GameState, id: string): number {
  return s.projects[id]?.stage ?? 0;
}

export function projectDone(s: GameState, id: string): boolean {
  const def = PROJECT_MAP.get(id);
  return !!def && projectStage(s, id) >= def.stages.length;
}

export function projectUnlocked(s: GameState, id: string): boolean {
  const def = PROJECT_MAP.get(id);
  return !!def && (def.requires ?? []).every((r) => projectDone(s, r));
}

/** Delivered amount of an item for the current stage. */
export function projectDelivered(s: GameState, id: string, item: string): number {
  return s.projects[id]?.delivered[item] ?? 0;
}

/** True if the bag holds everything still missing for the current stage. */
export function canFinishStage(s: GameState, id: string): boolean {
  const def = PROJECT_MAP.get(id);
  const stage = def?.stages[projectStage(s, id)];
  if (!def || !stage || !projectUnlocked(s, id)) return false;
  return stage.cost.every((c) => itemCount(s, c.item) >= c.qty - projectDelivered(s, id, c.item));
}

/**
 * Delivers what the bag has towards the current stage (one item or all of them). Finishes the stage
 * when everything is in. Returns the number of items handed over.
 */
export function deliverProject(s: GameState, id: string, emit: Emit, onlyItem?: string): number {
  const def = PROJECT_MAP.get(id);
  const stageNo = projectStage(s, id);
  const stage = def?.stages[stageNo];
  if (!def || !stage || !projectUnlocked(s, id)) return 0;
  const cur = s.projects[id] ?? { stage: stageNo, delivered: {} };
  const delivered = { ...cur.delivered };
  let moved = 0;
  for (const c of stage.cost) {
    if (onlyItem && c.item !== onlyItem) continue;
    const n = Math.min(itemCount(s, c.item), c.qty - (delivered[c.item] ?? 0));
    if (n <= 0) continue;
    removeItem(s, c.item, n);
    delivered[c.item] = (delivered[c.item] ?? 0) + n;
    moved += n;
  }
  const complete = stage.cost.every((c) => (delivered[c.item] ?? 0) >= c.qty);
  s.projects = {
    ...s.projects,
    [id]: complete ? { stage: stageNo + 1, delivered: {} } : { stage: stageNo, delivered },
  };
  if (complete) {
    addXp(s, 'construction', stage.xp * xpMultiplierFor(s, 'construction'), emit);
    addStat(s, 'projectStages');
    invalidateMods(s);
    emit({ type: 'projectStage', project: id, stage: stageNo + 1 });
  }
  return moved;
}

registerModifierSource('projects', (s) =>
  PROJECTS.flatMap((p) => p.stages.slice(0, projectStage(s, p.id)).map((st) => st.mods)),
);
