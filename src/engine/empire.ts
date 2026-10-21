import { EMPIRE_RANK_MODS, EMPIRE_RANKS, EMPIRE_SOURCES } from '../data/empire';
import { PROJECTS } from '../data/projects';
import { GUILDS } from '../data/guilds';
import type { Emit } from './events';
import { guildRank } from './guilds';
import { invalidateMods, registerModifierSource } from './modifiers';
import { applyReward, type RewardLine } from './progress';
import { projectStage } from './projects';
import type { Rng } from './rng';
import { totalLevel } from './skills';
import { addStat, type GameState } from './state';
import { totalPopulation } from './village';

/** Reichsrang: one score over every system; ranks are claimed with a ceremony. */

export function empireValues(s: GameState): Record<string, number> {
  return {
    totalLevel: totalLevel(s),
    population: totalPopulation(s),
    heroLevel: s.hero.level,
    riftWins: s.rift.wins,
    relics: s.rift.relics.length,
    projectStages: PROJECTS.reduce((a, p) => a + projectStage(s, p.id), 0),
    milestones: s.milestones.length,
    worldBossKills: s.worldBoss.kills,
    achievements: s.achievements.length,
    buildings: Object.values(s.buildings).reduce((a, b) => a + b, 0),
    stars: Object.values(s.stars.ranks).reduce((a, b) => a + b, 0),
    inventions: Object.values(s.inventions).reduce((a, b) => a + b, 0),
    guildRanks: GUILDS.reduce((a, g) => a + guildRank(s, g.id), 0),
  };
}

export function empireScore(s: GameState): number {
  const v = empireValues(s);
  return Math.floor(EMPIRE_SOURCES.reduce((sum, src) => sum + (v[src.key] ?? 0) * src.per, 0));
}

/** Highest rank the score reaches (index into EMPIRE_RANKS). */
export function empireRankReached(s: GameState): number {
  const score = empireScore(s);
  let rank = 0;
  for (let i = 0; i < EMPIRE_RANKS.length; i++) if (score >= EMPIRE_RANKS[i]!.score) rank = i;
  return rank;
}

/** Claims the next rank (ceremony + reward). */
export function claimEmpireRank(s: GameState, rng: Rng, emit: Emit): RewardLine[] | null {
  const next = s.empireRank + 1;
  if (next > empireRankReached(s) || !EMPIRE_RANKS[next]) return null;
  s.empireRank = next;
  invalidateMods(s);
  addStat(s, 'empireRanks');
  return applyReward(s, EMPIRE_RANKS[next]!.reward, rng, emit);
}

registerModifierSource('empire', (s) =>
  s.empireRank > 0
    ? [Object.fromEntries(Object.entries(EMPIRE_RANK_MODS).map(([k, v]) => [k, v * s.empireRank]))]
    : [],
);
