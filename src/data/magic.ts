import type { ActionDef, ItemDef, ModifierSet } from './types';

// Magie 3.0: high runes (Verzauberung), combat utility spells that cost them, and the Magie-Werkstatt –
// magic XP away from the arena: Hochalchemie (items to gold) and enchanted jewellery.

interface HighRune {
  id: string;
  name: string;
  icon: string;
  level: number;
  xp: number;
  input: { item: string; qty: number };
  out: number;
  price: number;
  desc: string;
}

const HIGH_RUNES: HighRune[] = [
  {
    id: 'rune_chaos',
    name: 'Chaosrune',
    icon: '🌪️',
    level: 32,
    xp: 40,
    input: { item: 'charm_gold', qty: 1 },
    out: 5,
    price: 20,
    desc: 'Für Schwächungszauber. Riecht nach Unordnung.',
  },
  {
    id: 'rune_death',
    name: 'Todesrune',
    icon: '💀',
    level: 50,
    xp: 70,
    input: { item: 'big_bones', qty: 1 },
    out: 5,
    price: 40,
    desc: 'Für Flüche und Verzauberungen. Bitte nicht im Dunkeln lesen.',
  },
  {
    id: 'rune_blood',
    name: 'Blutrune',
    icon: '🩸',
    level: 65,
    xp: 100,
    input: { item: 'basilisk_scale', qty: 1 },
    out: 5,
    price: 70,
    desc: 'Für Heilzauber. Pulsiert im Takt deines Herzens.',
  },
  {
    id: 'rune_soul',
    name: 'Seelenrune',
    icon: '👻',
    level: 80,
    xp: 150,
    input: { item: 'spirit_shard', qty: 20 },
    out: 6,
    price: 110,
    desc: 'Für Schutzzauber und mächtigen Schmuck.',
  },
];

/** Combat utility spells: optional, cast by hand – active play pays off a little. */
export interface UtilitySpellDef {
  id: string;
  name: string;
  icon: string;
  level: number;
  cost: { item: string; qty: number }[];
  /** Seconds the effect lasts (shield: number of blocked hits). */
  amount: number;
  cooldown: number;
  desc: string;
}

export const UTILITY_SPELLS: UtilitySpellDef[] = [
  {
    id: 'weaken',
    name: 'Schwächen',
    icon: '🌪️',
    level: 20,
    cost: [
      { item: 'rune_basic', qty: 2 },
      { item: 'rune_chaos', qty: 1 },
    ],
    amount: 30,
    cooldown: 20,
    desc: '30 s lang −25 % Verteidigung des Gegners.',
  },
  {
    id: 'curse',
    name: 'Fluch',
    icon: '💀',
    level: 40,
    cost: [
      { item: 'rune_basic', qty: 2 },
      { item: 'rune_death', qty: 1 },
    ],
    amount: 30,
    cooldown: 25,
    desc: '30 s lang −25 % Schaden des Gegners.',
  },
  {
    id: 'blood_pact',
    name: 'Blutpakt',
    icon: '🩸',
    level: 55,
    cost: [{ item: 'rune_blood', qty: 1 }],
    amount: 0.35,
    cooldown: 30,
    desc: 'Heilt sofort 35 % deiner Lebenspunkte.',
  },
  {
    id: 'soul_shield',
    name: 'Seelenschild',
    icon: '🛡️',
    level: 70,
    cost: [{ item: 'rune_soul', qty: 1 }],
    amount: 3,
    cooldown: 40,
    desc: 'Blockt die nächsten 3 Treffer vollständig.',
  },
];

export const UTILITY_MAP = new Map(UTILITY_SPELLS.map((u) => [u.id, u]));

interface Alch {
  item: string;
  name: string;
  level: number;
  xp: number;
}

/** Hochalchemie: turns an item into 1,6 × its sell price (fire runes as fuel). */
export const HIGH_ALCH_MULT = 1.6;

const ALCH: Alch[] = [
  { item: 'bar_iron', name: 'Eisenbarren', level: 10, xp: 20 },
  { item: 'bar_steel', name: 'Stahlbarren', level: 25, xp: 35 },
  { item: 'furn_table', name: 'Eichentisch', level: 35, xp: 50 },
  { item: 'bar_mithril', name: 'Mithrilbarren', level: 45, xp: 65 },
  { item: 'gem_sapphire', name: 'Saphir', level: 50, xp: 70 },
  { item: 'bar_adamant', name: 'Adamantbarren', level: 60, xp: 90 },
  { item: 'furn_wardrobe', name: 'Eibenschrank', level: 68, xp: 110 },
  { item: 'bar_rune', name: 'Runitbarren', level: 75, xp: 130 },
];

interface Enchant {
  id: string;
  name: string;
  icon: string;
  base: string;
  slot: 'ring' | 'amulet';
  level: number;
  xp: number;
  rune: { item: string; qty: number };
  mods: ModifierSet;
  price: number;
  desc: string;
}

const ENCHANTS: Enchant[] = [
  {
    id: 'ring_topaz_e',
    name: 'Verzauberter Topasring',
    icon: '💍',
    base: 'ring_topaz',
    slot: 'ring',
    level: 35,
    xp: 80,
    rune: { item: 'rune_chaos', qty: 5 },
    mods: { 'combat.accuracy': 0.07, 'combat.crit': 0.03 },
    price: 600,
    desc: '+7 % Treffsicherheit, +3 % kritische Treffer.',
  },
  {
    id: 'amulet_ranger',
    name: 'Amulett des Waldläufers',
    icon: '📿',
    base: 'amulet_emerald',
    slot: 'amulet',
    level: 52,
    xp: 130,
    rune: { item: 'rune_death', qty: 5 },
    mods: { 'combat.accuracy.ranged': 0.1, 'combat.damage.ranged': 0.06, 'combat.ammoSave': 0.15 },
    price: 1400,
    desc: 'Fernkampf: +10 % Treffsicherheit, +6 % Schaden, 15 % Pfeile sparen.',
  },
  {
    id: 'amulet_mage',
    name: 'Amulett des Erzmagiers',
    icon: '📿',
    base: 'amulet_sapphire',
    slot: 'amulet',
    level: 54,
    xp: 135,
    rune: { item: 'rune_death', qty: 5 },
    mods: { 'combat.accuracy.magic': 0.1, 'combat.damage.magic': 0.08, 'combat.runeSave': 0.15 },
    price: 1500,
    desc: 'Magie: +10 % Treffsicherheit, +8 % Schaden, 15 % Runen sparen.',
  },
  {
    id: 'amulet_fury',
    name: 'Amulett der Raserei',
    icon: '📿',
    base: 'amulet_strength',
    slot: 'amulet',
    level: 62,
    xp: 160,
    rune: { item: 'rune_blood', qty: 5 },
    mods: { 'combat.damage.melee': 0.14, 'combat.accuracy.melee': 0.06, 'combat.energy': 0.1 },
    price: 2200,
    desc: 'Nahkampf: +14 % Schaden, +6 % Treffsicherheit, Spezialleiste +10 %.',
  },
  {
    id: 'ring_onyx_e',
    name: 'Ring der Unsterblichkeit',
    icon: '💍',
    base: 'ring_onyx',
    slot: 'ring',
    level: 82,
    xp: 260,
    rune: { item: 'rune_soul', qty: 6 },
    mods: { 'combat.damage': 0.1, 'combat.hp': 0.08, 'combat.regen': 1 },
    price: 5000,
    desc: '+10 % Schaden, +8 % Leben, doppelte Heilung.',
  },
];

export const MAGIC_ITEMS: ItemDef[] = [
  ...HIGH_RUNES.map((r): ItemDef => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    category: 'resource',
    sellPrice: r.price,
    rarity: 'uncommon',
    desc: r.desc,
  })),
  ...ENCHANTS.map((e): ItemDef => ({
    id: e.id,
    name: e.name,
    icon: e.icon,
    category: 'gear',
    sellPrice: e.price,
    rarity: e.level >= 80 ? 'legendary' : 'epic',
    desc: e.desc,
    equip: { slot: e.slot, mods: e.mods },
  })),
];

export const MAGIC_ACTIONS: ActionDef[] = [
  ...HIGH_RUNES.map((r): ActionDef => ({
    id: `bind_${r.id}`,
    skill: 'enchanting',
    category: 'Hohe Runen',
    name: `${r.name}n binden`,
    icon: r.icon,
    levelReq: r.level,
    baseTime: 2.8,
    xp: r.xp,
    inputs: [{ item: 'rune_essence', qty: 3 }, r.input],
    outputs: [{ item: r.id, qty: r.out }],
  })),
  ...ALCH.map((a): ActionDef => ({
    id: `alch_${a.item}`,
    skill: 'magic',
    category: 'Hochalchemie',
    name: `Hochalchemie: ${a.name}`,
    icon: '🪙',
    levelReq: a.level,
    baseTime: 3,
    xp: a.xp,
    inputs: [
      { item: a.item, qty: 1 },
      { item: 'rune_fire', qty: 3 },
      { item: 'rune_basic', qty: 1 },
    ],
    outputs: [],
    alchemy: { item: a.item, mult: HIGH_ALCH_MULT },
    desc: `Verwandelt ${a.name} in Gold (×${HIGH_ALCH_MULT.toLocaleString('de-DE')} Verkaufspreis).`,
  })),
  ...ENCHANTS.map((e): ActionDef => ({
    id: `ench_${e.id}`,
    skill: 'magic',
    category: 'Schmuck verzaubern',
    name: e.name,
    icon: e.icon,
    levelReq: e.level,
    baseTime: 4,
    xp: e.xp,
    inputs: [{ item: e.base, qty: 1 }, e.rune],
    outputs: [{ item: e.id, qty: 1 }],
  })),
];
