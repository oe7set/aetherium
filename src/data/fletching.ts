import type { ActionDef, ItemDef, ModifierSet, SpellElement } from './types';

// Bogenbau: bowstrings, accurate longbows, heavy crossbows with bolts, gem-tipped bolts with
// effects (Juwelierkunst) and quivers. Crossbows only shoot bolts, bows only arrows.

interface Longbow {
  key: string;
  name: string;
  log: string;
  level: number;
  xp: number;
  attack: number;
  ranged: number;
  price: number;
}

const LONGBOWS: Longbow[] = [
  {
    key: 'oak',
    name: 'Eichen-Langbogen',
    log: 'log_oak',
    level: 5,
    xp: 25,
    attack: 12,
    ranged: 1,
    price: 30,
  },
  {
    key: 'willow',
    name: 'Weiden-Langbogen',
    log: 'log_willow',
    level: 20,
    xp: 50,
    attack: 26,
    ranged: 20,
    price: 90,
  },
  {
    key: 'maple',
    name: 'Ahorn-Langbogen',
    log: 'log_maple',
    level: 35,
    xp: 90,
    attack: 40,
    ranged: 30,
    price: 260,
  },
  {
    key: 'yew',
    name: 'Eiben-Langbogen',
    log: 'log_yew',
    level: 50,
    xp: 140,
    attack: 56,
    ranged: 40,
    price: 700,
  },
  {
    key: 'magic',
    name: 'Zauber-Langbogen',
    log: 'log_magic',
    level: 70,
    xp: 210,
    attack: 80,
    ranged: 55,
    price: 1800,
  },
  {
    key: 'redwood',
    name: 'Mammut-Langbogen',
    log: 'log_redwood',
    level: 85,
    xp: 300,
    attack: 104,
    ranged: 70,
    price: 4200,
  },
];

interface Crossbow {
  metal: string;
  name: string;
  log: string;
  level: number;
  xp: number;
  attack: number;
  ranged: number;
  price: number;
}

const CROSSBOWS: Crossbow[] = [
  {
    metal: 'bronze',
    name: 'Bronze-Armbrust',
    log: 'log_oak',
    level: 10,
    xp: 35,
    attack: 14,
    ranged: 5,
    price: 50,
  },
  {
    metal: 'iron',
    name: 'Eisen-Armbrust',
    log: 'log_willow',
    level: 25,
    xp: 65,
    attack: 28,
    ranged: 20,
    price: 140,
  },
  {
    metal: 'steel',
    name: 'Stahl-Armbrust',
    log: 'log_maple',
    level: 40,
    xp: 105,
    attack: 44,
    ranged: 35,
    price: 400,
  },
  {
    metal: 'mithril',
    name: 'Mithril-Armbrust',
    log: 'log_yew',
    level: 55,
    xp: 160,
    attack: 62,
    ranged: 50,
    price: 1100,
  },
  {
    metal: 'adamant',
    name: 'Adamant-Armbrust',
    log: 'log_magic',
    level: 70,
    xp: 230,
    attack: 84,
    ranged: 65,
    price: 2800,
  },
  {
    metal: 'rune',
    name: 'Runit-Armbrust',
    log: 'log_redwood',
    level: 85,
    xp: 330,
    attack: 110,
    ranged: 80,
    price: 6500,
  },
];

interface Bolt {
  metal: string;
  name: string;
  level: number;
  xp: number;
  strength: number;
  price: number;
}

const BOLTS: Bolt[] = [
  { metal: 'bronze', name: 'Bronzebolzen', level: 8, xp: 18, strength: 10, price: 2 },
  { metal: 'iron', name: 'Eisenbolzen', level: 22, xp: 34, strength: 15, price: 4 },
  { metal: 'steel', name: 'Stahlbolzen', level: 36, xp: 60, strength: 22, price: 10 },
  { metal: 'mithril', name: 'Mithrilbolzen', level: 50, xp: 95, strength: 30, price: 24 },
  { metal: 'adamant', name: 'Adamantbolzen', level: 65, xp: 140, strength: 42, price: 55 },
  { metal: 'rune', name: 'Runitbolzen', level: 80, xp: 200, strength: 60, price: 130 },
];

interface GemBolt {
  id: string;
  name: string;
  icon: string;
  gem: string;
  base: string;
  level: number;
  xp: number;
  strength: number;
  mods: ModifierSet;
  element?: SpellElement;
  price: number;
  desc: string;
}

const GEM_BOLTS: GemBolt[] = [
  {
    id: 'bolt_opal',
    name: 'Opalbolzen',
    icon: '🫧',
    gem: 'gem_opal',
    base: 'bolt_iron',
    level: 28,
    xp: 40,
    strength: 17,
    mods: { 'combat.loot': 0.08 },
    price: 8,
    desc: 'Glücksbolzen: +8 % Beute.',
  },
  {
    id: 'bolt_jade',
    name: 'Jadebolzen',
    icon: '🟢',
    gem: 'gem_jade',
    base: 'bolt_iron',
    level: 32,
    xp: 48,
    strength: 17,
    mods: { 'combat.crit': 0.05 },
    price: 10,
    desc: 'Treffen Schwachstellen: +5 % kritische Treffer.',
  },
  {
    id: 'bolt_topaz',
    name: 'Topasbolzen',
    icon: '🔶',
    gem: 'gem_topaz',
    base: 'bolt_steel',
    level: 42,
    xp: 70,
    strength: 25,
    mods: {},
    element: 'fire',
    price: 18,
    desc: 'Glühen beim Aufprall: Element Feuer.',
  },
  {
    id: 'bolt_sapphire',
    name: 'Saphirbolzen',
    icon: '💎',
    gem: 'gem_sapphire',
    base: 'bolt_mithril',
    level: 55,
    xp: 100,
    strength: 33,
    mods: {},
    element: 'frost',
    price: 35,
    desc: 'Eiskalt: Element Frost, frieren manchmal ein.',
  },
  {
    id: 'bolt_ruby',
    name: 'Rubinbolzen',
    icon: '♦️',
    gem: 'gem_ruby',
    base: 'bolt_adamant',
    level: 68,
    xp: 150,
    strength: 46,
    mods: { 'combat.damage.ranged': 0.08 },
    price: 80,
    desc: 'Blutige Spitze: +8 % Fernkampfschaden.',
  },
  {
    id: 'bolt_diamond',
    name: 'Diamantbolzen',
    icon: '💠',
    gem: 'gem_diamond',
    base: 'bolt_rune',
    level: 82,
    xp: 220,
    strength: 64,
    mods: { 'combat.accuracy.ranged': 0.12 },
    price: 170,
    desc: 'Panzerbrechend: +12 % Treffsicherheit.',
  },
  {
    id: 'bolt_onyx',
    name: 'Onyxbolzen',
    icon: '⚫',
    gem: 'gem_onyx',
    base: 'bolt_rune',
    level: 90,
    xp: 320,
    strength: 66,
    mods: { 'combat.damage.ranged': 0.06 },
    element: 'shadow',
    price: 400,
    desc: 'Saugen Leben: Element Schatten, heilen bei Treffern.',
  },
];

export const FLETCH_ITEMS: ItemDef[] = [
  {
    id: 'bowstring',
    name: 'Bogensehne',
    icon: '🧵',
    category: 'resource',
    sellPrice: 4,
    desc: 'Gespannt wie du vor einem Bosskampf.',
  },
  ...LONGBOWS.map((b): ItemDef => ({
    id: `longbow_${b.key}`,
    name: b.name,
    icon: '🏹',
    category: 'gear',
    sellPrice: b.price,
    desc: 'Langbogen: etwas langsamer, aber treffsicherer (+6 % Treffsicherheit). Verschießt Pfeile.',
    equip: {
      slot: 'weapon',
      style: 'ranged',
      speed: 2.6,
      attack: b.attack,
      strength: 0,
      mods: { 'combat.accuracy.ranged': 0.06 },
      req: { skill: 'ranged', level: Math.max(1, b.ranged) },
    },
  })),
  ...CROSSBOWS.map((c): ItemDef => ({
    id: `crossbow_${c.metal}`,
    name: c.name,
    icon: '🎯',
    category: 'gear',
    sellPrice: c.price,
    desc: 'Armbrust: langsam, aber jeder Bolzen sitzt (+10 % Fernkampfschaden). Verschießt nur Bolzen.',
    equip: {
      slot: 'weapon',
      style: 'ranged',
      speed: 3.0,
      attack: c.attack,
      strength: 0,
      ammoType: 'bolt',
      mods: { 'combat.damage.ranged': 0.1 },
      req: { skill: 'ranged', level: Math.max(1, c.ranged) },
    },
  })),
  ...BOLTS.map((b): ItemDef => ({
    id: `bolt_${b.metal}`,
    name: b.name,
    icon: '➵',
    category: 'gear',
    sellPrice: b.price,
    desc: `Munition für Armbrüste. Stärke +${b.strength}.`,
    equip: { slot: 'ammo', strength: b.strength, ammoType: 'bolt' },
  })),
  ...GEM_BOLTS.map((g): ItemDef => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    category: 'gear',
    sellPrice: g.price,
    rarity: 'uncommon',
    desc: `${g.desc} Munition für Armbrüste, Stärke +${g.strength}.`,
    equip: {
      slot: 'ammo',
      strength: g.strength,
      ammoType: 'bolt',
      element: g.element,
      mods: g.mods,
    },
  })),
  {
    id: 'quiver_leather',
    name: 'Lederköcher',
    icon: '🎒',
    category: 'gear',
    sellPrice: 120,
    desc: 'Umhang-Platz: 10 % Chance, Munition zu behalten.',
    equip: { slot: 'cape', defence: 3, mods: { 'combat.ammoSave': 0.1 } },
  },
  {
    id: 'quiver_dragon',
    name: 'Drachenköcher',
    icon: '🎒',
    category: 'gear',
    sellPrice: 2400,
    rarity: 'epic',
    desc: 'Umhang-Platz: 20 % Munition sparen, +4 % Treffsicherheit im Fernkampf.',
    equip: {
      slot: 'cape',
      defence: 12,
      mods: { 'combat.ammoSave': 0.2, 'combat.accuracy.ranged': 0.04 },
      req: { skill: 'ranged', level: 60 },
    },
  },
];

export const FLETCH_ACTIONS: ActionDef[] = [
  {
    id: 'fl_string_hide',
    skill: 'fletching',
    category: 'Sehnen',
    name: 'Sehnen aus Rindsleder',
    icon: '🧵',
    levelReq: 1,
    baseTime: 2.5,
    xp: 6,
    inputs: [{ item: 'cowhide', qty: 1 }],
    outputs: [{ item: 'bowstring', qty: 3 }],
  },
  {
    id: 'fl_string_silk',
    skill: 'fletching',
    category: 'Sehnen',
    name: 'Sehnen aus Spinnenseide',
    icon: '🕸️',
    levelReq: 20,
    baseTime: 2.5,
    xp: 14,
    inputs: [{ item: 'spider_silk', qty: 1 }],
    outputs: [{ item: 'bowstring', qty: 8 }],
  },
  ...LONGBOWS.map((b): ActionDef => ({
    id: `fl_longbow_${b.key}`,
    skill: 'fletching',
    category: 'Langbögen',
    name: b.name,
    icon: '🏹',
    levelReq: b.level,
    baseTime: 3.5,
    xp: b.xp,
    inputs: [
      { item: b.log, qty: 3 },
      { item: 'bowstring', qty: 1 },
    ],
    outputs: [{ item: `longbow_${b.key}`, qty: 1 }],
  })),
  ...CROSSBOWS.map((c): ActionDef => ({
    id: `fl_crossbow_${c.metal}`,
    skill: 'fletching',
    category: 'Armbrüste',
    name: c.name,
    icon: '🎯',
    levelReq: c.level,
    baseTime: 4,
    xp: c.xp,
    inputs: [
      { item: `bar_${c.metal}`, qty: 2 },
      { item: c.log, qty: 1 },
      { item: 'bowstring', qty: 1 },
    ],
    outputs: [{ item: `crossbow_${c.metal}`, qty: 1 }],
  })),
  ...BOLTS.map((b): ActionDef => ({
    id: `fl_bolt_${b.metal}`,
    skill: 'fletching',
    category: 'Bolzen',
    name: `15 ${b.name}`,
    icon: '➵',
    levelReq: b.level,
    baseTime: 3,
    xp: b.xp,
    inputs: [
      { item: `bar_${b.metal}`, qty: 1 },
      { item: 'feather', qty: 10 },
    ],
    outputs: [{ item: `bolt_${b.metal}`, qty: 15 }],
  })),
  ...GEM_BOLTS.map((g): ActionDef => ({
    id: `fl_${g.id}`,
    skill: 'fletching',
    category: 'Edelsteinbolzen',
    name: `10 ${g.name}`,
    icon: g.icon,
    levelReq: g.level,
    baseTime: 3.2,
    xp: g.xp,
    inputs: [
      { item: g.base, qty: 10 },
      { item: g.gem, qty: 1 },
    ],
    outputs: [{ item: g.id, qty: 10 }],
  })),
  {
    id: 'fl_quiver_leather',
    skill: 'fletching',
    category: 'Köcher',
    name: 'Lederköcher',
    icon: '🎒',
    levelReq: 15,
    baseTime: 4,
    xp: 45,
    inputs: [
      { item: 'cowhide', qty: 3 },
      { item: 'bowstring', qty: 2 },
    ],
    outputs: [{ item: 'quiver_leather', qty: 1 }],
  },
  {
    id: 'fl_quiver_dragon',
    skill: 'fletching',
    category: 'Köcher',
    name: 'Drachenköcher',
    icon: '🎒',
    levelReq: 72,
    baseTime: 5,
    xp: 300,
    inputs: [
      { item: 'dragon_scale', qty: 2 },
      { item: 'bowstring', qty: 4 },
    ],
    outputs: [{ item: 'quiver_dragon', qty: 1 }],
  },
];

/** Passive per level: a fletcher knows their bow – a little ranged accuracy and ammo saving. */
export const FLETCH_PER_LEVEL = { accuracy: 0.001, ammoSave: 0.001 };
