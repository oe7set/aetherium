import { BALANCE } from '../data/balance';
import { advance } from './actions';
import type { Emit, StopReason } from './events';
import type { Rng } from './rng';
import { skillLevel } from './skills';
import type { GameState } from './state';

export interface ProgressSummary {
  /** Real time the player was away. */
  elapsedSeconds: number;
  /** Time actually simulated (after the offline cap). */
  simulatedSeconds: number;
  xp: Record<string, number>;
  gained: Record<string, number>;
  consumed: Record<string, number>;
  lost: Record<string, number>;
  levels: Record<string, { from: number; to: number }>;
  rareDrops: { item: string; qty: number }[];
  actionsCompleted: number;
  gold: number;
  burnt: number;
  stopped?: { actionId: string; reason: StopReason; missingItem?: string };
  fireWentOut: boolean;
}

function bump(map: Record<string, number>, key: string, amount: number): void {
  map[key] = (map[key] ?? 0) + amount;
}

/** Builds an emit function that folds events into a summary instead of storing every event. */
export function summaryCollector(
  s: GameState,
  elapsedSeconds: number,
  simulatedSeconds: number,
): { emit: Emit; summary: ProgressSummary; finish: () => ProgressSummary } {
  const summary: ProgressSummary = {
    elapsedSeconds,
    simulatedSeconds,
    xp: {},
    gained: {},
    consumed: {},
    lost: {},
    levels: {},
    rareDrops: [],
    actionsCompleted: 0,
    gold: 0,
    burnt: 0,
    fireWentOut: false,
  };
  const before: Record<string, number> = {};
  for (const id of Object.keys(s.skills)) before[id] = skillLevel(s, id);

  const emit: Emit = (e) => {
    switch (e.type) {
      case 'xp':
        bump(summary.xp, e.skill, e.amount);
        break;
      case 'itemGained':
        bump(summary.gained, e.item, e.qty);
        break;
      case 'itemConsumed':
        bump(summary.consumed, e.item, e.qty);
        break;
      case 'itemLost':
        bump(summary.lost, e.item, e.qty);
        break;
      case 'rareDrop':
        summary.rareDrops.push({ item: e.item, qty: e.qty });
        break;
      case 'actionComplete':
        summary.actionsCompleted++;
        break;
      case 'gold':
        summary.gold += e.amount;
        break;
      case 'burnt':
        summary.burnt++;
        break;
      case 'fireOut':
        summary.fireWentOut = true;
        break;
      case 'actionStopped':
        if (e.reason !== 'manual') {
          summary.stopped = { actionId: e.actionId, reason: e.reason, missingItem: e.missingItem };
        }
        break;
      default:
        break;
    }
  };

  const finish = (): ProgressSummary => {
    for (const id of Object.keys(s.skills)) {
      const to = skillLevel(s, id);
      const from = before[id] ?? 1;
      if (to > from) summary.levels[id] = { from, to };
    }
    return summary;
  };

  return { emit, summary, finish };
}

/**
 * Simulates the time since `s.lastUpdate`, capped at the offline limit.
 * Mutates `s` and returns what happened.
 */
export function applyOfflineProgress(
  s: GameState,
  now: number,
  rng: Rng,
  capSeconds: number = BALANCE.OFFLINE_CAP_SECONDS,
): ProgressSummary {
  const elapsedSeconds = Math.max(0, (now - s.lastUpdate) / 1000);
  const simulatedSeconds = Math.min(elapsedSeconds, capSeconds);
  const { emit, finish } = summaryCollector(s, elapsedSeconds, simulatedSeconds);
  advance(s, simulatedSeconds, rng, emit);
  s.lastUpdate = now;
  return finish();
}

/** True if the summary contains anything worth showing to the player. */
export function summaryHasContent(summary: ProgressSummary): boolean {
  return (
    summary.actionsCompleted > 0 ||
    Object.keys(summary.xp).length > 0 ||
    summary.fireWentOut ||
    summary.stopped !== undefined
  );
}
