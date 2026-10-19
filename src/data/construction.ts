import type { ActionDef, ItemDef, ModifierSet } from './types';

// Baukunst: planks, stone blocks and nails become furniture and island buildings. Buildings have
// three levels with lasting bonuses and show up on the island.

interface Plank {
  id: string;
  name: string;
  log: string;
  level: number;
  xp: number;
  price: number;
}

const PLANKS: Plank[] = [
  { id: 'plank_oak', name: 'Eichenbrett', log: 'log_oak', level: 1, xp: 8, price: 4 },
  { id: 'plank_maple', name: 'Ahornbrett', log: 'log_maple', level: 30, xp: 22, price: 18 },
  { id: 'plank_yew', name: 'Eibenbrett', log: 'log_yew', level: 50, xp: 38, price: 40 },
  { id: 'plank_magic', name: 'Zauberholzbrett', log: 'log_magic', level: 70, xp: 60, price: 90 },
];

interface Furniture {
  id: string;
  name: string;
  icon: string;
  level: number;
  xp: number;
  inputs: { item: string; qty: number }[];
  price: number;
  desc: string;
}

const FURNITURE: Furniture[] = [
  {
    id: 'furn_chair',
    name: 'Holzstuhl',
    icon: '🪑',
    level: 5,
    xp: 30,
    inputs: [
      { item: 'plank_oak', qty: 2 },
      { item: 'nails', qty: 4 },
    ],
    price: 40,
    desc: 'Vier Beine, eine Lehne, null Drama.',
  },
  {
    id: 'furn_table',
    name: 'Eichentisch',
    icon: '🍽️',
    level: 15,
    xp: 65,
    inputs: [
      { item: 'plank_oak', qty: 4 },
      { item: 'nails', qty: 8 },
    ],
    price: 90,
    desc: 'Für Festmahle und Kartenabende.',
  },
  {
    id: 'furn_shelf',
    name: 'Ahornregal',
    icon: '📚',
    level: 30,
    xp: 140,
    inputs: [
      { item: 'plank_maple', qty: 4 },
      { item: 'nails', qty: 10 },
    ],
    price: 220,
    desc: 'Für Bücher, die du irgendwann liest.',
  },
  {
    id: 'furn_wardrobe',
    name: 'Eibenschrank',
    icon: '🚪',
    level: 45,
    xp: 230,
    inputs: [
      { item: 'plank_yew', qty: 5 },
      { item: 'nails', qty: 12 },
    ],
    price: 500,
    desc: 'Führt leider nicht nach Narnia.',
  },
  {
    id: 'furn_statue',
    name: 'Granitbüste',
    icon: '🗿',
    level: 55,
    xp: 300,
    inputs: [{ item: 'stone_block', qty: 8 }],
    price: 650,
    desc: 'Sieht dir erstaunlich ähnlich. Von hinten.',
  },
  {
    id: 'furn_throne',
    name: 'Zauberholzthron',
    icon: '👑',
    level: 70,
    xp: 520,
    inputs: [
      { item: 'plank_magic', qty: 6 },
      { item: 'bar_gold', qty: 2 },
      { item: 'gem_ruby', qty: 1 },
    ],
    price: 2500,
    desc: 'Für Herrscher über eine sehr kleine Insel.',
  },
];

export const CONSTRUCTION_ITEMS: ItemDef[] = [
  ...PLANKS.map((p): ItemDef => ({
    id: p.id,
    name: p.name,
    icon: '🪵',
    category: 'resource',
    sellPrice: p.price,
    desc: 'Gesägt, gehobelt, bereit zum Bauen.',
  })),
  {
    id: 'stone_block',
    name: 'Steinblock',
    icon: '🧱',
    category: 'resource',
    sellPrice: 9,
    desc: 'Zwei Granitbrocken, ein Ziel: Fundament.',
  },
  {
    id: 'nails',
    name: 'Nägel',
    icon: '📌',
    category: 'resource',
    sellPrice: 1,
    desc: 'Halten die Welt zusammen. Wortwörtlich.',
  },
  ...FURNITURE.map((f): ItemDef => ({
    id: f.id,
    name: f.name,
    icon: f.icon,
    category: 'resource',
    sellPrice: f.price,
    desc: f.desc,
  })),
];

export const CONSTRUCTION_ACTIONS: ActionDef[] = [
  ...PLANKS.map((p): ActionDef => ({
    id: `cons_${p.id}`,
    skill: 'construction',
    category: 'Baustoffe',
    name: `${p.name}er sägen`,
    icon: '🪚',
    levelReq: p.level,
    baseTime: 2.4,
    xp: p.xp,
    inputs: [{ item: p.log, qty: 1 }],
    outputs: [{ item: p.id, qty: 1 }],
  })),
  {
    id: 'cons_stone_block',
    skill: 'construction',
    category: 'Baustoffe',
    name: 'Steinblöcke hauen',
    icon: '🧱',
    levelReq: 10,
    baseTime: 3,
    xp: 16,
    inputs: [{ item: 'stone_granite', qty: 2 }],
    outputs: [{ item: 'stone_block', qty: 1 }],
  },
  ...FURNITURE.map((f): ActionDef => ({
    id: `cons_${f.id}`,
    skill: 'construction',
    category: 'Möbel',
    name: f.name,
    icon: f.icon,
    levelReq: f.level,
    baseTime: 4 + f.level / 30,
    xp: f.xp,
    inputs: f.inputs,
    outputs: [{ item: f.id, qty: 1 }],
  })),
  {
    id: 'smith_nails_bronze',
    skill: 'smithing',
    category: 'Werkzeuge',
    name: '10 Bronzenägel',
    icon: '📌',
    levelReq: 3,
    baseTime: 2.5,
    xp: 8,
    inputs: [{ item: 'bar_bronze', qty: 1 }],
    outputs: [{ item: 'nails', qty: 10 }],
  },
  {
    id: 'smith_nails_iron',
    skill: 'smithing',
    category: 'Werkzeuge',
    name: '25 Eisennägel',
    icon: '📌',
    levelReq: 16,
    baseTime: 2.5,
    xp: 16,
    inputs: [{ item: 'bar_iron', qty: 1 }],
    outputs: [{ item: 'nails', qty: 25 }],
  },
];

export interface BuildingLevel {
  level: number;
  cost: { item: string; qty: number }[];
  xp: number;
  mods: ModifierSet;
}

export interface IslandBuildingDef {
  id: string;
  name: string;
  icon: string;
  roof: string;
  pos: [number, number];
  desc: string;
  levels: BuildingLevel[];
}

export const ISLAND_BUILDINGS: IslandBuildingDef[] = [
  {
    id: 'workshop',
    name: 'Werkstatt',
    icon: '🛠️',
    roof: '#c8834a',
    pos: [-9.4, 2.2],
    desc: 'Schnelleres Handwerk und Schmieden.',
    levels: [
      {
        level: 5,
        cost: [
          { item: 'plank_oak', qty: 20 },
          { item: 'nails', qty: 40 },
        ],
        xp: 300,
        mods: { 'speed.crafting': 0.04, 'speed.smithing': 0.04 },
      },
      {
        level: 25,
        cost: [
          { item: 'plank_oak', qty: 40 },
          { item: 'stone_block', qty: 20 },
          { item: 'furn_table', qty: 2 },
        ],
        xp: 1200,
        mods: { 'speed.crafting': 0.08, 'speed.smithing': 0.08 },
      },
      {
        level: 50,
        cost: [
          { item: 'plank_yew', qty: 30 },
          { item: 'furn_wardrobe', qty: 2 },
          { item: 'bar_mithril', qty: 10 },
        ],
        xp: 4000,
        mods: { 'speed.crafting': 0.12, 'speed.smithing': 0.12, 'double.smithing': 0.04 },
      },
    ],
  },
  {
    id: 'sawmill',
    name: 'Sägewerk',
    icon: '🪚',
    roof: '#8b6b4a',
    pos: [-8.4, -3.4],
    desc: 'Mehr Holz und schnellere Bretter.',
    levels: [
      {
        level: 10,
        cost: [
          { item: 'plank_oak', qty: 30 },
          { item: 'nails', qty: 60 },
        ],
        xp: 500,
        mods: { 'double.woodcutting': 0.03, 'speed.construction': 0.05 },
      },
      {
        level: 35,
        cost: [
          { item: 'plank_maple', qty: 30 },
          { item: 'stone_block', qty: 30 },
        ],
        xp: 1800,
        mods: { 'double.woodcutting': 0.06, 'speed.construction': 0.1 },
      },
      {
        level: 60,
        cost: [
          { item: 'plank_yew', qty: 40 },
          { item: 'bar_adamant', qty: 8 },
        ],
        xp: 5000,
        mods: { 'double.woodcutting': 0.09, 'speed.construction': 0.15 },
      },
    ],
  },
  {
    id: 'altar',
    name: 'Gebetsaltar',
    icon: '⛪',
    roof: '#f3e3a1',
    pos: [-8.4, 5.0],
    desc: 'Mehr Gebetspunkte und Glaube-XP.',
    levels: [
      {
        level: 15,
        cost: [
          { item: 'stone_block', qty: 20 },
          { item: 'blessed_candle', qty: 5 },
        ],
        xp: 700,
        mods: { 'prayer.max': 15, 'xp.faith': 0.05 },
      },
      {
        level: 40,
        cost: [
          { item: 'stone_block', qty: 50 },
          { item: 'furn_statue', qty: 1 },
          { item: 'holy_water', qty: 10 },
        ],
        xp: 2500,
        mods: { 'prayer.max': 35, 'xp.faith': 0.1 },
      },
      {
        level: 65,
        cost: [
          { item: 'stone_block', qty: 100 },
          { item: 'gem_onyx', qty: 1 },
          { item: 'divine_spark', qty: 1 },
        ],
        xp: 6500,
        mods: { 'prayer.max': 60, 'xp.faith': 0.15 },
      },
    ],
  },
  {
    id: 'armory',
    name: 'Rüstkammer',
    icon: '🛡️',
    roof: '#7d7f86',
    pos: [6.2, 7.6],
    desc: 'Bessere Verteidigung für alle Kampfstile.',
    levels: [
      {
        level: 20,
        cost: [
          { item: 'plank_oak', qty: 30 },
          { item: 'bar_iron', qty: 15 },
          { item: 'nails', qty: 50 },
        ],
        xp: 900,
        mods: { 'combat.defence': 0.03 },
      },
      {
        level: 45,
        cost: [
          { item: 'stone_block', qty: 40 },
          { item: 'bar_mithril', qty: 15 },
          { item: 'furn_wardrobe', qty: 1 },
        ],
        xp: 3000,
        mods: { 'combat.defence': 0.06, 'combat.hp': 0.03 },
      },
      {
        level: 70,
        cost: [
          { item: 'stone_block', qty: 80 },
          { item: 'bar_rune', qty: 10 },
          { item: 'furn_throne', qty: 1 },
        ],
        xp: 8000,
        mods: { 'combat.defence': 0.1, 'combat.hp': 0.06 },
      },
    ],
  },
  {
    id: 'trophy_hall',
    name: 'Trophäenhalle',
    icon: '🏆',
    roof: '#e5534b',
    pos: [9.6, -1.6],
    desc: 'Mehr Beute und Gold aus Kämpfen.',
    levels: [
      {
        level: 25,
        cost: [
          { item: 'plank_oak', qty: 40 },
          { item: 'big_bones', qty: 20 },
          { item: 'furn_shelf', qty: 1 },
        ],
        xp: 1200,
        mods: { 'combat.loot': 0.03, gold: 0.02 },
      },
      {
        level: 50,
        cost: [
          { item: 'plank_yew', qty: 30 },
          { item: 'dragon_bones', qty: 10 },
          { item: 'furn_statue', qty: 1 },
        ],
        xp: 4000,
        mods: { 'combat.loot': 0.06, gold: 0.04 },
      },
      {
        level: 75,
        cost: [
          { item: 'plank_magic', qty: 30 },
          { item: 'dragon_scale', qty: 5 },
          { item: 'furn_throne', qty: 1 },
        ],
        xp: 9000,
        mods: { 'combat.loot': 0.1, gold: 0.06 },
      },
    ],
  },
  {
    id: 'observatory',
    name: 'Observatorium',
    icon: '🔭',
    roof: '#4a7bd9',
    pos: [2.0, -9.4],
    desc: 'Mehr Forschung und Arkan-XP.',
    levels: [
      {
        level: 30,
        cost: [
          { item: 'stone_block', qty: 40 },
          { item: 'furn_shelf', qty: 2 },
        ],
        xp: 1500,
        mods: { research: 0.05, 'xp.arcane': 0.05 },
      },
      {
        level: 55,
        cost: [
          { item: 'stone_block', qty: 80 },
          { item: 'mana_crystal', qty: 10 },
          { item: 'gem_sapphire', qty: 3 },
        ],
        xp: 4500,
        mods: { research: 0.1, 'xp.arcane': 0.1 },
      },
      {
        level: 80,
        cost: [
          { item: 'stone_block', qty: 150 },
          { item: 'aether', qty: 2 },
        ],
        xp: 10000,
        mods: { research: 0.15, 'xp.arcane': 0.15 },
      },
    ],
  },
  {
    id: 'greenhouse',
    name: 'Gewächshaus',
    icon: '🌿',
    roof: '#5fbf6a',
    pos: [-2.6, 9.4],
    desc: 'Schnellere Ernten und mehr Kräuter.',
    levels: [
      {
        level: 12,
        cost: [
          { item: 'plank_oak', qty: 25 },
          { item: 'nails', qty: 40 },
        ],
        xp: 600,
        mods: { 'speed.farming': 0.05, 'xp.farming': 0.03 },
      },
      {
        level: 38,
        cost: [
          { item: 'plank_maple', qty: 25 },
          { item: 'stone_block', qty: 25 },
        ],
        xp: 2200,
        mods: { 'speed.farming': 0.1, 'xp.farming': 0.06 },
      },
      {
        level: 62,
        cost: [
          { item: 'plank_yew', qty: 30 },
          { item: 'gem_jade', qty: 10 },
        ],
        xp: 5500,
        mods: { 'speed.farming': 0.15, 'xp.farming': 0.1 },
      },
    ],
  },
  {
    id: 'kennel',
    name: 'Vertrautenhort',
    icon: '🐾',
    roof: '#9b6bff',
    pos: [-5.8, -7.6],
    desc: 'Mehr Beschwörungs- und Jagd-XP.',
    levels: [
      {
        level: 18,
        cost: [
          { item: 'plank_oak', qty: 30 },
          { item: 'spirit_shard', qty: 100 },
        ],
        xp: 800,
        mods: { 'xp.summoning': 0.05, 'xp.hunting': 0.05 },
      },
      {
        level: 42,
        cost: [
          { item: 'plank_maple', qty: 30 },
          { item: 'charm_crimson', qty: 10 },
        ],
        xp: 2800,
        mods: { 'xp.summoning': 0.1, 'xp.hunting': 0.1 },
      },
      {
        level: 68,
        cost: [
          { item: 'plank_magic', qty: 25 },
          { item: 'charm_blue', qty: 15 },
        ],
        xp: 7000,
        mods: { 'xp.summoning': 0.15, 'xp.hunting': 0.15 },
      },
    ],
  },
  {
    id: 'barn',
    name: 'Stall',
    icon: '🛖',
    roof: '#a0522d',
    pos: [-1.2, 5.6],
    desc: 'Platz für Kühe, Ziegen, Alpakas und Ätherschafe – und fleißigere Tiere.',
    levels: [
      {
        level: 10,
        cost: [
          { item: 'plank_oak', qty: 25 },
          { item: 'nails', qty: 30 },
        ],
        xp: 400,
        mods: { 'speed.husbandry': 0.05 },
      },
      {
        level: 35,
        cost: [
          { item: 'plank_maple', qty: 30 },
          { item: 'stone_block', qty: 20 },
          { item: 'wool', qty: 20 },
        ],
        xp: 2200,
        mods: { 'speed.husbandry': 0.1, 'double.husbandry': 0.05 },
      },
      {
        level: 60,
        cost: [
          { item: 'plank_yew', qty: 30 },
          { item: 'furn_wardrobe', qty: 1 },
          { item: 'cheese', qty: 25 },
        ],
        xp: 6000,
        mods: { 'speed.husbandry': 0.15, 'double.husbandry': 0.1 },
      },
    ],
  },
  {
    id: 'harbor',
    name: 'Handelskontor',
    icon: '⚓',
    roof: '#3fa35a',
    pos: [7.0, -7.0],
    desc: 'Bessere Preise und eine fleißigere Dorfwirtschaft.',
    levels: [
      {
        level: 22,
        cost: [
          { item: 'plank_oak', qty: 50 },
          { item: 'furn_chair', qty: 4 },
          { item: 'furn_table', qty: 2 },
        ],
        xp: 1000,
        mods: { gold: 0.03, 'village.prod': 0.03 },
      },
      {
        level: 48,
        cost: [
          { item: 'plank_maple', qty: 50 },
          { item: 'stone_block', qty: 40 },
          { item: 'furn_shelf', qty: 2 },
        ],
        xp: 3500,
        mods: { gold: 0.06, 'village.prod': 0.06 },
      },
      {
        level: 72,
        cost: [
          { item: 'plank_magic', qty: 40 },
          { item: 'bar_gold', qty: 20 },
          { item: 'furn_throne', qty: 1 },
        ],
        xp: 8500,
        mods: { gold: 0.1, 'village.prod': 0.1 },
      },
    ],
  },
];

export const ISLAND_BUILDING_MAP = new Map(ISLAND_BUILDINGS.map((b) => [b.id, b]));
