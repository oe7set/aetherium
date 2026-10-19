import { MONSTER_MAP, MONSTERS } from '../data';
import {
  SLAYER_BLOCK_MAX,
  SLAYER_POINTS,
  SLAYER_SHOP,
  SLAYER_STREAK_EVERY,
  SLAYER_STREAK_MULT,
  SLAYER_TASK_MAX,
  SLAYER_TASK_MIN,
  SLAYER_XP_PER_HP,
} from '../data/slayer';
import { gainItem, xpMultiplierFor } from './actions';
import { combatLevel, onMonsterKilled } from './combat';
import type { Emit } from './events';
import { pick, randInt, type Rng } from './rng';
import { earnGold } from './shop';
import { addXp, skillLevel } from './skills';
import { addStat, type GameState } from './state';

/** Kopfgeldjagd: contracts, slayer XP per kill, points and the reward shop. */

export function slayerLevel(s: GameState): number {
  return skillLevel(s, 'slayer');
}

/** Monsters a contract can name: fair for the current combat level, no bosses, not blocked. */
export function slayerCandidates(s: GameState): string[] {
  const cl = combatLevel(s);
  const sl = slayerLevel(s);
  return MONSTERS.filter(
    (m) =>
      !m.boss &&
      (m.slayer ?? 0) <= sl &&
      m.level <= cl + 12 &&
      m.level >= Math.min(cl * 0.35, 60) &&
      !s.slayer.blocked.includes(m.id),
  ).map((m) => m.id);
}

export function newSlayerTask(s: GameState, rng: Rng, emit: Emit, exclude?: string): boolean {
  let pool = slayerCandidates(s).filter((id) => id !== exclude);
  if (!pool.length) pool = slayerCandidates(s);
  if (!pool.length) return false;
  const monster = pick(rng, pool);
  const total = randInt(rng, SLAYER_TASK_MIN, SLAYER_TASK_MAX);
  s.slayer.task = { monster, left: total, total };
  emit({ type: 'slayerTask', monster, count: total });
  return true;
}

/** Is this monster the current contract target? (Kopfgeld gear only works on it.) */
export function isSlayerTarget(s: GameState, monster: string): boolean {
  return s.slayer.task?.monster === monster;
}

onMonsterKilled((s, monster, _rng, emit) => {
  const task = s.slayer.task;
  if (!task || task.monster !== monster) return;
  const m = MONSTER_MAP.get(monster);
  if (!m) return;
  task.left--;
  addXp(s, 'slayer', m.hp * SLAYER_XP_PER_HP * xpMultiplierFor(s, 'slayer'), emit);
  if (task.left > 0) return;
  s.slayer.streak++;
  const bonus = s.slayer.streak % SLAYER_STREAK_EVERY === 0 ? SLAYER_STREAK_MULT : 1;
  const points = SLAYER_POINTS * bonus;
  s.slayer.points += points;
  s.slayer.done++;
  s.slayer.task = null;
  addStat(s, 'slayerTasks');
  earnGold(s, m.level * 12 * task.total, emit);
  emit({ type: 'slayerTaskDone', monster, points, streak: s.slayer.streak });
});

export type SlayerBuyResult = 'ok' | 'points' | 'noTask' | 'full' | 'unknown';

export function buySlayer(s: GameState, id: string, rng: Rng, emit: Emit): SlayerBuyResult {
  const entry = SLAYER_SHOP.find((e) => e.id === id);
  if (!entry) return 'unknown';
  if (s.slayer.points < entry.cost) return 'points';
  const fx = entry.effect;
  if (fx.type === 'skip' || fx.type === 'block') {
    const current = s.slayer.task?.monster;
    if (!current) return 'noTask';
    if (fx.type === 'block') {
      if (s.slayer.blocked.length >= SLAYER_BLOCK_MAX) return 'full';
      s.slayer.blocked = [...s.slayer.blocked, current];
    }
    s.slayer.points -= entry.cost;
    newSlayerTask(s, rng, emit, current);
    return 'ok';
  }
  s.slayer.points -= entry.cost;
  gainItem(s, fx.item, fx.qty, emit);
  return 'ok';
}

export function unblockSlayer(s: GameState, monster: string): void {
  s.slayer.blocked = s.slayer.blocked.filter((m) => m !== monster);
}
