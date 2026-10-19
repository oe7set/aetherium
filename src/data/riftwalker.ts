import type { StatKey } from './rift';
import type { ModifierSet } from './types';

// Rissläufer (skill, XP from every run) and Relikte (rare boss finds that work in every run and
// partly on the island). Both are read by `runStats`/`baseConfig` in engine/rift.ts.

export interface RunPerk {
  /** Extra run stat (multiplicative stats count relative to the base value, like talents). */
  stat?: { key: StatKey; value: number };
  rerolls?: number;
  revives?: number;
  skips?: number;
  banishes?: number;
  /** Extra levels on the starting weapon. */
  weapon?: number;
}

export interface RiftwalkerMilestone extends RunPerk {
  level: number;
  icon: string;
  label: string;
}

/** Per level: +0,2 % might and +0,5 max HP; milestones add bigger perks. */
export const RIFTWALKER_PER_LEVEL = { might: 0.002, maxHp: 0.5 };

export const RIFTWALKER_MILESTONES: RiftwalkerMilestone[] = [
  { level: 10, icon: '🎲', label: '+1 Neu würfeln', rerolls: 1 },
  { level: 20, icon: '🧲', label: '+20 % Magnet', stat: { key: 'magnet', value: 0.2 } },
  { level: 30, icon: '⚔️', label: 'Startwaffe eine Stufe höher', weapon: 1 },
  { level: 40, icon: '💖', label: '+1 Wiederbelebung', revives: 1 },
  {
    level: 50,
    icon: '🍀',
    label: '+10 % Glück (öfter 4 Wahlen)',
    stat: { key: 'luck', value: 0.1 },
  },
  { level: 60, icon: '⏭️', label: '+1 Überspringen, +1 Verbannen', skips: 1, banishes: 1 },
  { level: 75, icon: '✨', label: '+1 Projektil', stat: { key: 'amount', value: 1 } },
  { level: 90, icon: '📈', label: '+15 % Wachstum', stat: { key: 'growth', value: 0.15 } },
];

/** XP for a run: survive, slay, level up, beat bosses; deeper biomes pay more. */
export const RIFTWALKER_XP = {
  perSecond: 0.35,
  perKill: 0.2,
  perLevel: 5,
  perBoss: 60,
  win: 300,
  biome: 0.3,
  /** Live adventure dungeons give this share. */
  dungeon: 0.5,
};

export interface RelicDef extends RunPerk {
  id: string;
  name: string;
  icon: string;
  /** Biome whose bosses drop it; undefined = any biome. */
  biome?: string;
  /** Only from a won run (examiner beaten). */
  winOnly?: boolean;
  /** Island bonus while owned. */
  mods?: ModifierSet;
  desc: string;
}

export const RELICS: RelicDef[] = [
  {
    id: 'hen_feather',
    name: 'Goldene Hühnerfeder',
    icon: '🪶',
    biome: 'meadow',
    stat: { key: 'speed', value: 0.06 },
    mods: { 'xp.husbandry': 0.05 },
    desc: '+6 % Tempo im Riss. Insel: +5 % Viehzucht-XP.',
  },
  {
    id: 'wolf_fang',
    name: 'Wolfszahn',
    icon: '🦷',
    biome: 'darkwood',
    stat: { key: 'might', value: 0.06 },
    mods: { 'combat.damage.melee': 0.03 },
    desc: '+6 % Schaden im Riss. Insel: +3 % Nahkampfschaden.',
  },
  {
    id: 'gnome_cog',
    name: 'Gnomenzahnrad',
    icon: '⚙️',
    biome: 'gnome_lab',
    stat: { key: 'cooldown', value: -0.04 },
    mods: { 'speed.smithing': 0.03, 'speed.fletching': 0.03 },
    desc: '−4 % Abklingzeit im Riss. Insel: Schmieden und Bogenbau 3 % schneller.',
  },
  {
    id: 'forbidden_page',
    name: 'Verbotene Seite',
    icon: '📜',
    biome: 'library',
    stat: { key: 'growth', value: 0.08 },
    mods: { 'xp.enchanting': 0.04, 'xp.magic': 0.04 },
    desc: '+8 % Riss-XP. Insel: +4 % Verzauberungs- und Magie-XP.',
  },
  {
    id: 'ember_heart',
    name: 'Glutherz',
    icon: '❤️‍🔥',
    biome: 'volcano',
    stat: { key: 'area', value: 0.08 },
    mods: { 'combat.damage.magic': 0.03 },
    desc: '+8 % Fläche im Riss. Insel: +3 % Magieschaden.',
  },
  {
    id: 'quantum_die',
    name: 'Quantenwürfel',
    icon: '🎲',
    biome: 'quantum_rift',
    stat: { key: 'luck', value: 0.1 },
    mods: { 'combat.crit': 0.02 },
    desc: '+10 % Glück im Riss. Insel: +2 % kritische Treffer.',
  },
  {
    id: 'frost_crown',
    name: 'Frostkrone',
    icon: '👑',
    biome: 'glacier',
    stat: { key: 'armor', value: 1 },
    mods: { 'combat.hp': 0.04 },
    desc: '+1 Rüstung im Riss. Insel: +4 % Leben im Kampf.',
  },
  {
    id: 'phoenix_ash',
    name: 'Phönixasche',
    icon: '🔥',
    revives: 1,
    desc: '+1 Wiederbelebung in jedem Lauf.',
  },
  {
    id: 'lucky_clover',
    name: 'Vierblättriges Kleeblatt',
    icon: '🍀',
    rerolls: 2,
    mods: { rare: 0.03 },
    desc: '+2 Neu würfeln. Insel: +3 % seltene Funde.',
  },
  {
    id: 'magnet_stone',
    name: 'Magnetstein',
    icon: '🧲',
    stat: { key: 'magnet', value: 0.3 },
    desc: '+30 % Sammelradius.',
  },
  {
    id: 'vampire_tooth',
    name: 'Vampirzahn',
    icon: '🧛',
    stat: { key: 'regen', value: 0.5 },
    mods: { 'combat.regen': 0.25 },
    desc: '+0,5 LP/s im Riss. Insel: Heilung im Kampf +25 %.',
  },
  {
    id: 'hourglass',
    name: 'Sanduhr der Echos',
    icon: '⏳',
    stat: { key: 'duration', value: 0.1 },
    mods: { offlineHours: 0.05 },
    desc: '+10 % Wirkdauer. Insel: +5 % Offline-Zeit.',
  },
  {
    id: 'examiner_crown',
    name: 'Krone des Prüfers',
    icon: '🏆',
    winOnly: true,
    stat: { key: 'might', value: 0.1 },
    weapon: 1,
    desc: '+10 % Schaden und Startwaffe eine Stufe höher. Nur aus gewonnenen Läufen.',
  },
  {
    id: 'aether_lens',
    name: 'Ätherlinse',
    icon: '🔮',
    winOnly: true,
    biome: 'quantum_rift',
    stat: { key: 'amount', value: 1 },
    desc: '+1 Projektil für jede Waffe. Nur aus gewonnenen Läufen im Quantenriss.',
  },
];

export const RELIC_MAP = new Map(RELICS.map((r) => [r.id, r]));

/** Relic drop chance per boss kill, plus a bonus roll for a victory. */
export const RELIC_CHANCE = { perBoss: 0.12, win: 0.35 };
/** Essence instead of a relic once all of a pool is owned. */
export const RELIC_DUPLICATE_ESSENCE = 60;
