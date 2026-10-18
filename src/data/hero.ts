// Der Held: one hero for village and rift. Attributes, equipment templates, adventures.

export type HeroAttr = 'power' | 'offense' | 'defense' | 'resources';

export const HERO_ATTRS: { id: HeroAttr; name: string; icon: string; desc: string }[] = [
  {
    id: 'power',
    name: 'Kampfkraft',
    icon: '💪',
    desc: '+40 Kampfkraft bei Raubzügen & Verteidigung · +0,3 % Schaden im Riss',
  },
  {
    id: 'offense',
    name: 'Angriffsbonus',
    icon: '⚔️',
    desc: '+0,2 % Angriff begleiteter Truppen · −0,1 % Abklingzeit im Riss',
  },
  {
    id: 'defense',
    name: 'Verteidigungsbonus',
    icon: '🛡️',
    desc: '+0,2 % Verteidigung im Heimatdorf · +1 Rüstung im Riss pro 25 Punkte',
  },
  {
    id: 'resources',
    name: 'Rohstoffe',
    icon: '🌾',
    desc: '+0,25 % Produktion im Heimatdorf pro Punkt',
  },
];

export const POINTS_PER_LEVEL = 4;
export const MAX_ATTR = 100;
/** Hero level cap. */
export const HERO_MAX_LEVEL = 100;

export function heroXpForLevel(level: number): number {
  return Math.round(50 + level * 30 + level * level * 3);
}

export const HERO_AVATARS = ['🧑‍🚀', '🧙', '🥷', '🧝', '🧛', '🤴', '👸', '🦸', '🧑‍🔬', '🧔'];

/** Fields per hour (before SPEED). */
export const HERO_SPEED = 7;
/** Health regenerated per hour. */
export const HERO_REGEN = 15;

// --- Equipment ------------------------------------------------------------------------------------

export type HeroSlot = 'helmet' | 'armor' | 'weapon' | 'boots' | 'horse' | 'amulet';

export const HERO_SLOTS: { id: HeroSlot; name: string; icon: string }[] = [
  { id: 'helmet', name: 'Kopf', icon: '⛑️' },
  { id: 'armor', name: 'Rüstung', icon: '🦺' },
  { id: 'weapon', name: 'Waffe', icon: '🗡️' },
  { id: 'boots', name: 'Stiefel', icon: '👢' },
  { id: 'horse', name: 'Reittier', icon: '🐎' },
  { id: 'amulet', name: 'Amulett', icon: '📿' },
];

/**
 * Stat keys of hero items:
 * island: xp · village: cp, train, resources, raidAttack, heroDef · hero: heroPower, heroSpeed, regen, heroXp, loot
 * rift: riftMight, riftArmor, riftArea, riftSpeed, riftLuck, riftMagnet, riftGrowth, riftHp
 */
export interface HeroItemDef {
  id: string;
  name: string;
  icon: string;
  slot: HeroSlot;
  stats: Record<string, number>;
}

export const HERO_ITEMS: HeroItemDef[] = [
  { id: 'helm_wisdom', name: 'Helm der Weisheit', icon: '🎓', slot: 'helmet', stats: { xp: 0.04 } },
  { id: 'helm_culture', name: 'Lorbeerkranz', icon: '🌿', slot: 'helmet', stats: { cp: 0.1 } },
  {
    id: 'helm_drill',
    name: 'Drillmeister-Helm',
    icon: '⛑️',
    slot: 'helmet',
    stats: { train: 0.06 },
  },
  {
    id: 'armor_herbs',
    name: 'Kräuterwams',
    icon: '🧥',
    slot: 'armor',
    stats: { regen: 8, riftHp: 0.05 },
  },
  {
    id: 'armor_plate',
    name: 'Ätherplatte',
    icon: '🛡️',
    slot: 'armor',
    stats: { riftArmor: 1, heroDef: 40 },
  },
  {
    id: 'armor_scale',
    name: 'Drachenschuppe',
    icon: '🐉',
    slot: 'armor',
    stats: { riftHp: 0.1, regen: 4 },
  },
  {
    id: 'weapon_blade',
    name: 'Klinge',
    icon: '⚔️',
    slot: 'weapon',
    stats: { heroPower: 30, riftMight: 0.05 },
  },
  {
    id: 'weapon_axe',
    name: 'Kriegsaxt',
    icon: '🪓',
    slot: 'weapon',
    stats: { raidAttack: 0.04, heroPower: 15 },
  },
  {
    id: 'weapon_staff',
    name: 'Ätherstab',
    icon: '🪄',
    slot: 'weapon',
    stats: { riftArea: 0.06, riftMight: 0.03 },
  },
  {
    id: 'boots_swift',
    name: 'Siebenmeilenstiefel',
    icon: '👢',
    slot: 'boots',
    stats: { heroSpeed: 0.25, riftSpeed: 0.04 },
  },
  {
    id: 'boots_spikes',
    name: 'Spikestiefel',
    icon: '🥾',
    slot: 'boots',
    stats: { riftArmor: 1, riftSpeed: 0.02 },
  },
  { id: 'horse_pony', name: 'Pony', icon: '🐴', slot: 'horse', stats: { heroSpeed: 0.6 } },
  {
    id: 'horse_war',
    name: 'Schlachtross',
    icon: '🐎',
    slot: 'horse',
    stats: { heroSpeed: 0.4, heroPower: 20 },
  },
  {
    id: 'horse_griffin',
    name: 'Greif',
    icon: '🦅',
    slot: 'horse',
    stats: { heroSpeed: 0.8, riftSpeed: 0.03 },
  },
  {
    id: 'amulet_luck',
    name: 'Glücksamulett',
    icon: '🍀',
    slot: 'amulet',
    stats: { riftLuck: 0.1, loot: 0.1 },
  },
  {
    id: 'amulet_magnet',
    name: 'Magnetstein',
    icon: '🧲',
    slot: 'amulet',
    stats: { riftMagnet: 0.25 },
  },
  {
    id: 'amulet_harvest',
    name: 'Erntetalisman',
    icon: '🌾',
    slot: 'amulet',
    stats: { resources: 0.05 },
  },
  {
    id: 'amulet_scholar',
    name: 'Lernstein',
    icon: '📘',
    slot: 'amulet',
    stats: { riftGrowth: 0.08, heroXp: 0.1 },
  },
];

export const TIER_NAMES = ['', 'Einfach', 'Edel', 'Legendär'];
export const TIER_MULT = [0, 1, 2, 3.5];
export const TIER_COLORS = ['', '#9aa4c8', '#5aa9ff', '#ffd166'];
/** Riss-Essenz when an item is dismantled. */
export const DISMANTLE_ESSENCE = [0, 8, 30, 120];
export const HERO_BAG_SIZE = 24;

export const STAT_LABELS: Record<string, string> = {
  xp: '% XP auf der Insel',
  cp: '% Kulturpunkte',
  train: '% schnellere Ausbildung',
  resources: '% Rohstoffe (Heimatdorf)',
  raidAttack: '% Angriff begleiteter Truppen',
  heroDef: ' Verteidigung (Held)',
  heroPower: ' Kampfkraft',
  heroSpeed: '% Reisetempo',
  regen: ' Gesundheit/h',
  heroXp: '% Helden-XP',
  loot: '% Abenteuer-Beute',
  riftMight: '% Schaden im Riss',
  riftArmor: ' Rüstung im Riss',
  riftArea: '% Bereich im Riss',
  riftSpeed: '% Tempo im Riss',
  riftLuck: '% Glück im Riss',
  riftMagnet: '% Sammelradius',
  riftGrowth: '% Erfahrung im Riss',
  riftHp: '% LP im Riss',
};

/** Stats shown as percent (value × 100). */
export const PERCENT_STATS = new Set(
  Object.keys(STAT_LABELS).filter((k) => STAT_LABELS[k]!.startsWith('%')),
);

// --- Adventures ---------------------------------------------------------------------------------

export const MAX_ADVENTURES = 5;
/** Seconds between new adventures and their lifetime. */
export const ADVENTURE_SPAWN = 40 * 60;
export const ADVENTURE_LIFETIME = 12 * 3600;
/** Waiting at an adventure this long resolves it automatically (idle friendly). */
export const ADVENTURE_AUTO_WAIT = 30 * 60;
/** Dungeon length in minutes (normal / hard). */
export const DUNGEON_MINUTES = { normal: 4, hard: 6 };

export const ADVENTURE_NAMES: Record<string, string[]> = {
  meadow: ['Verlassene Mühle', 'Hühnerstall des Grauens', 'Goblin-Tunnel'],
  darkwood: ['Wolfshöhle', 'Spinnennest', 'Vergessene Hütte'],
  gnome_lab: ['Explodiertes Labor', 'Zahnradgruft', 'Prototypen-Lager'],
  library: ['Verbotene Abteilung', 'Staubige Gruft', 'Archiv der Fußnoten'],
  volcano: ['Glutschlund', 'Obsidianhalle', 'Drachenhort'],
  quantum_rift: ['Superpositions-Kammer', 'Ereignishorizont', 'Paradoxe Pforte'],
};
