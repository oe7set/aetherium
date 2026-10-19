import type { ActionDef, ItemDef, LootEntry } from './types';

// Kartografie: survey regions on parchment, send expeditions and find treasure maps. Each level
// also shortens the hero's travel time (better maps, shorter paths).

interface Region {
  id: string;
  name: string;
  icon: string;
  level: number;
  time: number;
  xp: number;
  price: number;
  drops: LootEntry[];
  desc: string;
}

const REGIONS: Region[] = [
  {
    id: 'coast',
    name: 'Küste',
    icon: '🏖️',
    level: 1,
    time: 3.5,
    xp: 12,
    price: 14,
    drops: [
      { item: 'treasure_map_1', chance: 1 / 30 },
      { item: 'bait', chance: 0.2, min: 2, max: 5 },
      { item: 'seed_potato', chance: 0.1 },
    ],
    desc: 'Sand, Möwen, eine Flasche mit Nachricht (leer).',
  },
  {
    id: 'forest',
    name: 'Wald',
    icon: '🌲',
    level: 12,
    time: 4,
    xp: 26,
    price: 30,
    drops: [
      { item: 'treasure_map_1', chance: 1 / 22 },
      { item: 'seed_mint', chance: 0.08 },
      { item: 'seed_sage', chance: 0.05 },
    ],
    desc: 'Jeder Baum sieht gleich aus. Die Karte hilft.',
  },
  {
    id: 'hills',
    name: 'Hügelland',
    icon: '⛰️',
    level: 25,
    time: 4.5,
    xp: 45,
    price: 55,
    drops: [
      { item: 'treasure_map_1', chance: 1 / 18 },
      { item: 'geode', chance: 0.15 },
      { item: 'fossil', chance: 0.02 },
    ],
    desc: 'Rauf, runter, rauf. Die Höhenlinien lügen nicht.',
  },
  {
    id: 'mountains',
    name: 'Gebirge',
    icon: '🏔️',
    level: 40,
    time: 5,
    xp: 75,
    price: 95,
    drops: [
      { item: 'treasure_map_2', chance: 1 / 25 },
      { item: 'gem_topaz', chance: 0.05 },
      { item: 'seed_mandrake', chance: 0.03 },
    ],
    desc: 'Die Berge vom Horizont, jetzt mit Maßstab.',
  },
  {
    id: 'desert',
    name: 'Glutwüste',
    icon: '🏜️',
    level: 55,
    time: 5.5,
    xp: 110,
    price: 150,
    drops: [
      { item: 'treasure_map_2', chance: 1 / 18 },
      { item: 'ancient_coin', chance: 0.05 },
      { item: 'seed_dragonroot', chance: 0.02 },
    ],
    desc: 'Sand in jeder Falte der Karte.',
  },
  {
    id: 'ocean',
    name: 'Offenes Meer',
    icon: '🌊',
    level: 70,
    time: 6,
    xp: 160,
    price: 240,
    drops: [
      { item: 'treasure_map_3', chance: 1 / 25 },
      { item: 'raw_shark', chance: 0.15 },
      { item: 'gem_sapphire', chance: 0.04 },
    ],
    desc: 'Hier sind Drachen. Und Haie. Vor allem Haie.',
  },
  {
    id: 'aether',
    name: 'Ätherweiten',
    icon: '🌌',
    level: 85,
    time: 7,
    xp: 240,
    price: 400,
    drops: [
      { item: 'treasure_map_3', chance: 1 / 15 },
      { item: 'mana_crystal', chance: 0.1 },
      { item: 'aether', chance: 1 / 150, rare: true },
    ],
    desc: 'Kartografie für Fortgeschrittene: Die Ränder bewegen sich.',
  },
];

const TREASURE: { tier: number; name: string; price: number; table: LootEntry[] }[] = [
  {
    tier: 1,
    name: 'Alte Schatzkarte',
    price: 60,
    table: [
      { item: 'geode', chance: 1, min: 2, max: 5 },
      { item: 'gem_opal', chance: 0.6, min: 1, max: 3 },
      { item: 'charm_gold', chance: 0.5, min: 2, max: 5 },
      { item: 'ancient_coin', chance: 0.3 },
      { item: 'gem_sapphire', chance: 0.1 },
    ],
  },
  {
    tier: 2,
    name: 'Vergilbte Schatzkarte',
    price: 250,
    table: [
      { item: 'gem_topaz', chance: 1, min: 1, max: 3 },
      { item: 'bar_gold', chance: 0.6, min: 1, max: 3 },
      { item: 'charm_crimson', chance: 0.5, min: 1, max: 3 },
      { item: 'clay_tablet', chance: 0.2 },
      { item: 'gem_ruby', chance: 0.12 },
    ],
  },
  {
    tier: 3,
    name: 'Legendäre Schatzkarte',
    price: 1200,
    table: [
      { item: 'gem_diamond', chance: 0.6 },
      { item: 'charm_blue', chance: 0.6, min: 1, max: 3 },
      { item: 'dragon_scale', chance: 0.3 },
      { item: 'gem_onyx', chance: 0.1, rare: true },
      { item: 'gem_aether', chance: 0.02, rare: true },
    ],
  },
];

export const CARTO_ITEMS: ItemDef[] = [
  {
    id: 'parchment',
    name: 'Pergament',
    icon: '📜',
    category: 'resource',
    sellPrice: 2,
    desc: 'Leer, geduldig, bereit für Abenteuer.',
  },
  ...REGIONS.map((r): ItemDef => ({
    id: `map_${r.id}`,
    name: `Karte: ${r.name}`,
    icon: '🗺️',
    category: 'resource',
    sellPrice: r.price,
    desc: `${r.desc} Gefragt bei Händlern und für Expeditionen.`,
  })),
  ...TREASURE.map((t): ItemDef => ({
    id: `treasure_map_${t.tier}`,
    name: t.name,
    icon: '🧭',
    category: 'consumable',
    sellPrice: t.price,
    rarity: t.tier === 3 ? 'epic' : t.tier === 2 ? 'rare' : 'uncommon',
    desc: 'Benutzen: dem X folgen und graben.',
    consume: { type: 'loot', rolls: 2 + t.tier, table: t.table },
  })),
];

/** Surveying is slow and eats parchment; expeditions eat maps and bread – both pay accordingly. */
const SURVEY_XP_MULT = 1.4;

export const CARTO_ACTIONS: ActionDef[] = [
  {
    id: 'carto_parchment',
    skill: 'cartography',
    category: 'Material',
    name: 'Pergament gerben',
    icon: '📜',
    levelReq: 1,
    baseTime: 2.5,
    xp: 5,
    inputs: [{ item: 'cowhide', qty: 1 }],
    outputs: [{ item: 'parchment', qty: 4 }],
  },
  ...REGIONS.map((r): ActionDef => ({
    id: `carto_${r.id}`,
    skill: 'cartography',
    category: 'Kartieren',
    name: `${r.name} kartieren`,
    icon: r.icon,
    levelReq: r.level,
    baseTime: r.time,
    xp: Math.round(r.xp * SURVEY_XP_MULT),
    inputs: [{ item: 'parchment', qty: 1 }],
    outputs: [{ item: `map_${r.id}`, qty: 1 }],
    drops: r.drops,
    desc: r.desc,
  })),
  {
    id: 'carto_exp_ruins',
    skill: 'cartography',
    category: 'Expeditionen',
    name: 'Expedition: Versunkene Ruinen',
    icon: '🏛️',
    levelReq: 30,
    baseTime: 45,
    xp: 900,
    inputs: [
      { item: 'map_hills', qty: 3 },
      { item: 'bread', qty: 5 },
    ],
    outputs: [{ item: 'treasure_map_1', qty: 2 }],
    drops: [
      { item: 'clay_tablet', chance: 0.3 },
      { item: 'fossil', chance: 0.4 },
      { item: 'treasure_map_2', chance: 0.25 },
    ],
    desc: 'Drei Karten, fünf Brote, ein Abenteuer.',
  },
  {
    id: 'carto_exp_peaks',
    skill: 'cartography',
    category: 'Expeditionen',
    name: 'Expedition: Gipfelsturm',
    icon: '🧗',
    levelReq: 50,
    baseTime: 60,
    xp: 1800,
    inputs: [
      { item: 'map_mountains', qty: 3 },
      { item: 'bread', qty: 8 },
    ],
    outputs: [{ item: 'treasure_map_2', qty: 1 }],
    drops: [
      { item: 'frost_shard', chance: 0.4, min: 1, max: 3 },
      { item: 'griffin_feather', chance: 0.2 },
      { item: 'treasure_map_3', chance: 0.1 },
    ],
    desc: 'Oben ist die Luft dünn und die Beute dick.',
  },
  {
    id: 'carto_exp_abyss',
    skill: 'cartography',
    category: 'Expeditionen',
    name: 'Expedition: Meeresschlund',
    icon: '🌀',
    levelReq: 75,
    baseTime: 90,
    xp: 4200,
    inputs: [
      { item: 'map_ocean', qty: 3 },
      { item: 'bread', qty: 12 },
    ],
    outputs: [{ item: 'treasure_map_3', qty: 1 }],
    drops: [
      { item: 'void_shard', chance: 0.4 },
      { item: 'gem_onyx', chance: 0.05, rare: true },
      { item: 'kraken_trident', chance: 1 / 200, rare: true },
    ],
    desc: 'Wo die Karten enden, beginnt der Schlund.',
  },
];

/** Passive per level: faster hero trips, a little archaeology XP. */
export const CARTO_PER_LEVEL = { travel: 0.005, archaeologyXp: 0.002 };
