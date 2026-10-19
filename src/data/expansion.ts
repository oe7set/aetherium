// Content expansion: more trees, ores, prey and arcane sources so every few levels unlock something new.
import type { ActionDef, ItemDef, LootEntry } from './types';

const nest: LootEntry = { item: 'bird_nest', chance: 1 / 150, rare: true };
const newton: LootEntry = { item: 'newton_apple', chance: 1 / 800, rare: true };

// --- Trees ----------------------------------------------------------------------------------------

interface Tree {
  key: string;
  tree: string;
  log: string;
  icon: string;
  level: number;
  time: number;
  xp: number;
  price: number;
  burnXp: number;
  fuel: number;
  desc: string;
  drops?: LootEntry[];
}

const TREES: Tree[] = [
  {
    key: 'spruce',
    tree: 'Fichte',
    log: 'Fichtenholz',
    icon: '🌲',
    level: 5,
    time: 3.2,
    xp: 15,
    price: 4,
    burnXp: 50,
    fuel: 75,
    desc: 'Riecht nach Weihnachten. Das ganze Jahr.',
  },
  {
    key: 'poplar',
    tree: 'Pappel',
    log: 'Pappelholz',
    icon: '🌳',
    level: 15,
    time: 3.8,
    xp: 30,
    price: 7,
    burnXp: 75,
    fuel: 105,
    desc: 'Wächst schnell, brennt schnell, vergisst schnell.',
  },
  {
    key: 'cherry',
    tree: 'Kirschbaum',
    log: 'Kirschholz',
    icon: '🌸',
    level: 25,
    time: 4.2,
    xp: 48,
    price: 12,
    burnXp: 110,
    fuel: 135,
    desc: 'Erst Blüten, dann Kirschen, dann Brennholz. Effizient.',
    drops: [{ item: 'apple', chance: 1 / 5 }],
  },
  {
    key: 'linden',
    tree: 'Linde',
    log: 'Lindenholz',
    icon: '🌳',
    level: 35,
    time: 4.8,
    xp: 75,
    price: 17,
    burnXp: 155,
    fuel: 160,
    desc: 'Unter ihr wurde früher Recht gesprochen. Jetzt gefällt.',
  },
  {
    key: 'teak',
    tree: 'Teakbaum',
    log: 'Teakholz',
    icon: '🌴',
    level: 40,
    time: 5,
    xp: 88,
    price: 21,
    burnXp: 180,
    fuel: 170,
    desc: 'Wasserfest, termitenfest, axtfest – fast.',
  },
  {
    key: 'mahogany',
    tree: 'Mahagoni',
    log: 'Mahagoniholz',
    icon: '🪵',
    level: 50,
    time: 5.8,
    xp: 120,
    price: 32,
    burnXp: 230,
    fuel: 200,
    desc: 'Für Schreibtische von Professoren, die nie da sind.',
  },
  {
    key: 'mangrove',
    tree: 'Mangrove',
    log: 'Mangrovenholz',
    icon: '🌿',
    level: 55,
    time: 6.1,
    xp: 140,
    price: 36,
    burnXp: 260,
    fuel: 220,
    desc: 'Steht mit nassen Füßen im Meer und beschwert sich nie.',
    drops: [{ item: 'raw_shrimp', chance: 1 / 6 }],
  },
  {
    key: 'ebony',
    tree: 'Ebenholzbaum',
    log: 'Ebenholz',
    icon: '🌑',
    level: 65,
    time: 6.9,
    xp: 195,
    price: 55,
    burnXp: 350,
    fuel: 260,
    desc: 'So schwarz wie der Kaffee im Labor um 3 Uhr nachts.',
  },
  {
    key: 'aetherbirch',
    tree: 'Ätherbirke',
    log: 'Ätherbirkenholz',
    icon: '✨',
    level: 70,
    time: 7.2,
    xp: 225,
    price: 65,
    burnXp: 400,
    fuel: 280,
    desc: 'Schimmert leise. Summt manchmal ein Lied.',
    drops: [{ item: 'mana_crystal', chance: 1 / 25 }],
  },
  {
    key: 'dragonblood',
    tree: 'Drachenblutbaum',
    log: 'Drachenblutholz',
    icon: '🐉',
    level: 80,
    time: 8,
    xp: 310,
    price: 90,
    burnXp: 520,
    fuel: 360,
    desc: 'Blutet rotes Harz. Bitte nicht erschrecken.',
    drops: [{ item: 'dragon_scale', chance: 1 / 400, rare: true }],
  },
  {
    key: 'crystal',
    tree: 'Kristallbaum',
    log: 'Kristallholz',
    icon: '💎',
    level: 85,
    time: 8.5,
    xp: 360,
    price: 110,
    burnXp: 600,
    fuel: 420,
    desc: 'Klingt beim Fällen wie ein Glockenspiel.',
    drops: [{ item: 'gem_diamond', chance: 1 / 300, rare: true }],
  },
  {
    key: 'worldroot',
    tree: 'Weltenwurzel',
    log: 'Weltenwurzelholz',
    icon: '🌌',
    level: 99,
    time: 10,
    xp: 600,
    price: 180,
    burnXp: 900,
    fuel: 800,
    desc: 'Hält das Universum zusammen. Ein bisschen weniger jetzt.',
    drops: [{ item: 'aether', chance: 1 / 60, rare: true }],
  },
];

// --- Ores & stones ------------------------------------------------------------------------------

const gemsLow: LootEntry[] = [
  { item: 'gem_sapphire', chance: 0.005, rare: true },
  { item: 'gem_emerald', chance: 0.0025, rare: true },
];
const gemsHigh: LootEntry[] = [
  { item: 'gem_ruby', chance: 0.004, rare: true },
  { item: 'gem_diamond', chance: 0.0015, rare: true },
];

interface Ore {
  art?: ItemDef['art'];
  id: string;
  action: string;
  name: string;
  icon: string;
  level: number;
  time: number;
  xp: number;
  price: number;
  desc: string;
  drops: LootEntry[];
}

const ORES: Ore[] = [
  {
    id: 'stone_granite',
    action: 'Granit brechen',
    name: 'Granit',
    icon: '🪨',
    level: 5,
    time: 3.2,
    xp: 18,
    price: 3,
    desc: 'Solide. Verlässlich. Langweilig. Perfekt für Dorfmauern.',
    drops: [...gemsLow, { item: 'fossil', chance: 1 / 350 }],
  },
  {
    id: 'amber',
    action: 'Bernstein graben',
    name: 'Bernstein',
    icon: '🟧',
    level: 22,
    time: 3.9,
    xp: 38,
    price: 30,
    desc: 'Manchmal steckt eine Mücke drin. Nie ein Dinosaurier.',
    drops: [...gemsLow, { item: 'fossil', chance: 1 / 120 }],
  },
  {
    id: 'ore_platinum',
    action: 'Platin abbauen',
    name: 'Platinerz',
    icon: '⬜',
    art: { kind: 'ore', color: '#eef3fa' },
    level: 62,
    time: 5.8,
    xp: 130,
    price: 70,
    desc: 'Teurer als Gold, langweiliger als Gold. Investoren lieben es.',
    drops: gemsHigh,
  },
  {
    id: 'obsidian',
    action: 'Obsidian schlagen',
    name: 'Obsidian',
    icon: '⬛',
    level: 66,
    time: 6,
    xp: 150,
    price: 55,
    desc: 'Vulkanglas. Scharf genug für Rasierer und Kritik.',
    drops: gemsHigh,
  },
  {
    id: 'ore_meteor',
    action: 'Meteoreisen bergen',
    name: 'Meteoreisen',
    icon: '☄️',
    level: 78,
    time: 6.8,
    xp: 220,
    price: 120,
    desc: 'Kam von weit her, um hier abgebaut zu werden. Pech.',
    drops: [...gemsHigh, { item: 'quark', chance: 1 / 500, rare: true }],
  },
  {
    id: 'aether_crystal',
    action: 'Ätherkristall lösen',
    name: 'Ätherkristall',
    icon: '🔮',
    level: 95,
    time: 8,
    xp: 380,
    price: 260,
    desc: 'Gefrorener Äther. Bitte nicht auftauen.',
    drops: [...gemsHigh, { item: 'aether', chance: 1 / 40, rare: true }],
  },
];

// --- Prey & arcane ------------------------------------------------------------------------------

export const EXPANSION_ITEMS: ItemDef[] = [
  ...TREES.map((t): ItemDef => ({
    id: `log_${t.key}`,
    name: t.log,
    icon: '🪵',
    category: 'log',
    sellPrice: t.price,
    desc: t.desc,
  })),
  ...ORES.map((o): ItemDef => ({
    id: o.id,
    name: o.name,
    icon: o.icon,
    art: o.art,
    category: 'ore',
    sellPrice: o.price,
    desc: o.desc,
  })),
  {
    id: 'tusk',
    name: 'Hauer',
    icon: '🦷',
    category: 'resource',
    sellPrice: 25,
    desc: 'Vom Wildschwein. Es wollte ihn ohnehin loswerden.',
  },
  {
    id: 'tiger_fur',
    name: 'Säbelzahnfell',
    icon: '🐯',
    category: 'resource',
    sellPrice: 140,
    desc: 'Gestreift, prähistorisch, kuschelig.',
  },
  {
    id: 'phoenix_feather',
    name: 'Phönixfeder',
    icon: '🪶',
    category: 'resource',
    sellPrice: 600,
    rarity: 'rare',
    desc: 'Glüht. Wird nach dem Verbrennen wieder Feder.',
  },
  {
    id: 'glimmer_dust',
    name: 'Glimmerstaub',
    icon: '✨',
    category: 'resource',
    sellPrice: 12,
    desc: 'Funkelt in jeder Tasche. Lässt sich nie ganz rausklopfen.',
  },
  {
    id: 'pottery_shard',
    name: 'Tonscherbe',
    icon: '🏺',
    category: 'junk',
    sellPrice: 3,
    desc: 'Teil einer Vase. Die anderen 312 Teile fehlen.',
  },
  {
    id: 'ancient_coin',
    name: 'Antike Münze',
    icon: '🪙',
    category: 'consumable',
    sellPrice: 15,
    desc: 'Gültiges Zahlungsmittel – vor 2000 Jahren. Öffnen = beim Händler eintauschen.',
    consume: { type: 'gold', min: 20, max: 70 },
  },
  {
    id: 'clay_tablet',
    name: 'Tontafel',
    icon: '📜',
    category: 'consumable',
    sellPrice: 20,
    desc: 'Die älteste Steuererklärung der Welt. Entziffern bringt Forschung.',
    consume: { type: 'research', amount: 35 },
  },
  {
    id: 'golden_mask',
    name: 'Goldene Maske',
    icon: '🎭',
    category: 'resource',
    sellPrice: 320,
    rarity: 'rare',
    desc: 'Lächelt seit 3000 Jahren. Niemand weiß, warum.',
  },
  {
    id: 'orichalcum',
    name: 'Orichalkum',
    icon: '🟡',
    category: 'ore',
    sellPrice: 230,
    desc: 'Das sagenhafte Metall von Atlantis. Rostet nicht, glänzt immer.',
  },
  {
    id: 'precursor_relic',
    name: 'Vorläufer-Relikt',
    icon: '🗿',
    category: 'consumable',
    sellPrice: 400,
    rarity: 'rare',
    desc: 'Summt in einer Frequenz, die nur Katzen hören. Öffnen!',
    consume: {
      type: 'loot',
      rolls: 3,
      table: [
        { item: 'aether', chance: 0.5, min: 1, max: 3 },
        { item: 'star_shard', chance: 0.25 },
        { item: 'gem_diamond', chance: 0.15, rare: true },
        { item: 'dungeon_chest', chance: 0.1, rare: true },
        { item: 'research_notes', chance: 0.4, min: 2, max: 5 },
      ],
    },
  },
  {
    id: 'star_shard',
    name: 'Sternensplitter',
    icon: '⭐',
    category: 'resource',
    sellPrice: 180,
    rarity: 'rare',
    desc: 'Ein Stück Himmel. Leicht angekokelt.',
  },
];

const EXP_WOODCUTTING: ActionDef[] = TREES.map((t) => ({
  id: `wc_${t.key}`,
  skill: 'woodcutting',
  name: `${t.tree} fällen`,
  icon: t.icon,
  levelReq: t.level,
  baseTime: t.time,
  xp: t.xp,
  inputs: [],
  outputs: [{ item: `log_${t.key}`, qty: 1 }],
  drops: [...(t.drops ?? []), nest, newton],
  desc: t.desc,
}));

const EXP_FIREMAKING: ActionDef[] = TREES.map((t) => ({
  id: `fm_${t.key}`,
  skill: 'firemaking',
  name: `${t.log} verbrennen`,
  icon: '🔥',
  levelReq: t.level,
  baseTime: 2 + t.level / 100,
  xp: t.burnXp,
  fuelSeconds: t.fuel,
  inputs: [{ item: `log_${t.key}`, qty: 1 }],
  outputs: [{ item: 'ash', qty: 1 }],
}));

const EXP_MINING: ActionDef[] = ORES.map((o) => ({
  id: `mine_${o.id}`,
  skill: 'mining',
  name: o.action,
  icon: o.icon,
  levelReq: o.level,
  baseTime: o.time,
  xp: o.xp,
  inputs: [],
  outputs: [{ item: o.id, qty: 1 }],
  drops: o.drops,
  desc: o.desc,
}));

const EXP_HUNTING: ActionDef[] = [
  {
    id: 'hunt_boar',
    skill: 'hunting',
    name: 'Wildschweinjagd',
    icon: '🐗',
    levelReq: 18,
    baseTime: 5,
    xp: 40,
    inputs: [],
    outputs: [{ item: 'raw_venison', qty: 1 }],
    drops: [{ item: 'tusk', chance: 0.25 }],
  },
  {
    id: 'hunt_moose',
    skill: 'hunting',
    name: 'Elchpirsch',
    icon: '🫎',
    levelReq: 45,
    baseTime: 8,
    xp: 105,
    inputs: [],
    outputs: [
      { item: 'raw_venison', qty: 2 },
      { item: 'cowhide', qty: 1 },
    ],
    drops: [{ item: 'antler', chance: 0.4 }],
  },
  {
    id: 'hunt_sabertooth',
    skill: 'hunting',
    name: 'Säbelzahntiger stellen',
    icon: '🐅',
    levelReq: 68,
    baseTime: 10,
    xp: 210,
    inputs: [],
    outputs: [{ item: 'tiger_fur', qty: 1 }],
    drops: [{ item: 'big_bones', chance: 1 }],
  },
  {
    id: 'hunt_phoenix',
    skill: 'hunting',
    name: 'Phönix beobachten',
    icon: '🔥',
    levelReq: 92,
    baseTime: 14,
    xp: 420,
    inputs: [],
    outputs: [{ item: 'phoenix_feather', qty: 1 }],
    drops: [{ item: 'ash', chance: 1, min: 2, max: 5 }],
    desc: 'Man fängt ihn nicht. Man wartet, bis er eine Feder verliert.',
  },
];

const EXP_ARCANE: ActionDef[] = [
  {
    id: 'arcane_glimmer',
    skill: 'arcane',
    name: 'Glimmerstaub sieben',
    icon: '✨',
    levelReq: 12,
    baseTime: 3.5,
    xp: 22,
    inputs: [],
    outputs: [{ item: 'glimmer_dust', qty: 2 }],
    drops: [{ item: 'rune_essence', chance: 0.3 }],
  },
  {
    id: 'arcane_starfall',
    skill: 'arcane',
    name: 'Sternschnuppen auffangen',
    icon: '🌠',
    levelReq: 70,
    baseTime: 10,
    xp: 230,
    inputs: [],
    outputs: [{ item: 'star_shard', qty: 1 }],
    drops: [{ item: 'mana_crystal', chance: 0.5 }],
  },
  {
    id: 'arcane_crystal',
    skill: 'arcane',
    name: 'Ätherkristalle resonieren',
    icon: '🔮',
    levelReq: 95,
    baseTime: 14,
    xp: 420,
    inputs: [{ item: 'star_shard', qty: 1 }],
    outputs: [
      { item: 'aether_crystal', qty: 2 },
      { item: 'aether', qty: 1 },
    ],
  },
];

const dig = (
  id: string,
  name: string,
  icon: string,
  level: number,
  time: number,
  xp: number,
  item: string,
  drops: LootEntry[],
  desc: string,
): ActionDef => ({
  id,
  skill: 'archaeology',
  name,
  icon,
  levelReq: level,
  baseTime: time,
  xp,
  inputs: [],
  outputs: [{ item, qty: 1 }],
  drops,
  desc,
});

const ARCHAEOLOGY: ActionDef[] = [
  dig(
    'arch_beach',
    'Strand sieben',
    '🏖️',
    1,
    3.5,
    12,
    'pottery_shard',
    [
      { item: 'ancient_coin', chance: 0.12 },
      { item: 'fossil', chance: 1 / 120 },
    ],
    'Jedes Sandkorn ist eine Geschichte. Die meisten sind langweilig.',
  ),
  dig(
    'arch_barrow',
    'Hügelgrab freilegen',
    '⛰️',
    12,
    4.5,
    30,
    'ancient_coin',
    [
      { item: 'pottery_shard', chance: 0.5 },
      { item: 'bones', chance: 0.3 },
    ],
    'Höflich anklopfen, dann graben.',
  ),
  dig(
    'arch_temple',
    'Tempelruinen kartieren',
    '🏛️',
    28,
    5.5,
    60,
    'clay_tablet',
    [
      { item: 'ancient_coin', chance: 0.3 },
      { item: 'gem_sapphire', chance: 0.01, rare: true },
    ],
    'Die Säulen stehen noch. Die Götter sind ausgezogen.',
  ),
  dig(
    'arch_cave',
    'Höhlenmalereien studieren',
    '🕯️',
    45,
    7,
    110,
    'fossil',
    [
      { item: 'research_notes', chance: 0.35 },
      { item: 'clay_tablet', chance: 0.25 },
    ],
    'Ein Mammut, drei Strichmännchen und ein Smiley. Erstaunlich modern.',
  ),
  dig(
    'arch_pyramid',
    'Pyramidenkammer öffnen',
    '🔺',
    60,
    8.5,
    170,
    'golden_mask',
    [
      { item: 'ancient_coin', chance: 0.6, min: 2, max: 5 },
      { item: 'gem_ruby', chance: 0.02, rare: true },
    ],
    'Der Fluch ist bestimmt nur ein Gerücht.',
  ),
  dig(
    'arch_atlantis',
    'Atlantis betauchen',
    '🌊',
    78,
    10,
    260,
    'orichalcum',
    [
      { item: 'aether', chance: 1 / 40, rare: true },
      { item: 'raw_octopus', chance: 0.2 },
    ],
    'Es war die ganze Zeit hier. Unter Wasser. Wer hätte das gedacht.',
  ),
  dig(
    'arch_precursor',
    'Vorläufer-Ruinen erforschen',
    '🗿',
    92,
    12,
    400,
    'precursor_relic',
    [{ item: 'star_shard', chance: 0.15, rare: true }],
    'Wer hat den Ätherriss zuerst geöffnet? Hier steht es. In 4000 Sprachen.',
  ),
];

export const EXPANSION_ACTIONS: ActionDef[] = [
  ...ARCHAEOLOGY,
  ...EXP_WOODCUTTING,
  ...EXP_FIREMAKING,
  ...EXP_MINING,
  ...EXP_HUNTING,
  ...EXP_ARCANE,
];

/** New logs, for systems that accept "any log" (harbor, crafting fuel …). */
export const EXPANSION_LOGS = TREES.map((t) => `log_${t.key}`);
