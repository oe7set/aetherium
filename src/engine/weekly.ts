import { BIOMES } from '../data/rift';
import {
  WEEKLY_MINUTES,
  WEEKLY_MUTATORS,
  WEEKLY_REWARD,
  WEEKLY_TRY_REWARD,
  weeklyDifficulty,
  type WeeklyMutator,
} from '../data/weekly';
import type { RunConfig, RunResult } from '../rift/sim';
import type { Emit } from './events';
import { weekKey } from './meta';
import { applyReward, type RewardLine } from './progress';
import { biomeUnlocked, canStartRun, finishRun, prepareRun, type RiftReward } from './rift';
import type { Rng } from './rng';
import { addStat, type GameState } from './state';

export interface WeeklyChallenge {
  week: string;
  biome: string;
  mutator: WeeklyMutator;
  difficulty: number;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Resets the weekly progress when a new week has started. */
export function syncWeekly(s: GameState, now: number): void {
  const week = weekKey(now);
  const w = s.rift.weekly;
  if (w.week === week) return;
  s.rift.weekly = { ...w, week, attempts: 0, won: false, bestTime: 0, bestKills: 0 };
}

/** This week's challenge: the hardest open biome with the mutator of the week. */
export function weeklyChallenge(s: GameState, now: number): WeeklyChallenge {
  const week = weekKey(now);
  const open = BIOMES.filter((b) => biomeUnlocked(s, b.id));
  const biome = open[open.length - 1] ?? BIOMES[0]!;
  const mutator = WEEKLY_MUTATORS[hash(week) % WEEKLY_MUTATORS.length]!;
  return {
    week,
    biome: biome.id,
    mutator,
    difficulty: weeklyDifficulty(s.rift.weekly.wins) * mutator.difficulty,
  };
}

/** Starts the weekly boss with the hero's current combat style. */
export function prepareWeekly(s: GameState, hero: string, now: number, rng: Rng): RunConfig | null {
  syncWeekly(s, now);
  const c = weeklyChallenge(s, now);
  if (!canStartRun(s, hero, c.biome).ok) return null;
  const base = prepareRun(s, hero, c.biome, rng);
  if (!base) return null;
  s.rift.weekly.attempts++;
  addStat(s, 'weeklyAttempts');
  const stats = { ...base.stats };
  for (const [k, v] of Object.entries(c.mutator.mult ?? {}) as [keyof typeof stats, number][])
    stats[k] *= v;
  for (const [k, v] of Object.entries(c.mutator.add ?? {}) as [keyof typeof stats, number][])
    stats[k] += v;
  return {
    ...base,
    stats,
    mode: 'dungeon',
    trial: true,
    minutes: WEEKLY_MINUTES,
    difficulty: c.difficulty,
  };
}

export interface WeeklyReward {
  run: RiftReward;
  /** Reward lines for the first victory (or the first attempt) of the week. */
  lines: RewardLine[] | null;
  firstWin: boolean;
  record: boolean;
}

export function finishWeekly(
  s: GameState,
  r: RunResult,
  now: number,
  rng: Rng,
  emit: Emit,
): WeeklyReward {
  syncWeekly(s, now);
  const w = s.rift.weekly;
  const record = r.time > w.bestTime + 0.5 || (r.won && !w.won);
  w.bestTime = Math.max(w.bestTime, r.time);
  w.bestKills = Math.max(w.bestKills, r.kills);
  const run = finishRun(s, r, rng, emit);
  let lines: RewardLine[] | null = null;
  const firstWin = r.won && !w.won;
  if (firstWin) {
    w.won = true;
    w.wins++;
    addStat(s, 'weeklyWins');
    lines = applyReward(s, WEEKLY_REWARD, rng, emit);
  } else if (!w.won && w.attempts === 1) {
    lines = applyReward(s, WEEKLY_TRY_REWARD, rng, emit);
  }
  return { run, lines, firstWin, record };
}
