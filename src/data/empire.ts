import type { RewardDef } from './progress';

// Reichsrang: one score over every system (skills, village, hero, rift, monuments …). Each rank is a
// title, a small lasting bonus and a ceremony with a reward.

export interface EmpireSource {
  key: string;
  label: string;
  icon: string;
  /** Points per unit. */
  per: number;
}

/** What counts towards the empire score (read by `empireScore`). */
export const EMPIRE_SOURCES: EmpireSource[] = [
  { key: 'totalLevel', label: 'Gesamtlevel', icon: '📊', per: 1 },
  { key: 'population', label: 'Einwohner aller Dörfer', icon: '🏘️', per: 0.2 },
  { key: 'heroLevel', label: 'Heldenstufe', icon: '🦸', per: 5 },
  { key: 'riftWins', label: 'Bestandene Riss-Prüfungen', icon: '🌀', per: 8 },
  { key: 'relics', label: 'Relikte', icon: '🏺', per: 15 },
  { key: 'projectStages', label: 'Großprojekt-Abschnitte', icon: '🏗️', per: 40 },
  { key: 'milestones', label: 'Skill-Meilensteine', icon: '🎖️', per: 6 },
  { key: 'worldBossKills', label: 'Besiegte Weltbosse', icon: '👹', per: 25 },
  { key: 'achievements', label: 'Erfolge', icon: '🏆', per: 2 },
  { key: 'buildings', label: 'Inselbau-Stufen', icon: '🔨', per: 10 },
  { key: 'stars', label: 'Sternbild-Ränge', icon: '🔭', per: 4 },
  { key: 'inventions', label: 'Erfindungs-Stufen', icon: '⚙️', per: 4 },
  { key: 'guildRanks', label: 'Zunft-Ränge', icon: '⚒️', per: 10 },
];

export interface EmpireRank {
  name: string;
  icon: string;
  score: number;
  reward: RewardDef;
}

export const EMPIRE_RANKS: EmpireRank[] = [
  { name: 'Gestrandete·r', icon: '🛶', score: 0, reward: {} },
  { name: 'Siedler·in', icon: '🏕️', score: 150, reward: { gold: 1_000 } },
  { name: 'Dorfälteste·r', icon: '🏡', score: 350, reward: { gold: 3_000, essence: 20 } },
  { name: 'Inselvogt', icon: '🗝️', score: 650, reward: { gold: 8_000, heroXp: 300 } },
  { name: 'Landgraf·gräfin', icon: '🏰', score: 1_000, reward: { gold: 20_000, essence: 50 } },
  { name: 'Hafenfürst·in', icon: '⚓', score: 1_500, reward: { gold: 40_000, heroItem: 2 } },
  { name: 'Herzog·in', icon: '🦚', score: 2_100, reward: { gold: 80_000, essence: 100 } },
  { name: 'Erzherzog·in', icon: '👑', score: 2_800, reward: { gold: 150_000, heroItem: 3 } },
  {
    name: 'König·in der Inseln',
    icon: '🤴',
    score: 3_600,
    reward: { gold: 300_000, essence: 200 },
  },
  { name: 'Hochkönig·in', icon: '🌟', score: 4_600, reward: { gold: 600_000, essence: 300 } },
  { name: 'Sternenregent·in', icon: '🌌', score: 5_800, reward: { gold: 1_200_000, essence: 500 } },
  { name: 'Ätherkaiser·in', icon: '💠', score: 7_500, reward: { gold: 3_000_000, essence: 1_000 } },
];

/** Lasting bonus per reached rank above the first. */
export const EMPIRE_RANK_MODS = { xp: 0.01, gold: 0.01, 'village.prod': 0.01 };
