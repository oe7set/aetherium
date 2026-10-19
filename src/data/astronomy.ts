import type { ActionDef, ItemDef, LootEntry, ModifierSet } from './types';

// Sternkunde: watch the sky for stardust (twice as much at night), then study constellations with it.
// Each constellation has five ranks of bonuses; only a few can shine at once (slots grow with the level).

interface Sky {
  id: string;
  name: string;
  icon: string;
  level: number;
  time: number;
  xp: number;
  dust: number;
  drops: LootEntry[];
  desc: string;
}

const SKIES: Sky[] = [
  {
    id: 'evening',
    name: 'Abendhimmel',
    icon: '🌆',
    level: 1,
    time: 4,
    xp: 10,
    dust: 1,
    drops: [],
    desc: 'Der erste Stern ist meistens ein Flugzeug. Hier gibt es keine Flugzeuge.',
  },
  {
    id: 'moon',
    name: 'Mondkrater',
    icon: '🌙',
    level: 15,
    time: 4.5,
    xp: 24,
    dust: 1,
    drops: [{ item: 'moonstone', chance: 0.05 }],
    desc: 'Der Mond guckt zurück. Höflich bleiben.',
  },
  {
    id: 'planets',
    name: 'Wandelsterne',
    icon: '🪐',
    level: 30,
    time: 5,
    xp: 45,
    dust: 2,
    drops: [{ item: 'moonstone', chance: 0.08 }],
    desc: 'Sie wandern, weil sie es können.',
  },
  {
    id: 'comet',
    name: 'Kometenbahn',
    icon: '☄️',
    level: 45,
    time: 5.5,
    xp: 70,
    dust: 2,
    drops: [{ item: 'meteorite', chance: 0.06 }],
    desc: 'Einmal in 76 Jahren. Oder jetzt, wenn du hinsiehst.',
  },
  {
    id: 'nebula',
    name: 'Nebelhaufen',
    icon: '🌌',
    level: 60,
    time: 6,
    xp: 105,
    dust: 3,
    drops: [
      { item: 'meteorite', chance: 0.08 },
      { item: 'mana_crystal', chance: 0.05 },
    ],
    desc: 'Sternenkinderstube in Pastellfarben.',
  },
  {
    id: 'pulsar',
    name: 'Pulsar',
    icon: '💫',
    level: 75,
    time: 6.5,
    xp: 150,
    dust: 4,
    drops: [{ item: 'meteorite', chance: 0.1 }],
    desc: 'Tickt genauer als jede Uhr auf der Insel.',
  },
  {
    id: 'void',
    name: 'Rand des Alls',
    icon: '🕳️',
    level: 90,
    time: 7,
    xp: 220,
    dust: 5,
    drops: [
      { item: 'void_shard', chance: 0.05 },
      { item: 'gem_aether', chance: 0.005, rare: true },
    ],
    desc: 'Dahinter beginnt der Riss. Oder ein sehr großer Vorhang.',
  },
];

export const ASTRO_ITEMS: ItemDef[] = [
  {
    id: 'moonstone',
    name: 'Mondstein',
    icon: '🌕',
    category: 'resource',
    sellPrice: 80,
    rarity: 'uncommon',
    desc: 'Schimmert, wenn niemand hinsieht.',
  },
  {
    id: 'meteorite',
    name: 'Meteoritenbrocken',
    icon: '☄️',
    category: 'resource',
    sellPrice: 220,
    rarity: 'rare',
    desc: 'Ist von weit her gekommen, um dir auf den Fuß zu fallen.',
  },
  {
    id: 'bar_starmetal',
    name: 'Sternenmetall',
    icon: '🌟',
    category: 'resource',
    sellPrice: 900,
    rarity: 'rare',
    desc: 'Leichter als Mithril, härter als Ausreden.',
  },
];

export const ASTRO_ACTIONS: ActionDef[] = [
  ...SKIES.map((k): ActionDef => ({
    id: `astro_${k.id}`,
    skill: 'astronomy',
    category: 'Himmel beobachten',
    name: k.name,
    icon: k.icon,
    levelReq: k.level,
    baseTime: k.time,
    xp: k.xp,
    inputs: [],
    outputs: [{ item: 'stardust', qty: k.dust }],
    drops: k.drops,
    desc: `${k.desc} Nachts doppelte Ausbeute und XP.`,
  })),
  {
    id: 'astro_starmetal',
    skill: 'smithing',
    category: 'Barren',
    name: 'Sternenmetall schmelzen',
    icon: '🌟',
    levelReq: 72,
    baseTime: 6,
    xp: 260,
    inputs: [
      { item: 'meteorite', qty: 1 },
      { item: 'bar_mithril', qty: 2 },
    ],
    outputs: [{ item: 'bar_starmetal', qty: 1 }],
    desc: 'Für Sternenstahl-Ausrüstung und große Erfindungen.',
  },
];

/** Night multiplier on stardust and XP of stargazing. */
export const NIGHT_MULT = 2;

export interface ConstellationDef {
  id: string;
  name: string;
  icon: string;
  level: number;
  /** Modifiers per rank. */
  perRank: ModifierSet;
  desc: string;
}

export const CONSTELLATIONS: ConstellationDef[] = [
  {
    id: 'lumberjack',
    name: 'Der Holzfäller',
    icon: '🪓',
    level: 1,
    perRank: { 'speed.woodcutting': 0.02, 'xp.firemaking': 0.02 },
    desc: 'Holzfällen und Feuermachen',
  },
  {
    id: 'pickaxe',
    name: 'Die Spitzhacke',
    icon: '⛏️',
    level: 10,
    perRank: { 'speed.mining': 0.02, 'xp.smithing': 0.02 },
    desc: 'Bergbau und Schmieden',
  },
  {
    id: 'fish',
    name: 'Der Fisch',
    icon: '🐟',
    level: 20,
    perRank: { 'speed.fishing': 0.02, 'xp.cooking': 0.02 },
    desc: 'Angeln und Kochen',
  },
  {
    id: 'anvil',
    name: 'Der Amboss',
    icon: '⚒️',
    level: 30,
    perRank: { 'speed.crafting': 0.015, 'speed.fletching': 0.015, 'speed.jewelcrafting': 0.015 },
    desc: 'Handwerk, Bogenbau, Juwelierkunst',
  },
  {
    id: 'warrior',
    name: 'Der Krieger',
    icon: '⚔️',
    level: 40,
    perRank: { 'combat.damage': 0.015, 'combat.accuracy': 0.01 },
    desc: 'Kampf',
  },
  {
    id: 'owl',
    name: 'Die Eule',
    icon: '🦉',
    level: 50,
    perRank: { xp: 0.01, research: 0.02 },
    desc: 'Alle XP und Forschung',
  },
  {
    id: 'scales',
    name: 'Die Waage',
    icon: '⚖️',
    level: 60,
    perRank: { gold: 0.02, 'village.prod': 0.01 },
    desc: 'Gold und Dorfwirtschaft',
  },
  {
    id: 'compass',
    name: 'Der Kompass',
    icon: '🧭',
    level: 70,
    perRank: { 'speed.sailing': 0.02, 'hero.travel': 0.02 },
    desc: 'Seefahrt und Heldenreisen',
  },
  {
    id: 'dragon',
    name: 'Der Drache',
    icon: '🐉',
    level: 85,
    perRank: { 'rift.might': 0.02, 'combat.hp': 0.015 },
    desc: 'Riss und Lebenskraft',
  },
];

export const CONSTELLATION_MAP = new Map(CONSTELLATIONS.map((c) => [c.id, c]));
export const CONSTELLATION_MAX_RANK = 5;

/** Stardust for the next rank (rank 1 = 20, doubling); rank 4+ also needs meteorites. */
export function constellationCost(rank: number): { item: string; qty: number }[] {
  const cost = [{ item: 'stardust', qty: 20 * 2 ** rank }];
  if (rank >= 3) cost.push({ item: 'meteorite', qty: rank - 2 });
  return cost;
}

/** Shining constellations at once: 1, +1 every 20 levels (max 5). */
export function constellationSlots(level: number): number {
  return Math.min(5, 1 + Math.floor(level / 20));
}
