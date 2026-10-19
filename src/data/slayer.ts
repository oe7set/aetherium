import type { ItemDef } from './types';

// Kopfgeldjagd: monster contracts with slayer XP per kill, points for finished contracts and a
// reward shop. Kopfgeldturm monsters can only be fought with enough slayer level.

/** Contract size range and points per finished contract. */
export const SLAYER_TASK_MIN = 12;
export const SLAYER_TASK_MAX = 35;
export const SLAYER_POINTS = 12;
/** Every n-th contract in a row pays this multiple. */
export const SLAYER_STREAK_EVERY = 10;
export const SLAYER_STREAK_MULT = 5;
/** Slayer XP per monster hit point on a kill. */
export const SLAYER_XP_PER_HP = 1.2;

export const SLAYER_ITEMS: ItemDef[] = [
  {
    id: 'slayer_helm',
    name: 'Kopfgeldhelm',
    icon: '🪖',
    category: 'gear',
    sellPrice: 0,
    rarity: 'rare',
    desc: '+12 % Schaden und Treffsicherheit gegen dein Kopfgeld-Ziel.',
    equip: { slot: 'head', defence: 20, mods: { 'combat.slayer': 0.12 } },
  },
  {
    id: 'slayer_ring',
    name: 'Kopfgeldring',
    icon: '💍',
    category: 'gear',
    sellPrice: 0,
    rarity: 'rare',
    desc: '+6 % gegen Kopfgeld-Ziele, +3 % Gold.',
    equip: { slot: 'ring', mods: { 'combat.slayer': 0.06, gold: 0.03 } },
  },
  {
    id: 'slayer_cape',
    name: 'Umhang des Kopfgeldjägers',
    icon: '🧣',
    category: 'gear',
    sellPrice: 0,
    rarity: 'epic',
    desc: '+8 % gegen Kopfgeld-Ziele, +5 % Beute.',
    equip: { slot: 'cape', defence: 12, mods: { 'combat.slayer': 0.08, 'combat.loot': 0.05 } },
  },
  {
    id: 'bounty_bag',
    name: 'Kopfgeld-Beutel',
    icon: '💰',
    category: 'consumable',
    sellPrice: 50,
    desc: 'Öffnen: eine Handvoll nützlicher Kampfvorräte.',
    consume: {
      type: 'loot',
      rolls: 3,
      table: [
        { item: 'rune_fire', chance: 1, min: 10, max: 30 },
        { item: 'rune_frost', chance: 1, min: 10, max: 30 },
        { item: 'arrow_steel', chance: 1, min: 20, max: 50 },
        { item: 'prayer_draught', chance: 0.6, min: 1, max: 3 },
        { item: 'geode', chance: 0.6, min: 2, max: 5 },
        { item: 'gem_topaz', chance: 0.3 },
        { item: 'gem_onyx', chance: 0.02, rare: true },
      ],
    },
  },
  {
    id: 'basilisk_scale',
    name: 'Basiliskenschuppe',
    icon: '🟩',
    category: 'resource',
    sellPrice: 90,
    desc: 'Hart wie Stein, glänzt wie ein neuer Kühlschrank.',
  },
  {
    id: 'banshee_veil',
    name: 'Schleier der Banshee',
    icon: '🫥',
    category: 'gear',
    sellPrice: 1500,
    rarity: 'epic',
    desc: '+8 % Magieschaden. Flüstert manchmal. Ignorieren.',
    equip: {
      slot: 'head',
      defence: 8,
      mods: { 'combat.damage.magic': 0.08 },
      req: { skill: 'magic', level: 35 },
    },
  },
  {
    id: 'granite_maul',
    name: 'Granithammer',
    icon: '🔨',
    category: 'gear',
    sellPrice: 2500,
    rarity: 'epic',
    desc: 'Langsam, aber jeder Schlag ein Erdbeben. Spezialleiste lädt 20 % schneller.',
    equip: {
      slot: 'weapon',
      style: 'melee',
      speed: 3.2,
      attack: 60,
      strength: 95,
      mods: { 'combat.energy': 0.2 },
      req: { skill: 'melee', level: 50 },
    },
  },
  {
    id: 'basilisk_eye',
    name: 'Basiliskenauge',
    icon: '👁️',
    category: 'gear',
    sellPrice: 3000,
    rarity: 'epic',
    desc: 'Ein Amulett, das zurückstarrt: +8 % Treffsicherheit im Fern- und Magiekampf.',
    equip: {
      slot: 'amulet',
      mods: { 'combat.accuracy.ranged': 0.08, 'combat.accuracy.magic': 0.08 },
    },
  },
  {
    id: 'kraken_trident',
    name: 'Dreizack der Krake',
    icon: '🔱',
    category: 'gear',
    sellPrice: 6000,
    rarity: 'epic',
    desc: 'Ein Stab aus der Tiefe: unbegrenzt Frostrunen, +20 % Schaden mit Frostzaubern.',
    equip: {
      slot: 'weapon',
      style: 'magic',
      speed: 2.2,
      attack: 70,
      strength: 52,
      mods: { 'combat.element.frost': 0.2 },
      runeSupply: 'rune_frost',
      req: { skill: 'magic', level: 70 },
    },
  },
  {
    id: 'abyssal_whip',
    name: 'Abgrundpeitsche',
    icon: '🪢',
    category: 'gear',
    sellPrice: 12000,
    rarity: 'legendary',
    desc: 'Schnell, präzise, legendär. Jeder will sie, wenige haben sie.',
    equip: {
      slot: 'weapon',
      style: 'melee',
      speed: 1.8,
      attack: 100,
      strength: 82,
      req: { skill: 'melee', level: 75 },
    },
  },
];

export type SlayerShopEffect =
  { type: 'item'; item: string; qty: number } | { type: 'skip' } | { type: 'block' };

export interface SlayerShopEntry {
  id: string;
  name: string;
  icon: string;
  cost: number;
  effect: SlayerShopEffect;
  desc: string;
}

export const SLAYER_SHOP: SlayerShopEntry[] = [
  {
    id: 'skip',
    name: 'Auftrag tauschen',
    icon: '🔄',
    cost: 25,
    effect: { type: 'skip' },
    desc: 'Neuer Auftrag, Serie bleibt erhalten.',
  },
  {
    id: 'block',
    name: 'Monster sperren',
    icon: '🚫',
    cost: 80,
    effect: { type: 'block' },
    desc: 'Das aktuelle Ziel kommt nie wieder als Auftrag (max. 5).',
  },
  {
    id: 'bag',
    name: 'Kopfgeld-Beutel',
    icon: '💰',
    cost: 20,
    effect: { type: 'item', item: 'bounty_bag', qty: 1 },
    desc: 'Runen, Pfeile, Weihtrunk, Geoden.',
  },
  {
    id: 'helm',
    name: 'Kopfgeldhelm',
    icon: '🪖',
    cost: 120,
    effect: { type: 'item', item: 'slayer_helm', qty: 1 },
    desc: '+12 % gegen Kopfgeld-Ziele.',
  },
  {
    id: 'ring',
    name: 'Kopfgeldring',
    icon: '💍',
    cost: 90,
    effect: { type: 'item', item: 'slayer_ring', qty: 1 },
    desc: '+6 % gegen Kopfgeld-Ziele, +3 % Gold.',
  },
  {
    id: 'cape',
    name: 'Kopfgeldjäger-Umhang',
    icon: '🧣',
    cost: 300,
    effect: { type: 'item', item: 'slayer_cape', qty: 1 },
    desc: '+8 % gegen Ziele, +5 % Beute.',
  },
];

export const SLAYER_BLOCK_MAX = 5;
