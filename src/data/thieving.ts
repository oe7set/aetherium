import type { ActionDef, ItemDef } from './types';

// Diebeskunst: pickpocketing, stalls and locked chests. Every attempt can fail (caught: stunned,
// a few HP lost). Higher levels sharpen the eye: critical hits in combat and village spies.

export const THIEVING_ITEMS: ItemDef[] = [
  {
    id: 'lockpick',
    name: 'Dietrich',
    icon: '🗝️',
    category: 'resource',
    sellPrice: 6,
    desc: 'Für Schlösser, die es sich anders überlegen sollen.',
  },
  {
    id: 'thief_mask',
    name: 'Diebesmaske',
    icon: '🎭',
    category: 'gear',
    sellPrice: 400,
    rarity: 'rare',
    desc: '15 % seltener erwischt werden, +3 % kritische Treffer.',
    equip: { slot: 'head', defence: 4, mods: { stealth: 0.15, 'combat.crit': 0.03 } },
  },
  {
    id: 'silent_boots',
    name: 'Leisetreter',
    icon: '🥿',
    category: 'gear',
    sellPrice: 600,
    rarity: 'rare',
    desc: '10 % seltener erwischt werden, +5 % Diebeskunst-Tempo.',
    equip: { slot: 'feet', defence: 6, mods: { stealth: 0.1, 'speed.thieving': 0.05 } },
  },
];

interface Target {
  id: string;
  name: string;
  icon: string;
  level: number;
  time: number;
  xp: number;
  fail: number;
  stun: number;
  damage: number;
  gold: [number, number];
  inputs?: { item: string; qty: number }[];
  outputs?: { item: string; qty: number }[];
  drops: ActionDef['drops'];
  category: string;
  desc: string;
}

const TARGETS: Target[] = [
  {
    id: 'farmer',
    name: 'Bauer bestehlen',
    icon: '👨‍🌾',
    level: 1,
    time: 2.5,
    xp: 8,
    fail: 0.45,
    stun: 3,
    damage: 1,
    gold: [3, 9],
    drops: [
      { item: 'seed_potato', chance: 0.2, min: 1, max: 3 },
      { item: 'seed_wheat', chance: 0.1 },
    ],
    category: 'Taschendiebstahl',
    desc: 'Er merkt es nie. Fast nie.',
  },
  {
    id: 'veg_stall',
    name: 'Gemüsestand plündern',
    icon: '🥕',
    level: 6,
    time: 3,
    xp: 15,
    fail: 0.4,
    stun: 3,
    damage: 2,
    gold: [2, 6],
    outputs: [{ item: 'potato', qty: 2 }],
    drops: [
      { item: 'apple', chance: 0.4, min: 1, max: 3 },
      { item: 'seed_apple', chance: 0.02, rare: true },
    ],
    category: 'Marktstände',
    desc: 'Karotten in der Hose sind kein Verbrechen. Glaubst du.',
  },
  {
    id: 'fish_stall',
    name: 'Fischstand plündern',
    icon: '🐟',
    level: 15,
    time: 3.2,
    xp: 26,
    fail: 0.4,
    stun: 3.5,
    damage: 3,
    gold: [4, 12],
    outputs: [{ item: 'raw_trout', qty: 1 }],
    drops: [{ item: 'raw_salmon', chance: 0.25 }],
    category: 'Marktstände',
    desc: 'Riecht verdächtig. Du auch danach.',
  },
  {
    id: 'guard',
    name: 'Wache bestehlen',
    icon: '💂',
    level: 25,
    time: 3.5,
    xp: 42,
    fail: 0.45,
    stun: 4,
    damage: 5,
    gold: [30, 80],
    drops: [
      { item: 'lockpick', chance: 0.2, min: 1, max: 2 },
      { item: 'arrow_iron', chance: 0.2, min: 5, max: 15 },
    ],
    category: 'Taschendiebstahl',
    desc: 'Die Wache schläft. Ihre Geldbörse nicht.',
  },
  {
    id: 'scholar',
    name: 'Gelehrten bestehlen',
    icon: '🧑‍🏫',
    level: 35,
    time: 3.8,
    xp: 60,
    fail: 0.4,
    stun: 4,
    damage: 4,
    gold: [40, 110],
    drops: [
      { item: 'research_notes', chance: 0.4 },
      { item: 'rune_essence', chance: 0.3, min: 2, max: 6 },
    ],
    category: 'Taschendiebstahl',
    desc: 'Die Notizen sind wertvoller als das Geld. Leider unleserlich.',
  },
  {
    id: 'chest',
    name: 'Truhe knacken',
    icon: '🧰',
    level: 40,
    time: 4.5,
    xp: 85,
    fail: 0.35,
    stun: 5,
    damage: 6,
    gold: [80, 220],
    inputs: [{ item: 'lockpick', qty: 1 }],
    drops: [
      { item: 'geode', chance: 0.5, min: 1, max: 3 },
      { item: 'gem_topaz', chance: 0.2 },
      { item: 'bar_silver', chance: 0.3 },
      { item: 'thief_mask', chance: 1 / 250, rare: true },
    ],
    category: 'Schlösser',
    desc: 'Klick. Klick. Klack. Gold!',
  },
  {
    id: 'jeweller',
    name: 'Juwelier-Auslage',
    icon: '💍',
    level: 48,
    time: 4,
    xp: 100,
    fail: 0.45,
    stun: 5,
    damage: 7,
    gold: [60, 160],
    drops: [
      { item: 'gem_opal', chance: 0.4 },
      { item: 'gem_jade', chance: 0.3 },
      { item: 'gem_sapphire', chance: 0.1 },
      { item: 'gem_emerald', chance: 0.06 },
    ],
    category: 'Marktstände',
    desc: 'Funkeln ist Einladung. Sagt man.',
  },
  {
    id: 'knight',
    name: 'Ritter bestehlen',
    icon: '🤺',
    level: 58,
    time: 4.2,
    xp: 130,
    fail: 0.45,
    stun: 6,
    damage: 10,
    gold: [150, 400],
    drops: [
      { item: 'charm_crimson', chance: 0.2 },
      { item: 'prayer_draught', chance: 0.15 },
      { item: 'silent_boots', chance: 1 / 300, rare: true },
    ],
    category: 'Taschendiebstahl',
    desc: 'Die Rüstung klappert, du nicht.',
  },
  {
    id: 'wizard',
    name: 'Zauberer bestehlen',
    icon: '🧙',
    level: 68,
    time: 4.5,
    xp: 165,
    fail: 0.45,
    stun: 6,
    damage: 12,
    gold: [120, 300],
    drops: [
      { item: 'rune_storm', chance: 0.4, min: 4, max: 12 },
      { item: 'rune_shadow', chance: 0.3, min: 3, max: 9 },
      { item: 'mana_crystal', chance: 0.2 },
    ],
    category: 'Taschendiebstahl',
    desc: 'Hoffentlich hat er keinen Alarmzauber. Hat er.',
  },
  {
    id: 'vault',
    name: 'Schatzkammer knacken',
    icon: '🏦',
    level: 78,
    time: 6,
    xp: 240,
    fail: 0.4,
    stun: 8,
    damage: 15,
    gold: [500, 1400],
    inputs: [{ item: 'lockpick', qty: 3 }],
    drops: [
      { item: 'bar_gold', chance: 0.6, min: 1, max: 3 },
      { item: 'gem_ruby', chance: 0.15 },
      { item: 'gem_diamond', chance: 0.06, rare: true },
      { item: 'gem_onyx', chance: 0.015, rare: true },
    ],
    category: 'Schlösser',
    desc: 'Der Ernstfall für jeden Dietrich.',
  },
  {
    id: 'dragon_hoard',
    name: 'Drachenhort bestehlen',
    icon: '🐉',
    level: 90,
    time: 7,
    xp: 380,
    fail: 0.5,
    stun: 10,
    damage: 25,
    gold: [1500, 4000],
    drops: [
      { item: 'dragon_scale', chance: 0.25 },
      { item: 'gem_diamond', chance: 0.12, rare: true },
      { item: 'gem_aether', chance: 0.004, rare: true },
    ],
    category: 'Schlösser',
    desc: 'Er schläft. Hoffentlich tief. Sehr tief.',
  },
];

/** Failed attempts only teach 10 %, so successes pay more (keeps XP/h in line with other skills). */
const THIEVING_XP_MULT = 1.6;

export const THIEVING_ACTIONS: ActionDef[] = [
  ...TARGETS.map((t): ActionDef => ({
    id: `thieve_${t.id}`,
    skill: 'thieving',
    category: t.category,
    name: t.name,
    icon: t.icon,
    levelReq: t.level,
    baseTime: t.time,
    xp: Math.round(t.xp * THIEVING_XP_MULT),
    inputs: t.inputs ?? [],
    outputs: t.outputs ?? [],
    drops: t.drops,
    steal: { failAtReq: t.fail, stun: t.stun, damage: t.damage, gold: t.gold },
    desc: t.desc,
  })),
  {
    id: 'smith_lockpicks',
    skill: 'smithing',
    category: 'Werkzeuge',
    name: '5 Dietriche',
    icon: '🗝️',
    levelReq: 18,
    baseTime: 3,
    xp: 20,
    inputs: [{ item: 'bar_iron', qty: 1 }],
    outputs: [{ item: 'lockpick', qty: 5 }],
  },
];

/** Passive bonuses per Diebeskunst level. */
export const THIEVING_PER_LEVEL = { crit: 0.0015, villageDefense: 0.0015 };
/** Critical hits deal this much more damage. */
export const CRIT_MULT = 1.5;
