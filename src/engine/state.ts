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
  /** Power profile: eco caps frame rates and turns off costly effects (cool phones). */
  performance: 'auto' | 'eco' | 'smooth';
  /** Vibration feedback on rewards. */
  haptics: boolean;
  /** Procedural background music and its volume (0–1). */
  music: boolean;
  musicVolume: number;
  /** Accessibility: text size, fewer animations, stronger contrast. */
  textSize: 'normal' | 'large' | 'xlarge';
  reduceMotion: boolean;
  highContrast: boolean;
  /** Colour-blind friendly palette: blue/orange instead of green/red. */
  colorblind: boolean;
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
  /** Special attack charge 0–100; fills on attacks, fired by hand. */
  energy: number;
  /** Monster swings since spawn (every n-th is a telegraphed heavy attack). */
  swings: number;
  /** The monster winds up a heavy attack right now. */
  windup: boolean;
  /** The player tapped „Ausweichen" during the wind-up. */
  dodged: boolean;
  /** Utility spells: seconds of Schwächen/Fluch left, Seelenschild hits left. */
  weaken: number;
  curse: number;
  shield: number;
  /** Utility spell id → cooldown seconds left. */
  cooldowns: Record<string, number>;
}

export interface SlayerState {
  task: { monster: string; left: number; total: number } | null;
  points: number;
  streak: number;
  done: number;
  blocked: string[];
}

export interface PrayerState {
  points: number;
  active: string[];
}

export interface Loadout {
  name: string;
  gear: Partial<Record<EquipSlot, string>>;
  /** Spell to cast with this set (magic loadouts). */
  spell?: string;
}

export const LOADOUT_COUNT = 3;

export interface CombatSettings {
  /** Where combat XP goes: the weapon's style or defence. */
  training: 'style' | 'defence';
  /** Eat when HP drops to this fraction of max (0 = never). */
  autoEat: number;
  /** Preferred food; null = best available. */
  food: string | null;
  /** Chosen combat spell (magic style); falls back to the spark without reagents. */
  spell: string;
  /** Buff item drunk automatically in combat whenever its buff runs out (null = off). */
  potion: string | null;
}

export interface PlotState {
  seed: string | null;
  /** Growth seconds accumulated (already scaled by growth speed). */
  elapsed: number;
  /**
   * What auto-harvest plants afterwards: undefined = the same seed again, null = leave empty,
   * a seed id = switch to that seed.
   */
  next?: string | null;
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
  /** The hero marches with these troops. */
  hero?: boolean;
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

export interface HeroItem {
  uid: number;
  base: string;
  tier: number;
}

export interface Adventure {
  id: number;
  x: number;
  y: number;
  biome: string;
  level: number;
  hard: boolean;
  name: string;
  /** Seconds until it vanishes. */
  expires: number;
}

/** The one hero: lives in a village, explores adventures, fights in the rift. */
export interface HeroState {
  name: string;
  avatar: string;
  level: number;
  xp: number;
  points: number;
  attrs: Record<'power' | 'offense' | 'defense' | 'resources', number>;
  /** 0–100. */
  health: number;
  /** Village id the hero lives in. */
  home: number;
  status: 'home' | 'moving' | 'adventure' | 'raid' | 'dead';
  /** Travel to/from an adventure. */
  trip: { kind: 'adventure' | 'return'; target: number; remaining: number; total: number } | null;
  /** Adventure the hero is standing at (waiting to be played). */
  at: number | null;
  /** Seconds until an adventure the hero waits at resolves itself. */
  autoIn: number;
  equipped: Partial<Record<'helmet' | 'armor' | 'weapon' | 'boots' | 'horse' | 'amulet', number>>;
  bag: HeroItem[];
  nextUid: number;
  adventures: Adventure[];
  nextAdventureId: number;
  /** Seconds until the next adventure appears. */
  adventureIn: number;
  /** Seconds until revived (while dead). */
  revive: number;
  /** Rift combat style (starting weapon). */
  style: string;
}

/** Motivation layer: daily streak, Ruhmesleiter, Chronik, unlocked avatars. */
export interface ProgressState {
  /** Day key of the last claimed daily reward. */
  lastDaily: string;
  streak: number;
  dailyTotal: number;
  passClaimed: number[];
  /** Index of the current Chronik step. */
  chronicle: number;
  avatars: string[];
  /** Sammelbuch: every item id ever obtained. */
  found: string[];
  /** Claimed Sammelbuch sets. */
  sets: string[];
  /** Chosen title: id of an unlocked achievement ('' = none). */
  title: string;
  /** Chosen portrait frame (`FRAMES` id, '' = default). */
  frame: string;
  /** Inselschmuck the player switched off (unlocked pieces show by default). */
  decorHidden: string[];
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
  weekly: WeeklyState;
  /** Relikte found in runs (Phase 24). */
  relics: string[];
  /** Flüche chosen for the next runs. */
  curses: string[];
  daily: DailyRiftState;
}

/** Tagesriss: today's attempts and best result; the first finished run of a day pays a bonus. */
export interface DailyRiftState {
  day: string;
  attempts: number;
  bestTime: number;
  bestKills: number;
  claimed: boolean;
  /** Lifetime days with a finished daily run. */
  days: number;
}

/** Wochenboss: progress in the current week plus the lifetime count of weekly victories. */
export interface WeeklyState {
  week: string;
  attempts: number;
  won: boolean;
  bestTime: number;
  bestKills: number;
  wins: number;
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
  /** Prayer points and active prayers (faith in combat). */
  prayer: PrayerState;
  /** Saved equipment sets („Loadouts"), switched with one tap. */
  loadouts: Loadout[];
  /** Kopfgeldjagd: current contract, points, streak, blocked monsters. */
  slayer: SlayerState;
  /** Baukunst: island building id → level (0 = not built). */
  buildings: Record<string, number>;
  /** Beschwörung: the familiar at your side and its remaining seconds. */
  familiar: { id: string; remaining: number } | null;
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
  hero: HeroState;
  progress: ProgressState;
  rift: RiftState;
}

export const SAVE_VERSION = 13;

export function defaultSettings(): Settings {
  return {
    numberFormat: 'short',
    nerdMode: false,
    sound: true,
    chatter: true,
    graphics: 'auto',
    batteryMode: false,
    notifications: false,
    performance: 'auto',
    haptics: true,
    music: true,
    musicVolume: 0.5,
    textSize: 'normal',
    reduceMotion: false,
    highContrast: false,
    colorblind: false,
  };
}

export function defaultCombatSettings(): CombatSettings {
  return { training: 'style', autoEat: 0.5, food: null, spell: 'spark', potion: null };
}

export function defaultLoadouts(): Loadout[] {
  return ['⚔️ Nahkampf', '🏹 Fernkampf', '🪄 Magie'].map((name) => ({ name, gear: {} }));
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
    prayer: { points: 12, active: [] },
    loadouts: defaultLoadouts(),
    slayer: { task: null, points: 0, streak: 0, done: 0, blocked: [] },
    familiar: null,
    buildings: {},
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
    hero: defaultHero(),
    progress: {
      lastDaily: '',
      streak: 0,
      dailyTotal: 0,
      passClaimed: [],
      chronicle: 0,
      avatars: [],
      found: [],
      sets: [],
      title: '',
      frame: '',
      decorHidden: [],
    },
    rift: defaultRift(),
  };
}

export function defaultHero(): HeroState {
  return {
    name: 'Abenteurer·in',
    avatar: '🧑‍🚀',
    level: 1,
    xp: 0,
    points: 4,
    attrs: { power: 0, offense: 0, defense: 0, resources: 0 },
    health: 100,
    home: 1,
    status: 'home',
    trip: null,
    at: null,
    autoIn: 0,
    equipped: {},
    bag: [],
    nextUid: 1,
    adventures: [],
    nextAdventureId: 1,
    adventureIn: 60,
    revive: 0,
    style: 'farmer',
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
    weekly: { week: '', attempts: 0, won: false, bestTime: 0, bestKills: 0, wins: 0 },
    relics: [],
    curses: [],
    daily: { day: '', attempts: 0, bestTime: 0, bestKills: 0, claimed: false, days: 0 },
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
    combat: s.combat ? { ...s.combat, cooldowns: { ...s.combat.cooldowns } } : null,
    combatSettings: { ...s.combatSettings },
    prayer: { ...s.prayer, active: [...s.prayer.active] },
    loadouts: s.loadouts.map((l) => ({ ...l, gear: { ...l.gear } })),
    familiar: s.familiar ? { ...s.familiar } : null,
    buildings: { ...s.buildings },
    slayer: {
      ...s.slayer,
      task: s.slayer.task ? { ...s.slayer.task } : null,
      blocked: [...s.slayer.blocked],
    },
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
    hero: {
      ...s.hero,
      attrs: { ...s.hero.attrs },
      trip: s.hero.trip ? { ...s.hero.trip } : null,
      equipped: { ...s.hero.equipped },
      bag: s.hero.bag,
      adventures: s.hero.adventures.map((a) => ({ ...a })),
    },
    progress: { ...s.progress },
    rift: {
      ...s.rift,
      talents: { ...s.rift.talents },
      best: { ...s.rift.best },
      evolutions: [...s.rift.evolutions],
      weekly: { ...s.rift.weekly },
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
