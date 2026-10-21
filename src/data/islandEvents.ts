import type { ModifierSet } from './types';

// Insel-Ereignisse: every hour or so something happens on the island for a while. Each event boosts a
// group of skills and drops special goods while those skills work; the Wanderhändler sells rarities.

export interface IslandEventDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** Seconds the event lasts. */
  duration: number;
  mods: ModifierSet;
  /** Skills whose completed actions can drop the event goods. */
  skills: string[];
  drop?: { item: string; chance: number };
  /** Wanderhändler: offers three deals instead of drops. */
  trader?: boolean;
}

export const ISLAND_EVENTS: IslandEventDef[] = [
  {
    id: 'trader',
    name: 'Wanderhändler',
    icon: '🧳',
    desc: 'Ein Händler mit klappernden Kisten legt an. Er schwört, alles sei „fast legal".',
    duration: 20 * 60,
    mods: { gold: 0.1 },
    skills: [],
    trader: true,
  },
  {
    id: 'meteor',
    name: 'Meteorschauer',
    icon: '☄️',
    desc: 'Glühende Brocken regnen auf die Insel. Die Möwen sind empört.',
    duration: 15 * 60,
    mods: { 'xp.mining': 0.25, 'xp.astronomy': 0.25, 'speed.smithing': 0.1 },
    skills: ['mining', 'astronomy'],
    drop: { item: 'meteorite', chance: 0.04 },
  },
  {
    id: 'fish_swarm',
    name: 'Fischschwarm',
    icon: '🐟',
    desc: 'Das Wasser brodelt vor Fischen. Ein paar davon wirken beleidigt.',
    duration: 20 * 60,
    mods: { 'speed.fishing': 0.2, 'double.fishing': 0.1, 'xp.cooking': 0.15 },
    skills: ['fishing', 'sailing'],
    drop: { item: 'pearl', chance: 0.05 },
  },
  {
    id: 'gold_vein',
    name: 'Goldader',
    icon: '💰',
    desc: 'Ein Erdrutsch legt eine glitzernde Ader frei. Alle sind plötzlich sehr freundlich zueinander.',
    duration: 15 * 60,
    mods: { gold: 0.25, 'double.mining': 0.15 },
    skills: ['mining'],
    drop: { item: 'ore_gold', chance: 0.3 },
  },
  {
    id: 'storm',
    name: 'Sturm',
    icon: '⛈️',
    desc: 'Der Wind reißt Bäume um und spült Treibgut an. Die Wäsche ist weg.',
    duration: 15 * 60,
    mods: { 'double.woodcutting': 0.2, 'xp.sailing': 0.3, 'xp.agility': 0.2 },
    skills: ['woodcutting', 'sailing'],
    drop: { item: 'driftwood', chance: 0.25 },
  },
  {
    id: 'harvest',
    name: 'Erntefest',
    icon: '🌾',
    desc: 'Die ganze Insel feiert. Jemand hat zu viel Met getrunken – vermutlich alle.',
    duration: 25 * 60,
    mods: {
      'speed.farming': 0.15,
      'double.cooking': 0.1,
      'double.brewing': 0.1,
      'village.prod': 0.15,
    },
    skills: ['farming', 'cooking', 'brewing'],
    drop: { item: 'honey', chance: 0.08 },
  },
];

export const ISLAND_EVENT_MAP = new Map(ISLAND_EVENTS.map((e) => [e.id, e]));

/** Time between events (seconds, random in this range). */
export const ISLAND_EVENT_GAP: [number, number] = [45 * 60, 90 * 60];

/** Wanderhändler's stock: three of these per visit, at a fixed gold price. */
export const TRADER_DEALS: { item: string; qty: number; price: number }[] = [
  { item: 'imprint_stone', qty: 1, price: 1_500 },
  { item: 'protect_rune', qty: 1, price: 1_000 },
  { item: 'moonstone', qty: 2, price: 600 },
  { item: 'meteorite', qty: 1, price: 900 },
  { item: 'pearl', qty: 3, price: 800 },
  { item: 'spice', qty: 10, price: 900 },
  { item: 'gem_ruby', qty: 2, price: 700 },
  { item: 'dungeon_chest', qty: 2, price: 500 },
  { item: 'kraken_tooth', qty: 1, price: 6_000 },
  { item: 'stardust', qty: 20, price: 3_000 },
];
