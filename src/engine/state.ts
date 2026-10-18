import Decimal from 'break_eternity.js';
import { BALANCE } from '../data/balance';
import { SKILLS } from '../data/skills';
import { STARTER_TOOLS } from '../data/tools';

export type NumberFormat = 'short' | 'scientific' | 'engineering';
export type GraphicsSetting = 'auto' | 'low' | 'medium' | 'high';

export interface Settings {
  numberFormat: NumberFormat;
  /** Show formulas and exact values in tooltips. */
  nerdMode: boolean;
  sound: boolean;
  /** Show random chatter lines in the event feed. */
  chatter: boolean;
  /** 3D quality preset. */
  graphics: GraphicsSetting;
  /** Battery saver: no 3D at all, 2D world only. */
  batteryMode: boolean;
}

export interface ActiveAction {
  actionId: string;
  /** Seconds already spent on the current cycle. */
  progress: number;
}

export interface MarketState {
  /** Item id → current price multiplier (1 = base). Missing = 1. Recovers towards 1 over time. */
  mults: Record<string, number>;
  /** Temporary demand spike or crash for one item. */
  trend: { item: string; mult: number; remaining: number } | null;
  /** Seconds until the next trend roll. */
  nextTrend: number;
}

export interface BuffState {
  id: string;
  remaining: number;
}

export interface SkillState {
  xp: number;
}

export interface GameState {
  /** Save-format version this state conforms to. */
  version: number;
  createdAt: number;
  /** Wall-clock ms of the last simulated moment; used for offline progress. */
  lastUpdate: number;
  gold: Decimal;
  skills: Record<string, SkillState>;
  /** Item id → quantity. Entries with 0 are removed. */
  inventory: Record<string, number>;
  inventorySlots: number;
  /** Tool ids the player owns. */
  ownedTools: string[];
  /** Skill id → equipped tool id. */
  equippedTools: Record<string, string>;
  active: ActiveAction | null;
  /** Campfire burn time remaining in seconds. */
  fire: number;
  intelligence: number;
  /** Free-form counters for the statistics page and achievements. */
  stats: Record<string, number>;
  settings: Settings;
  market: MarketState;
  /** Unlocked achievement ids. */
  achievements: string[];
  buffs: BuffState[];
  /** Active-play seconds until the next lucky event. */
  nextLucky: number;
}

export const SAVE_VERSION = 2;

export function defaultSettings(): Settings {
  return {
    numberFormat: 'short',
    nerdMode: false,
    sound: true,
    chatter: true,
    graphics: 'auto',
    batteryMode: false,
  };
}

export function newGame(now: number = Date.now()): GameState {
  const skills: Record<string, SkillState> = {};
  for (const s of SKILLS) skills[s.id] = { xp: 0 };
  return {
    version: SAVE_VERSION,
    createdAt: now,
    lastUpdate: now,
    gold: new Decimal(BALANCE.START_GOLD),
    skills,
    inventory: {},
    inventorySlots: BALANCE.START_INVENTORY_SLOTS,
    ownedTools: Object.values(STARTER_TOOLS),
    equippedTools: { ...STARTER_TOOLS },
    active: null,
    fire: 0,
    intelligence: 0,
    stats: {},
    settings: defaultSettings(),
    market: { mults: {}, trend: null, nextTrend: 120 },
    achievements: [],
    buffs: [],
    nextLucky: 240,
  };
}

/** Deep copy. The state is small and plain apart from Decimal, so this is cheap. */
export function cloneState(s: GameState): GameState {
  return {
    ...s,
    gold: new Decimal(s.gold),
    skills: Object.fromEntries(Object.entries(s.skills).map(([k, v]) => [k, { ...v }])),
    inventory: { ...s.inventory },
    ownedTools: [...s.ownedTools],
    equippedTools: { ...s.equippedTools },
    active: s.active ? { ...s.active } : null,
    stats: { ...s.stats },
    settings: { ...s.settings },
    market: {
      ...s.market,
      mults: { ...s.market.mults },
      trend: s.market.trend ? { ...s.market.trend } : null,
    },
    achievements: [...s.achievements],
    buffs: s.buffs.map((b) => ({ ...b })),
  };
}

export function addStat(s: GameState, key: string, amount = 1): void {
  s.stats[key] = (s.stats[key] ?? 0) + amount;
}

export function getStat(s: GameState, key: string): number {
  return s.stats[key] ?? 0;
}
