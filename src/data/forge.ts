import type { ActionDef, EquipSlot, ItemDef } from './types';

// Item-Aufwertung: every equipment slot can be reinforced +1 to +10 (stays when you swap gear) and
// carries one random imprint (Prägung). Higher levels can fail; above +5 a failure costs a level unless
// a protection rune is used.

export const FORGE_SLOTS: EquipSlot[] = [
  'weapon',
  'shield',
  'head',
  'body',
  'legs',
  'hands',
  'feet',
  'cape',
  'ring',
  'amulet',
];

export const FORGE_MAX = 10;
/** Attack, strength and defence of the item in the slot per level. */
export const FORGE_STAT_PER_LEVEL = 0.05;

/** Success chance for going from `level` to `level + 1`. */
export function forgeChance(level: number): number {
  return [1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3][level] ?? 0;
}

/** Above this level a failure drops one level (unless protected). */
export const FORGE_SAFE_LEVEL = 5;

export function forgeCost(level: number): { gold: number; items: { item: string; qty: number }[] } {
  const gold = 250 * 2 ** level;
  if (level < 3) return { gold, items: [{ item: 'bar_iron', qty: 5 + 5 * level }] };
  if (level < 6) return { gold, items: [{ item: 'bar_mithril', qty: 3 + 2 * level }] };
  const items = [{ item: 'bar_rune', qty: 2 + level }];
  if (level >= 8) items.push({ item: 'gem_diamond', qty: level - 7 });
  return { gold, items };
}

export interface AffixDef {
  key: string;
  label: string;
  /** Value range of a roll. */
  min: number;
  max: number;
  /** Slots that can roll it (undefined = all). */
  slots?: EquipSlot[];
}

export const AFFIXES: AffixDef[] = [
  {
    key: 'combat.damage',
    label: 'Schaden',
    min: 0.02,
    max: 0.06,
    slots: ['weapon', 'ring', 'amulet', 'hands'],
  },
  { key: 'combat.accuracy', label: 'Treffsicherheit', min: 0.02, max: 0.06 },
  {
    key: 'combat.crit',
    label: 'Kritische Treffer',
    min: 0.01,
    max: 0.04,
    slots: ['weapon', 'ring', 'hands'],
  },
  {
    key: 'combat.defence',
    label: 'Verteidigung',
    min: 0.02,
    max: 0.06,
    slots: ['shield', 'head', 'body', 'legs', 'feet'],
  },
  {
    key: 'combat.hp',
    label: 'Leben',
    min: 0.02,
    max: 0.06,
    slots: ['body', 'legs', 'amulet', 'shield'],
  },
  { key: 'combat.loot', label: 'Beute', min: 0.03, max: 0.08 },
  { key: 'combat.regen', label: 'Heilung', min: 0.1, max: 0.3, slots: ['amulet', 'ring', 'cape'] },
  { key: 'xp', label: 'Alle XP', min: 0.01, max: 0.03, slots: ['ring', 'amulet', 'cape', 'head'] },
  { key: 'gold', label: 'Gold', min: 0.02, max: 0.05, slots: ['ring', 'hands', 'feet'] },
  { key: 'speed', label: 'Aktionstempo', min: 0.01, max: 0.025, slots: ['feet', 'hands', 'cape'] },
  { key: 'rare', label: 'Seltene Funde', min: 0.02, max: 0.05, slots: ['head', 'amulet', 'ring'] },
  { key: 'rift.might', label: 'Riss-Schaden', min: 0.02, max: 0.05, slots: ['weapon', 'cape'] },
];

export const AFFIX_MAP = new Map(AFFIXES.map((a) => [a.key, a]));

export const FORGE_ITEMS: ItemDef[] = [
  {
    id: 'protect_rune',
    name: 'Schutzrune',
    icon: '🛡️',
    category: 'resource',
    sellPrice: 300,
    rarity: 'rare',
    desc: 'Verhindert, dass eine missglückte Verstärkung eine Stufe kostet.',
  },
  {
    id: 'imprint_stone',
    name: 'Prägestein',
    icon: '🔷',
    category: 'resource',
    sellPrice: 500,
    rarity: 'rare',
    desc: 'Prägt einem Ausrüstungsplatz einen zufälligen Zusatzwert ein (überschreibt den alten).',
  },
];

export const FORGE_ACTIONS: ActionDef[] = [
  {
    id: 'mag_protect_rune',
    skill: 'magic',
    category: 'Schmiede-Magie',
    name: 'Schutzrune binden',
    icon: '🛡️',
    levelReq: 40,
    baseTime: 5,
    xp: 120,
    inputs: [
      { item: 'rune_death', qty: 2 },
      { item: 'bar_gold', qty: 1 },
    ],
    outputs: [{ item: 'protect_rune', qty: 1 }],
  },
  {
    id: 'inv_imprint_stone',
    skill: 'invention',
    category: 'Feinmechanik',
    name: 'Prägestein formen',
    icon: '🔷',
    levelReq: 45,
    baseTime: 6,
    xp: 220,
    inputs: [
      { item: 'part_magic', qty: 4 },
      { item: 'gem_ruby', qty: 1 },
    ],
    outputs: [{ item: 'imprint_stone', qty: 1 }],
  },
];
