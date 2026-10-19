// Dorf „Neu-Aetherium": village builder in the spirit of Travian. Resource fields around the village,
// buildings in the centre, troops, raids, oases, invasions and new villages. Only data here.
import type { ItemDef } from './types';

export type VRes = 'wood' | 'clay' | 'iron' | 'crop';
export const V_RESOURCES: VRes[] = ['wood', 'clay', 'iron', 'crop'];
export type VCost = Record<VRes, number>;

export const V_RES_INFO: Record<
  VRes,
  { name: string; icon: string; color: string; field: string; fieldIcon: string }
> = {
  wood: { name: 'Holz', icon: '🪵', color: '#3f9a4c', field: 'Holzfäller', fieldIcon: '🌲' },
  clay: { name: 'Lehm', icon: '🧱', color: '#c8673f', field: 'Lehmgrube', fieldIcon: '🏺' },
  iron: { name: 'Eisen', icon: '⛓️', color: '#8f97a8', field: 'Eisenmine', fieldIcon: '⛏️' },
  crop: { name: 'Getreide', icon: '🌾', color: '#e6c34a', field: 'Getreidefarm', fieldIcon: '🌾' },
};

/** Game speed: production ×SPEED, build/train/travel times ÷SPEED (like a speed server). */
export const SPEED = 10;
/** Production (and crop upkeep) tempo – faster than build times so the village never stalls. */
export const PROD_SPEED = 20;

// --- Resource fields ------------------------------------------------------------------------------

/** Base production per hour by field level (before SPEED). */
export const FIELD_PROD = [
  10, 18, 28, 42, 60, 82, 110, 146, 190, 245, 310, 400, 520, 670, 860, 1100,
];
export const FIELD_MAX = 10;
export const CAPITAL_FIELD_MAX = 15;

export interface FieldDef {
  res: VRes;
  /** Cost of level 1. */
  cost: VCost;
  /** Seconds for level 1 (before SPEED). */
  time: number;
  pop: number;
}

export const FIELD_DEFS: Record<VRes, FieldDef> = {
  wood: { res: 'wood', cost: { wood: 40, clay: 100, iron: 50, crop: 60 }, time: 260, pop: 2 },
  clay: { res: 'clay', cost: { wood: 80, clay: 40, iron: 80, crop: 50 }, time: 220, pop: 2 },
  iron: { res: 'iron', cost: { wood: 100, clay: 80, iron: 30, crop: 60 }, time: 450, pop: 3 },
  crop: { res: 'crop', cost: { wood: 70, clay: 90, iron: 70, crop: 20 }, time: 150, pop: 0 },
};
export const FIELD_COST_MULT = 1.67;
export const FIELD_TIME_MULT = 1.5;

/** Valley layouts for new villages (field types in ring order, 18 fields). */
export const VALLEYS: Record<string, { name: string; layout: VRes[] }> = {
  standard: {
    name: '4-4-4-6',
    layout: [
      'wood',
      'crop',
      'wood',
      'iron',
      'crop',
      'clay',
      'iron',
      'crop',
      'wood',
      'clay',
      'crop',
      'iron',
      'clay',
      'crop',
      'wood',
      'clay',
      'iron',
      'crop',
    ],
  },
  cropper: {
    name: '3-3-3-9',
    layout: [
      'wood',
      'crop',
      'crop',
      'iron',
      'crop',
      'clay',
      'crop',
      'crop',
      'wood',
      'clay',
      'crop',
      'iron',
      'crop',
      'crop',
      'wood',
      'clay',
      'iron',
      'crop',
    ],
  },
  granary: {
    name: '1-1-1-15',
    layout: [
      'crop',
      'crop',
      'wood',
      'crop',
      'crop',
      'crop',
      'crop',
      'clay',
      'crop',
      'crop',
      'crop',
      'crop',
      'iron',
      'crop',
      'crop',
      'crop',
      'crop',
      'crop',
    ],
  },
  lumber: {
    name: '5-4-3-6',
    layout: [
      'wood',
      'crop',
      'wood',
      'iron',
      'crop',
      'clay',
      'wood',
      'crop',
      'wood',
      'clay',
      'crop',
      'iron',
      'clay',
      'crop',
      'wood',
      'clay',
      'iron',
      'crop',
    ],
  },
};

// --- Buildings -----------------------------------------------------------------------------------

export type BuildingEffect =
  | 'buildSpeed'
  | 'storage'
  | 'granary'
  | 'cranny'
  | 'rally'
  | 'barracks'
  | 'stable'
  | 'academy'
  | 'smithy'
  | 'market'
  | 'wall'
  | 'townhall'
  | 'residence'
  | 'prodBonus'
  | 'harbor'
  | 'library';

export interface VBuildingDef {
  id: string;
  name: string;
  icon: string;
  maxLevel: number;
  cost: VCost;
  /** Seconds for level 1 (before SPEED). */
  time: number;
  /** Population (crop upkeep) per level. */
  pop: number;
  /** Culture points per hour per level. */
  cp: number;
  effect: BuildingEffect;
  /** For prodBonus: which resource (+5 % per level). */
  bonusRes?: VRes;
  /** Requirements: building id → level; `field:<res>` → highest field level of that kind. */
  requires: Record<string, number>;
  /** Position on the village map (percent). */
  pos: [number, number];
  desc: string;
}

const c = (wood: number, clay: number, iron: number, crop: number): VCost => ({
  wood,
  clay,
  iron,
  crop,
});

export const V_BUILDINGS: VBuildingDef[] = [
  {
    id: 'main',
    name: 'Hauptgebäude',
    icon: '🏛️',
    maxLevel: 20,
    cost: c(70, 40, 60, 20),
    time: 300,
    pop: 2,
    cp: 0.5,
    effect: 'buildSpeed',
    requires: {},
    pos: [50, 46],
    desc: 'Hier wohnen die Baumeister. Jede Stufe beschleunigt alle Bauarbeiten.',
  },
  {
    id: 'warehouse',
    name: 'Rohstofflager',
    icon: '🏚️',
    maxLevel: 20,
    cost: c(130, 160, 90, 40),
    time: 400,
    pop: 1,
    cp: 0.2,
    effect: 'storage',
    requires: { main: 1 },
    pos: [28, 30],
    desc: 'Lagert Holz, Lehm und Eisen. Voll ist voll.',
  },
  {
    id: 'granary',
    name: 'Kornspeicher',
    icon: '🌽',
    maxLevel: 20,
    cost: c(80, 100, 70, 20),
    time: 350,
    pop: 1,
    cp: 0.2,
    effect: 'granary',
    requires: { main: 1 },
    pos: [72, 30],
    desc: 'Lagert Getreide. Mäuse inklusive.',
  },
  {
    id: 'cranny',
    name: 'Versteck',
    icon: '🕳️',
    maxLevel: 10,
    cost: c(40, 50, 30, 10),
    time: 120,
    pop: 0,
    cp: 0.1,
    effect: 'cranny',
    requires: {},
    pos: [14, 52],
    desc: 'Versteckt Rohstoffe vor Plünderern aus dem Riss.',
  },
  {
    id: 'rally',
    name: 'Versammlungsplatz',
    icon: '🚩',
    maxLevel: 20,
    cost: c(110, 160, 90, 70),
    time: 300,
    pop: 1,
    cp: 0.2,
    effect: 'rally',
    requires: {},
    pos: [62, 64],
    desc: 'Truppen sammeln sich hier für Raubzüge. +5 % Truppentempo pro Stufe.',
  },
  {
    id: 'barracks',
    name: 'Kaserne',
    icon: '⚔️',
    maxLevel: 20,
    cost: c(210, 140, 260, 120),
    time: 500,
    pop: 4,
    cp: 0.3,
    effect: 'barracks',
    requires: { main: 3, rally: 1 },
    pos: [38, 66],
    desc: 'Bildet Fußtruppen aus. Jede Stufe beschleunigt die Ausbildung.',
  },
  {
    id: 'stable',
    name: 'Stall',
    icon: '🐎',
    maxLevel: 20,
    cost: c(260, 140, 220, 100),
    time: 700,
    pop: 5,
    cp: 0.3,
    effect: 'stable',
    requires: { academy: 5, smithy: 3 },
    pos: [24, 76],
    desc: 'Bildet Reiter aus. Riecht nach Abenteuer. Und Pferd.',
  },
  {
    id: 'academy',
    name: 'Akademie',
    icon: '🎓',
    maxLevel: 20,
    cost: c(220, 160, 90, 40),
    time: 600,
    pop: 4,
    cp: 0.6,
    effect: 'academy',
    requires: { main: 3, barracks: 3 },
    pos: [80, 52],
    desc: 'Erforscht neue Truppentypen.',
  },
  {
    id: 'smithy',
    name: 'Schmiede',
    icon: '🔨',
    maxLevel: 20,
    cost: c(170, 200, 380, 130),
    time: 600,
    pop: 4,
    cp: 0.3,
    effect: 'smithy',
    requires: { main: 3, academy: 1 },
    pos: [86, 72],
    desc: '+1,5 % Angriff und Verteidigung pro Stufe. Stärkt auch deinen Riss-Helden.',
  },
  {
    id: 'market',
    name: 'Marktplatz',
    icon: '⚖️',
    maxLevel: 20,
    cost: c(80, 70, 120, 70),
    time: 450,
    pop: 4,
    cp: 0.4,
    effect: 'market',
    requires: { main: 3, warehouse: 1, granary: 1 },
    pos: [64, 18],
    desc: 'Tauscht Rohstoffe und schickt Händler zu deinen anderen Dörfern.',
  },
  {
    id: 'wall',
    name: 'Stadtmauer',
    icon: '🧱',
    maxLevel: 20,
    cost: c(70, 90, 170, 70),
    time: 400,
    pop: 0,
    cp: 0.2,
    effect: 'wall',
    requires: {},
    pos: [50, 92],
    desc: '+3 % Verteidigung pro Stufe gegen Riss-Invasionen. Stärkt die Rüstung im Riss.',
  },
  {
    id: 'townhall',
    name: 'Rathaus',
    icon: '🏰',
    maxLevel: 20,
    cost: c(1250, 1110, 1260, 600),
    time: 1500,
    pop: 4,
    cp: 1,
    effect: 'townhall',
    requires: { main: 10, academy: 10 },
    pos: [36, 16],
    desc: 'Veranstaltet Feste. Feste bringen viele Kulturpunkte.',
  },
  {
    id: 'residence',
    name: 'Residenz',
    icon: '🏯',
    maxLevel: 20,
    cost: c(580, 460, 350, 180),
    time: 1200,
    pop: 1,
    cp: 0.6,
    effect: 'residence',
    requires: { main: 5 },
    pos: [14, 30],
    desc: 'Ab Stufe 10 Siedler für neue Dörfer. Erlaubt Oasen (Stufe 10/15/20).',
  },
  {
    id: 'sawmill',
    name: 'Sägewerk',
    icon: '🪚',
    maxLevel: 5,
    cost: c(520, 380, 290, 90),
    time: 900,
    pop: 4,
    cp: 0.3,
    effect: 'prodBonus',
    bonusRes: 'wood',
    requires: { main: 5, 'field:wood': 10 },
    pos: [8, 70],
    desc: '+5 % Holz pro Stufe. Auch die Insel hackt schneller.',
  },
  {
    id: 'brickyard',
    name: 'Lehmbrennerei',
    icon: '🧱',
    maxLevel: 5,
    cost: c(440, 480, 320, 50),
    time: 900,
    pop: 3,
    cp: 0.3,
    effect: 'prodBonus',
    bonusRes: 'clay',
    requires: { main: 5, 'field:clay': 10 },
    pos: [92, 40],
    desc: '+5 % Lehm pro Stufe. Die Insel-Mine profitiert.',
  },
  {
    id: 'foundry',
    name: 'Eisengießerei',
    icon: '🏭',
    maxLevel: 5,
    cost: c(200, 450, 510, 120),
    time: 900,
    pop: 6,
    cp: 0.3,
    effect: 'prodBonus',
    bonusRes: 'iron',
    requires: { main: 5, 'field:iron': 10 },
    pos: [92, 86],
    desc: '+5 % Eisen pro Stufe. Die Insel-Schmiede profitiert.',
  },
  {
    id: 'mill',
    name: 'Getreidemühle',
    icon: '🌬️',
    maxLevel: 5,
    cost: c(500, 440, 380, 1240),
    time: 900,
    pop: 3,
    cp: 0.3,
    effect: 'prodBonus',
    bonusRes: 'crop',
    requires: { 'field:crop': 5 },
    pos: [76, 88],
    desc: '+5 % Getreide pro Stufe. Felder auf der Insel wachsen schneller.',
  },
  {
    id: 'bakery',
    name: 'Bäckerei',
    icon: '🥖',
    maxLevel: 5,
    cost: c(1200, 1480, 870, 1600),
    time: 1200,
    pop: 4,
    cp: 0.3,
    effect: 'prodBonus',
    bonusRes: 'crop',
    requires: { mill: 5, 'field:crop': 10 },
    pos: [10, 88],
    desc: '+5 % Getreide pro Stufe. Kochen auf der Insel gibt mehr XP.',
  },
  {
    id: 'harbor',
    name: 'Inselhafen',
    icon: '⚓',
    maxLevel: 10,
    cost: c(300, 200, 260, 150),
    time: 800,
    pop: 2,
    cp: 0.4,
    effect: 'harbor',
    requires: { market: 1 },
    pos: [50, 4],
    desc: 'Verschifft Inselwaren ins Dorf und Rohstoffe als Gold zurück. Bessere Kurse pro Stufe.',
  },
  {
    id: 'library',
    name: 'Bibliothek',
    icon: '📚',
    maxLevel: 10,
    cost: c(400, 520, 300, 200),
    time: 1000,
    pop: 3,
    cp: 0.8,
    effect: 'library',
    requires: { academy: 5 },
    pos: [26, 52],
    desc: '+2 % Forschungspunkte auf der Insel pro Stufe.',
  },
];

export const BUILDING_COST_MULT = 1.28;
export const BUILDING_TIME_MULT = 1.4;
/** Build time factor per main building level. */
export const MAIN_SPEED = 0.964;

/** Warehouse / granary capacity by level (level 0 = no building). */
export const STORAGE = [
  1600, 2400, 3400, 4600, 6200, 8000, 10000, 12600, 15600, 19200, 23600, 28800, 35200, 42800, 51800,
  62600, 75800, 91400, 110200, 132800, 160000,
];
/** Resources the cranny protects (per resource). */
export const CRANNY = [0, 200, 260, 340, 440, 560, 720, 920, 1200, 1540, 2000];

// --- Troops --------------------------------------------------------------------------------------

export interface TroopDef {
  id: string;
  name: string;
  icon: string;
  attack: number;
  defInf: number;
  defCav: number;
  /** Fields per hour (before SPEED). */
  speed: number;
  carry: number;
  /** Crop per hour. */
  upkeep: number;
  cost: VCost;
  /** Seconds (before SPEED). */
  time: number;
  building: 'barracks' | 'stable' | 'residence';
  /** Building level needed to train. */
  buildingLevel: number;
  /** Academy research: level needed and cost; omitted = known from the start. */
  research?: { academy: number; smithy?: number; cost: VCost; time: number };
  cavalry?: boolean;
  desc: string;
}

export const TROOPS: TroopDef[] = [
  {
    id: 'militia',
    name: 'Knüppelbauer',
    icon: '🧑‍🌾',
    attack: 40,
    defInf: 35,
    defCav: 50,
    speed: 7,
    carry: 50,
    upkeep: 1,
    cost: c(95, 75, 40, 40),
    time: 600,
    building: 'barracks',
    buildingLevel: 1,
    desc: 'Billig, willig, mit Knüppel. Das Rückgrat jedes Raubzugs.',
  },
  {
    id: 'spear',
    name: 'Speerträger',
    icon: '🔱',
    attack: 15,
    defInf: 40,
    defCav: 60,
    speed: 7,
    carry: 35,
    upkeep: 1,
    cost: c(100, 130, 55, 30),
    time: 650,
    building: 'barracks',
    buildingLevel: 1,
    research: { academy: 1, cost: c(700, 620, 1480, 580), time: 1800 },
    desc: 'Verteidigt das Dorf. Pferde hassen Speere.',
  },
  {
    id: 'axe',
    name: 'Axtkrieger',
    icon: '🪓',
    attack: 60,
    defInf: 30,
    defCav: 30,
    speed: 6,
    carry: 50,
    upkeep: 1,
    cost: c(145, 70, 85, 40),
    time: 800,
    building: 'barracks',
    buildingLevel: 3,
    research: { academy: 3, smithy: 1, cost: c(1000, 1020, 1500, 600), time: 2400 },
    desc: 'Holzfällen, aber offensiv.',
  },
  {
    id: 'mage',
    name: 'Kampfmagier',
    icon: '🧙',
    attack: 75,
    defInf: 65,
    defCav: 55,
    speed: 5,
    carry: 20,
    upkeep: 2,
    cost: c(300, 240, 400, 120),
    time: 1500,
    building: 'barracks',
    buildingLevel: 5,
    research: { academy: 10, smithy: 5, cost: c(2200, 2400, 2800, 900), time: 5400 },
    desc: 'Doppelte Kraft gegen Riss-Kreaturen. Trägt dafür kaum Beute.',
  },
  {
    id: 'rider',
    name: 'Steppenreiter',
    icon: '🐎',
    attack: 120,
    defInf: 20,
    defCav: 30,
    speed: 16,
    carry: 110,
    upkeep: 2,
    cost: c(370, 270, 290, 75),
    time: 1600,
    building: 'stable',
    buildingLevel: 1,
    cavalry: true,
    research: { academy: 5, cost: c(2200, 1900, 2040, 520), time: 4200 },
    desc: 'Schnell rein, schnell raus, Taschen voll.',
  },
  {
    id: 'knight',
    name: 'Ätherritter',
    icon: '🏇',
    attack: 150,
    defInf: 80,
    defCav: 70,
    speed: 14,
    carry: 80,
    upkeep: 3,
    cost: c(450, 515, 480, 80),
    time: 2400,
    building: 'stable',
    buildingLevel: 10,
    cavalry: true,
    research: { academy: 15, smithy: 10, cost: c(3100, 3400, 3700, 1100), time: 7200 },
    desc: 'Glänzende Rüstung, glänzende Statistiken.',
  },
  {
    id: 'settler',
    name: 'Siedler',
    icon: '🧳',
    attack: 0,
    defInf: 80,
    defCav: 80,
    speed: 5,
    carry: 3000,
    upkeep: 1,
    cost: c(1500, 1700, 1400, 1500),
    time: 3600,
    building: 'residence',
    buildingLevel: 10,
    desc: 'Drei davon gründen ein neues Dorf. Bringen eigenes Picknick mit.',
  },
];

export const SETTLERS_PER_VILLAGE = 3;
/** Culture points needed for village n+1 (index = villages already owned). */
export const CP_FOR_VILLAGE = [0, 1500, 5000, 12000, 25000];
export const MAX_VILLAGES = 5;
export const SMITHY_BONUS = 0.015;

// --- Celebrations --------------------------------------------------------------------------------

export const CELEBRATIONS = [
  {
    id: 'small',
    name: 'Dorffest',
    icon: '🎉',
    townhall: 1,
    cost: c(1600, 1660, 1480, 340),
    time: 24 * 3600,
    cp: 500,
  },
  {
    id: 'big',
    name: 'Großes Erntefest',
    icon: '🎆',
    townhall: 10,
    cost: c(7400, 7000, 7500, 3000),
    time: 60 * 3600,
    cp: 2000,
  },
];

// --- Map: raid targets ---------------------------------------------------------------------------

export type TargetKind = 'camp' | 'oasis' | 'ruin';

export interface TargetTemplate {
  kind: TargetKind;
  name: string;
  icon: string;
  /** Defence per level^1.6. */
  defense: number;
  /** Stock capacity per level^1.4. */
  stock: number;
  desc: string;
}

export const TARGET_TEMPLATES: TargetTemplate[] = [
  {
    kind: 'camp',
    name: 'Räuberlager',
    icon: '⛺',
    defense: 60,
    stock: 600,
    desc: 'Gestohlenes Gut, schlecht bewacht. Meistens.',
  },
  {
    kind: 'oasis',
    name: 'Oase',
    icon: '🏝️',
    defense: 90,
    stock: 400,
    desc: 'Wilde Tiere bewachen sie. Geräumt kann deine Residenz sie annektieren: +25 % auf einen Rohstoff.',
  },
  {
    kind: 'ruin',
    name: 'Riss-Ruine',
    icon: '🌀',
    defense: 160,
    stock: 900,
    desc: 'Ätherkreaturen hüten Beute aus dem Riss – Äther für die Insel inklusive.',
  },
];

/** Oasis production bonus. */
export const OASIS_BONUS = 0.25;
/** Oases per residence level threshold. */
export const OASIS_SLOTS = [10, 15, 20];

// --- Invasions -----------------------------------------------------------------------------------

/** Seconds of protection after the first village is founded (no invasions). */
export const PROTECTION = 24 * 3600;
export const INVASION_INTERVAL: [number, number] = [2 * 3600, 4 * 3600];

// --- Island exchange -----------------------------------------------------------------------------

/** Village resources per island item shipped through the harbor. */
export const HARBOR_IMPORTS: { res: VRes; items: string[]; per: number }[] = [
  {
    res: 'wood',
    items: [
      'log_oak',
      'log_birch',
      'log_willow',
      'log_maple',
      'log_yew',
      'log_spruce',
      'log_poplar',
      'log_cherry',
      'log_linden',
      'log_teak',
    ],
    per: 6,
  },
  { res: 'clay', items: ['ash', 'ore_copper', 'ore_tin', 'stone_granite'], per: 5 },
  { res: 'iron', items: ['ore_iron', 'bar_iron', 'bar_bronze'], per: 8 },
  {
    res: 'crop',
    items: ['wheat', 'potato', 'apple', 'apple_cider', 'wheat_beer', 'mead', 'potato_schnapps'],
    per: 10,
  },
];

/** Gold per 100 resources sold at the harbor (×(1 + 10 % per harbor level)). */
export const HARBOR_GOLD_PER_100 = 12;

/** Items the village can produce for the island (bakery bread etc.). */
export const VILLAGE_ITEMS: ItemDef[] = [
  {
    id: 'village_bread',
    name: 'Dorfbrot',
    icon: '🥖',
    category: 'food',
    sellPrice: 10,
    heal: 12,
    desc: 'Frisch aus der Dorfbäckerei. Heilt 12 LP.',
  },
];
