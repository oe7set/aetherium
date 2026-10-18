import { COLLECTION_MAP, COLLECTIONS, type CollectionDef } from '../data/collections';
import type { Emit } from './events';
import { invalidateMods, registerModifierSource } from './modifiers';
import { applyReward, type RewardLine } from './progress';
import type { Rng } from './rng';
import { addStat, type GameState } from './state';

/** Sammelbuch: which items of a set have ever been found. */
export function collectionProgress(s: GameState, c: CollectionDef): number {
  const found = new Set(s.progress.found);
  return c.items.filter((i) => found.has(i)).length;
}

export function collectionComplete(s: GameState, c: CollectionDef): boolean {
  return collectionProgress(s, c) >= c.items.length;
}

/** Completed but not yet claimed sets. */
export function collectionsClaimable(s: GameState): CollectionDef[] {
  return COLLECTIONS.filter((c) => !s.progress.sets.includes(c.id) && collectionComplete(s, c));
}

export function claimCollection(
  s: GameState,
  id: string,
  rng: Rng,
  emit: Emit,
): RewardLine[] | null {
  const c = COLLECTION_MAP.get(id);
  if (!c || s.progress.sets.includes(id) || !collectionComplete(s, c)) return null;
  s.progress.sets = [...s.progress.sets, id];
  addStat(s, 'collectionsDone');
  const lines = applyReward(s, c.reward, rng, emit);
  invalidateMods(s);
  return [{ icon: '📗', label: `Dauerhaft: ${c.bonusText}`, rarity: 3 }, ...lines];
}

registerModifierSource('collections', (s) =>
  s.progress.sets.flatMap((id) => {
    const c = COLLECTION_MAP.get(id);
    return c ? [c.bonus] : [];
  }),
);
