import type { ItemDef } from './types';

// Weltbosse: every few hours a giant appears off the island. Island guard, village troops and the hero
// fight it together (also offline); a manual strike adds bursts. Phases harden it, a kill pays well,
// and each boss can drop its own legendary piece.

export interface WorldBossDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  unique: string;
}

export const WORLD_BOSSES: WorldBossDef[] = [
  {
    id: 'colossus',
    name: 'Ätherkoloss',
    icon: '🗿',
    desc: 'Ein wandelnder Berg aus Kristall. Ziemlich schlecht gelaunt.',
    unique: 'colossus_hammer',
  },
  {
    id: 'kraken_queen',
    name: 'Krakenkönigin',
    icon: '🦑',
    desc: 'Sie will ihren Zahn zurück. Und deinen Hafen.',
    unique: 'kraken_crown',
  },
  {
    id: 'star_eater',
    name: 'Sternenfresser',
    icon: '🌑',
    desc: 'Frisst Sterne zum Frühstück. Die Insel wäre der Nachtisch.',
    unique: 'starveil_cape',
  },
  {
    id: 'magma_titan',
    name: 'Magmatitan',
    icon: '🌋',
    desc: 'Steigt aus dem Meer, und das Meer kocht.',
    unique: 'titan_heart',
  },
];

export const WORLD_BOSS_MAP = new Map(WORLD_BOSSES.map((b) => [b.id, b]));

export const WORLD_BOSS = {
  /** Seconds between bosses (from the end of one to the next). */
  interval: 4 * 3600,
  /** Seconds a boss stays before it leaves. */
  duration: 3600,
  /** Base HP; scales with combat level and every kill. */
  baseHp: 30_000,
  hpPerKill: 0.25,
  /** Damage factors in the hard phases (below 66 % and 33 % HP). */
  phaseArmor: [1, 0.85, 0.7],
  /** Seconds between manual strikes. */
  strikeCooldown: 60,
  /** Seconds between recomputing the damage rates (they read gear, troops and the hero). */
  recalc: 60,
  /** Chance for the boss's legendary piece per kill. */
  uniqueChance: 0.12,
};

export const WORLD_BOSS_ITEMS: ItemDef[] = [
  {
    id: 'colossus_hammer',
    name: 'Kolosshammer',
    icon: '🔨',
    category: 'gear',
    sellPrice: 25_000,
    rarity: 'legendary',
    desc: 'Aus dem Arm des Ätherkolosses geschlagen. Schwer. Sehr schwer.',
    equip: {
      slot: 'weapon',
      style: 'melee',
      speed: 2.8,
      attack: 110,
      strength: 118,
      mods: { 'combat.damage': 0.05 },
      req: { skill: 'melee', level: 70 },
    },
  },
  {
    id: 'kraken_crown',
    name: 'Krone der Krakenkönigin',
    icon: '👑',
    category: 'gear',
    sellPrice: 20_000,
    rarity: 'legendary',
    desc: 'Glänzt nass. Immer.',
    equip: {
      slot: 'head',
      defence: 55,
      mods: { 'combat.hp': 0.06, 'combat.regen': 0.3 },
      req: { skill: 'defence', level: 65 },
    },
  },
  {
    id: 'starveil_cape',
    name: 'Sternenschleier',
    icon: '🌌',
    category: 'gear',
    sellPrice: 22_000,
    rarity: 'legendary',
    desc: 'Ein Stück Nachthimmel, das der Sternenfresser nicht mehr verdauen konnte.',
    equip: { slot: 'cape', defence: 20, mods: { xp: 0.03, 'rift.might': 0.05 } },
  },
  {
    id: 'titan_heart',
    name: 'Titanenherz',
    icon: '❤️‍🔥',
    category: 'gear',
    sellPrice: 24_000,
    rarity: 'legendary',
    desc: 'Schlägt noch. Bitte nicht erschrecken.',
    equip: { slot: 'amulet', mods: { 'combat.damage': 0.06, 'combat.hp': 0.05 } },
  },
];
