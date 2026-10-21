import type { ItemStack } from './types';

// Dorf ↔ Insel (Phase 45): high building levels need island goods on top of village resources, and
// the village's workshops send goods back to the island (collected in the village supply).

type Kind = 'stone' | 'wood' | 'metal' | 'lore';

const KIND: Record<string, Kind> = {
  main: 'stone',
  warehouse: 'stone',
  granary: 'stone',
  cranny: 'stone',
  wall: 'stone',
  townhall: 'stone',
  residence: 'stone',
  brickyard: 'stone',
  rally: 'wood',
  market: 'wood',
  sawmill: 'wood',
  mill: 'wood',
  bakery: 'wood',
  harbor: 'wood',
  barracks: 'metal',
  stable: 'metal',
  academy: 'metal',
  smithy: 'metal',
  foundry: 'metal',
  library: 'lore',
};

const TIERS: Record<Kind, ItemStack[][]> = {
  stone: [
    [
      { item: 'stone_block', qty: 20 },
      { item: 'plank_oak', qty: 20 },
    ],
    [
      { item: 'stone_block', qty: 60 },
      { item: 'nails', qty: 80 },
    ],
    [
      { item: 'stone_block', qty: 150 },
      { item: 'plank_maple', qty: 60 },
      { item: 'furn_table', qty: 2 },
    ],
  ],
  wood: [
    [{ item: 'plank_oak', qty: 40 }],
    [
      { item: 'plank_maple', qty: 40 },
      { item: 'rope', qty: 10 },
    ],
    [
      { item: 'plank_yew', qty: 60 },
      { item: 'furn_shelf', qty: 2 },
    ],
  ],
  metal: [
    [{ item: 'bar_iron', qty: 15 }],
    [
      { item: 'bar_steel', qty: 20 },
      { item: 'nails', qty: 60 },
    ],
    [
      { item: 'bar_steel', qty: 40 },
      { item: 'bar_mithril', qty: 20 },
    ],
  ],
  lore: [
    [{ item: 'parchment', qty: 30 }],
    [
      { item: 'parchment', qty: 80 },
      { item: 'research_notes', qty: 20 },
    ],
    [
      { item: 'research_notes', qty: 60 },
      { item: 'furn_shelf', qty: 3 },
    ],
  ],
};

/** Levels (relative to the max level) that ask for island goods: half, three quarters, max. */
export function goodsLevels(maxLevel: number): number[] {
  return [Math.ceil(maxLevel * 0.5), Math.ceil(maxLevel * 0.75), maxLevel];
}

/** Island goods a building level needs (empty for most levels). */
export function buildingGoods(id: string, maxLevel: number, level: number): ItemStack[] {
  const kind = KIND[id];
  if (!kind) return [];
  const tier = goodsLevels(maxLevel).indexOf(level);
  return tier < 0 ? [] : TIERS[kind][tier]!;
}

/** Village workshops send goods to the island: item per hour and building level. */
export const VILLAGE_SUPPLY: { building: string; item: string; perHour: number }[] = [
  { building: 'mill', item: 'flour', perHour: 2 },
  { building: 'bakery', item: 'bread', perHour: 1 },
  { building: 'smithy', item: 'nails', perHour: 3 },
  { building: 'sawmill', item: 'plank_oak', perHour: 1.5 },
  { building: 'brickyard', item: 'stone_block', perHour: 0.8 },
  { building: 'foundry', item: 'bar_iron', perHour: 0.6 },
];

/** Hours of production the village store holds before it stops filling. */
export const SUPPLY_CAP_HOURS = 24;
