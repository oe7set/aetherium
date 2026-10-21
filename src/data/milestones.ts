import type { RewardDef } from './progress';
import { SKILLS } from './skills';
import type { ItemDef, ModifierSet } from './types';

// Skill-Meilensteine: every skill pays at level 10, 25, 50, 75 and 99 – a lasting bonus that starts
// working right away and a one-off reward to claim. Level 99 hands out the skill's Meisterumhang.

export const MILESTONE_LEVELS = [10, 25, 50, 75, 99] as const;

/** Combat-ish skills have no speed/double; their milestones use their own stat. */
const OWN_STAT: Record<string, [string, string]> = {
  melee: ['combat.damage.melee', 'combat.accuracy.melee'],
  ranged: ['combat.damage.ranged', 'combat.accuracy.ranged'],
  magic: ['combat.damage.magic', 'combat.accuracy.magic'],
  defence: ['combat.defence', 'combat.hp'],
  hitpoints: ['combat.hp', 'combat.regen'],
  slayer: ['combat.damage', 'combat.loot'],
  riftwalker: ['rift.might', 'rift.hp'],
  faith: ['combat.defence', 'prayer.max'],
};

/** Lasting bonus for reaching a milestone (cumulative). */
export function milestoneMods(skill: string, level: number): ModifierSet {
  const own = OWN_STAT[skill];
  if (own) {
    const [a, b] = own;
    const v = { 10: 0.02, 25: 0.03, 50: 0.04, 75: 0.05, 99: 0.06 }[level] ?? 0;
    return level % 2 ? { [b]: b === 'prayer.max' ? 2 : v } : { [a]: v };
  }
  switch (level) {
    case 10:
      return { [`xp.${skill}`]: 0.03 };
    case 25:
      return { [`speed.${skill}`]: 0.03 };
    case 50:
      return { [`double.${skill}`]: 0.03 };
    case 75:
      return { [`speed.${skill}`]: 0.04, [`xp.${skill}`]: 0.04 };
    default:
      return { [`double.${skill}`]: 0.04, [`speed.${skill}`]: 0.03 };
  }
}

/** One-off reward to claim (scaled with the prestige reward scale like every reward). */
export function milestoneReward(skill: string, level: number): RewardDef {
  switch (level) {
    case 10:
      return { gold: 500 };
    case 25:
      return { gold: 3_000, items: [{ item: 'coin_pouch', qty: 2 }] };
    case 50:
      return { gold: 15_000, items: [{ item: 'dungeon_chest', qty: 2 }] };
    case 75:
      return { gold: 60_000, essence: 50, items: [{ item: 'imprint_stone', qty: 1 }] };
    default:
      return { gold: 250_000, essence: 150, items: [{ item: `cape_${skill}`, qty: 1 }] };
  }
}

/** Meisterumhang: skill-themed cape with the skill's own perk. */
export const SKILL_CAPES: ItemDef[] = SKILLS.map((s) => {
  const own = OWN_STAT[s.id];
  const mods: ModifierSet = own
    ? { [own[0]]: 0.06, [own[1]]: own[1] === 'prayer.max' ? 5 : 0.04 }
    : { [`speed.${s.id}`]: 0.05, [`double.${s.id}`]: 0.05, [`xp.${s.id}`]: 0.05 };
  return {
    id: `cape_${s.id}`,
    name: `Meisterumhang: ${s.name}`,
    icon: '🧥',
    category: 'gear',
    sellPrice: 99_000,
    rarity: 'legendary',
    desc: `Nur wer ${s.name} auf Stufe 99 bringt, darf ihn tragen. ${s.icon}`,
    equip: { slot: 'cape', defence: 15, mods, req: { skill: s.id, level: 99 } },
  };
});
