import type { SkillId } from '../data/types';

export type StopReason = 'noInputs' | 'inventoryFull' | 'noFire' | 'levelTooLow' | 'manual';

/** Everything the engine wants the UI (feed, popups, sounds) to know about. */
export type GameEvent =
  | { type: 'xp'; skill: SkillId; amount: number }
  | { type: 'itemGained'; item: string; qty: number }
  | { type: 'itemConsumed'; item: string; qty: number }
  | { type: 'itemLost'; item: string; qty: number }
  | { type: 'rareDrop'; item: string; qty: number }
  | { type: 'levelUp'; skill: SkillId; level: number }
  | { type: 'burnt'; item: string }
  | { type: 'actionComplete'; actionId: string }
  | { type: 'actionStarted'; actionId: string }
  | { type: 'actionStopped'; actionId: string; reason: StopReason; missingItem?: string }
  | { type: 'fireLit' }
  | { type: 'fireOut' }
  | { type: 'gold'; amount: number }
  | { type: 'intelligence'; amount: number }
  | { type: 'achievement'; id: string }
  | { type: 'buffStarted'; id: string }
  | { type: 'buffExpired'; id: string }
  | { type: 'marketTrend'; item: string; mult: number }
  | { type: 'toolUnlocked'; tool: string };

export type Emit = (event: GameEvent) => void;

export const noopEmit: Emit = () => {};

/** Convenience collector for tests and the live loop. */
export function collector(): { events: GameEvent[]; emit: Emit } {
  const events: GameEvent[] = [];
  return { events, emit: (e) => events.push(e) };
}
