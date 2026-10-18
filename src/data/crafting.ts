import type { ActionDef, ItemDef } from './types';

// Handwerk: arrow shafts, bows, arrows, staffs and leather armour. Connects woodcutting,
// smithing (arrowheads), fishing/combat (feathers, hides) and mining (gems) to combat.

const SHAFTS: { log: string; level: number; qty: number; xp: number }[] = [
  { log: 'log_oak', level: 1, qty: 15, xp: 5 },
  { log: 'log_willow', level: 15, qty: 30, xp: 15 },
  { log: 'log_maple', level: 30, qty: 45, xp: 30 },
  { log: 'log_yew', level: 45, qty: 60, xp: 50 },
  { log: 'log_magic', level: 60, qty: 75, xp: 80 },
];

const BOWS: {
  key: string;
  name: string;
  log: string;
  level: number;
  xp: number;
  attack: number;
  ranged: number;
  price: number;
}[] = [
  {
    key: 'oak',
    name: 'Eichen-Kurzbogen',
    log: 'log_oak',
    level: 5,
    xp: 16,
    attack: 8,
    ranged: 1,
    price: 20,
  },
  {
    key: 'willow',
    name: 'Weidenbogen',
    log: 'log_willow',
    level: 20,
    xp: 42,
    attack: 20,
    ranged: 20,
    price: 60,
  },
  {
    key: 'maple',
    name: 'Ahornbogen',
    log: 'log_maple',
    level: 35,
    xp: 75,
    attack: 29,
    ranged: 30,
    price: 140,
  },
  {
    key: 'yew',
    name: 'Eibenbogen',
    log: 'log_yew',
    level: 50,
    xp: 120,
    attack: 47,
    ranged: 40,
    price: 400,
  },
  {
    key: 'magic',
    name: 'Zauberbogen',
    log: 'log_magic',
    level: 65,
    xp: 180,
    attack: 69,
    ranged: 50,
    price: 1100,
  },
  {
    key: 'redwood',
    name: 'Mammutbogen',
    log: 'log_redwood',
    level: 80,
    xp: 260,
    attack: 90,
    ranged: 65,
    price: 2600,
  },
];

const ARROWS: {
  metal: string;
  name: string;
  level: number;
  xp: number;
  strength: number;
  price: number;
}[] = [
  { metal: 'bronze', name: 'Bronzepfeile', level: 1, xp: 20, strength: 7, price: 1 },
  { metal: 'iron', name: 'Eisenpfeile', level: 15, xp: 37, strength: 10, price: 3 },
  { metal: 'steel', name: 'Stahlpfeile', level: 30, xp: 75, strength: 16, price: 8 },
  { metal: 'mithril', name: 'Mithrilpfeile', level: 45, xp: 112, strength: 22, price: 20 },
  { metal: 'adamant', name: 'Adamantpfeile', level: 60, xp: 150, strength: 31, price: 45 },
  { metal: 'rune', name: 'Runitpfeile', level: 75, xp: 187, strength: 49, price: 110 },
];

const STAFFS: {
  key: string;
  name: string;
  inputs: { item: string; qty: number }[];
  level: number;
  xp: number;
  attack: number;
  magic: number;
  price: number;
}[] = [
  {
    key: 'basic',
    name: 'Lehrlingsstab',
    inputs: [{ item: 'log_oak', qty: 2 }],
    level: 8,
    xp: 25,
    attack: 6,
    magic: 4,
    price: 25,
  },
  {
    key: 'sapphire',
    name: 'Saphirstab',
    inputs: [
      { item: 'log_maple', qty: 2 },
      { item: 'gem_sapphire', qty: 1 },
    ],
    level: 30,
    xp: 90,
    attack: 22,
    magic: 14,
    price: 220,
  },
  {
    key: 'emerald',
    name: 'Smaragdstab',
    inputs: [
      { item: 'log_yew', qty: 2 },
      { item: 'gem_emerald', qty: 1 },
    ],
    level: 45,
    xp: 140,
    attack: 35,
    magic: 24,
    price: 480,
  },
  {
    key: 'ruby',
    name: 'Rubinstab',
    inputs: [
      { item: 'log_magic', qty: 2 },
      { item: 'gem_ruby', qty: 1 },
    ],
    level: 60,
    xp: 210,
    attack: 52,
    magic: 36,
    price: 1100,
  },
  {
    key: 'diamond',
    name: 'Diamantstab',
    inputs: [
      { item: 'log_redwood', qty: 2 },
      { item: 'gem_diamond', qty: 1 },
    ],
    level: 75,
    xp: 320,
    attack: 75,
    magic: 52,
    price: 3000,
  },
];

const LEATHER: {
  key: string;
  name: string;
  slot: 'body' | 'legs' | 'head';
  hide: string;
  qty: number;
  level: number;
  xp: number;
  defence: number;
  mods?: Record<string, number>;
  price: number;
}[] = [
  {
    key: 'leather_cap',
    name: 'Lederkappe',
    slot: 'head',
    hide: 'cowhide',
    qty: 1,
    level: 3,
    xp: 14,
    defence: 2,
    price: 10,
  },
  {
    key: 'leather_body',
    name: 'Lederwams',
    slot: 'body',
    hide: 'cowhide',
    qty: 3,
    level: 10,
    xp: 30,
    defence: 8,
    price: 30,
  },
  {
    key: 'leather_legs',
    name: 'Lederhose',
    slot: 'legs',
    hide: 'cowhide',
    qty: 2,
    level: 7,
    xp: 22,
    defence: 5,
    price: 20,
  },
  {
    key: 'fur_cloak',
    name: 'Wolfsfellmantel',
    slot: 'body',
    hide: 'fur',
    qty: 3,
    level: 25,
    xp: 70,
    defence: 18,
    mods: { 'combat.accuracy': 0.03 },
    price: 90,
  },
  {
    key: 'silk_robe',
    name: 'Seidenrobe',
    slot: 'body',
    hide: 'spider_silk',
    qty: 4,
    level: 35,
    xp: 110,
    defence: 14,
    mods: { 'combat.damage': 0.05 },
    price: 160,
  },
  {
    key: 'dragonhide_body',
    name: 'Drachenleder-Wams',
    slot: 'body',
    hide: 'dragon_scale',
    qty: 3,
    level: 70,
    xp: 300,
    defence: 70,
    mods: { 'combat.accuracy': 0.05 },
    price: 2200,
  },
];

const items: ItemDef[] = [
  {
    id: 'arrow_shaft',
    name: 'Pfeilschaft',
    icon: '🥢',
    category: 'resource',
    sellPrice: 0.2,
    desc: 'Ein Stock mit Ambitionen.',
  },
  ...BOWS.map((b): ItemDef => ({
    id: `bow_${b.key}`,
    name: b.name,
    icon: '🏹',
    category: 'gear',
    sellPrice: b.price,
    desc: 'Braucht Pfeile. Keine Pfeile, kein Spaß.',
    equip: {
      slot: 'weapon',
      style: 'ranged',
      speed: 2.4,
      attack: b.attack,
      strength: 0,
      req: { skill: 'ranged', level: Math.max(1, b.level - 5) },
    },
  })),
  ...ARROWS.map((a): ItemDef => ({
    id: `arrow_${a.metal}`,
    name: a.name,
    icon: '➶',
    category: 'gear',
    sellPrice: a.price,
    desc: `Munition. Stärke +${a.strength}.`,
    equip: { slot: 'ammo', strength: a.strength },
  })),
  ...STAFFS.map((st): ItemDef => ({
    id: `staff_${st.key}`,
    name: st.name,
    icon: '🪄',
    category: 'gear',
    sellPrice: st.price,
    desc: 'Verbraucht Runen pro Zauber. Funkeln inklusive.',
    equip: {
      slot: 'weapon',
      style: 'magic',
      speed: 2.4,
      attack: st.attack,
      strength: st.magic,
      req: { skill: 'magic', level: Math.max(1, st.level - 5) },
    },
  })),
  ...LEATHER.map((l): ItemDef => ({
    id: l.key,
    name: l.name,
    icon: l.slot === 'head' ? '🧢' : l.slot === 'legs' ? '👖' : '🧥',
    category: 'gear',
    sellPrice: l.price,
    desc: 'Leicht, bequem, riecht leicht nach Abenteuer.',
    equip: {
      slot: l.slot,
      defence: l.defence,
      mods: l.mods,
      req: { skill: 'defence', level: Math.max(1, l.level - 3) },
    },
  })),
];

const actions: ActionDef[] = [
  ...SHAFTS.map((sh): ActionDef => ({
    id: `craft_shafts_${sh.log}`,
    skill: 'crafting',
    category: 'Pfeilschäfte',
    name: `${sh.qty} Pfeilschäfte schnitzen`,
    icon: '🥢',
    levelReq: sh.level,
    baseTime: 2.5,
    xp: sh.xp,
    inputs: [{ item: sh.log, qty: 1 }],
    outputs: [{ item: 'arrow_shaft', qty: sh.qty }],
  })),
  ...ARROWS.map((a): ActionDef => ({
    id: `craft_arrow_${a.metal}`,
    skill: 'crafting',
    category: 'Pfeile',
    name: `15 ${a.name}`,
    icon: '➶',
    levelReq: a.level,
    baseTime: 3,
    xp: a.xp,
    inputs: [
      { item: 'arrow_shaft', qty: 15 },
      { item: 'feather', qty: 15 },
      { item: `${a.metal}_arrowheads`, qty: 15 },
    ],
    outputs: [{ item: `arrow_${a.metal}`, qty: 15 }],
  })),
  ...BOWS.map((b): ActionDef => ({
    id: `craft_bow_${b.key}`,
    skill: 'crafting',
    category: 'Bögen',
    name: b.name,
    icon: '🏹',
    levelReq: b.level,
    baseTime: 3,
    xp: b.xp,
    inputs: [
      { item: b.log, qty: 2 },
      { item: 'spider_silk', qty: b.level >= 35 ? 1 : 0 },
    ].filter((i) => i.qty > 0),
    outputs: [{ item: `bow_${b.key}`, qty: 1 }],
  })),
  ...STAFFS.map((st): ActionDef => ({
    id: `craft_staff_${st.key}`,
    skill: 'crafting',
    category: 'Stäbe',
    name: st.name,
    icon: '🪄',
    levelReq: st.level,
    baseTime: 3.5,
    xp: st.xp,
    inputs: st.inputs,
    outputs: [{ item: `staff_${st.key}`, qty: 1 }],
  })),
  ...LEATHER.map((l): ActionDef => ({
    id: `craft_${l.key}`,
    skill: 'crafting',
    category: 'Leder & Stoff',
    name: l.name,
    icon: '🧵',
    levelReq: l.level,
    baseTime: 3,
    xp: l.xp,
    inputs: [{ item: l.hide, qty: l.qty }],
    outputs: [{ item: l.key, qty: 1 }],
  })),
];

export const CRAFTING_ITEMS = items;
export const CRAFTING_ACTIONS = actions;
