import type { ActionDef, BuffDef, ItemDef, LootEntry, ModifierSet } from './types';

// Phase 5: research tech tree, helpers, farming, hunting, arcane mining, alchemy, enchanting.

// --- Tech tree ------------------------------------------------------------------------------------

export type TechUnlock =
  | 'skill:farming'
  | 'skill:hunting'
  | 'skill:arcane'
  | 'skill:alchemy'
  | 'skill:enchanting'
  | 'helpers'
  | 'helperSlot'
  | 'plot'
  | 'autoHarvest'
  | 'accelerator';

export interface TechDef {
  id: string;
  name: string;
  icon: string;
  era: string;
  cost: number;
  requires: string[];
  mods?: ModifierSet;
  unlocks?: TechUnlock[];
  desc: string;
}

export const ERAS = [
  'Steinzeit',
  'Antike',
  'Mittelalter',
  'Renaissance',
  'Industrialisierung',
  'Elektrizität',
  'Atomzeitalter',
  'Quantenära',
  'Interdimensional',
];

export const TECHS: TechDef[] = [
  // Steinzeit
  {
    id: 'fire_control',
    name: 'Feuer beherrschen',
    icon: '🔥',
    era: 'Steinzeit',
    cost: 10,
    requires: [],
    mods: { fireDuration: 0.25 },
    desc: 'Feuer brennt 25 % länger. Grillen wird erfunden.',
  },
  {
    id: 'sharp_stones',
    name: 'Spitze Steine',
    icon: '🪨',
    era: 'Steinzeit',
    cost: 15,
    requires: [],
    mods: { 'speed.woodcutting': 0.05, 'speed.mining': 0.05 },
    desc: '+5 % Tempo beim Holzfällen und Bergbau. Spitz schlägt stumpf.',
  },
  {
    id: 'agriculture',
    name: 'Ackerbau',
    icon: '🌾',
    era: 'Steinzeit',
    cost: 30,
    requires: ['sharp_stones'],
    unlocks: ['skill:farming'],
    desc: 'Schaltet Landwirtschaft frei. Sesshaftigkeit, endlich!',
  },
  {
    id: 'traps',
    name: 'Fallenstellerei',
    icon: '🪤',
    era: 'Steinzeit',
    cost: 30,
    requires: ['sharp_stones'],
    unlocks: ['skill:hunting'],
    desc: 'Schaltet Jagen frei. Geduld ist auch eine Waffe.',
  },
  // Antike
  {
    id: 'wheel',
    name: 'Das Rad',
    icon: '🛞',
    era: 'Antike',
    cost: 60,
    requires: ['sharp_stones'],
    mods: { speed: 0.03 },
    desc: '+3 % Tempo auf alles. Endlich nicht mehr alles tragen.',
  },
  {
    id: 'writing',
    name: 'Schrift',
    icon: '📜',
    era: 'Antike',
    cost: 80,
    requires: ['fire_control'],
    mods: { research: 0.15 },
    desc: '+15 % Forschungspunkte. Wissen, das bleibt.',
  },
  {
    id: 'interns',
    name: 'Praktikumsprogramm',
    icon: '🧑‍🎓',
    era: 'Antike',
    cost: 100,
    requires: ['writing'],
    unlocks: ['helpers', 'helperSlot'],
    desc: 'Schaltet Helfer frei (1 Platz). Unbezahlt, aber motiviert.',
  },
  {
    id: 'proto_alchemy',
    name: 'Proto-Alchemie',
    icon: '⚗️',
    era: 'Antike',
    cost: 120,
    requires: ['writing', 'fire_control'],
    unlocks: ['skill:alchemy'],
    desc: 'Schaltet Alchemie und das Periodensystem frei. Blei zu Gold? Später.',
  },
  {
    id: 'irrigation',
    name: 'Bewässerung',
    icon: '💧',
    era: 'Antike',
    cost: 150,
    requires: ['agriculture'],
    mods: { 'speed.farming': 0.15 },
    unlocks: ['plot'],
    desc: 'Pflanzen wachsen 15 % schneller, +1 Beet.',
  },
  // Mittelalter
  {
    id: 'runes',
    name: 'Runenkunde',
    icon: 'ᚱ',
    era: 'Mittelalter',
    cost: 250,
    requires: ['proto_alchemy'],
    unlocks: ['skill:arcane', 'skill:enchanting'],
    desc: 'Schaltet Arkanes Schürfen und Verzauberung frei.',
  },
  {
    id: 'blast_furnace',
    name: 'Hochofen',
    icon: '🏭',
    era: 'Mittelalter',
    cost: 300,
    requires: ['wheel', 'fire_control'],
    mods: { 'speed.smithing': 0.15, 'double.smithing': 0.05 },
    desc: '+15 % Schmiedetempo, 5 % doppelte Barren.',
  },
  {
    id: 'guilds',
    name: 'Zünfte',
    icon: '🏛️',
    era: 'Mittelalter',
    cost: 350,
    requires: ['writing'],
    mods: { gold: 0.1 },
    desc: '+10 % Verkaufspreise. Qualität hat ihren Preis.',
  },
  {
    id: 'gnomes',
    name: 'Gnomen-Gewerkschaft',
    icon: '🧙',
    era: 'Mittelalter',
    cost: 400,
    requires: ['interns'],
    unlocks: ['helperSlot'],
    mods: { helperSpeed: 0.1 },
    desc: '+1 Helferplatz, Helfer +10 % schneller. Gnome verhandeln hart.',
  },
  {
    id: 'crop_rotation',
    name: 'Dreifelderwirtschaft',
    icon: '🔄',
    era: 'Mittelalter',
    cost: 450,
    requires: ['irrigation'],
    mods: { 'double.farming': 0.2 },
    unlocks: ['plot'],
    desc: '+1 Beet, 20 % Chance auf doppelte Ernte.',
  },
  {
    id: 'chainmail',
    name: 'Kettenhemden',
    icon: '🛡️',
    era: 'Mittelalter',
    cost: 500,
    requires: ['blast_furnace'],
    mods: { 'combat.defence': 0.1 },
    desc: '+10 % Verteidigung.',
  },
  // Renaissance
  {
    id: 'printing',
    name: 'Buchdruck',
    icon: '📖',
    era: 'Renaissance',
    cost: 900,
    requires: ['writing', 'guilds'],
    mods: { research: 0.25 },
    desc: '+25 % Forschungspunkte. Copy & Paste, Mittelalter-Edition.',
  },
  {
    id: 'scientific_method',
    name: 'Wissenschaftliche Methode',
    icon: '🔬',
    era: 'Renaissance',
    cost: 1200,
    requires: ['printing'],
    mods: { xp: 0.05, research: 0.1 },
    desc: '+5 % XP auf alles, +10 % Forschung. Hypothese, Experiment, Peer-Review.',
  },
  {
    id: 'gunpowder',
    name: 'Schwarzpulver',
    icon: '💥',
    era: 'Renaissance',
    cost: 1400,
    requires: ['proto_alchemy', 'blast_furnace'],
    mods: { 'speed.mining': 0.2, 'combat.damage': 0.05 },
    desc: '+20 % Bergbautempo, +5 % Schaden. Vorsichtig dosieren.',
  },
  {
    id: 'optics',
    name: 'Optik',
    icon: '🔭',
    era: 'Renaissance',
    cost: 1600,
    requires: ['scientific_method'],
    mods: { 'combat.accuracy': 0.08, rare: 0.1 },
    desc: '+8 % Treffsicherheit, +10 % Seltenheitschance. Genauer hinsehen lohnt sich.',
  },
  {
    id: 'clockwork',
    name: 'Uhrwerke',
    icon: '⚙️',
    era: 'Renaissance',
    cost: 2000,
    requires: ['gnomes', 'printing'],
    mods: { helperSpeed: 0.15 },
    unlocks: ['helperSlot'],
    desc: '+1 Helferplatz, Helfer +15 % schneller. Präzision tickt.',
  },
  // Industrialisierung
  {
    id: 'steam_engine',
    name: 'Dampfmaschine',
    icon: '🚂',
    era: 'Industrialisierung',
    cost: 5000,
    requires: ['clockwork', 'blast_furnace'],
    mods: { speed: 0.08 },
    desc: '+8 % Tempo auf alles. Wasser kochen, aber produktiv.',
  },
  {
    id: 'golems',
    name: 'Golem-Fertigung',
    icon: '🗿',
    era: 'Industrialisierung',
    cost: 6500,
    requires: ['steam_engine', 'runes'],
    unlocks: ['helperSlot'],
    mods: { helperSpeed: 0.1 },
    desc: '+1 Helferplatz. Golems: stark, stumm, steuerfrei.',
  },
  {
    id: 'fertilizer',
    name: 'Kunstdünger',
    icon: '🧫',
    era: 'Industrialisierung',
    cost: 7000,
    requires: ['crop_rotation', 'scientific_method'],
    mods: { 'speed.farming': 0.3 },
    unlocks: ['plot', 'autoHarvest'],
    desc: '+30 % Wachstum, +1 Beet, automatische Ernte und Neubepflanzung.',
  },
  {
    id: 'banking',
    name: 'Bankwesen',
    icon: '🏦',
    era: 'Industrialisierung',
    cost: 8000,
    requires: ['guilds', 'printing'],
    mods: { gold: 0.15 },
    desc: '+15 % Verkaufspreise. Zinseszins ist die stärkste Kraft im Universum (laut Einstein, angeblich).',
  },
  {
    id: 'vaccines',
    name: 'Impfstoffe',
    icon: '💉',
    era: 'Industrialisierung',
    cost: 9000,
    requires: ['scientific_method', 'proto_alchemy'],
    mods: { 'combat.hp': 0.15 },
    desc: '+15 % maximale Lebenspunkte.',
  },
  // Elektrizität
  {
    id: 'electricity',
    name: 'Elektrizität',
    icon: '⚡',
    era: 'Elektrizität',
    cost: 25000,
    requires: ['steam_engine', 'optics'],
    mods: { speed: 0.1, research: 0.2 },
    desc: '+10 % Tempo, +20 % Forschung. Endlich kann das Kupfer zeigen, was es kann.',
  },
  {
    id: 'telegraph',
    name: 'Telegraf',
    icon: '📠',
    era: 'Elektrizität',
    cost: 30000,
    requires: ['electricity'],
    mods: { offlineHours: 12 },
    desc: '+12 Stunden Offline-Fortschritt. Die Spielfigur schreibt dir, was passiert ist.',
  },
  {
    id: 'robots',
    name: 'Robotik',
    icon: '🤖',
    era: 'Elektrizität',
    cost: 45000,
    requires: ['electricity', 'golems'],
    unlocks: ['helperSlot'],
    mods: { helperSpeed: 0.2 },
    desc: '+1 Helferplatz, Helfer +20 % schneller. Beep boop.',
  },
  {
    id: 'refrigeration',
    name: 'Kühlschrank',
    icon: '🧊',
    era: 'Elektrizität',
    cost: 50000,
    requires: ['electricity'],
    mods: { burn: 0.3, 'double.cooking': 0.1 },
    desc: '−30 % Anbrennen, 10 % doppelte Portionen. Frische zahlt sich aus.',
  },
  // Atomzeitalter
  {
    id: 'relativity',
    name: 'Relativitätstheorie',
    icon: '🕰️',
    era: 'Atomzeitalter',
    cost: 150000,
    requires: ['electricity', 'scientific_method'],
    mods: { offlineHours: 24, xp: 0.1 },
    desc: '+24 h Offline-Fortschritt, +10 % XP. Zeit ist relativ, Fortschritt nicht.',
  },
  {
    id: 'fission',
    name: 'Kernspaltung',
    icon: '☢️',
    era: 'Atomzeitalter',
    cost: 200000,
    requires: ['relativity', 'gunpowder'],
    mods: { 'speed.mining': 0.3, 'combat.damage': 0.1 },
    desc: '+30 % Bergbau, +10 % Schaden. Bitte nicht im Wohnzimmer.',
  },
  {
    id: 'computers',
    name: 'Computer',
    icon: '💻',
    era: 'Atomzeitalter',
    cost: 300000,
    requires: ['electricity', 'clockwork'],
    mods: { research: 0.4, helperSpeed: 0.15 },
    desc: '+40 % Forschung, Helfer +15 %. Hast du es schon aus- und wieder eingeschaltet?',
  },
  {
    id: 'fusion',
    name: 'Kontrollierte Kernfusion',
    icon: '☀️',
    era: 'Atomzeitalter',
    cost: 500000,
    requires: ['fission'],
    mods: { fireDuration: 2, xp: 0.05 },
    desc: 'Lagerfeuer brennt 3× so lange. Endlich „in 30 Jahren“ erreicht.',
  },
  // Quantenära
  {
    id: 'accelerator',
    name: 'Teilchenbeschleuniger',
    icon: '🌀',
    era: 'Quantenära',
    cost: 2e6,
    requires: ['fusion', 'computers'],
    unlocks: ['accelerator'],
    mods: { research: 0.5 },
    desc: 'Baut den Ring! Alchemie kann nun Elemente synthetisieren. +50 % Forschung.',
  },
  {
    id: 'quantum_computer',
    name: 'Quantencomputer',
    icon: '🖥️',
    era: 'Quantenära',
    cost: 5e6,
    requires: ['computers', 'accelerator'],
    unlocks: ['helperSlot'],
    mods: { helperSpeed: 0.3, research: 0.3 },
    desc: '+1 Helferplatz. Rechnet alles gleichzeitig, auch Unsinn.',
  },
  {
    id: 'superposition',
    name: 'Superposition',
    icon: '🐈',
    era: 'Quantenära',
    cost: 8e6,
    requires: ['accelerator'],
    mods: { double: 0.1, rare: 0.25 },
    desc: '+10 % doppelte Ausbeute auf alles: das Item ist da und auch noch einmal da.',
  },
  // Interdimensional
  {
    id: 'wormholes',
    name: 'Wurmlöcher',
    icon: '🕳️',
    era: 'Interdimensional',
    cost: 5e7,
    requires: ['superposition', 'relativity'],
    mods: { speed: 0.25, offlineHours: 48 },
    desc: '+25 % Tempo, +48 h Offline. Abkürzungen durch die Raumzeit.',
  },
  {
    id: 'warp_drive',
    name: 'Warp-Antrieb',
    icon: '🚀',
    era: 'Interdimensional',
    cost: 2e8,
    requires: ['wormholes', 'quantum_computer'],
    mods: { speed: 0.5, xp: 0.25 },
    desc: '+50 % Tempo, +25 % XP. Für die ganz langen Holzwege.',
  },
  {
    id: 'multiverse',
    name: 'Multiversums-Theorie',
    icon: '🌌',
    era: 'Interdimensional',
    cost: 1e9,
    requires: ['warp_drive'],
    mods: { gold: 0.5, research: 1, wisdom: 0.25 },
    desc: 'In einem anderen Universum bist du schon fertig. Hier: +50 % Gold, +100 % Forschung.',
  },
];

// --- Helpers ----------------------------------------------------------------------------------------

export interface HelperDef {
  id: string;
  name: string;
  icon: string;
  /** Work speed relative to the player (1 = same). */
  efficiency: number;
  /** Fraction of XP the helper earns for you. */
  xpShare: number;
  cost: number;
  requiresTech: string;
  desc: string;
}

export const HELPERS: HelperDef[] = [
  {
    id: 'intern',
    name: 'Praktikant',
    icon: '🧑‍🎓',
    efficiency: 0.25,
    xpShare: 0.25,
    cost: 500,
    requiresTech: 'interns',
    desc: 'Unbezahlt, aber lernfähig: wird mit jeder erledigten Aufgabe etwas schneller (bis +50 %).',
  },
  {
    id: 'gnome',
    name: 'Gnom',
    icon: '🧙',
    efficiency: 0.45,
    xpShare: 0.35,
    cost: 15000,
    requiresTech: 'gnomes',
    desc: 'Klein, fleißig, besteht auf Mittagspause (wird ignoriert).',
  },
  {
    id: 'golem',
    name: 'Golem',
    icon: '🗿',
    efficiency: 0.65,
    xpShare: 0.4,
    cost: 250000,
    requiresTech: 'golems',
    desc: 'Stark und stumm. Beschwert sich nie. Sagt auch sonst nichts.',
  },
  {
    id: 'robot',
    name: 'Roboter',
    icon: '🤖',
    efficiency: 0.85,
    xpShare: 0.5,
    cost: 5e6,
    requiresTech: 'robots',
    desc: 'Effizient. Fragt manchmal, ob er Gefühle hat.',
  },
  {
    id: 'ai',
    name: 'KI-Assistent',
    icon: '🧠',
    efficiency: 1.1,
    xpShare: 0.6,
    cost: 2e8,
    requiresTech: 'quantum_computer',
    desc: 'Arbeitet schneller als du. Erklärt dir gern, warum.',
  },
];

// --- Farming --------------------------------------------------------------------------------------------

export interface CropDef {
  seed: string;
  name: string;
  icon: string;
  level: number;
  /** Real seconds to grow. */
  growTime: number;
  xpPlant: number;
  xpHarvest: number;
  product: string;
  yield: [number, number];
  /** Mendel: chance-based mutation into this seed on harvest. */
  mutatesTo?: string;
  seedPrice: number;
}

export const CROPS: CropDef[] = [
  {
    seed: 'seed_potato',
    name: 'Kartoffeln',
    icon: '🥔',
    level: 1,
    growTime: 120,
    xpPlant: 5,
    xpHarvest: 9,
    product: 'potato',
    yield: [3, 6],
    mutatesTo: 'seed_wheat',
    seedPrice: 3,
  },
  {
    seed: 'seed_wheat',
    name: 'Weizen',
    icon: '🌾',
    level: 5,
    growTime: 180,
    xpPlant: 8,
    xpHarvest: 14,
    product: 'wheat',
    yield: [4, 8],
    mutatesTo: 'seed_mint',
    seedPrice: 8,
  },
  {
    seed: 'seed_mint',
    name: 'Minze',
    icon: '🌿',
    level: 10,
    growTime: 300,
    xpPlant: 12,
    xpHarvest: 25,
    product: 'herb_mint',
    yield: [3, 6],
    mutatesTo: 'seed_sage',
    seedPrice: 15,
  },
  {
    seed: 'seed_apple',
    name: 'Apfelbaum-Setzling',
    icon: '🍎',
    level: 15,
    growTime: 600,
    xpPlant: 20,
    xpHarvest: 45,
    product: 'apple',
    yield: [8, 15],
    seedPrice: 40,
  },
  {
    seed: 'seed_sage',
    name: 'Salbei',
    icon: '🌱',
    level: 25,
    growTime: 600,
    xpPlant: 25,
    xpHarvest: 55,
    product: 'herb_sage',
    yield: [3, 6],
    mutatesTo: 'seed_mandrake',
    seedPrice: 60,
  },
  {
    seed: 'seed_mushroom',
    name: 'Pilzkultur',
    icon: '🍄',
    level: 30,
    growTime: 900,
    xpPlant: 30,
    xpHarvest: 70,
    product: 'mushroom',
    yield: [10, 20],
    seedPrice: 80,
  },
  {
    seed: 'seed_mandrake',
    name: 'Alraune',
    icon: '🫚',
    level: 45,
    growTime: 1200,
    xpPlant: 45,
    xpHarvest: 110,
    product: 'herb_mandrake',
    yield: [2, 5],
    mutatesTo: 'seed_dragonroot',
    seedPrice: 250,
  },
  {
    seed: 'seed_dragonroot',
    name: 'Drachenwurz',
    icon: '🐉',
    level: 65,
    growTime: 2400,
    xpPlant: 80,
    xpHarvest: 220,
    product: 'herb_dragonroot',
    yield: [2, 4],
    mutatesTo: 'seed_quantum_clover',
    seedPrice: 1200,
  },
  {
    seed: 'seed_quantum_clover',
    name: 'Quantenklee',
    icon: '☘️',
    level: 85,
    growTime: 3600,
    xpPlant: 150,
    xpHarvest: 400,
    product: 'herb_quantum_clover',
    yield: [1, 4],
    seedPrice: 8000,
  },
];

/** Mendel-gag: chance of a mutated seed on harvest. */
export const MUTATION_CHANCE = 0.08;

// --- Elements (Periodensystem-Codex) ----------------------------------------------------------------------

export interface ElementDef {
  z: number;
  symbol: string;
  name: string;
  /** Periodic table grid position (period row, group column). Lanthanides/actinides get rows 9/10. */
  row: number;
  col: number;
}

const ELEMENT_LIST =
  'H Wasserstoff,He Helium,Li Lithium,Be Beryllium,B Bor,C Kohlenstoff,N Stickstoff,O Sauerstoff,F Fluor,Ne Neon,' +
  'Na Natrium,Mg Magnesium,Al Aluminium,Si Silicium,P Phosphor,S Schwefel,Cl Chlor,Ar Argon,K Kalium,Ca Calcium,' +
  'Sc Scandium,Ti Titan,V Vanadium,Cr Chrom,Mn Mangan,Fe Eisen,Co Cobalt,Ni Nickel,Cu Kupfer,Zn Zink,' +
  'Ga Gallium,Ge Germanium,As Arsen,Se Selen,Br Brom,Kr Krypton,Rb Rubidium,Sr Strontium,Y Yttrium,Zr Zirconium,' +
  'Nb Niob,Mo Molybdän,Tc Technetium,Ru Ruthenium,Rh Rhodium,Pd Palladium,Ag Silber,Cd Cadmium,In Indium,Sn Zinn,' +
  'Sb Antimon,Te Tellur,I Iod,Xe Xenon,Cs Caesium,Ba Barium,La Lanthan,Ce Cer,Pr Praseodym,Nd Neodym,' +
  'Pm Promethium,Sm Samarium,Eu Europium,Gd Gadolinium,Tb Terbium,Dy Dysprosium,Ho Holmium,Er Erbium,Tm Thulium,Yb Ytterbium,' +
  'Lu Lutetium,Hf Hafnium,Ta Tantal,W Wolfram,Re Rhenium,Os Osmium,Ir Iridium,Pt Platin,Au Gold,Hg Quecksilber,' +
  'Tl Thallium,Pb Blei,Bi Bismut,Po Polonium,At Astat,Rn Radon,Fr Francium,Ra Radium,Ac Actinium,Th Thorium,' +
  'Pa Protactinium,U Uran,Np Neptunium,Pu Plutonium,Am Americium,Cm Curium,Bk Berkelium,Cf Californium,Es Einsteinium,Fm Fermium,' +
  'Md Mendelevium,No Nobelium,Lr Lawrencium,Rf Rutherfordium,Db Dubnium,Sg Seaborgium,Bh Bohrium,Hs Hassium,Mt Meitnerium,Ds Darmstadtium,' +
  'Rg Roentgenium,Cn Copernicium,Nh Nihonium,Fl Flerovium,Mc Moscovium,Lv Livermorium,Ts Tenness,Og Oganesson';

function gridPosition(z: number): { row: number; col: number } {
  if (z === 1) return { row: 1, col: 1 };
  if (z === 2) return { row: 1, col: 18 };
  const periods = [
    { start: 3, end: 10, row: 2 },
    { start: 11, end: 18, row: 3 },
  ];
  for (const p of periods) {
    if (z >= p.start && z <= p.end) {
      const i = z - p.start;
      return { row: p.row, col: i < 2 ? i + 1 : i + 11 };
    }
  }
  if (z >= 19 && z <= 36) return { row: 4, col: z - 18 };
  if (z >= 37 && z <= 54) return { row: 5, col: z - 36 };
  if (z >= 57 && z <= 71) return { row: 9, col: z - 57 + 3 };
  if (z >= 89 && z <= 103) return { row: 10, col: z - 89 + 3 };
  if (z >= 55 && z <= 86) return { row: 6, col: z <= 56 ? z - 54 : z - 68 };
  return { row: 7, col: z <= 88 ? z - 86 : z - 100 };
}

export const ELEMENTS: ElementDef[] = ELEMENT_LIST.split(',').map((entry, i) => {
  const [symbol = '', name = ''] = entry.split(' ');
  return { z: i + 1, symbol, name, ...gridPosition(i + 1) };
});

// --- Items --------------------------------------------------------------------------------------------------

const POTION_DEFS: {
  key: string;
  name: string;
  icon: string;
  buff: BuffDef;
  level: number;
  inputs: { item: string; qty: number }[];
  xp: number;
  price: number;
  heal?: number;
}[] = [
  {
    key: 'healing',
    name: 'Heiltrank',
    icon: '🧪',
    level: 1,
    xp: 15,
    price: 15,
    heal: 12,
    inputs: [
      { item: 'herb_mint', qty: 1 },
      { item: 'ash', qty: 1 },
    ],
    buff: {
      id: 'potion_healing',
      name: 'Regeneration',
      icon: '❤️‍🩹',
      duration: 120,
      mods: { 'combat.hp': 0.1 },
      desc: '+10 % LP für 2 min. Heilt außerdem 12 LP im Kampf.',
    },
  },
  {
    key: 'haste',
    name: 'Trank der Eile',
    icon: '⚡',
    level: 8,
    xp: 30,
    price: 40,
    inputs: [
      { item: 'herb_mint', qty: 2 },
      { item: 'feather', qty: 3 },
    ],
    buff: {
      id: 'potion_haste',
      name: 'Eile',
      icon: '⚡',
      duration: 300,
      mods: { speed: 0.2 },
      desc: '+20 % Tempo auf alles für 5 min.',
    },
  },
  {
    key: 'wisdom',
    name: 'Trank der Weisheit',
    icon: '🦉',
    level: 20,
    xp: 55,
    price: 90,
    inputs: [
      { item: 'herb_sage', qty: 1 },
      { item: 'research_notes', qty: 1 },
    ],
    buff: {
      id: 'potion_wisdom',
      name: 'Weisheit',
      icon: '🦉',
      duration: 300,
      mods: { xp: 0.25 },
      desc: '+25 % XP auf alles für 5 min.',
    },
  },
  {
    key: 'strength',
    name: 'Stärketrank',
    icon: '💪',
    level: 28,
    xp: 70,
    price: 110,
    inputs: [
      { item: 'herb_sage', qty: 1 },
      { item: 'big_bones', qty: 1 },
    ],
    buff: {
      id: 'potion_strength',
      name: 'Stärke',
      icon: '💪',
      duration: 300,
      mods: { 'combat.damage': 0.15, 'combat.accuracy': 0.1 },
      desc: '+15 % Schaden, +10 % Treffsicherheit für 5 min.',
    },
  },
  {
    key: 'fireproof',
    name: 'Feuerfest-Trank',
    icon: '🧯',
    level: 35,
    xp: 85,
    price: 120,
    inputs: [
      { item: 'herb_sage', qty: 1 },
      { item: 'coal', qty: 2 },
    ],
    buff: {
      id: 'potion_fireproof',
      name: 'Feuerfest',
      icon: '🧯',
      duration: 600,
      mods: { burn: 0.6, fireDuration: 0.5 },
      desc: '−60 % Anbrennen und +50 % Brenndauer für 10 min.',
    },
  },
  {
    key: 'luck',
    name: 'Glückstrank',
    icon: '🍀',
    level: 45,
    xp: 120,
    price: 300,
    inputs: [
      { item: 'herb_mandrake', qty: 1 },
      { item: 'gem_emerald', qty: 1 },
    ],
    buff: {
      id: 'potion_luck',
      name: 'Glück',
      icon: '🍀',
      duration: 600,
      mods: { rare: 0.75, double: 0.1 },
      desc: '+75 % Seltenheitschance, 10 % doppelte Ausbeute für 10 min.',
    },
  },
  {
    key: 'gold',
    name: 'Goldrausch-Elixier',
    icon: '💰',
    level: 55,
    xp: 150,
    price: 400,
    inputs: [
      { item: 'herb_mandrake', qty: 1 },
      { item: 'bar_gold', qty: 1 },
    ],
    buff: {
      id: 'potion_gold',
      name: 'Goldrausch',
      icon: '💰',
      duration: 600,
      mods: { gold: 0.3 },
      desc: '+30 % Verkaufspreise für 10 min. Fast so gut wie Blei zu Gold.',
    },
  },
  {
    key: 'defence',
    name: 'Schutztrank',
    icon: '🛡️',
    level: 60,
    xp: 170,
    price: 450,
    inputs: [
      { item: 'herb_dragonroot', qty: 1 },
      { item: 'dragon_bones', qty: 1 },
    ],
    buff: {
      id: 'potion_defence',
      name: 'Panzerhaut',
      icon: '🛡️',
      duration: 300,
      mods: { 'combat.defence': 0.3, 'combat.hp': 0.15 },
      desc: '+30 % Verteidigung, +15 % LP für 5 min.',
    },
  },
  {
    key: 'genius',
    name: 'Geniestreich-Serum',
    icon: '🧠',
    level: 75,
    xp: 260,
    price: 1200,
    inputs: [
      { item: 'herb_dragonroot', qty: 1 },
      { item: 'quark', qty: 2 },
    ],
    buff: {
      id: 'potion_genius',
      name: 'Geniestreich',
      icon: '🧠',
      duration: 600,
      mods: { research: 1, xp: 0.5 },
      desc: '+100 % Forschung, +50 % XP für 10 min.',
    },
  },
  {
    key: 'superposition',
    name: 'Superpositions-Tinktur',
    icon: '🐈‍⬛',
    level: 90,
    xp: 420,
    price: 5000,
    inputs: [
      { item: 'herb_quantum_clover', qty: 1 },
      { item: 'dark_matter', qty: 1 },
    ],
    buff: {
      id: 'potion_superposition',
      name: 'Superposition',
      icon: '🐈‍⬛',
      duration: 600,
      mods: { double: 0.5, speed: 0.5 },
      desc: 'Du bist an zwei Orten gleichzeitig: +50 % doppelte Ausbeute, +50 % Tempo für 10 min.',
    },
  },
];

export const POTION_BUFF_DEFS: BuffDef[] = POTION_DEFS.map((p) => p.buff);

const herbs: ItemDef[] = [
  {
    id: 'wheat',
    name: 'Weizen',
    icon: '🌾',
    category: 'raw_food',
    sellPrice: 2,
    desc: 'Wird in der Mühle (Kochen) zu Mehl.',
  },
  {
    id: 'herb_mint',
    name: 'Minze',
    icon: '🌿',
    category: 'resource',
    sellPrice: 6,
    desc: 'Frisch! Die Basis jeder Alchemie und jedes Mojitos.',
  },
  {
    id: 'herb_sage',
    name: 'Salbei',
    icon: '🌱',
    category: 'resource',
    sellPrice: 18,
    desc: 'Weise Pflanze. Hat einen Doktortitel.',
  },
  {
    id: 'herb_mandrake',
    name: 'Alraune',
    icon: '🫚',
    category: 'resource',
    sellPrice: 60,
    rarity: 'uncommon',
    desc: 'Schreit beim Ernten. Ohrenschützer empfohlen.',
  },
  {
    id: 'herb_dragonroot',
    name: 'Drachenwurz',
    icon: '🐉',
    category: 'resource',
    sellPrice: 180,
    rarity: 'rare',
    desc: 'Scharf. Sehr scharf. Feueratem nicht ausgeschlossen.',
  },
  {
    id: 'herb_quantum_clover',
    name: 'Quantenklee',
    icon: '☘️',
    category: 'resource',
    sellPrice: 900,
    rarity: 'epic',
    desc: 'Hat gleichzeitig drei und vier Blätter. Bringt doppeltes Glück.',
  },
];

const seeds: ItemDef[] = CROPS.map((c) => ({
  id: c.seed,
  name: `Saat: ${c.name}`,
  icon: '🫘',
  category: 'resource',
  sellPrice: Math.max(1, Math.round(c.seedPrice / 3)),
  desc: `Wächst in ${Math.round(c.growTime / 60)} min zu ${c.name}. Landwirtschaft Lvl ${c.level}.`,
}));

const potions: ItemDef[] = POTION_DEFS.map((p) => ({
  id: `potion_${p.key}`,
  name: p.name,
  icon: p.icon,
  category: 'consumable',
  sellPrice: p.price,
  heal: p.heal,
  desc: p.buff.desc,
  consume: { type: 'buff', buff: p.buff.id },
}));

const RUNE_TYPES: {
  key: string;
  name: string;
  icon: string;
  level: number;
  xp: number;
  perEssence: number;
}[] = [{ key: 'basic', name: 'Runen', icon: '🔣', level: 1, xp: 6, perEssence: 3 }];

const arcane: ItemDef[] = [
  {
    id: 'rune_essence',
    name: 'Runenessenz',
    icon: '🔹',
    category: 'resource',
    sellPrice: 3,
    desc: 'Ungeformte Magie in Steinform. Wartet auf einen Zweck.',
  },
  {
    id: 'mana_crystal',
    name: 'Mana-Kristall',
    icon: '💠',
    category: 'resource',
    sellPrice: 25,
    rarity: 'uncommon',
    desc: 'Summt leise. Ist das Magie oder Tinnitus?',
  },
  {
    id: 'void_shard',
    name: 'Leerensplitter',
    icon: '🔮',
    category: 'resource',
    sellPrice: 120,
    rarity: 'rare',
    desc: 'Ein Stück Nichts. Schwerer als erwartet.',
  },
  {
    id: 'aether',
    name: 'Äther',
    icon: '✨',
    category: 'resource',
    sellPrice: 600,
    rarity: 'epic',
    desc: 'Das fünfte Element. Namensgeber dieser Welt. Riecht nach Ozon.',
  },
];

const hunting: ItemDef[] = [
  {
    id: 'raw_rabbit',
    name: 'Kaninchen (roh)',
    icon: '🐇',
    category: 'raw_food',
    sellPrice: 4,
    desc: 'Schnell, aber nicht schnell genug.',
  },
  {
    id: 'rabbit_foot',
    name: 'Hasenpfote',
    icon: '🐾',
    category: 'resource',
    sellPrice: 30,
    rarity: 'uncommon',
    desc: 'Bringt Glück. Dem Hasen offensichtlich nicht.',
  },
  {
    id: 'raw_venison',
    name: 'Wildbret (roh)',
    icon: '🥩',
    category: 'raw_food',
    sellPrice: 15,
    desc: 'Bio, Freilandhaltung, Waldursprung.',
  },
  {
    id: 'antler',
    name: 'Geweih',
    icon: '🦌',
    category: 'resource',
    sellPrice: 40,
    desc: 'Sieht über dem Kamin gut aus. Oder als Zauberstab-Griff.',
  },
  {
    id: 'bear_fur',
    name: 'Bärenfell',
    icon: '🐻',
    category: 'resource',
    sellPrice: 90,
    desc: 'Warm, groß und leicht beleidigt.',
  },
  {
    id: 'griffin_feather',
    name: 'Greifenfeder',
    icon: '🪶',
    category: 'resource',
    sellPrice: 300,
    rarity: 'rare',
    desc: 'Halb Adler, halb Löwe, ganz teuer.',
  },
  {
    id: 'cooked_rabbit',
    name: 'Kaninchenbraten',
    icon: '🍖',
    category: 'food',
    sellPrice: 9,
    heal: 5,
    desc: 'Heilt 5 LP. Knusprig.',
  },
  {
    id: 'cooked_venison',
    name: 'Wildbraten',
    icon: '🍖',
    category: 'food',
    sellPrice: 28,
    heal: 13,
    desc: 'Heilt 13 LP. Ein Festessen.',
  },
];

const enchanted: ItemDef[] = [
  {
    id: 'ring_wealth',
    name: 'Ring des Reichtums',
    icon: '💍',
    category: 'gear',
    sellPrice: 900,
    rarity: 'rare',
    desc: '+12 % Verkaufspreise. Glänzt, wenn Gold in der Nähe ist.',
    equip: { slot: 'ring', mods: { gold: 0.12 } },
  },
  {
    id: 'ring_haste',
    name: 'Ring der Eile',
    icon: '💍',
    category: 'gear',
    sellPrice: 1400,
    rarity: 'rare',
    desc: '+8 % Tempo auf alles.',
    equip: { slot: 'ring', mods: { speed: 0.08 } },
  },
  {
    id: 'amulet_scholar',
    name: 'Amulett der Gelehrsamkeit',
    icon: '📿',
    category: 'gear',
    sellPrice: 1800,
    rarity: 'epic',
    desc: '+20 % Forschung, +5 % XP.',
    equip: { slot: 'amulet', mods: { research: 0.2, xp: 0.05 } },
  },
  {
    id: 'amulet_luck',
    name: 'Glücksbringer',
    icon: '🧿',
    category: 'gear',
    sellPrice: 2500,
    rarity: 'epic',
    desc: '+30 % Seltenheitschance. Funktioniert auch, wenn man nicht daran glaubt.',
    equip: { slot: 'amulet', mods: { rare: 0.3 } },
  },
  {
    id: 'aether_staff',
    name: 'Ätherstab',
    icon: '🪄',
    category: 'gear',
    sellPrice: 12000,
    rarity: 'legendary',
    desc: 'Der Stab eines Erzmagiers. +10 % Schaden.',
    equip: {
      slot: 'weapon',
      style: 'magic',
      speed: 2.2,
      attack: 95,
      strength: 70,
      req: { skill: 'magic', level: 80 },
      mods: { 'combat.damage': 0.1 },
    },
  },
];

export const SCIENCE_ITEMS: ItemDef[] = [
  ...herbs,
  ...seeds,
  ...potions,
  ...arcane,
  ...hunting,
  ...enchanted,
];

// --- Actions ------------------------------------------------------------------------------------------------

/** Hunting has no tools, so its XP is scaled up to keep the 1–99 curve in line with other gathering skills. */
const HUNT_XP_SCALE = 2.8;

const hunt = (
  id: string,
  name: string,
  icon: string,
  level: number,
  time: number,
  xp: number,
  loot: LootEntry[],
  outputs: { item: string; qty: number }[],
): ActionDef => ({
  id,
  skill: 'hunting',
  name,
  icon,
  levelReq: level,
  baseTime: time,
  xp: Math.round(xp * HUNT_XP_SCALE),
  inputs: [],
  outputs,
  drops: loot,
});

const HUNTING: ActionDef[] = [
  hunt(
    'hunt_rabbit',
    'Kaninchenfalle',
    '🐇',
    1,
    4,
    14,
    [{ item: 'rabbit_foot', chance: 1 / 60, rare: true }],
    [{ item: 'raw_rabbit', qty: 1 }],
  ),
  hunt(
    'hunt_pheasant',
    'Fasan locken',
    '🐦',
    12,
    4.5,
    28,
    [{ item: 'egg', chance: 0.2 }],
    [{ item: 'feather', qty: 8 }],
  ),
  hunt(
    'hunt_deer',
    'Hirschpirsch',
    '🦌',
    25,
    6,
    55,
    [{ item: 'antler', chance: 0.15 }],
    [
      { item: 'raw_venison', qty: 1 },
      { item: 'cowhide', qty: 1 },
    ],
  ),
  hunt(
    'hunt_wolf',
    'Wolfsfalle',
    '🐺',
    38,
    7,
    80,
    [{ item: 'bones', chance: 1 }],
    [{ item: 'fur', qty: 1 }],
  ),
  hunt(
    'hunt_bear',
    'Bärenfalle',
    '🐻',
    55,
    9,
    140,
    [{ item: 'big_bones', chance: 1 }],
    [{ item: 'bear_fur', qty: 1 }],
  ),
  hunt(
    'hunt_griffin',
    'Greifenhorst',
    '🦅',
    80,
    12,
    300,
    [{ item: 'egg', chance: 0.3, min: 2, max: 4 }],
    [{ item: 'griffin_feather', qty: 1 }],
  ),
];

const ARCANE: ActionDef[] = [
  {
    id: 'arcane_essence',
    skill: 'arcane',
    name: 'Runenessenz schürfen',
    icon: '🔹',
    levelReq: 1,
    baseTime: 2.5,
    xp: 8,
    inputs: [],
    outputs: [{ item: 'rune_essence', qty: 1 }],
    drops: [{ item: 'mana_crystal', chance: 1 / 40 }],
  },
  {
    id: 'arcane_mana',
    skill: 'arcane',
    name: 'Mana-Kristalle ernten',
    icon: '💠',
    levelReq: 25,
    baseTime: 5,
    xp: 45,
    inputs: [],
    outputs: [{ item: 'mana_crystal', qty: 1 }],
    drops: [{ item: 'void_shard', chance: 1 / 80, rare: true }],
  },
  {
    id: 'arcane_void',
    skill: 'arcane',
    name: 'Leere anzapfen',
    icon: '🔮',
    levelReq: 55,
    baseTime: 8,
    xp: 130,
    inputs: [],
    outputs: [{ item: 'void_shard', qty: 1 }],
    drops: [{ item: 'aether', chance: 1 / 120, rare: true }],
  },
  {
    id: 'arcane_aether',
    skill: 'arcane',
    name: 'Äther kondensieren',
    icon: '✨',
    levelReq: 85,
    baseTime: 12,
    xp: 320,
    inputs: [{ item: 'mana_crystal', qty: 3 }],
    outputs: [{ item: 'aether', qty: 1 }],
  },
];

const ENCHANTING: ActionDef[] = [
  ...RUNE_TYPES.map((r): ActionDef => ({
    id: `rune_${r.key}`,
    skill: 'enchanting',
    category: 'Runen',
    name: `${r.name} binden`,
    icon: r.icon,
    levelReq: r.level,
    baseTime: 2,
    xp: r.xp,
    inputs: [{ item: 'rune_essence', qty: 1 }],
    outputs: [{ item: 'rune_basic', qty: r.perEssence }],
  })),
  {
    id: 'rune_bulk',
    skill: 'enchanting',
    category: 'Runen',
    name: 'Runen im Mana-Bad',
    icon: '🔣',
    levelReq: 30,
    baseTime: 3,
    xp: 40,
    inputs: [
      { item: 'rune_essence', qty: 5 },
      { item: 'mana_crystal', qty: 1 },
    ],
    outputs: [{ item: 'rune_basic', qty: 30 }],
  },
  {
    id: 'ench_ring_wealth',
    skill: 'enchanting',
    category: 'Verzaubern',
    name: 'Ring des Reichtums',
    icon: '💍',
    levelReq: 20,
    baseTime: 5,
    xp: 90,
    inputs: [
      { item: 'gold_ring', qty: 1 },
      { item: 'mana_crystal', qty: 2 },
    ],
    outputs: [{ item: 'ring_wealth', qty: 1 }],
  },
  {
    id: 'ench_ring_haste',
    skill: 'enchanting',
    category: 'Verzaubern',
    name: 'Ring der Eile',
    icon: '💍',
    levelReq: 35,
    baseTime: 5,
    xp: 140,
    inputs: [
      { item: 'ring_emerald', qty: 1 },
      { item: 'mana_crystal', qty: 4 },
    ],
    outputs: [{ item: 'ring_haste', qty: 1 }],
  },
  {
    id: 'ench_amulet_scholar',
    skill: 'enchanting',
    category: 'Verzaubern',
    name: 'Amulett der Gelehrsamkeit',
    icon: '📿',
    levelReq: 50,
    baseTime: 6,
    xp: 220,
    inputs: [
      { item: 'amulet_ruby', qty: 1 },
      { item: 'research_notes', qty: 10 },
      { item: 'void_shard', qty: 1 },
    ],
    outputs: [{ item: 'amulet_scholar', qty: 1 }],
  },
  {
    id: 'ench_amulet_luck',
    skill: 'enchanting',
    category: 'Verzaubern',
    name: 'Glücksbringer',
    icon: '🧿',
    levelReq: 60,
    baseTime: 6,
    xp: 260,
    inputs: [
      { item: 'amulet_diamond', qty: 1 },
      { item: 'rabbit_foot', qty: 3 },
      { item: 'void_shard', qty: 2 },
    ],
    outputs: [{ item: 'amulet_luck', qty: 1 }],
  },
  {
    id: 'ench_aether_staff',
    skill: 'enchanting',
    category: 'Verzaubern',
    name: 'Ätherstab',
    icon: '🪄',
    levelReq: 80,
    baseTime: 8,
    xp: 600,
    inputs: [
      { item: 'staff_diamond', qty: 1 },
      { item: 'aether', qty: 3 },
    ],
    outputs: [{ item: 'aether_staff', qty: 1 }],
  },
];

/** Alchemy: potions plus "analyses" that discover periodic table elements for the codex. */
const ALCHEMY_POTIONS: ActionDef[] = POTION_DEFS.map((p) => ({
  id: `brew_${p.key}`,
  skill: 'alchemy',
  category: 'Tränke',
  name: p.name,
  icon: p.icon,
  levelReq: p.level,
  baseTime: 3.5,
  xp: p.xp,
  inputs: p.inputs,
  outputs: [{ item: `potion_${p.key}`, qty: 1 }],
}));

export const ANALYSES: ActionDef[] = [
  {
    id: 'analyze_ash',
    skill: 'alchemy',
    category: 'Analyse',
    name: 'Asche analysieren',
    icon: '🌫️',
    levelReq: 1,
    baseTime: 3,
    xp: 10,
    inputs: [{ item: 'ash', qty: 2 }],
    outputs: [],
    elements: ['C', 'K', 'Ca', 'Na', 'P', 'Mg'],
  },
  {
    id: 'analyze_ores',
    skill: 'alchemy',
    category: 'Analyse',
    name: 'Erze analysieren',
    icon: '🪨',
    levelReq: 10,
    baseTime: 3.5,
    xp: 22,
    inputs: [
      { item: 'ore_copper', qty: 1 },
      { item: 'ore_tin', qty: 1 },
      { item: 'ore_iron', qty: 1 },
    ],
    outputs: [],
    elements: ['Cu', 'Sn', 'Fe', 'Zn', 'Ni', 'S', 'Si', 'Al', 'Pb', 'Co', 'Mn', 'Cr'],
  },
  {
    id: 'analyze_air',
    skill: 'alchemy',
    category: 'Analyse',
    name: 'Luft destillieren',
    icon: '💨',
    levelReq: 20,
    baseTime: 4,
    xp: 35,
    inputs: [{ item: 'mana_crystal', qty: 1 }],
    outputs: [],
    elements: ['N', 'O', 'Ar', 'H', 'He', 'Ne', 'Kr', 'Xe'],
  },
  {
    id: 'analyze_sea',
    skill: 'alchemy',
    category: 'Analyse',
    name: 'Meerwasser verdampfen',
    icon: '🌊',
    levelReq: 25,
    baseTime: 4,
    xp: 40,
    inputs: [{ item: 'raw_shrimp', qty: 2 }],
    outputs: [],
    elements: ['Cl', 'Na', 'Br', 'I', 'Mg', 'B', 'Li', 'Sr', 'F', 'Rb'],
  },
  {
    id: 'analyze_precious',
    skill: 'alchemy',
    category: 'Analyse',
    name: 'Edelmetall-Probe',
    icon: '🥇',
    levelReq: 35,
    baseTime: 4.5,
    xp: 60,
    inputs: [
      { item: 'bar_silver', qty: 1 },
      { item: 'bar_gold', qty: 1 },
    ],
    outputs: [],
    elements: [
      'Ag',
      'Au',
      'Pt',
      'Pd',
      'Rh',
      'Ir',
      'Os',
      'Ru',
      'Hg',
      'Cd',
      'In',
      'Sb',
      'Bi',
      'Te',
      'Se',
      'As',
      'Ge',
      'Ga',
      'Tl',
    ],
  },
  {
    id: 'analyze_gems',
    skill: 'alchemy',
    category: 'Analyse',
    name: 'Edelsteine spektroskopieren',
    icon: '💎',
    levelReq: 45,
    baseTime: 5,
    xp: 90,
    inputs: [
      { item: 'gem_sapphire', qty: 1 },
      { item: 'gem_emerald', qty: 1 },
    ],
    outputs: [],
    elements: ['Be', 'Ti', 'V', 'Sc', 'Y', 'Zr', 'Hf', 'Nb', 'Ta', 'Mo', 'W', 'Re', 'Ba', 'Cs'],
  },
  {
    id: 'analyze_rare_earth',
    skill: 'alchemy',
    category: 'Analyse',
    name: 'Seltene Erden trennen',
    icon: '🧲',
    levelReq: 60,
    baseTime: 6,
    xp: 150,
    inputs: [
      { item: 'ore_runite', qty: 1 },
      { item: 'void_shard', qty: 1 },
    ],
    outputs: [],
    elements: [
      'La',
      'Ce',
      'Pr',
      'Nd',
      'Pm',
      'Sm',
      'Eu',
      'Gd',
      'Tb',
      'Dy',
      'Ho',
      'Er',
      'Tm',
      'Yb',
      'Lu',
    ],
  },
  {
    id: 'analyze_radioactive',
    skill: 'alchemy',
    category: 'Analyse',
    name: 'Strahlung messen',
    icon: '☢️',
    levelReq: 75,
    baseTime: 7,
    xp: 240,
    inputs: [{ item: 'ore_uranium', qty: 1 }],
    outputs: [],
    elements: ['U', 'Th', 'Ra', 'Rn', 'Po', 'At', 'Fr', 'Ac', 'Pa', 'Tc', 'Np', 'Pu'],
  },
  {
    id: 'synthesize',
    skill: 'alchemy',
    category: 'Analyse',
    name: 'Teilchenbeschleuniger-Synthese',
    icon: '🌀',
    levelReq: 85,
    baseTime: 10,
    xp: 500,
    inputs: [
      { item: 'quark', qty: 3 },
      { item: 'aether', qty: 1 },
    ],
    outputs: [],
    requiresTech: 'accelerator',
    elements: [
      'Am',
      'Cm',
      'Bk',
      'Cf',
      'Es',
      'Fm',
      'Md',
      'No',
      'Lr',
      'Rf',
      'Db',
      'Sg',
      'Bh',
      'Hs',
      'Mt',
      'Ds',
      'Rg',
      'Cn',
      'Nh',
      'Fl',
      'Mc',
      'Lv',
      'Ts',
      'Og',
    ],
  },
];

/** Chance per analysis to discover one still-unknown element of its list. */
export const DISCOVERY_CHANCE = 0.12;

const COOKING_EXTRA: ActionDef[] = [
  {
    id: 'mill_flour',
    skill: 'cooking',
    category: 'Mühle',
    name: 'Mehl mahlen',
    icon: '🌾',
    levelReq: 5,
    baseTime: 2,
    xp: 6,
    inputs: [{ item: 'wheat', qty: 2 }],
    outputs: [{ item: 'flour', qty: 1 }],
  },
  {
    id: 'cook_rabbit',
    skill: 'cooking',
    category: 'Wild',
    name: 'Kaninchenbraten',
    icon: '🍖',
    levelReq: 8,
    baseTime: 3,
    xp: 40,
    requiresFire: true,
    inputs: [{ item: 'raw_rabbit', qty: 1 }],
    outputs: [{ item: 'cooked_rabbit', qty: 1 }],
    burn: { chanceAtReq: 0.45, stopBurnLevel: 38, burntItem: 'burnt_food' },
  },
  {
    id: 'cook_venison',
    skill: 'cooking',
    category: 'Wild',
    name: 'Wildbraten',
    icon: '🍖',
    levelReq: 32,
    baseTime: 3.5,
    xp: 105,
    requiresFire: true,
    inputs: [{ item: 'raw_venison', qty: 1 }],
    outputs: [{ item: 'cooked_venison', qty: 1 }],
    burn: { chanceAtReq: 0.45, stopBurnLevel: 66, burntItem: 'burnt_food' },
  },
];

export const SCIENCE_ACTIONS: ActionDef[] = [
  ...HUNTING,
  ...ARCANE,
  ...ENCHANTING,
  ...ALCHEMY_POTIONS,
  ...ANALYSES,
  ...COOKING_EXTRA,
];
