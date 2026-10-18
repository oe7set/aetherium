import type { ItemStack } from '../data/types';
import type { GameState } from './state';

export function itemCount(s: GameState, item: string): number {
  return s.inventory[item] ?? 0;
}

export function usedSlots(s: GameState): number {
  let n = 0;
  for (const qty of Object.values(s.inventory)) if (qty > 0) n++;
  return n;
}

export function freeSlots(s: GameState): number {
  return Math.max(0, s.inventorySlots - usedSlots(s));
}

/** Can all of these items be added without exceeding the slot limit? */
export function hasRoomFor(s: GameState, items: readonly string[]): boolean {
  // Fast path (hot during offline simulation): everything already has a stack.
  if (items.every((i) => (s.inventory[i] ?? 0) > 0)) return true;
  const newTypes = new Set(items.filter((i) => itemCount(s, i) <= 0));
  return newTypes.size <= freeSlots(s);
}

/** Adds items if there is room. Returns false (and adds nothing) if a new slot is needed but none is free. */
export function addItem(s: GameState, item: string, qty: number): boolean {
  if (qty <= 0) return true;
  if (itemCount(s, item) <= 0 && freeSlots(s) <= 0) return false;
  s.inventory[item] = itemCount(s, item) + qty;
  return true;
}

export function removeItem(s: GameState, item: string, qty: number): boolean {
  const have = itemCount(s, item);
  if (have < qty) return false;
  const left = have - qty;
  if (left <= 0) delete s.inventory[item];
  else s.inventory[item] = left;
  return true;
}

export function hasItems(s: GameState, stacks: readonly ItemStack[]): boolean {
  return stacks.every((st) => itemCount(s, st.item) >= st.qty);
}

/** First stack the player lacks, if any. */
export function firstMissing(s: GameState, stacks: readonly ItemStack[]): string | undefined {
  return stacks.find((st) => itemCount(s, st.item) < st.qty)?.item;
}

/** How many times the given recipe inputs can be paid for. Infinity if there are no inputs. */
export function craftableTimes(s: GameState, stacks: readonly ItemStack[]): number {
  let times = Infinity;
  for (const st of stacks) times = Math.min(times, Math.floor(itemCount(s, st.item) / st.qty));
  return times;
}
