import type { ActionDef, ItemDef, ModifierSet } from './types';

// Erfinden: take old gear apart for components, turn junk into screws, and build inventions –
// permanent gadgets with five levels each that sharpen tools, weapons, ships and telescopes.

export const PARTS = ['part_basic', 'part_precise', 'part_magic', 'part_ancient'] as const;
export type PartId = (typeof PARTS)[number];

export const INVENTION_ITEMS: ItemDef[] = [
  {
    id: 'part_basic',
    name: 'Schrauben & Zahnräder',
    icon: '🔩',
    category: 'resource',
    sellPrice: 3,
    desc: 'Aus allem, was mal etwas anderes war.',
  },
  {
    id: 'part_precise',
    name: 'Präzisionsteile',
    icon: '⚙️',
    category: 'resource',
    sellPrice: 20,
    desc: 'Aus guten Waffen und Rüstungen. Passt auf den Mikrometer.',
  },
  {
    id: 'part_magic',
    name: 'Zauberteile',
    icon: '🔮',
    category: 'resource',
    sellPrice: 45,
    rarity: 'uncommon',
    desc: 'Summen leise, wenn man sie schüttelt.',
  },
  {
    id: 'part_ancient',
    name: 'Uralte Teile',
    icon: '🗿',
    category: 'resource',
    sellPrice: 250,
    rarity: 'rare',
    desc: 'Älter als die Insel. Funktionieren trotzdem.',
  },
];

export const INVENTION_ACTIONS: ActionDef[] = [
  {
    id: 'inv_junk_boot',
    skill: 'invention',
    category: 'Schrott zerlegen',
    name: 'Alte Stiefel zerlegen',
    icon: '👢',
    levelReq: 1,
    baseTime: 2,
    xp: 6,
    inputs: [{ item: 'old_boot', qty: 1 }],
    outputs: [{ item: 'part_basic', qty: 3 }],
  },
  {
    id: 'inv_junk_food',
    skill: 'invention',
    category: 'Schrott zerlegen',
    name: 'Verbranntes analysieren',
    icon: '🪨',
    levelReq: 1,
    baseTime: 2,
    xp: 4,
    inputs: [{ item: 'burnt_food', qty: 2 }],
    outputs: [{ item: 'part_basic', qty: 1 }],
    desc: 'Kohlenstoff ist Kohlenstoff.',
  },
  {
    id: 'inv_junk_shard',
    skill: 'invention',
    category: 'Schrott zerlegen',
    name: 'Tonscherben sortieren',
    icon: '🏺',
    levelReq: 5,
    baseTime: 2.5,
    xp: 9,
    inputs: [{ item: 'pottery_shard', qty: 2 }],
    outputs: [{ item: 'part_basic', qty: 3 }],
  },
  {
    id: 'inv_nails',
    skill: 'invention',
    category: 'Schrott zerlegen',
    name: 'Nägel umschmieden',
    icon: '📌',
    levelReq: 10,
    baseTime: 2.5,
    xp: 12,
    inputs: [{ item: 'nails', qty: 10 }],
    outputs: [{ item: 'part_basic', qty: 4 }],
  },
  {
    id: 'inv_runes',
    skill: 'invention',
    category: 'Feinmechanik',
    name: 'Runen in Zauberteile binden',
    icon: '🔮',
    levelReq: 30,
    baseTime: 3.5,
    xp: 45,
    inputs: [
      { item: 'rune_basic', qty: 10 },
      { item: 'part_precise', qty: 1 },
    ],
    outputs: [{ item: 'part_magic', qty: 2 }],
  },
  {
    id: 'inv_meteorite',
    skill: 'invention',
    category: 'Feinmechanik',
    name: 'Meteorit analysieren',
    icon: '☄️',
    levelReq: 60,
    baseTime: 6,
    xp: 180,
    inputs: [{ item: 'meteorite', qty: 1 }],
    outputs: [{ item: 'part_ancient', qty: 2 }],
  },
];

export interface InventionDef {
  id: string;
  name: string;
  icon: string;
  level: number;
  /** Modifiers per level (max 5). */
  perLevel: ModifierSet;
  /** Parts for level 1; every further level costs twice as much. */
  cost: { item: string; qty: number }[];
  xp: number;
  desc: string;
}

export const INVENTIONS: InventionDef[] = [
  {
    id: 'sharp_axe',
    name: 'Selbstschärfende Axt',
    icon: '🪓',
    level: 1,
    perLevel: { 'speed.woodcutting': 0.03 },
    cost: [{ item: 'part_basic', qty: 20 }],
    xp: 60,
    desc: 'Holzfällen schneller',
  },
  {
    id: 'drill_pick',
    name: 'Bohrspitzhacke',
    icon: '⛏️',
    level: 8,
    perLevel: { 'speed.mining': 0.03 },
    cost: [{ item: 'part_basic', qty: 30 }],
    xp: 90,
    desc: 'Bergbau schneller',
  },
  {
    id: 'lucky_lure',
    name: 'Glücksköder',
    icon: '🎣',
    level: 15,
    perLevel: { 'double.fishing': 0.02, 'speed.fishing': 0.01 },
    cost: [
      { item: 'part_basic', qty: 30 },
      { item: 'part_precise', qty: 4 },
    ],
    xp: 140,
    desc: 'Angeln: öfter doppelte Fänge',
  },
  {
    id: 'bellows',
    name: 'Dampfblasebalg',
    icon: '🔥',
    level: 22,
    perLevel: { 'double.smithing': 0.02, 'speed.smithing': 0.01 },
    cost: [
      { item: 'part_basic', qty: 40 },
      { item: 'part_precise', qty: 6 },
    ],
    xp: 200,
    desc: 'Schmieden: öfter doppelte Barren',
  },
  {
    id: 'sharpener',
    name: 'Klingenschärfer',
    icon: '🗡️',
    level: 30,
    perLevel: { 'combat.damage.melee': 0.03 },
    cost: [
      { item: 'part_precise', qty: 10 },
      { item: 'bar_steel', qty: 5 },
    ],
    xp: 260,
    desc: 'Nahkampfschaden',
  },
  {
    id: 'scope',
    name: 'Zielfernrohr',
    icon: '🔭',
    level: 38,
    perLevel: { 'combat.accuracy.ranged': 0.03, 'combat.damage.ranged': 0.01 },
    cost: [
      { item: 'part_precise', qty: 12 },
      { item: 'gem_sapphire', qty: 1 },
    ],
    xp: 320,
    desc: 'Fernkampf: Treffsicherheit',
  },
  {
    id: 'resonator',
    name: 'Runenresonator',
    icon: '🔮',
    level: 45,
    perLevel: { 'combat.runeSave': 0.04, 'combat.damage.magic': 0.01 },
    cost: [
      { item: 'part_magic', qty: 8 },
      { item: 'part_precise', qty: 6 },
    ],
    xp: 420,
    desc: 'Magie: Runen sparen',
  },
  {
    id: 'compass_needle',
    name: 'Kreiselkompass',
    icon: '🧭',
    level: 52,
    perLevel: { 'speed.sailing': 0.03, 'speed.cartography': 0.02 },
    cost: [
      { item: 'part_precise', qty: 14 },
      { item: 'part_magic', qty: 4 },
    ],
    xp: 520,
    desc: 'Seefahrt und Kartografie schneller',
  },
  {
    id: 'star_lens',
    name: 'Sternenlinse',
    icon: '✨',
    level: 60,
    perLevel: { 'xp.astronomy': 0.04, 'double.astronomy': 0.02 },
    cost: [
      { item: 'part_magic', qty: 8 },
      { item: 'moonstone', qty: 2 },
    ],
    xp: 650,
    desc: 'Sternkunde: mehr XP und Staub',
  },
  {
    id: 'clockwork',
    name: 'Uhrwerk-Gehilfe',
    icon: '🤖',
    level: 70,
    perLevel: { helperSpeed: 0.04, speed: 0.005 },
    cost: [
      { item: 'part_precise', qty: 20 },
      { item: 'part_ancient', qty: 1 },
    ],
    xp: 900,
    desc: 'Helfer schneller, alles etwas schneller',
  },
  {
    id: 'aether_core',
    name: 'Ätherkern',
    icon: '💠',
    level: 85,
    perLevel: { 'rift.might': 0.03, 'combat.damage': 0.01 },
    cost: [
      { item: 'part_ancient', qty: 3 },
      { item: 'bar_starmetal', qty: 1 },
    ],
    xp: 1_500,
    desc: 'Riss-Schaden und Kampf',
  },
];

export const INVENTION_MAP = new Map(INVENTIONS.map((i) => [i.id, i]));
export const INVENTION_MAX = 5;

export function inventionCost(def: InventionDef, level: number): { item: string; qty: number }[] {
  return def.cost.map((c) => ({ item: c.item, qty: c.qty * 2 ** level }));
}

/** XP per component when taking gear apart. */
export const DISASSEMBLE_XP: Record<PartId, number> = {
  part_basic: 2,
  part_precise: 6,
  part_magic: 12,
  part_ancient: 60,
};
