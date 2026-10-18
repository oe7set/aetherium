import { BALANCE } from '../data/balance';
import { advance } from './actions';
import type { CombatStopReason, Emit, StopReason } from './events';
import type { Rng } from './rng';
import { mod } from './modifiers';
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
  kills: Record<string, number>;
  dungeons: number;
  died: boolean;
  combatStopped?: CombatStopReason;
  foodEaten: number;
  research: number;
  elements: string[];
  harvests: number;
  /** Village & hero activity while away. */
  village: { built: string[]; reports: string[]; resources: number };
  hero: { adventures: number; levels: number; died: boolean; essence: number };
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
    kills: {},
    dungeons: 0,
    died: false,
    foodEaten: 0,
    research: 0,
    elements: [],
    harvests: 0,
    village: { built: [], reports: [], resources: 0 },
    hero: { adventures: 0, levels: 0, died: false, essence: 0 },
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
      case 'monsterKilled':
        bump(summary.kills, e.monster, 1);
        break;
      case 'dungeonCompleted':
        summary.dungeons++;
        break;
      case 'playerDied':
        summary.died = true;
        break;
      case 'elementDiscovered':
        summary.elements.push(e.symbol);
        break;
      case 'harvested':
        summary.harvests++;
        break;
      case 'ate':
        summary.foodEaten++;
        break;
      case 'villageBuilt':
        if (summary.village.built.length < 12) summary.village.built.push(`${e.name} ${e.level}`);
        break;
      case 'villageReport':
        if (summary.village.reports.length < 6) summary.village.reports.push(e.title);
        break;
      case 'heroAdventure':
        if (e.success) summary.hero.adventures++;
        break;
      case 'heroLevel':
        summary.hero.levels++;
        break;
      case 'heroDied':
        summary.hero.died = true;
        break;
      case 'riftEcho':
        summary.hero.essence += e.essence;
        break;
      case 'combatStopped':
        if (e.reason !== 'manual') summary.combatStopped = e.reason;
        break;
      default:
        break;
    }
  };

  const researchBefore = s.research;
  const villageRes = () =>
    s.village.villages.reduce(
      (sum, v) => sum + v.res.wood + v.res.clay + v.res.iron + v.res.crop,
      0,
    );
  const resBefore = villageRes();
  const finish = (): ProgressSummary => {
    summary.research = Math.max(0, s.research - researchBefore);
    summary.village.resources = Math.max(0, Math.round(villageRes() - resBefore));
    for (const id of Object.keys(s.skills)) {
      const to = skillLevel(s, id);
      const from = before[id] ?? 1;
      if (to > from) summary.levels[id] = { from, to };
    }
    return summary;
  };

  return { emit, summary, finish };
}

/** Offline cap in seconds including tech bonuses (Telegraf, Relativitätstheorie …). */
export function offlineCap(s: GameState): number {
  return BALANCE.OFFLINE_CAP_SECONDS + mod(s, 'offlineHours') * 3600;
}

/**
 * Simulates the time since `s.lastUpdate`, capped at the offline limit.
 * Mutates `s` and returns what happened.
 */
export function applyOfflineProgress(
  s: GameState,
  now: number,
  rng: Rng,
  capSeconds: number = offlineCap(s),
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
    Object.keys(summary.kills).length > 0 ||
    summary.died ||
    Object.keys(summary.xp).length > 0 ||
    summary.fireWentOut ||
    summary.stopped !== undefined ||
    summary.village.built.length > 0 ||
    summary.village.reports.length > 0 ||
    summary.village.resources > 0 ||
    summary.hero.adventures > 0
  );
}
