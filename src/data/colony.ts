import type { ItemDef, ModifierSet } from './types';

// Kolonie „Neu-Aetherium": Catan-style hex economy plus Siedler-style production buildings.

export type Resource = 'wood' | 'brick' | 'wool' | 'grain' | 'ore';
export const RESOURCES: Resource[] = ['wood', 'brick', 'wool', 'grain', 'ore'];
export type Terrain = Resource | 'desert';

export const RESOURCE_INFO: Record<
  Resource,
  { name: string; icon: string; terrain: string; color: string }
> = {
  wood: { name: 'Holz', icon: '🪵', terrain: 'Wald', color: '#2f7a3a' },
  brick: { name: 'Lehm', icon: '🧱', terrain: 'Lehmgrube', color: '#b5553a' },
  wool: { name: 'Wolle', icon: '🐑', terrain: 'Weide', color: '#8fcf5a' },
  grain: { name: 'Getreide', icon: '🌾', terrain: 'Acker', color: '#e6c34a' },
  ore: { name: 'Erz', icon: '⛰️', terrain: 'Gebirge', color: '#7a7f8c' },
};

export type Cost = Partial<Record<Resource, number>>;

export const COSTS = {
  road: { wood: 1, brick: 1 } as Cost,
  settlement: { wood: 1, brick: 1, wool: 1, grain: 1 } as Cost,
  city: { grain: 2, ore: 3 } as Cost,
  devCard: { wool: 1, grain: 1, ore: 1 } as Cost,
};

export const LIMITS = { roads: 15, settlements: 5, cities: 4 };
export const WIN_POINTS = 10;
export const HAND_LIMIT = 7;

/** Standard tile mix (19 tiles). */
export const TILE_BAG: Terrain[] = [
  'wood',
  'wood',
  'wood',
  'wood',
  'brick',
  'brick',
  'brick',
  'wool',
  'wool',
  'wool',
  'wool',
  'grain',
  'grain',
  'grain',
  'grain',
  'ore',
  'ore',
  'ore',
  'desert',
];
export const NUMBER_BAG = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
/** Harbor kinds: 4 generic 3:1 and one 2:1 per resource. */
export const HARBOR_BAG: (Resource | 'any')[] = [
  'any',
  'wood',
  'any',
  'brick',
  'wool',
  'any',
  'grain',
  'ore',
  'any',
];

/** Probability weight („pips") of a number token. */
export function pips(n: number): number {
  return n === 7 || n < 2 || n > 12 ? 0 : 6 - Math.abs(7 - n);
}

// --- Development cards -----------------------------------------------------------------------------

export type DevCard = 'knight' | 'roadBuilding' | 'plenty' | 'monopoly' | 'victory';
export const DEV_DECK: DevCard[] = [
  ...Array<DevCard>(14).fill('knight'),
  ...Array<DevCard>(5).fill('victory'),
  'roadBuilding',
  'roadBuilding',
  'plenty',
  'plenty',
  'monopoly',
  'monopoly',
];
export const DEV_INFO: Record<DevCard, { name: string; icon: string; desc: string }> = {
  knight: {
    name: 'Ritter',
    icon: '🛡️',
    desc: 'Versetze den Räuber (Reviewer #2) und stiehl eine Karte. Drei Ritter = Größte Rittermacht.',
  },
  roadBuilding: {
    name: 'Straßenbau',
    icon: '🛣️',
    desc: 'Baue sofort 2 Straßen gratis. Die Gewerkschaft ist im Urlaub.',
  },
  plenty: { name: 'Erfindung', icon: '💡', desc: 'Nimm dir 2 Rohstoffe deiner Wahl. Heureka!' },
  monopoly: {
    name: 'Monopol',
    icon: '🎩',
    desc: 'Alle Gegner geben dir einen Rohstoff deiner Wahl. Kartellamt? Nie gehört.',
  },
  victory: {
    name: 'Siegpunkt',
    icon: '🏛️',
    desc: 'Eine Universität! +1 Siegpunkt (wird automatisch gezählt).',
  },
};

// --- AI opponents ----------------------------------------------------------------------------------

export type AiStyle = 'expander' | 'city' | 'knight' | 'trader';
export interface AiPersona {
  id: string;
  name: string;
  icon: string;
  color: string;
  style: AiStyle;
  quips: string[];
}

export const PERSONAS: AiPersona[] = [
  {
    id: 'bureaucratia',
    name: 'Baronin von Bürokratia',
    icon: '👑',
    color: '#e5534b',
    style: 'city',
    quips: [
      'Formular K-7 bitte in dreifacher Ausfertigung.',
      'Meine Städte wachsen nach Vorschrift.',
      'Antrag auf Siegpunkt eingereicht.',
    ],
  },
  {
    id: 'gnomes',
    name: 'Gnom-Konsortium',
    icon: '🧙',
    color: '#5aa9ff',
    style: 'trader',
    quips: [
      'Wir hätten da ein Angebot …',
      'Gnome handeln fair. Fast immer.',
      'Unser Lehm ist der beste Lehm.',
    ],
  },
  {
    id: 'expansion',
    name: 'Prof. Dr. Expansion',
    icon: '🧑‍🔬',
    color: '#f2c94c',
    style: 'expander',
    quips: [
      'Mehr Straßen! Für die Wissenschaft!',
      'Ich habe eine Hypothese: Diese Ecke gehört mir.',
      'Peer-Review bestätigt: Straßen sind gut.',
    ],
  },
  {
    id: 'paladin',
    name: 'Ritterin Ruth',
    icon: '⚔️',
    color: '#b98cff',
    style: 'knight',
    quips: [
      'Der Räuber gehört mir!',
      'Rittermacht ist auch eine Macht.',
      'Für die Ehre – und den Lehm.',
    ],
  },
  {
    id: 'alchemist',
    name: 'Alchemist Ansgar',
    icon: '⚗️',
    color: '#4ad9b0',
    style: 'city',
    quips: ['Erz zu Gold, Gold zu Städten.', 'Die Formel stimmt fast.', 'Blubber.'],
  },
];

// --- Siedler buildings (production chains on own settlements/cities) -------------------------------

export interface ColonyBuildingDef {
  id: string;
  name: string;
  icon: string;
  cost: Cost;
  /** Converts one colony resource into a good (item id) on every dice roll. */
  convert?: { from: Resource; to: string };
  /** Global modifiers per building (capped by maxCount). */
  mods?: ModifierSet;
  maxCount: number;
  desc: string;
}

export const COLONY_BUILDINGS: ColonyBuildingDef[] = [
  {
    id: 'sawmill',
    name: 'Sägewerk',
    icon: '🪚',
    cost: { wood: 2, brick: 1 },
    convert: { from: 'wood', to: 'colony_planks' },
    mods: { 'speed.woodcutting': 0.03, 'xp.crafting': 0.02 },
    maxCount: 4,
    desc: 'Holz → Bretter. +3 % Holzfällen auf der Insel.',
  },
  {
    id: 'mill',
    name: 'Mühle',
    icon: '🌬️',
    cost: { wood: 1, brick: 2 },
    convert: { from: 'grain', to: 'flour' },
    mods: { 'speed.farming': 0.04 },
    maxCount: 4,
    desc: 'Getreide → Mehl. +4 % Wachstum auf den Feldern.',
  },
  {
    id: 'bakery',
    name: 'Bäckerei',
    icon: '🥖',
    cost: { brick: 2, grain: 2 },
    convert: { from: 'grain', to: 'colony_bread' },
    mods: { 'xp.cooking': 0.03 },
    maxCount: 3,
    desc: 'Getreide → Kolonistenbrot (heilt 14 LP). +3 % Koch-XP.',
  },
  {
    id: 'smelter',
    name: 'Schmelzhütte',
    icon: '🏭',
    cost: { brick: 2, ore: 2 },
    convert: { from: 'ore', to: 'bar_iron' },
    mods: { 'speed.smithing': 0.03 },
    maxCount: 4,
    desc: 'Erz → Eisenbarren. +3 % Schmieden.',
  },
  {
    id: 'weaver',
    name: 'Weberei',
    icon: '🧶',
    cost: { wood: 1, wool: 2 },
    convert: { from: 'wool', to: 'colony_cloth' },
    mods: { 'xp.crafting': 0.03 },
    maxCount: 3,
    desc: 'Wolle → Tuch. +3 % Handwerk-XP.',
  },
  {
    id: 'academy',
    name: 'Akademie',
    icon: '🎓',
    cost: { brick: 2, wool: 1, ore: 2 },
    mods: { research: 0.06 },
    maxCount: 3,
    desc: '+6 % Forschungspunkte im ganzen Reich.',
  },
  {
    id: 'harbor_office',
    name: 'Hafenkontor',
    icon: '⚓',
    cost: { wood: 2, wool: 2 },
    mods: { gold: 0.03 },
    maxCount: 3,
    desc: 'Bank-Tausch der Kolonie 3:1 statt 4:1. +3 % Verkaufspreise.',
  },
  {
    id: 'warehouse',
    name: 'Lagerhaus',
    icon: '🏚️',
    cost: { wood: 2, brick: 2 },
    maxCount: 3,
    desc: '+4 Handkartenlimit gegen den Räuber.',
  },
  {
    id: 'watchtower',
    name: 'Wachturm',
    icon: '🗼',
    cost: { brick: 1, ore: 2 },
    mods: { 'combat.defence': 0.03 },
    maxCount: 3,
    desc: 'Schützt gegen Riss-Invasionen. +3 % Verteidigung.',
  },
];

// --- Ruhm talents ------------------------------------------------------------------------------------

export interface FameTalent {
  id: string;
  name: string;
  icon: string;
  desc: string;
  cost: (level: number) => number;
  maxLevel: number;
}

export const FAME_TALENTS: FameTalent[] = [
  {
    id: 'fast_dice',
    name: 'Flinke Würfel',
    icon: '🎲',
    desc: 'Würfelwürfe kommen 10 % schneller pro Stufe.',
    cost: (n) => 15 * n,
    maxLevel: 5,
  },
  {
    id: 'start_kit',
    name: 'Siedler-Starterpaket',
    icon: '🎒',
    desc: 'Starte jede Partie mit je 1 Holz, Lehm, Wolle, Getreide pro Stufe.',
    cost: (n) => 10 * n,
    maxLevel: 3,
  },
  {
    id: 'big_pockets',
    name: 'Große Taschen',
    icon: '👜',
    desc: '+2 Handkartenlimit gegen den Räuber pro Stufe.',
    cost: (n) => 8 * n,
    maxLevel: 4,
  },
  {
    id: 'steward',
    name: 'Verwalter',
    icon: '🧑‍💼',
    desc: 'Ein Verwalter baut automatisch (auch offline) und stellt die Startsiedlungen auf.',
    cost: () => 40,
    maxLevel: 1,
  },
  {
    id: 'diplomat',
    name: 'Diplomatie',
    icon: '🤝',
    desc: 'KI-Handelsangebote sind großzügiger.',
    cost: (n) => 12 * n,
    maxLevel: 3,
  },
  {
    id: 'glory',
    name: 'Ruhmreich',
    icon: '🌟',
    desc: '+25 % Ruhm pro Partie pro Stufe.',
    cost: (n) => 25 * n,
    maxLevel: 4,
  },
];

// --- Import/export with the island ------------------------------------------------------------------

/** How many island items make one colony resource (shipped via the harbor). */
export const IMPORT_RATES: { resource: Resource; items: string[]; qty: number }[] = [
  {
    resource: 'wood',
    items: ['log_oak', 'log_birch', 'log_willow', 'log_maple', 'log_yew'],
    qty: 10,
  },
  { resource: 'brick', items: ['ash'], qty: 15 },
  { resource: 'wool', items: ['fur', 'cowhide'], qty: 3 },
  { resource: 'grain', items: ['wheat'], qty: 8 },
  { resource: 'ore', items: ['ore_iron', 'ore_copper', 'ore_tin'], qty: 8 },
];

export const COLONY_ITEMS: ItemDef[] = [
  {
    id: 'colony_planks',
    name: 'Kolonie-Bretter',
    icon: '🪵',
    category: 'resource',
    sellPrice: 18,
    desc: 'Gerade gesägt im Sägewerk von Neu-Aetherium. Begehrt im Handwerk.',
  },
  {
    id: 'colony_cloth',
    name: 'Kolonie-Tuch',
    icon: '🧶',
    category: 'resource',
    sellPrice: 22,
    desc: 'Weich, warm, mit Siedler-Stolz gewebt.',
  },
  {
    id: 'colony_bread',
    name: 'Kolonistenbrot',
    icon: '🥖',
    category: 'food',
    sellPrice: 12,
    heal: 14,
    desc: 'Heilt 14 LP. Schmeckt nach Pioniergeist.',
  },
  {
    id: 'colony_chest',
    name: 'Kolonie-Schatztruhe',
    icon: '🧰',
    category: 'consumable',
    sellPrice: 150,
    rarity: 'rare',
    desc: 'Der Lohn einer gewonnenen Partie. Öffnen!',
    consume: {
      type: 'loot',
      rolls: 3,
      table: [
        { item: 'coin_pouch', chance: 0.3, min: 3, max: 8 },
        { item: 'research_notes', chance: 0.25, min: 3, max: 6 },
        { item: 'gem_ruby', chance: 0.15 },
        { item: 'seed_mandrake', chance: 0.12 },
        { item: 'gem_diamond', chance: 0.08, rare: true },
        { item: 'newton_apple', chance: 0.1, rare: true },
      ],
    },
  },
];

/** Seconds between dice rolls (before talents/techs). */
export const ROLL_INTERVAL = 30;
