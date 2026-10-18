import Decimal from 'break_eternity.js';
import { BALANCE } from '../data/balance';
import { SKILLS } from '../data/skills';
import { STARTER_TOOLS } from '../data/tools';
import type { EquipSlot } from '../data/types';
import { xpForLevel } from './xp';

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
  /** Browser notifications while the tab is in the background. */
  notifications: boolean;
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

export interface CombatState {
  kind: 'monster' | 'dungeon';
  /** Monster id or dungeon id. */
  target: string;
  /** Position inside a dungeon. */
  index: number;
  monster: string;
  monsterHp: number;
  /** Boss phase index. */
  phase: number;
  /** Seconds until the next monster spawns (0 while fighting). */
  respawn: number;
  playerTimer: number;
  monsterTimer: number;
}

export interface CombatSettings {
  /** Where combat XP goes: the weapon's style or defence. */
  training: 'style' | 'defence';
  /** Eat when HP drops to this fraction of max (0 = never). */
  autoEat: number;
  /** Preferred food; null = best available. */
  food: string | null;
}

export interface PlotState {
  seed: string | null;
  /** Growth seconds accumulated (already scaled by growth speed). */
  elapsed: number;
}

export interface HelperState {
  /** Helper type id (data/science.ts HELPERS). */
  type: string;
  actionId: string | null;
  progress: number;
  /** Completed tasks (interns learn from them). */
  done: number;
}

export interface PrestigeState {
  /** Unspent wisdom (currency for Ahnen-Talente). */
  wisdom: number;
  /** Lifetime wisdom; drives the global multiplier. */
  wisdomTotal: number;
  rebirths: number;
  upgrades: Record<string, number>;
  paradigms: number;
  /** Active natural laws. */
  laws: string[];
  bigBangs: number;
  shards: number;
  multiverse: Record<string, number>;
  /** Total XP at the start of the current run (excluded from wisdom gain). */
  runBaseXp: number;
  runStartedAt: number;
}

export interface TaskState {
  id: string;
  template: string;
  period: 'day' | 'week';
  stat: string;
  target: number;
  /** Stat value when the task was rolled. */
  baseline: number;
  claimed: boolean;
}

export type ColonyRes = Record<'wood' | 'brick' | 'wool' | 'grain' | 'ore', number>;

export interface ColonyPlayer {
  /** 'you' or an AI persona id. */
  persona: string;
  res: ColonyRes;
  settlements: number[];
  cities: number[];
  roads: number[];
  devHand: string[];
  knights: number;
  victoryCards: number;
}

export interface ColonyOffer {
  id: number;
  from: number;
  give: keyof ColonyRes;
  giveQty: number;
  want: keyof ColonyRes;
  wantQty: number;
  /** Rolls until the offer expires. */
  expires: number;
}

export interface ColonyMatch {
  seed: number;
  terrain: string[];
  numbers: (number | null)[];
  harbors: { edge: number; kind: string }[];
  robber: number;
  players: ColonyPlayer[];
  deck: string[];
  phase: 'setup' | 'running' | 'finished';
  /** Player indices still to place in the setup (snake order). */
  setupQueue: number[];
  /** Vertex of the settlement just placed in setup, awaiting its road. */
  setupVertex: number | null;
  rolls: number;
  lastRoll: [number, number] | null;
  turn: number;
  longestRoad: number | null;
  largestArmy: number | null;
  offers: ColonyOffer[];
  winner: number | null;
  /** Siedler buildings on own settlements/cities: vertex → building ids. */
  buildings: Record<string, string[]>;
  /** Free roads from a road-building card. */
  freeRoads: number;
  /** Waiting for the player to pick a hex for the robber (after a knight). */
  robberMode: boolean;
}

export interface ColonyState {
  match: ColonyMatch | null;
  fame: number;
  fameTotal: number;
  talents: Record<string, number>;
  wins: number;
  matches: number;
  /** Seconds until the next dice roll. */
  nextRoll: number;
  nextOfferId: number;
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
  /** Current hit points (may be fractional while regenerating). */
  hp: number;
  equipment: Partial<Record<EquipSlot, string>>;
  combat: CombatState | null;
  combatSettings: CombatSettings;
  /** Research points (currency for the tech tree). */
  research: number;
  techs: string[];
  /** Discovered element symbols (periodic table codex). */
  codex: string[];
  plots: PlotState[];
  helpers: HelperState[];
  prestige: PrestigeState;
  pets: string[];
  catState: 'unknown' | 'alive' | 'ghost';
  quests: { active: Record<string, Record<string, number>>; done: string[] };
  tasks: { day: string; week: string; list: TaskState[] };
  colony: ColonyState;
}

export const SAVE_VERSION = 7;

export function defaultSettings(): Settings {
  return {
    numberFormat: 'short',
    nerdMode: false,
    sound: true,
    chatter: true,
    graphics: 'auto',
    batteryMode: false,
    notifications: false,
  };
}

export function defaultCombatSettings(): CombatSettings {
  return { training: 'style', autoEat: 0.5, food: null };
}

export function newGame(now: number = Date.now()): GameState {
  const skills: Record<string, SkillState> = {};
  for (const s of SKILLS) skills[s.id] = { xp: 0 };
  // Like in old-school MMOs you start with 10 hit points.
  skills.hitpoints = { xp: xpForLevel(10) };
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
    hp: 10,
    equipment: {},
    combat: null,
    combatSettings: defaultCombatSettings(),
    research: 0,
    techs: [],
    codex: [],
    plots: [
      { seed: null, elapsed: 0 },
      { seed: null, elapsed: 0 },
      { seed: null, elapsed: 0 },
    ],
    helpers: [],
    prestige: defaultPrestige(now),
    pets: [],
    catState: 'unknown',
    quests: { active: {}, done: [] },
    tasks: { day: '', week: '', list: [] },
    colony: defaultColony(),
  };
}

export function defaultColony(): ColonyState {
  return {
    match: null,
    fame: 0,
    fameTotal: 0,
    talents: {},
    wins: 0,
    matches: 0,
    nextRoll: 30,
    nextOfferId: 1,
  };
}

export function defaultPrestige(now: number = Date.now()): PrestigeState {
  return {
    wisdom: 0,
    wisdomTotal: 0,
    rebirths: 0,
    upgrades: {},
    paradigms: 0,
    laws: [],
    bigBangs: 0,
    shards: 0,
    multiverse: {},
    runBaseXp: xpForLevel(10),
    runStartedAt: now,
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
    equipment: { ...s.equipment },
    combat: s.combat ? { ...s.combat } : null,
    combatSettings: { ...s.combatSettings },
    techs: [...s.techs],
    codex: [...s.codex],
    plots: s.plots.map((p) => ({ ...p })),
    helpers: s.helpers.map((h) => ({ ...h })),
    prestige: {
      ...s.prestige,
      upgrades: { ...s.prestige.upgrades },
      laws: [...s.prestige.laws],
      multiverse: { ...s.prestige.multiverse },
    },
    pets: [...s.pets],
    quests: {
      active: Object.fromEntries(Object.entries(s.quests.active).map(([k, v]) => [k, { ...v }])),
      done: [...s.quests.done],
    },
    tasks: { ...s.tasks, list: s.tasks.list.map((t) => ({ ...t })) },
    colony: cloneColony(s.colony),
  };
}

export function addStat(s: GameState, key: string, amount = 1): void {
  s.stats[key] = (s.stats[key] ?? 0) + amount;
}

export function getStat(s: GameState, key: string): number {
  return s.stats[key] ?? 0;
}

/** Colony state is nested; matches are cloned deeply (they are small: 4 players, 19 hexes). */
export function cloneColony(c: ColonyState): ColonyState {
  return {
    ...c,
    talents: { ...c.talents },
    match: c.match
      ? {
          ...c.match,
          terrain: [...c.match.terrain],
          numbers: [...c.match.numbers],
          harbors: c.match.harbors.map((h) => ({ ...h })),
          players: c.match.players.map((p) => ({
            ...p,
            res: { ...p.res },
            settlements: [...p.settlements],
            cities: [...p.cities],
            roads: [...p.roads],
            devHand: [...p.devHand],
          })),
          deck: [...c.match.deck],
          setupQueue: [...c.match.setupQueue],
          lastRoll: c.match.lastRoll ? [...c.match.lastRoll] : null,
          offers: c.match.offers.map((o) => ({ ...o })),
          buildings: Object.fromEntries(
            Object.entries(c.match.buildings).map(([k, v]) => [k, [...v]]),
          ),
        }
      : null,
  };
}
