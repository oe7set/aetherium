import type { RiftStats } from './rift';
import type { RewardDef } from './progress';

/**
 * Wochenboss: every week one fixed challenge in the hero's hardest open biome, with a twist
 * (mutator). The first victory of the week pays a big reward; the challenge grows with each win.
 */
export interface WeeklyMutator {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** Multiplies the hero's start stats. */
  mult?: Partial<Record<keyof RiftStats, number>>;
  /** Added to the hero's start stats. */
  add?: Partial<Record<keyof RiftStats, number>>;
  /** Extra enemy strength on top of the base difficulty. */
  difficulty: number;
}

export const WEEKLY_MUTATORS: WeeklyMutator[] = [
  {
    id: 'blood_moon',
    name: 'Blutmond',
    icon: '🌕',
    desc: 'Die Horde ist gereizt: Gegner +25 % stärker, dafür +50 % Glück.',
    mult: { luck: 1.5 },
    difficulty: 1.25,
  },
  {
    id: 'glass_cannon',
    name: 'Glaskanone',
    icon: '🍷',
    desc: 'Halbe Lebenspunkte, doppelter Schaden. Was soll schon schiefgehen?',
    mult: { maxHp: 0.5, might: 2 },
    difficulty: 1.1,
  },
  {
    id: 'whirlwind',
    name: 'Wirbelsturm',
    icon: '🌪️',
    desc: 'Alle sind schneller – du auch. +30 % Tempo, Gegner +20 % stärker.',
    mult: { speed: 1.3 },
    difficulty: 1.2,
  },
  {
    id: 'magnet_storm',
    name: 'Magnetsturm',
    icon: '🧲',
    desc: 'Erfahrung fliegt dir zu: dreifacher Sammelradius, +30 % XP. Gegner +30 % stärker.',
    mult: { magnet: 3 },
    add: { growth: 0.3 },
    difficulty: 1.3,
  },
  {
    id: 'iron_skin',
    name: 'Eisenhaut',
    icon: '🛡️',
    desc: '+5 Rüstung, aber die Waffen sind träge (+15 % Abklingzeit). Gegner +15 %.',
    add: { armor: 5, cooldown: 0.15 },
    difficulty: 1.15,
  },
  {
    id: 'swarm',
    name: 'Schwarmzeit',
    icon: '🐝',
    desc: 'Mehr Projektile für alle: +1 Geschoss und +20 % Fläche. Gegner +35 %.',
    add: { amount: 1 },
    mult: { area: 1.2 },
    difficulty: 1.35,
  },
];

/** Minutes until the weekly boss (half-time boss included). */
export const WEEKLY_MINUTES = 6;

/** Base difficulty; every weekly victory adds a little (capped). */
export function weeklyDifficulty(wins: number): number {
  return 1 + Math.min(1, wins * 0.05);
}

/** Reward for the first victory of a week. */
export const WEEKLY_REWARD: RewardDef = {
  heroItem: 3,
  essence: 250,
  gold: 2500,
  heroXp: 400,
  avatar: '🦹',
};

/** Consolation for a brave attempt (first attempt of the week only). */
export const WEEKLY_TRY_REWARD: RewardDef = { essence: 40, heroXp: 80 };
