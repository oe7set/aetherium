import Decimal from 'break_eternity.js';
import { BALANCE } from '../data/balance';
import { SKILLS } from '../data/skills';
import { STARTER_TOOLS } from '../data/tools';
import type { EquipSlot } from '../data/types';
import { createVillageState } from './villageWorld';
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

export type VCostState = Record<'wood' | 'clay' | 'iron' | 'crop', number>;

export interface VQueueItem {
  /** Field index (as string) or building id. */
  key: string;
  level: number;
  remaining: number;
  total: number;
}

export interface VTraining {
  troop: string;
  count: number;
  /** Seconds per unit. */
  each: number;
  /** Progress on the current unit. */
  progress: number;
}

export interface Village {
  id: number;
  name: string;
  capital: boolean;
  x: number;
  y: number;
  /** Valley layout key (see VALLEYS). */
  layout: string;
  fields: number[];
  buildings: Record<string, number>;
  res: VCostState;
  queue: { field: VQueueItem[]; center: VQueueItem[] };
  training: VTraining[];
  troops: Record<string, number>;
  research: { troop: string; remaining: number; total: number } | null;
  /** Remaining seconds of a running celebration (and its CP). */
  celebration: { remaining: number; cp: number } | null;
  /** Annexed oases (target ids). */
  oases: string[];
}

export interface VMovement {
  id: number;
  kind: 'raid' | 'return' | 'settle' | 'trade';
  /** Village id the movement started from (returns go back there). */
  from: number;
  /** Target id, site id or village id (as string). */
  target: string;
  troops: Record<string, number>;
  res: VCostState;
  remaining: number;
  total: number;
}

export interface RaidTarget {
  id: string;
  kind: 'camp' | 'oasis' | 'ruin';
  name: string;
  icon: string;
  level: number;
  x: number;
  y: number;
  defense: number;
  maxDefense: number;
  stock: VCostState;
  stockMax: number;
  /** Oasis production bonus. */
  bonus?: 'wood' | 'clay' | 'iron' | 'crop';
  /** Village id that annexed this oasis. */
  owner: number | null;
}

export interface ValleySite {
  id: string;
  x: number;
  y: number;
  layout: string;
}

export interface VReport {
  id: number;
  /** Village clock (seconds) when it happened. */
  at: number;
  kind: 'raid' | 'invasion' | 'settle' | 'starve' | 'trade';
  village: number;
  won: boolean;
  title: string;
  text: string;
  loot?: VCostState;
  losses?: Record<string, number>;
}

/** Dorf (Travian-like village builder). */
export interface VillageState {
  villages: Village[];
  /** Currently selected village id. */
  active: number;
  /** Troops researched in the academy (shared by all villages). */
  researched: string[];
  cp: number;
  cpTotal: number;
  targets: RaidTarget[];
  sites: ValleySite[];
  movements: VMovement[];
  reports: VReport[];
  /** Unread reports (badge). */
  unread: number;
  nextId: number;
  /** Seconds of beginner protection left. */
  protection: number;
  /** Seconds until the next rift invasion. */
  invasionIn: number;
  invasionsWon: number;
  invasionsLost: number;
  /** Total village time in seconds (report timestamps). */
  clock: number;
}

export interface RiftBest {
  time: number;
  kills: number;
  level: number;
}

/** Ätherriss meta progression (runs themselves are not saved). */
export interface RiftState {
  essence: number;
  essenceTotal: number;
  talents: Record<string, number>;
  runs: number;
  wins: number;
  best: Record<string, RiftBest>;
  /** Evolutions discovered at least once (codex). */
  evolutions: string[];
  hero: string;
  biome: string;
  /** Seconds until the next echo run. */
  echo: number;
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
  village: VillageState;
  rift: RiftState;
}

export const SAVE_VERSION = 9;

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
    village: createVillageState(),
    rift: defaultRift(),
  };
}

export function defaultRift(): RiftState {
  return {
    essence: 0,
    essenceTotal: 0,
    talents: {},
    runs: 0,
    wins: 0,
    best: {},
    evolutions: [],
    hero: 'farmer',
    biome: 'meadow',
    echo: 600,
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
    village: cloneVillageState(s.village),
    rift: {
      ...s.rift,
      talents: { ...s.rift.talents },
      best: { ...s.rift.best },
      evolutions: [...s.rift.evolutions],
    },
  };
}

export function addStat(s: GameState, key: string, amount = 1): void {
  s.stats[key] = (s.stats[key] ?? 0) + amount;
}

export function getStat(s: GameState, key: string): number {
  return s.stats[key] ?? 0;
}

/** Village state is nested; cloned by hand (runs on every tick, so no structuredClone). */
export function cloneVillageState(v: VillageState): VillageState {
  return {
    ...v,
    villages: v.villages.map((vl) => ({
      ...vl,
      fields: [...vl.fields],
      buildings: { ...vl.buildings },
      res: { ...vl.res },
      queue: {
        field: vl.queue.field.map((q) => ({ ...q })),
        center: vl.queue.center.map((q) => ({ ...q })),
      },
      training: vl.training.map((tr) => ({ ...tr })),
      troops: { ...vl.troops },
      research: vl.research ? { ...vl.research } : null,
      celebration: vl.celebration ? { ...vl.celebration } : null,
      oases: [...vl.oases],
    })),
    researched: [...v.researched],
    targets: v.targets.map((tg) => ({ ...tg, stock: { ...tg.stock } })),
    sites: v.sites.map((st) => ({ ...st })),
    movements: v.movements.map((m) => ({ ...m, troops: { ...m.troops }, res: { ...m.res } })),
    reports: v.reports,
  };
}
