import { SKILLS } from '../data';
import { MILESTONE_LEVELS, milestoneMods, milestoneReward } from '../data/milestones';
import type { Emit } from './events';
import { registerModifierSource } from './modifiers';
import { applyReward, type RewardLine } from './progress';
import type { Rng } from './rng';
import { skillLevel } from './skills';
import { addStat, type GameState } from './state';

/** Skill-Meilensteine: lasting boni by level, one-off rewards to claim. */

export function milestoneKey(skill: string, level: number): string {
  return `${skill}:${level}`;
}

/** Reached but not yet claimed milestones. */
export function claimableMilestones(s: GameState): { skill: string; level: number }[] {
  const out: { skill: string; level: number }[] = [];
  for (const sk of SKILLS) {
    const lvl = skillLevel(s, sk.id);
    for (const m of MILESTONE_LEVELS)
      if (lvl >= m && !s.milestones.includes(milestoneKey(sk.id, m)))
        out.push({ skill: sk.id, level: m });
  }
  return out;
}

/** Next milestone of a skill (null at 99). */
export function nextMilestone(s: GameState, skill: string): number | null {
  const lvl = skillLevel(s, skill);
  return MILESTONE_LEVELS.find((m) => m > lvl) ?? null;
}

export function claimMilestone(
  s: GameState,
  skill: string,
  level: number,
  rng: Rng,
  emit: Emit,
): RewardLine[] | null {
  const key = milestoneKey(skill, level);
  if (skillLevel(s, skill) < level || s.milestones.includes(key)) return null;
  s.milestones = [...s.milestones, key];
  addStat(s, 'milestonesClaimed');
  return applyReward(s, milestoneReward(skill, level), rng, emit);
}

// The lasting part needs no claiming: it follows the level (and falls away after a rebirth).
registerModifierSource('milestones', (s) =>
  SKILLS.flatMap((sk) => {
    const lvl = skillLevel(s, sk.id);
    return MILESTONE_LEVELS.filter((m) => lvl >= m).map((m) => milestoneMods(sk.id, m));
  }),
);
