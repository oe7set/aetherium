import type { ActionDef, ItemDef, LootEntry, ModifierSet } from './types';

// Viehzucht: feed animals with crops from the fields, collect eggs, wool, milk and honey, make
// cheese. Products feed cooking, brewing, crafting (wool robes for mages) and fletching. Bigger
// animals need the Stall (Baukunst).

interface Animal {
  id: string;
  name: string;
  icon: string;
  level: number;
  time: number;
  xp: number;
  feed: { item: string; qty: number }[];
  out: { item: string; qty: number };
  drops?: LootEntry[];
  barn?: number;
  desc: string;
}

const ANIMALS: Animal[] = [
  {
    id: 'chickens',
    name: 'Hühner füttern',
    icon: '🐔',
    level: 1,
    time: 3,
    xp: 8,
    feed: [{ item: 'wheat', qty: 1 }],
    out: { item: 'egg', qty: 2 },
    drops: [{ item: 'feather', chance: 0.5, min: 2, max: 5 }],
    desc: 'Gack. Gack gack. (Übersetzung: Danke für den Weizen.)',
  },
  {
    id: 'sheep',
    name: 'Schafe scheren',
    icon: '🐑',
    level: 10,
    time: 3.5,
    xp: 16,
    feed: [{ item: 'wheat', qty: 2 }],
    out: { item: 'wool', qty: 2 },
    desc: 'Mäh. Das Schaf ist jetzt aerodynamischer.',
  },
  {
    id: 'cows',
    name: 'Kühe melken',
    icon: '🐄',
    level: 20,
    time: 4,
    xp: 28,
    feed: [
      { item: 'wheat', qty: 2 },
      { item: 'potato', qty: 2 },
    ],
    out: { item: 'milk', qty: 2 },
    drops: [{ item: 'cowhide', chance: 0.15 }],
    barn: 1,
    desc: 'Muuh. Braucht einen Stall (Baukunst).',
  },
  {
    id: 'bees',
    name: 'Bienenstöcke ernten',
    icon: '🐝',
    level: 30,
    time: 4,
    xp: 40,
    feed: [
      { item: 'herb_mint', qty: 1 },
      { item: 'apple', qty: 1 },
    ],
    out: { item: 'honey', qty: 2 },
    drops: [{ item: 'beeswax', chance: 0.4 }],
    desc: 'Summ. Nicht hektisch bewegen.',
  },
  {
    id: 'goats',
    name: 'Ziegen melken',
    icon: '🐐',
    level: 45,
    time: 4.5,
    xp: 60,
    feed: [
      { item: 'apple', qty: 2 },
      { item: 'herb_sage', qty: 1 },
    ],
    out: { item: 'goat_milk', qty: 2 },
    barn: 2,
    desc: 'Mäck. Frisst auch deine Notizen. Braucht Stall Stufe 2.',
  },
  {
    id: 'alpacas',
    name: 'Alpakas scheren',
    icon: '🦙',
    level: 60,
    time: 5,
    xp: 90,
    feed: [
      { item: 'wheat', qty: 3 },
      { item: 'herb_sage', qty: 2 },
    ],
    out: { item: 'fine_wool', qty: 2 },
    barn: 2,
    desc: 'Spuckt nur, wenn man es verdient hat. Braucht Stall Stufe 2.',
  },
  {
    id: 'aether_sheep',
    name: 'Ätherschafe scheren',
    icon: '☁️',
    level: 75,
    time: 6,
    xp: 150,
    feed: [
      { item: 'herb_mandrake', qty: 1 },
      { item: 'mana_crystal', qty: 1 },
    ],
    out: { item: 'aether_wool', qty: 1 },
    drops: [{ item: 'spirit_shard', chance: 0.3, min: 2, max: 5 }],
    barn: 3,
    desc: 'Schweben leicht über der Wiese. Braucht Stall Stufe 3.',
  },
];

interface Product {
  id: string;
  name: string;
  icon: string;
  price: number;
  category: ItemDef['category'];
  heal?: number;
  desc: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'wool',
    name: 'Wolle',
    icon: '🧶',
    price: 4,
    category: 'resource',
    desc: 'Kuschelig. Kratzig. Unverzichtbar.',
  },
  {
    id: 'milk',
    name: 'Milch',
    icon: '🥛',
    price: 5,
    category: 'raw_food',
    desc: 'Frisch vom Stall. Riecht nach Wiese.',
  },
  {
    id: 'honey',
    name: 'Honig',
    icon: '🍯',
    price: 9,
    category: 'raw_food',
    desc: 'Flüssiges Gold, nur klebriger.',
  },
  {
    id: 'beeswax',
    name: 'Bienenwachs',
    icon: '🕯️',
    price: 7,
    category: 'resource',
    desc: 'Für Kerzen, Bogensehnen und Schuhcreme.',
  },
  {
    id: 'goat_milk',
    name: 'Ziegenmilch',
    icon: '🥛',
    price: 10,
    category: 'raw_food',
    desc: 'Würziger als Kuhmilch. Und die Ziege auch.',
  },
  {
    id: 'fine_wool',
    name: 'Alpakawolle',
    icon: '🧶',
    price: 22,
    category: 'resource',
    desc: 'Weich wie eine Wolke mit Fell.',
  },
  {
    id: 'aether_wool',
    name: 'Ätherwolle',
    icon: '☁️',
    price: 90,
    category: 'resource',
    desc: 'Leuchtet im Dunkeln. Strickt sich fast von selbst.',
  },
  {
    id: 'cheese',
    name: 'Käse',
    icon: '🧀',
    price: 26,
    category: 'food',
    heal: 10,
    desc: 'Gereifte Geduld. Heilt 10 LP.',
  },
  {
    id: 'goat_cheese',
    name: 'Ziegenkäse',
    icon: '🧀',
    price: 55,
    category: 'food',
    heal: 15,
    desc: 'Cremig, kräftig, heilt 15 LP.',
  },
  {
    id: 'omelette',
    name: 'Omelett',
    icon: '🍳',
    price: 18,
    category: 'food',
    heal: 7,
    desc: 'Man muss Eier zerbrechen. Heilt 7 LP.',
  },
  {
    id: 'cheese_bread',
    name: 'Käsebrot',
    icon: '🥪',
    price: 50,
    category: 'food',
    heal: 14,
    desc: 'Brot + Käse = Glück. Heilt 14 LP.',
  },
  {
    id: 'honey_cake',
    name: 'Honigkuchen',
    icon: '🍰',
    price: 110,
    category: 'food',
    heal: 22,
    desc: 'Süß, klebrig, heilt 22 LP.',
  },
];

interface Robe {
  id: string;
  name: string;
  slot: 'head' | 'body' | 'legs';
  icon: string;
  wool: string;
  qty: number;
  level: number;
  xp: number;
  defence: number;
  mods: ModifierSet;
  price: number;
}

/** Wool clothing for mages (Handwerk): light armour, magic bonuses, rune saving. */
const ROBES: Robe[] = [
  {
    id: 'wool_hat',
    name: 'Wollmütze des Lehrlings',
    slot: 'head',
    icon: '🧢',
    wool: 'wool',
    qty: 3,
    level: 12,
    xp: 30,
    defence: 2,
    mods: { 'combat.accuracy.magic': 0.03 },
    price: 30,
  },
  {
    id: 'wool_robe',
    name: 'Wollrobe des Lehrlings',
    slot: 'body',
    icon: '🥼',
    wool: 'wool',
    qty: 6,
    level: 18,
    xp: 55,
    defence: 6,
    mods: { 'combat.damage.magic': 0.04, 'combat.runeSave': 0.03 },
    price: 60,
  },
  {
    id: 'alpaca_robe',
    name: 'Alpaka-Magierrobe',
    slot: 'body',
    icon: '🥼',
    wool: 'fine_wool',
    qty: 6,
    level: 55,
    xp: 200,
    defence: 24,
    mods: { 'combat.damage.magic': 0.1, 'combat.runeSave': 0.06 },
    price: 600,
  },
  {
    id: 'alpaca_skirt',
    name: 'Alpaka-Magierrock',
    slot: 'legs',
    icon: '👘',
    wool: 'fine_wool',
    qty: 4,
    level: 52,
    xp: 150,
    defence: 16,
    mods: { 'combat.accuracy.magic': 0.06 },
    price: 420,
  },
  {
    id: 'aether_robe',
    name: 'Ätherwoll-Robe',
    slot: 'body',
    icon: '🌌',
    wool: 'aether_wool',
    qty: 5,
    level: 78,
    xp: 420,
    defence: 40,
    mods: { 'combat.damage.magic': 0.15, 'combat.runeSave': 0.1, 'combat.accuracy.magic': 0.05 },
    price: 2600,
  },
];

export const HUSBANDRY_ITEMS: ItemDef[] = [
  ...PRODUCTS.map((p): ItemDef => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    category: p.category,
    sellPrice: p.price,
    heal: p.heal,
    desc: p.desc,
  })),
  ...ROBES.map((r): ItemDef => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    category: 'gear',
    sellPrice: r.price,
    rarity: r.level >= 75 ? 'epic' : r.level >= 50 ? 'rare' : undefined,
    desc: 'Wollkleidung für Magier: leicht, warm und gut für Zauber.',
    equip: {
      slot: r.slot,
      defence: r.defence,
      mods: r.mods,
      req: { skill: 'magic', level: Math.max(1, r.level - 10) },
    },
  })),
];

export const HUSBANDRY_ACTIONS: ActionDef[] = [
  ...ANIMALS.map((a): ActionDef => ({
    id: `hb_${a.id}`,
    skill: 'husbandry',
    category: 'Tiere',
    name: a.name,
    icon: a.icon,
    levelReq: a.level,
    baseTime: a.time,
    xp: a.xp,
    inputs: a.feed,
    outputs: [a.out],
    drops: a.drops,
    requiresBuilding: a.barn ? { id: 'barn', level: a.barn } : undefined,
    desc: a.desc,
  })),
  {
    id: 'hb_cheese',
    skill: 'husbandry',
    category: 'Molkerei',
    name: 'Käse reifen lassen',
    icon: '🧀',
    levelReq: 25,
    baseTime: 4,
    xp: 36,
    inputs: [{ item: 'milk', qty: 3 }],
    outputs: [{ item: 'cheese', qty: 1 }],
  },
  {
    id: 'hb_goat_cheese',
    skill: 'husbandry',
    category: 'Molkerei',
    name: 'Ziegenkäse reifen lassen',
    icon: '🧀',
    levelReq: 50,
    baseTime: 4.5,
    xp: 72,
    inputs: [{ item: 'goat_milk', qty: 3 }],
    outputs: [{ item: 'goat_cheese', qty: 1 }],
  },
  {
    id: 'cook_omelette',
    skill: 'cooking',
    name: 'Omelett',
    icon: '🍳',
    levelReq: 15,
    baseTime: 3,
    xp: 48,
    inputs: [{ item: 'egg', qty: 2 }],
    outputs: [{ item: 'omelette', qty: 1 }],
    requiresFire: true,
    burn: { chanceAtReq: 0.4, stopBurnLevel: 40, burntItem: 'burnt_food' },
  },
  {
    id: 'cook_cheese_bread',
    skill: 'cooking',
    name: 'Käsebrot',
    icon: '🥪',
    levelReq: 45,
    baseTime: 3,
    xp: 120,
    inputs: [
      { item: 'bread', qty: 1 },
      { item: 'cheese', qty: 1 },
    ],
    outputs: [{ item: 'cheese_bread', qty: 1 }],
    requiresFire: true,
    burn: { chanceAtReq: 0.3, stopBurnLevel: 65, burntItem: 'burnt_food' },
  },
  {
    id: 'cook_honey_cake',
    skill: 'cooking',
    name: 'Honigkuchen backen',
    icon: '🍰',
    levelReq: 62,
    baseTime: 4,
    xp: 210,
    inputs: [
      { item: 'flour', qty: 2 },
      { item: 'honey', qty: 1 },
      { item: 'egg', qty: 1 },
    ],
    outputs: [{ item: 'honey_cake', qty: 1 }],
    requiresFire: true,
    burn: { chanceAtReq: 0.35, stopBurnLevel: 85, burntItem: 'burnt_food' },
  },
  {
    id: 'brew_honey_mead',
    skill: 'brewing',
    category: 'Bier & Met',
    name: 'Honigmet ansetzen',
    icon: '🍯',
    levelReq: 30,
    baseTime: 4.4,
    xp: 60,
    inputs: [
      { item: 'honey', qty: 2 },
      { item: 'apple', qty: 1 },
    ],
    outputs: [{ item: 'mead', qty: 2 }],
    desc: 'Die süße Abkürzung zum Kräutermet: doppelte Ausbeute.',
  },
  {
    id: 'fl_string_wool',
    skill: 'fletching',
    category: 'Sehnen',
    name: 'Sehnen aus Wolle und Wachs',
    icon: '🧶',
    levelReq: 10,
    baseTime: 2.5,
    xp: 10,
    inputs: [
      { item: 'wool', qty: 2 },
      { item: 'beeswax', qty: 1 },
    ],
    outputs: [{ item: 'bowstring', qty: 6 }],
  },
  ...ROBES.map((r): ActionDef => ({
    id: `craft_${r.id}`,
    skill: 'crafting',
    category: 'Wollkleidung',
    name: r.name,
    icon: r.icon,
    levelReq: r.level,
    baseTime: 3.5,
    xp: r.xp,
    inputs: [{ item: r.wool, qty: r.qty }],
    outputs: [{ item: r.id, qty: 1 }],
  })),
];

/** Passive per level: well-fed villagers work harder. */
export const HUSBANDRY_PER_LEVEL = { villageProd: 0.002 };
