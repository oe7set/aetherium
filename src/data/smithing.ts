import type { ActionDef, EquipDef, ItemDef } from './types';

// Smelting and smithing are generated from a metal table so every tier stays consistent.

interface Metal {
  key: string;
  name: string;
  /** Smithing level of the tier's first item. */
  level: number;
  /** Ore inputs per bar. */
  ores: { item: string; qty: number }[];
  barXp: number;
  barPrice: number;
  /** Combat power scale of gear made from this metal. */
  power: number;
  /** Tool unlocked by the axe/pickaxe of this tier (must exist in tools.ts). */
  axe?: string;
  pick?: string;
  color: string;
}

const METALS: Metal[] = [
  {
    key: 'bronze',
    name: 'Bronze',
    level: 1,
    ores: [
      { item: 'ore_copper', qty: 1 },
      { item: 'ore_tin', qty: 1 },
    ],
    barXp: 8,
    barPrice: 8,
    power: 1,
    axe: 'axe_bronze',
    pick: 'pick_bronze',
    color: '#c8834a',
  },
  {
    key: 'iron',
    name: 'Eisen',
    level: 15,
    ores: [{ item: 'ore_iron', qty: 1 }],
    barXp: 14,
    barPrice: 14,
    power: 2,
    axe: 'axe_iron',
    pick: 'pick_iron',
    color: '#8d8f94',
  },
  {
    key: 'steel',
    name: 'Stahl',
    level: 30,
    ores: [
      { item: 'ore_iron', qty: 1 },
      { item: 'coal', qty: 2 },
    ],
    barXp: 22,
    barPrice: 40,
    power: 3,
    axe: 'axe_steel',
    pick: 'pick_steel',
    color: '#b8bcc4',
  },
  {
    key: 'mithril',
    name: 'Mithril',
    level: 50,
    ores: [
      { item: 'ore_mithril', qty: 1 },
      { item: 'coal', qty: 4 },
    ],
    barXp: 40,
    barPrice: 110,
    power: 5,
    axe: 'axe_mithril',
    pick: 'pick_mithril',
    color: '#4a7bd9',
  },
  {
    key: 'adamant',
    name: 'Adamant',
    level: 70,
    ores: [
      { item: 'ore_adamant', qty: 1 },
      { item: 'coal', qty: 6 },
    ],
    barXp: 60,
    barPrice: 220,
    power: 8,
    axe: 'axe_adamant',
    pick: 'pick_adamant',
    color: '#3fa35a',
  },
  {
    key: 'rune',
    name: 'Runit',
    level: 85,
    ores: [
      { item: 'ore_runite', qty: 1 },
      { item: 'coal', qty: 8 },
    ],
    barXp: 85,
    barPrice: 420,
    power: 12,
    axe: 'axe_rune',
    pick: 'pick_rune',
    color: '#3fb7d9',
  },
];

/** Precious metal bars (no gear, used for jewellery and enchanting later). */
const PRECIOUS = [
  {
    key: 'silver',
    name: 'Silberbarren',
    level: 20,
    ore: 'ore_silver',
    xp: 14,
    price: 30,
    color: '#dfe6ee',
  },
  {
    key: 'gold',
    name: 'Goldbarren',
    level: 40,
    ore: 'ore_gold',
    xp: 23,
    price: 55,
    color: '#f2c94c',
  },
];

interface Piece {
  key: string;
  name: string;
  icon: string;
  bars: number;
  offset: number;
  /** Units produced per smith. */
  qty?: number;
  equip?: (m: Metal) => EquipDef;
  tool?: 'axe' | 'pick';
  desc: string;
}

const PIECES: Piece[] = [
  {
    key: 'axe',
    name: 'axt',
    icon: '🪓',
    bars: 1,
    offset: 1,
    tool: 'axe',
    desc: 'Benutzen, um sie als Werkzeug zu übernehmen.',
  },
  {
    key: 'pick',
    name: 'spitzhacke',
    icon: '⛏️',
    bars: 1,
    offset: 2,
    tool: 'pick',
    desc: 'Benutzen, um sie als Werkzeug zu übernehmen.',
  },
  {
    key: 'dagger',
    name: 'dolch',
    icon: '🗡️',
    bars: 1,
    offset: 0,
    desc: 'Klein, aber gemein.',
    equip: (m) => ({
      slot: 'weapon',
      style: 'melee',
      speed: 2.0,
      attack: 4 * m.power,
      strength: 3 * m.power,
      req: { skill: 'melee', level: Math.max(1, m.level - 1) },
    }),
  },
  {
    key: 'arrowheads',
    name: 'pfeilspitzen',
    icon: '🔺',
    bars: 1,
    offset: 4,
    qty: 15,
    desc: 'Für Pfeile. Spitz auf Knopf.',
  },
  {
    key: 'sword',
    name: 'schwert',
    icon: '⚔️',
    bars: 2,
    offset: 4,
    desc: 'Das Schwert. Ein Klassiker seit dem Bronzezeitalter.',
    equip: (m) => ({
      slot: 'weapon',
      style: 'melee',
      speed: 2.4,
      attack: 7 * m.power,
      strength: 6 * m.power,
      req: { skill: 'melee', level: Math.max(1, m.level - 1) },
    }),
  },
  {
    key: 'helm',
    name: 'helm',
    icon: '⛑️',
    bars: 1,
    offset: 6,
    desc: 'Schützt den wichtigsten Muskel: das Gehirn.',
    equip: (m) => ({
      slot: 'head',
      defence: 3 * m.power,
      req: { skill: 'defence', level: Math.max(1, m.level - 1) },
    }),
  },
  {
    key: 'shield',
    name: 'schild',
    icon: '🛡️',
    bars: 2,
    offset: 9,
    desc: 'Defensive Haltung, offensiv glänzend.',
    equip: (m) => ({
      slot: 'shield',
      defence: 5 * m.power,
      req: { skill: 'defence', level: Math.max(1, m.level - 1) },
    }),
  },
  {
    key: 'legs',
    name: 'beinschutz',
    icon: '👖',
    bars: 2,
    offset: 11,
    desc: 'Hosen, aber aus Metall. Klappert beim Gehen.',
    equip: (m) => ({
      slot: 'legs',
      defence: 5 * m.power,
      req: { skill: 'defence', level: Math.max(1, m.level - 1) },
    }),
  },
  {
    key: 'body',
    name: 'brustplatte',
    icon: '🦺',
    bars: 3,
    offset: 13,
    desc: 'Die Mutter aller Rüstungsteile.',
    equip: (m) => ({
      slot: 'body',
      defence: 8 * m.power,
      req: { skill: 'defence', level: Math.max(1, m.level - 1) },
    }),
  },
];

const metalItems: ItemDef[] = [];
const metalActions: ActionDef[] = [];

for (const m of METALS) {
  const bar = `bar_${m.key}`;
  metalItems.push({
    id: bar,
    name: `${m.name}barren`,
    icon: '🧱',
    art: { kind: 'bar', color: m.color },
    category: 'resource',
    sellPrice: m.barPrice,
    desc: `Ein solider ${m.name}barren. Riecht nach Fortschritt.`,
  });
  metalActions.push({
    id: `smelt_${m.key}`,
    skill: 'smithing',
    category: 'Barren',
    name: `${m.name}barren schmelzen`,
    icon: '🔥',
    levelReq: m.level,
    baseTime: 3,
    xp: m.barXp,
    inputs: m.ores,
    outputs: [{ item: bar, qty: 1 }],
  });
  for (const p of PIECES) {
    const id = `${m.key}_${p.key}`;
    const toolId = p.tool === 'axe' ? m.axe : p.tool === 'pick' ? m.pick : undefined;
    if (p.tool && !toolId) continue;
    const qty = p.qty ?? 1;
    const name = `${m.name}${p.name}`;
    metalItems.push({
      id,
      name,
      icon: p.icon,
      category: p.equip ? 'gear' : p.tool ? 'consumable' : 'resource',
      sellPrice: Math.round((m.barPrice * p.bars * 1.25) / qty),
      desc: p.desc,
      consume: toolId ? { type: 'tool', tool: toolId } : undefined,
      equip: p.equip?.(m),
    });
    metalActions.push({
      id: `smith_${id}`,
      skill: 'smithing',
      category: p.tool
        ? 'Werkzeuge'
        : p.equip
          ? p.equip(m).slot === 'weapon'
            ? 'Waffen'
            : 'Rüstung'
          : 'Munition',
      name,
      icon: p.icon,
      levelReq: Math.min(99, m.level + p.offset),
      baseTime: 2.5 + p.bars * 0.5,
      xp: Math.round(m.barXp * 1.6 * p.bars),
      inputs: [{ item: bar, qty: p.bars }],
      outputs: [{ item: id, qty }],
    });
  }
}

for (const p of PRECIOUS) {
  metalItems.push({
    id: `bar_${p.key}`,
    name: p.name,
    icon: '🧱',
    art: { kind: 'bar', color: p.color },
    category: 'resource',
    sellPrice: p.price,
    desc: 'Edel, glänzend, für Schmuck und Verzauberungen.',
  });
  metalActions.push({
    id: `smelt_${p.key}`,
    skill: 'smithing',
    category: 'Barren',
    name: `${p.name} schmelzen`,
    icon: '🔥',
    levelReq: p.level,
    baseTime: 3,
    xp: p.xp,
    inputs: [{ item: p.ore, qty: 1 }],
    outputs: [{ item: `bar_${p.key}`, qty: 1 }],
  });
}

// Jewellery: rings and amulets with combat/skill modifiers.
const JEWELLERY: ItemDef[] = [
  {
    id: 'ring_sapphire',
    name: 'Saphirring',
    icon: '💍',
    category: 'gear',
    sellPrice: 120,
    rarity: 'uncommon',
    desc: '+3 % XP auf alles. Blau macht schlau.',
    equip: { slot: 'ring', mods: { xp: 0.03 } },
  },
  {
    id: 'ring_emerald',
    name: 'Smaragdring',
    icon: '💍',
    category: 'gear',
    sellPrice: 220,
    rarity: 'uncommon',
    desc: '+5 % Sammelgeschwindigkeit beim Holzfällen und Bergbau.',
    equip: { slot: 'ring', mods: { 'speed.woodcutting': 0.05, 'speed.mining': 0.05 } },
  },
  {
    id: 'amulet_ruby',
    name: 'Rubinamulett',
    icon: '📿',
    category: 'gear',
    sellPrice: 380,
    rarity: 'rare',
    desc: '+8 % Schaden. Rot ist schneller, sagen Orks.',
    equip: { slot: 'amulet', mods: { 'combat.damage': 0.08 } },
  },
  {
    id: 'amulet_diamond',
    name: 'Diamantamulett',
    icon: '📿',
    category: 'gear',
    sellPrice: 900,
    rarity: 'epic',
    desc: '+10 % Chance auf doppelte Ausbeute bei allem.',
    equip: { slot: 'amulet', mods: { double: 0.1 } },
  },
];
const jewelleryActions: ActionDef[] = [
  {
    id: 'craft_ring_sapphire',
    skill: 'smithing',
    category: 'Schmuck',
    name: 'Saphirring',
    icon: '💍',
    levelReq: 25,
    baseTime: 4,
    xp: 50,
    inputs: [
      { item: 'bar_silver', qty: 1 },
      { item: 'gem_sapphire', qty: 1 },
    ],
    outputs: [{ item: 'ring_sapphire', qty: 1 }],
  },
  {
    id: 'craft_ring_emerald',
    skill: 'smithing',
    category: 'Schmuck',
    name: 'Smaragdring',
    icon: '💍',
    levelReq: 35,
    baseTime: 4,
    xp: 70,
    inputs: [
      { item: 'bar_silver', qty: 1 },
      { item: 'gem_emerald', qty: 1 },
    ],
    outputs: [{ item: 'ring_emerald', qty: 1 }],
  },
  {
    id: 'craft_amulet_ruby',
    skill: 'smithing',
    category: 'Schmuck',
    name: 'Rubinamulett',
    icon: '📿',
    levelReq: 50,
    baseTime: 4.5,
    xp: 110,
    inputs: [
      { item: 'bar_gold', qty: 1 },
      { item: 'gem_ruby', qty: 1 },
    ],
    outputs: [{ item: 'amulet_ruby', qty: 1 }],
  },
  {
    id: 'craft_amulet_diamond',
    skill: 'smithing',
    category: 'Schmuck',
    name: 'Diamantamulett',
    icon: '📿',
    levelReq: 70,
    baseTime: 5,
    xp: 180,
    inputs: [
      { item: 'bar_gold', qty: 1 },
      { item: 'gem_diamond', qty: 1 },
    ],
    outputs: [{ item: 'amulet_diamond', qty: 1 }],
  },
];

export const SMITHING_ITEMS: ItemDef[] = [...metalItems, ...JEWELLERY];
export const SMITHING_ACTIONS: ActionDef[] = [...metalActions, ...jewelleryActions];
export const METAL_COLORS: Record<string, string> = Object.fromEntries(
  METALS.map((m) => [m.key, m.color]),
);
