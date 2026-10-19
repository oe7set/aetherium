import { DAILY_MINUTES, DAILY_REWARD, CURSES } from '../data/riftCurses';
import { BIOMES } from '../data/rift';
import type { RunConfig, RunResult } from '../rift/sim';
import type { Emit } from './events';
import { dayKey } from './meta';
import { applyReward, type RewardLine } from './progress';
import { biomeUnlocked, canStartRun, finishRun, prepareRun, type RiftReward } from './rift';
import type { Rng } from './rng';
import { addStat, type GameState } from './state';

/** Tagesriss: one seed, biome and curse per day – the same run for everyone on that day. */
export interface DailyChallenge {
  day: string;
  seed: number;
  biome: string;
  curse: string;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function syncDaily(s: GameState, now: number): void {
  const day = dayKey(now);
  const d = s.rift.daily;
  if (d.day === day) return;
  s.rift.daily = { ...d, day, attempts: 0, bestTime: 0, bestKills: 0, claimed: false };
}

/** The day's challenge: biome among the open ones, a fixed curse, a fixed seed. */
export function dailyChallenge(s: GameState, now: number): DailyChallenge {
  const day = dayKey(now);
  const h = hash(`daily:${day}`);
  const open = BIOMES.filter((b) => biomeUnlocked(s, b.id));
  const biome = open[h % Math.max(1, open.length)] ?? BIOMES[0]!;
  const curse = CURSES[(h >>> 8) % CURSES.length]!;
  return { day, seed: h % 2 ** 31, biome: biome.id, curse: curse.id };
}

export function prepareDaily(s: GameState, hero: string, now: number, rng: Rng): RunConfig | null {
  syncDaily(s, now);
  const c = dailyChallenge(s, now);
  if (!canStartRun(s, hero, c.biome).ok) return null;
  const base = prepareRun(s, hero, c.biome, rng, false, [c.curse]);
  if (!base) return null;
  s.rift.daily.attempts++;
  addStat(s, 'riftDailyRuns');
  return {
    ...base,
    seed: c.seed,
    minutes: DAILY_MINUTES,
    daily: true,
  };
}

export interface DailyReward {
  run: RiftReward;
  lines: RewardLine[] | null;
  record: boolean;
}

export function finishDaily(
  s: GameState,
  r: RunResult,
  now: number,
  rng: Rng,
  emit: Emit,
): DailyReward {
  syncDaily(s, now);
  const d = s.rift.daily;
  const record = r.time > d.bestTime + 0.5;
  d.bestTime = Math.max(d.bestTime, r.time);
  d.bestKills = Math.max(d.bestKills, r.kills);
  const run = finishRun(s, r, rng, emit);
  let lines: RewardLine[] | null = null;
  if (!d.claimed) {
    d.claimed = true;
    d.days++;
    lines = applyReward(s, DAILY_REWARD, rng, emit);
  }
  return { run, lines, record };
}
