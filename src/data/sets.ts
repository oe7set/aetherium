import type { ItemDef, LootEntry, ModifierSet } from './types';

/** Gear sets: wearing several pieces of one set gives extra bonuses (tiers by piece count). */
export interface GearSetDef {
  id: string;
  name: string;
  icon: string;
  pieces: string[];
  tiers: { count: number; mods: ModifierSet }[];
}

const METAL_SETS: [string, string][] = [
  ['bronze', 'Bronze'],
  ['iron', 'Eisen'],
  ['steel', 'Stahl'],
  ['mithril', 'Mithril'],
  ['adamant', 'Adamant'],
  ['rune', 'Runit'],
  ['aetherite', 'Ätherit'],
];

export const GEAR_SETS: GearSetDef[] = [
  ...METAL_SETS.map(([key, name], i): GearSetDef => ({
    id: `set_${key}`,
    name: `${name}-Garnitur`,
    icon: '🛡️',
    pieces: ['helm', 'body', 'legs', 'gloves', 'boots', 'shield'].map((p) => `${key}_${p}`),
    tiers: [
      { count: 3, mods: { 'combat.defence': 0.03 + 0.01 * i } },
      {
        count: 6,
        mods: { 'combat.damage.melee': 0.03 + 0.01 * i, 'combat.hp': 0.04 + 0.01 * i },
      },
    ],
  })),
  {
    id: 'set_leather',
    name: 'Lederjäger',
    icon: '🏹',
    pieces: ['leather_cap', 'leather_body', 'leather_legs', 'leather_gloves', 'leather_boots'],
    tiers: [
      { count: 3, mods: { 'combat.accuracy.ranged': 0.04 } },
      { count: 5, mods: { 'combat.ammoSave': 0.1, 'combat.damage.ranged': 0.04 } },
    ],
  },
  {
    id: 'set_silk',
    name: 'Seidenmagier',
    icon: '🪄',
    pieces: ['silk_hood', 'silk_robe', 'silk_trousers', 'silk_gloves'],
    tiers: [
      { count: 2, mods: { 'combat.runeSave': 0.06 } },
      { count: 4, mods: { 'combat.damage.magic': 0.1, 'combat.accuracy.magic': 0.05 } },
    ],
  },
  {
    id: 'set_dragonhide',
    name: 'Drachenjäger',
    icon: '🐉',
    pieces: ['dragonhide_body', 'dragonhide_chaps', 'dragonhide_vambraces'],
    tiers: [
      { count: 2, mods: { 'combat.accuracy.ranged': 0.05 } },
      { count: 3, mods: { 'combat.damage.ranged': 0.12 } },
    ],
  },
];

export const SET_OF = new Map<string, GearSetDef>(
  GEAR_SETS.flatMap((set) => set.pieces.map((p) => [p, set] as const)),
);

/** Boss uniques: rare drops with a twist – the reason to farm a boss once more. */
export const UNIQUE_ITEMS: ItemDef[] = [
  {
    id: 'reviewer_blade',
    name: 'Rotstift-Klinge',
    icon: '🖍️',
    category: 'gear',
    sellPrice: 9000,
    rarity: 'legendary',
    desc: 'Korrigiert Gegner mit Nachdruck. Spezialleiste lädt 25 % schneller.',
    equip: {
      slot: 'weapon',
      style: 'melee',
      speed: 2.0,
      attack: 110,
      strength: 95,
      mods: { 'combat.energy': 0.25 },
      req: { skill: 'melee', level: 70 },
    },
  },
  {
    id: 'dragonfire_bow',
    name: 'Drachenfeuerbogen',
    icon: '🏹',
    category: 'gear',
    sellPrice: 12000,
    rarity: 'legendary',
    desc: 'Glüht noch. +25 % Schaden mit Feuerpfeilen, +5 % Fernkampfschaden.',
    equip: {
      slot: 'weapon',
      style: 'ranged',
      speed: 2.2,
      attack: 120,
      strength: 0,
      mods: { 'combat.element.fire': 0.25, 'combat.damage.ranged': 0.05 },
      req: { skill: 'ranged', level: 80 },
    },
  },
  {
    id: 'model_staff',
    name: 'Stab des Standardmodells',
    icon: '⚛️',
    category: 'gear',
    sellPrice: 15000,
    rarity: 'legendary',
    desc: 'Vereint alle Kräfte. +20 % Schaden mit Leere- und Blitzzaubern.',
    equip: {
      slot: 'weapon',
      style: 'magic',
      speed: 2.3,
      attack: 120,
      strength: 85,
      mods: { 'combat.element.void': 0.2, 'combat.element.lightning': 0.2 },
      req: { skill: 'magic', level: 90 },
    },
  },
  {
    id: 'wyrm_cape',
    name: 'Eiswurm-Schuppenmantel',
    icon: '🧣',
    category: 'gear',
    sellPrice: 6000,
    rarity: 'epic',
    desc: 'Kalt, schwer, unverwüstlich. +8 % Verteidigung, +6 % Lebenspunkte.',
    equip: {
      slot: 'cape',
      defence: 30,
      mods: { 'combat.defence': 0.08, 'combat.hp': 0.06 },
      req: { skill: 'defence', level: 85 },
    },
  },
  {
    id: 'yeti_mitts',
    name: 'Yeti-Fäustlinge',
    icon: '🧤',
    category: 'gear',
    sellPrice: 4000,
    rarity: 'epic',
    desc: 'Flauschig und brutal. +6 % Nahkampfschaden.',
    equip: {
      slot: 'hands',
      attack: 10,
      strength: 12,
      defence: 10,
      mods: { 'combat.damage.melee': 0.06 },
      req: { skill: 'defence', level: 80 },
    },
  },
];

/** Monster id → extra unique drop. */
export const UNIQUE_DROPS: Record<string, LootEntry> = {
  peer_reviewer_2: { item: 'reviewer_blade', chance: 1 / 40, rare: true },
  elder_dragon: { item: 'dragonfire_bow', chance: 1 / 50, rare: true },
  standard_model: { item: 'model_staff', chance: 1 / 50, rare: true },
  ice_wyrm: { item: 'wyrm_cape', chance: 1 / 150, rare: true },
  yeti: { item: 'yeti_mitts', chance: 1 / 100, rare: true },
};
