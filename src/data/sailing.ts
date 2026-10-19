import type { ActionDef, ItemDef, LootEntry, ToolDef } from './types';

// Seefahrt: build ships at the wharf (they are the skill's tools – faster voyages), rig them with sails
// and ropes, sail to distant islands with their own goods, and run trade voyages for gold and village
// resources. Bigger ships reach farther islands.

interface Ship {
  id: string;
  name: string;
  tier: number;
  level: number;
  speed: number;
  price: number;
  xp: number;
  inputs: { item: string; qty: number }[];
  desc: string;
}

const SHIPS: Ship[] = [
  {
    id: 'ship_raft',
    name: 'Floß',
    tier: 0,
    level: 1,
    speed: 1,
    price: 0,
    xp: 0,
    inputs: [],
    desc: 'Vier Stämme, ein Seil, viel Gottvertrauen.',
  },
  {
    id: 'ship_sloop',
    name: 'Schaluppe',
    tier: 1,
    level: 10,
    speed: 1.2,
    price: 2_500,
    xp: 300,
    inputs: [
      { item: 'plank_oak', qty: 20 },
      { item: 'nails', qty: 30 },
      { item: 'sail', qty: 1 },
    ],
    desc: 'Klein, wendig, nur leicht undicht.',
  },
  {
    id: 'ship_cog',
    name: 'Kogge',
    tier: 2,
    level: 25,
    speed: 1.45,
    price: 15_000,
    xp: 900,
    inputs: [
      { item: 'plank_maple', qty: 25 },
      { item: 'nails', qty: 40 },
      { item: 'sail', qty: 2 },
      { item: 'rope', qty: 4 },
    ],
    desc: 'Der Lastesel der Meere. Bauchig und stolz darauf.',
  },
  {
    id: 'ship_brig',
    name: 'Brigg',
    tier: 3,
    level: 40,
    speed: 1.75,
    price: 60_000,
    xp: 2_200,
    inputs: [
      { item: 'plank_maple', qty: 40 },
      { item: 'bar_iron', qty: 20 },
      { item: 'sail', qty: 3 },
      { item: 'rope', qty: 8 },
    ],
    desc: 'Zwei Masten, ein Ziel: weiter weg.',
  },
  {
    id: 'ship_frigate',
    name: 'Fregatte',
    tier: 4,
    level: 55,
    speed: 2.1,
    price: 250_000,
    xp: 4_800,
    inputs: [
      { item: 'plank_yew', qty: 40 },
      { item: 'bar_steel', qty: 25 },
      { item: 'sail', qty: 4 },
      { item: 'rope', qty: 12 },
    ],
    desc: 'Schnell genug, um Seeungeheuern davonzusegeln. Meistens.',
  },
  {
    id: 'ship_galleon',
    name: 'Galeone',
    tier: 5,
    level: 70,
    speed: 2.5,
    price: 1_000_000,
    xp: 9_500,
    inputs: [
      { item: 'plank_yew', qty: 60 },
      { item: 'bar_mithril', qty: 30 },
      { item: 'sail', qty: 6 },
      { item: 'rope', qty: 20 },
    ],
    desc: 'Ein schwimmender Palast mit Kanonen und Kapitänsdinner.',
  },
  {
    id: 'ship_aether',
    name: 'Ätherschiff',
    tier: 6,
    level: 85,
    speed: 3,
    price: 6_000_000,
    xp: 20_000,
    inputs: [
      { item: 'plank_magic', qty: 50 },
      { item: 'bar_adamant', qty: 30 },
      { item: 'aether_wool', qty: 10 },
      { item: 'rope', qty: 30 },
    ],
    desc: 'Segelt auf Wasser, Wolken und gelegentlich auf Wahrscheinlichkeiten.',
  },
];

export const SHIP_TOOLS: ToolDef[] = SHIPS.map((s) => ({
  id: s.id,
  name: s.name,
  icon: s.tier >= 6 ? '🚀' : s.tier >= 3 ? '🚢' : s.tier >= 1 ? '⛵' : '🛶',
  skill: 'sailing',
  tier: s.tier,
  levelReq: s.level,
  speed: s.speed,
  price: s.price,
  desc: s.desc,
}));

export const SHIP_TIER = new Map(SHIPS.map((s) => [s.id, s.tier]));
export const SHIP_NAMES = SHIPS.map((s) => s.name);

interface Voyage {
  id: string;
  name: string;
  icon: string;
  level: number;
  /** Minimum ship tier. */
  ship: number;
  time: number;
  xp: number;
  outputs: { item: string; qty: number }[];
  drops: LootEntry[];
  desc: string;
}

const VOYAGES: Voyage[] = [
  {
    id: 'shoals',
    name: 'Fischgründe vor der Küste',
    icon: '🐟',
    level: 1,
    ship: 0,
    time: 20,
    xp: 70,
    outputs: [{ item: 'raw_sardine', qty: 6 }],
    drops: [
      { item: 'message_bottle', chance: 0.05 },
      { item: 'driftwood', chance: 0.4, min: 1, max: 3 },
    ],
    desc: 'Nicht weit, aber immerhin nass.',
  },
  {
    id: 'pearl_bay',
    name: 'Perlenbucht',
    icon: '🦪',
    level: 8,
    ship: 0,
    time: 30,
    xp: 130,
    outputs: [{ item: 'pearl', qty: 1 }],
    drops: [
      { item: 'raw_lobster', chance: 0.3, min: 1, max: 2 },
      { item: 'pearl', chance: 0.15 },
    ],
    desc: 'Muscheln, Taucher, glänzende Beute.',
  },
  {
    id: 'spice_isles',
    name: 'Gewürzinseln',
    icon: '🌶️',
    level: 20,
    ship: 1,
    time: 45,
    xp: 300,
    outputs: [{ item: 'spice', qty: 4 }],
    drops: [
      { item: 'seed_dragonroot', chance: 0.03 },
      { item: 'coin_pouch', chance: 0.1 },
    ],
    desc: 'Die Luft riecht nach Zimt und Abenteuer.',
  },
  {
    id: 'volcano_isle',
    name: 'Feuerinsel',
    icon: '🌋',
    level: 35,
    ship: 2,
    time: 60,
    xp: 520,
    outputs: [{ item: 'obsidian', qty: 3 }],
    drops: [
      { item: 'gem_ruby', chance: 0.08 },
      { item: 'ember_coral', chance: 0.3 },
    ],
    desc: 'Heißer Boden, heiße Funde.',
  },
  {
    id: 'mist_isle',
    name: 'Nebelinsel',
    icon: '🌫️',
    level: 50,
    ship: 3,
    time: 75,
    xp: 820,
    outputs: [{ item: 'mist_essence', qty: 3 }],
    drops: [
      { item: 'treasure_map_2', chance: 0.06 },
      { item: 'spirit_shard', chance: 0.4, min: 5, max: 15 },
    ],
    desc: 'Wer hier nicht leise segelt, segelt im Kreis.',
  },
  {
    id: 'dragon_reef',
    name: 'Drachenriff',
    icon: '🐉',
    level: 65,
    ship: 4,
    time: 90,
    xp: 1_250,
    outputs: [{ item: 'dragon_scale', qty: 1 }],
    drops: [
      { item: 'raw_shark', chance: 0.4, min: 2, max: 5 },
      { item: 'kraken_tooth', chance: 0.04, rare: true },
    ],
    desc: 'Die Drachen hier sind klein. Ihre Mütter nicht.',
  },
  {
    id: 'star_atoll',
    name: 'Sternenatoll',
    icon: '🌠',
    level: 78,
    ship: 5,
    time: 105,
    xp: 1_800,
    outputs: [{ item: 'stardust', qty: 6 }],
    drops: [
      { item: 'mana_crystal', chance: 0.3 },
      { item: 'gem_diamond', chance: 0.05 },
    ],
    desc: 'Nachts fallen hier die Sterne ins Meer.',
  },
  {
    id: 'aether_current',
    name: 'Ätherstrom',
    icon: '🌀',
    level: 90,
    ship: 6,
    time: 120,
    xp: 2_600,
    outputs: [{ item: 'aether', qty: 3 }],
    drops: [
      { item: 'void_shard', chance: 0.25 },
      { item: 'gem_aether', chance: 0.01, rare: true },
    ],
    desc: 'Wo das Meer aufhört und der Riss beginnt.',
  },
];

/** Minimum ship tier per voyage action. */
export const VOYAGE_SHIP = new Map(VOYAGES.map((v) => [`sail_${v.id}`, v.ship]));

interface Trade {
  id: string;
  name: string;
  level: number;
  ship: number;
  time: number;
  xp: number;
  inputs: { item: string; qty: number }[];
  gold: number;
  /** Each village resource for the active village. */
  village: number;
  desc: string;
}

const TRADES: Trade[] = [
  {
    id: 'timber',
    name: 'Holzhandel',
    level: 12,
    ship: 1,
    time: 50,
    xp: 220,
    inputs: [{ item: 'plank_oak', qty: 30 }],
    gold: 900,
    village: 400,
    desc: 'Bretter in den Süden, Münzen zurück.',
  },
  {
    id: 'spices',
    name: 'Gewürzhandel',
    level: 30,
    ship: 2,
    time: 70,
    xp: 520,
    inputs: [{ item: 'spice', qty: 10 }],
    gold: 3_500,
    village: 900,
    desc: 'Teuer eingekauft, teurer verkauft.',
  },
  {
    id: 'pearls',
    name: 'Perlenhandel',
    level: 45,
    ship: 3,
    time: 90,
    xp: 900,
    inputs: [{ item: 'pearl', qty: 6 }],
    gold: 9_000,
    village: 1_800,
    desc: 'Die Königshöfe zahlen jeden Preis.',
  },
  {
    id: 'obsidian',
    name: 'Obsidianhandel',
    level: 60,
    ship: 4,
    time: 110,
    xp: 1_500,
    inputs: [{ item: 'obsidian', qty: 12 }],
    gold: 20_000,
    village: 3_000,
    desc: 'Schwarzes Glas für weiße Paläste.',
  },
];

/** Gold and village resources per trade voyage (paid by engine/sailing.ts). */
export const TRADE_PAY = new Map(TRADES.map((t) => [`trade_${t.id}`, t]));

export const SAILING_ITEMS: ItemDef[] = [
  {
    id: 'rope',
    name: 'Tau',
    icon: '🪢',
    category: 'resource',
    sellPrice: 6,
    desc: 'Hält Schiffe zusammen und Matrosen bei Laune.',
  },
  {
    id: 'sail',
    name: 'Segel',
    icon: '⛵',
    category: 'resource',
    sellPrice: 40,
    desc: 'Fängt Wind. Und gelegentlich Möwen.',
  },
  {
    id: 'driftwood',
    name: 'Treibholz',
    icon: '🪵',
    category: 'resource',
    sellPrice: 3,
    desc: 'Hat schon mehr von der Welt gesehen als du.',
  },
  {
    id: 'pearl',
    name: 'Perle',
    icon: '🫧',
    category: 'resource',
    sellPrice: 120,
    rarity: 'uncommon',
    desc: 'Eine Muschel hatte einen schlechten Tag. Du einen guten.',
  },
  {
    id: 'spice',
    name: 'Gewürze',
    icon: '🌶️',
    category: 'resource',
    sellPrice: 45,
    desc: 'Macht jedes Essen besser und jeden Händler reicher.',
  },
  {
    id: 'ember_coral',
    name: 'Glutkoralle',
    icon: '🪸',
    category: 'resource',
    sellPrice: 60,
    desc: 'Warm wie ein Ofen, schön wie ein Sonnenuntergang.',
  },
  {
    id: 'mist_essence',
    name: 'Nebelessenz',
    icon: '🌫️',
    category: 'resource',
    sellPrice: 150,
    rarity: 'uncommon',
    desc: 'Nebel in der Flasche. Bitte nicht schütteln.',
  },
  {
    id: 'kraken_tooth',
    name: 'Krakenzahn',
    icon: '🦷',
    category: 'resource',
    sellPrice: 2_000,
    rarity: 'epic',
    desc: 'Den hat sie nicht freiwillig hergegeben.',
  },
  {
    id: 'stardust',
    name: 'Sternenstaub',
    icon: '✨',
    category: 'resource',
    sellPrice: 90,
    rarity: 'uncommon',
    desc: 'Leuchtet leise. Nährt Sternbilder.',
  },
  {
    id: 'spiced_fish',
    name: 'Gewürzfisch',
    icon: '🐠',
    category: 'food',
    heal: 18,
    sellPrice: 140,
    desc: 'Scharf, saftig, heilt 18 LP.',
  },
  ...SHIPS.filter((s) => s.tier > 0).map((s): ItemDef => ({
    id: `${s.id}_kit`,
    name: `Bausatz: ${s.name}`,
    icon: '🧰',
    category: 'consumable',
    sellPrice: Math.round(s.price / 4),
    desc: `Benutzen: ${s.name} vom Stapel lassen (Tempo ×${s.speed.toLocaleString('de-DE')} für alle Fahrten).`,
    consume: { type: 'tool', tool: s.id },
  })),
];

export const SAILING_ACTIONS: ActionDef[] = [
  {
    id: 'sail_rope',
    skill: 'sailing',
    category: 'Takelage',
    name: 'Taue drehen',
    icon: '🪢',
    levelReq: 1,
    baseTime: 2.5,
    xp: 6,
    inputs: [{ item: 'wool', qty: 2 }],
    outputs: [{ item: 'rope', qty: 2 }],
  },
  {
    id: 'sail_rope_drift',
    skill: 'sailing',
    category: 'Takelage',
    name: 'Taue aus Treibholzfasern',
    icon: '🪵',
    levelReq: 1,
    baseTime: 2.5,
    xp: 5,
    inputs: [{ item: 'driftwood', qty: 3 }],
    outputs: [{ item: 'rope', qty: 1 }],
  },
  {
    id: 'sail_sail',
    skill: 'sailing',
    category: 'Takelage',
    name: 'Segel nähen',
    icon: '⛵',
    levelReq: 5,
    baseTime: 4,
    xp: 30,
    inputs: [
      { item: 'wool', qty: 6 },
      { item: 'rope', qty: 2 },
    ],
    outputs: [{ item: 'sail', qty: 1 }],
  },
  ...SHIPS.filter((s) => s.tier > 0).map((s): ActionDef => ({
    id: `sail_build_${s.id}`,
    skill: 'sailing',
    category: 'Werft',
    name: `${s.name} bauen`,
    icon: '🧰',
    levelReq: s.level,
    baseTime: 30,
    xp: s.xp,
    inputs: s.inputs,
    outputs: [{ item: `${s.id}_kit`, qty: 1 }],
    desc: s.desc,
  })),
  ...VOYAGES.map((v): ActionDef => ({
    id: `sail_${v.id}`,
    skill: 'sailing',
    category: 'Fahrten',
    name: v.name,
    icon: v.icon,
    levelReq: v.level,
    baseTime: v.time,
    xp: v.xp,
    inputs: [{ item: 'bread', qty: 1 }],
    outputs: v.outputs,
    drops: v.drops,
    desc: `${v.desc} Braucht: ${SHIPS[v.ship]!.name} oder größer.`,
  })),
  ...TRADES.map((t): ActionDef => ({
    id: `trade_${t.id}`,
    skill: 'sailing',
    category: 'Handelsfahrten',
    name: t.name,
    icon: '💰',
    levelReq: t.level,
    baseTime: t.time,
    xp: t.xp,
    inputs: t.inputs,
    outputs: [],
    desc: `${t.desc} +${t.gold.toLocaleString('de-DE')} Gold, je ${t.village} Dorf-Rohstoffe. Braucht: ${SHIPS[t.ship]!.name} oder größer.`,
  })),
  {
    id: 'cook_spiced_fish',
    skill: 'cooking',
    name: 'Gewürzfisch',
    icon: '🐠',
    levelReq: 48,
    baseTime: 3.4,
    xp: 140,
    inputs: [
      { item: 'raw_tuna', qty: 1 },
      { item: 'spice', qty: 1 },
    ],
    outputs: [{ item: 'spiced_fish', qty: 1 }],
    requiresFire: true,
    burn: { chanceAtReq: 0.35, stopBurnLevel: 75, burntItem: 'burnt_food' },
  },
];

/** Minimum ship tier for trade voyages, too. */
for (const t of TRADES) VOYAGE_SHIP.set(`trade_${t.id}`, t.ship);

/** Passive per level: better trade deals (gold) and a cartography synergy (maps shorten voyages). */
export const SAILING_PER_LEVEL = { gold: 0.001 };
export const CARTO_SAILING_SPEED = 0.003;
