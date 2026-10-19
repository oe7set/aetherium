import type { ActionDef, ItemDef, ModifierSet } from './types';

// Gewandtheit: run obstacle courses across the island (and beyond). Falls cost a little time and HP,
// marks of grace buy the light runner's set. Every level makes everything a little faster.

interface Course {
  id: string;
  name: string;
  icon: string;
  level: number;
  time: number;
  xp: number;
  /** Fall chance at the required level (drops to a few % thirty levels later). */
  fail: number;
  damage: number;
  marks: number;
  desc: string;
}

const COURSES: Course[] = [
  {
    id: 'beach',
    name: 'Strandlauf',
    icon: '🏖️',
    level: 1,
    time: 5,
    xp: 14,
    fail: 0.15,
    damage: 1,
    marks: 0.03,
    desc: 'Über Sandburgen, Treibholz und eine verwirrte Krabbe.',
  },
  {
    id: 'forest',
    name: 'Baumkronenpfad',
    icon: '🌳',
    level: 10,
    time: 6,
    xp: 32,
    fail: 0.2,
    damage: 2,
    marks: 0.04,
    desc: 'Von Ast zu Ast. Die Eichhörnchen bewerten deine Haltung.',
  },
  {
    id: 'river',
    name: 'Flusssprünge',
    icon: '🌊',
    level: 20,
    time: 6.5,
    xp: 55,
    fail: 0.22,
    damage: 3,
    marks: 0.05,
    desc: 'Steine, Strömung und nasse Socken.',
  },
  {
    id: 'rooftops',
    name: 'Dorfdächer',
    icon: '🏘️',
    level: 32,
    time: 7,
    xp: 90,
    fail: 0.25,
    damage: 4,
    marks: 0.06,
    desc: 'Die Dorfbewohner haben aufgehört, sich zu beschweren.',
  },
  {
    id: 'cliffs',
    name: 'Klippenkletterei',
    icon: '🧗',
    level: 45,
    time: 8,
    xp: 140,
    fail: 0.27,
    damage: 6,
    marks: 0.07,
    desc: 'Nicht nach unten schauen. Auch nicht nach oben. Einfach gar nicht schauen.',
  },
  {
    id: 'mast',
    name: 'Takelage-Parcours',
    icon: '⛵',
    level: 58,
    time: 8.5,
    xp: 200,
    fail: 0.28,
    damage: 7,
    marks: 0.08,
    desc: 'Über Masten, Rahen und Wanten der Hafenschiffe.',
  },
  {
    id: 'volcano',
    name: 'Lavastein-Hüpfen',
    icon: '🌋',
    level: 72,
    time: 9,
    xp: 280,
    fail: 0.3,
    damage: 9,
    marks: 0.09,
    desc: 'Der Boden ist Lava. Diesmal wirklich.',
  },
  {
    id: 'aether',
    name: 'Ätherbrücken',
    icon: '🌈',
    level: 85,
    time: 10,
    xp: 390,
    fail: 0.32,
    damage: 11,
    marks: 0.11,
    desc: 'Brücken aus Licht, die nur halten, solange du an sie glaubst.',
  },
];

interface Piece {
  id: string;
  name: string;
  slot: 'head' | 'body' | 'legs' | 'hands' | 'feet' | 'cape';
  icon: string;
  marks: number;
  level: number;
  mods: ModifierSet;
}

/** Läufer-Set: light, no defence, faster everything. */
const PIECES: Piece[] = [
  {
    id: 'runner_hood',
    name: 'Läuferkapuze',
    slot: 'head',
    icon: '🧢',
    marks: 20,
    level: 10,
    mods: { speed: 0.01 },
  },
  {
    id: 'runner_top',
    name: 'Läuferhemd',
    slot: 'body',
    icon: '👕',
    marks: 35,
    level: 20,
    mods: { speed: 0.015 },
  },
  {
    id: 'runner_legs',
    name: 'Läuferhose',
    slot: 'legs',
    icon: '🩳',
    marks: 30,
    level: 30,
    mods: { speed: 0.01 },
  },
  {
    id: 'runner_gloves',
    name: 'Läuferhandschuhe',
    slot: 'hands',
    icon: '🧤',
    marks: 15,
    level: 40,
    mods: { speed: 0.01 },
  },
  {
    id: 'runner_boots',
    name: 'Läuferstiefel',
    slot: 'feet',
    icon: '👟',
    marks: 25,
    level: 50,
    mods: { speed: 0.01, 'hero.travel': 0.05 },
  },
  {
    id: 'runner_cape',
    name: 'Läuferumhang',
    slot: 'cape',
    icon: '🧣',
    marks: 40,
    level: 60,
    mods: { speed: 0.015, 'rift.speed': 0.05 },
  },
];

export const RUNNER_SET_PIECES = PIECES.map((p) => p.id);

export const AGILITY_ITEMS: ItemDef[] = [
  {
    id: 'mark_grace',
    name: 'Gewandtheitsmarke',
    icon: '🏅',
    category: 'resource',
    sellPrice: 25,
    rarity: 'uncommon',
    desc: 'Liegt auf dem Parcours herum. Niemand weiß, wer sie verteilt.',
  },
  ...PIECES.map((p): ItemDef => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    category: 'gear',
    sellPrice: p.marks * 20,
    rarity: 'rare',
    desc: 'Läufer-Set: federleicht, keine Rüstung – aber alles geht schneller.',
    equip: { slot: p.slot, defence: 0, mods: p.mods, req: { skill: 'agility', level: p.level } },
  })),
];

export const AGILITY_ACTIONS: ActionDef[] = [
  ...COURSES.map((c): ActionDef => ({
    id: `agi_${c.id}`,
    skill: 'agility',
    category: 'Parcours',
    name: c.name,
    icon: c.icon,
    levelReq: c.level,
    baseTime: c.time,
    xp: c.xp,
    inputs: [],
    outputs: [],
    drops: [{ item: 'mark_grace', chance: c.marks }],
    fall: { failAtReq: c.fail, stun: 2, damage: c.damage },
    desc: c.desc,
  })),
  ...PIECES.map((p): ActionDef => ({
    id: `agi_buy_${p.id}`,
    skill: 'agility',
    category: 'Marken eintauschen',
    name: p.name,
    icon: p.icon,
    levelReq: p.level,
    baseTime: 1,
    xp: 0,
    inputs: [{ item: 'mark_grace', qty: p.marks }],
    outputs: [{ item: p.id, qty: 1 }],
  })),
];

/** Passive per level: everything a little faster, the hero travels quicker, the rift hero runs faster. */
export const AGILITY_PER_LEVEL = { speed: 0.0008, travel: 0.003, rift: 0.002 };
