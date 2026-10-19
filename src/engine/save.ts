import Decimal from 'break_eternity.js';
import {
  ACHIEVEMENT_MAP,
  ACTION_MAP,
  BUFF_MAP,
  CROP_MAP,
  DUNGEON_MAP,
  ELEMENT_MAP,
  HELPER_MAP,
  ITEM_MAP,
  MONSTER_MAP,
  TECH_MAP,
  TOOL_MAP,
} from '../data';
import { SPELL_MAP } from '../data/spells';
import { PRAYER_MAP } from '../data/prayers';
import { FAMILIAR_MAP } from '../data/summoning';
import { UTILITY_MAP } from '../data/magic';
import { ISLAND_BUILDING_MAP } from '../data/construction';
import { COLLECTION_MAP } from '../data/collections';
import { DECOR_MAP, FRAME_MAP } from '../data/progress';
import { PETS, QUESTS } from '../data/meta';
import { LAWS } from '../data/prestige';
import { TROOPS, VALLEYS, V_BUILDINGS } from '../data/village';
import { HERO_ITEMS, HERO_SLOTS, type HeroSlot } from '../data/hero';
import { BIOMES, HEROES, RIFT_TALENTS, RIFT_WEAPONS } from '../data/rift';
import { createVillage } from './villageWorld';
import {
  defaultCombatSettings,
  defaultLoadouts,
  defaultSettings,
  newGame,
  SAVE_VERSION,
  type CombatSettings,
  type Loadout,
  type SlayerState,
  type PrayerState,
  type Village,
  type VillageState,
  type CombatState,
  type GameState,
  type HeroState,
  type PrestigeState,
  type RiftState,
} from './state';

/** Shape stored in localStorage / export strings. */
export interface SaveEnvelope {
  v: number;
  savedAt: number;
  data: Record<string, unknown>;
}

/**
 * Migration from version N to N+1, keyed by N. Each receives the raw data object of version N.
 * Never edit an existing migration after release – add a new one and bump SAVE_VERSION.
 */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

export const MIGRATIONS: Record<number, Migration> = {
  // 0 → 1: pre-release prototype saves stored gold as a number and had no inventory slots.
  0: (data) => ({
    ...data,
    gold: String(data.gold ?? 0),
    inventorySlots: data.inventorySlots ?? 20,
  }),
  // 1 → 2 (Phase 3): market, achievements and buffs.
  1: (data) => ({
    ...data,
    market: data.market ?? { mults: {}, trend: null, nextTrend: 120 },
    achievements: data.achievements ?? [],
    buffs: data.buffs ?? [],
    nextLucky: data.nextLucky ?? 240,
  }),
  // 2 → 3 (Phase 4): combat. Existing players get the 10 starting hit points.
  2: (data) => {
    const skills = (isRecord(data.skills) ? data.skills : {}) as Record<string, unknown>;
    return {
      ...data,
      skills: { ...skills, hitpoints: skills.hitpoints ?? { xp: 1154 } },
      hp: 10,
      equipment: {},
      combat: null,
    };
  },
  // 3 → 4 (Phase 5): research, tech tree, codex, farming plots, helpers.
  3: (data) => ({ ...data, research: 0, techs: [], codex: [], plots: [], helpers: [] }),
  // 4 → 5 (Phase 6): prestige layers. Existing XP counts towards the first rebirth.
  4: (data) => ({ ...data, prestige: null }),
  // 5 → 6 (Phase 7): pets, quests, daily/weekly tasks.
  5: (data) => ({ ...data, pets: [], quests: null, tasks: null }),
  // 6 → 7 (Phase 9): the colony (Catan-like board game with Siedler chains).
  6: (data) => ({ ...data, colony: null }),
  // 7 → 8 (Phase 10): Ätherriss meta progression.
  7: (data) => ({ ...data, rift: null }),
  // 8 → 9: the Catan colony is replaced by the Travian-like village.
  8: (data) => {
    const rest = { ...data };
    delete rest.colony;
    return { ...rest, village: null };
  },
  // 9 → 10: the one hero (village + rift).
  9: (data) => ({ ...data, hero: null }),
  // 10 → 11: daily rewards, Ruhmesleiter, Chronik.
  10: (data) => ({ ...data, progress: null }),
  // 11 → 12: Sammelbuch – everything currently owned counts as found.
  11: (data) => {
    const progress = isRecord(data.progress) ? data.progress : {};
    const owned = [
      ...(isRecord(data.inventory) ? Object.keys(data.inventory) : []),
      ...(isRecord(data.stats)
        ? Object.keys(data.stats)
            .filter((k) => k.startsWith('obtained.'))
            .map((k) => k.slice('obtained.'.length))
        : []),
      ...(isRecord(data.equipment)
        ? Object.values(data.equipment).filter((x): x is string => typeof x === 'string')
        : []),
    ];
    const found = [...new Set(owned)];
    const stats = isRecord(data.stats) ? { ...data.stats, albumItems: found.length } : data.stats;
    return { ...data, stats, progress: { ...progress, found, sets: [] } };
  },
  // 12 → 13: Wochenboss (hydrate fills the defaults).
  12: (data) => data,
};

export const EXPORT_PREFIX = 'AETH1:';

export class SaveError extends Error {}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Converts the live state into a plain JSON-friendly object. */
export function serialize(s: GameState, now: number = Date.now()): SaveEnvelope {
  const { gold, ...rest } = s;
  return { v: SAVE_VERSION, savedAt: now, data: { ...rest, gold: gold.toString() } };
}

/** Runs all migrations from `fromVersion` up to `SAVE_VERSION`. */
export function migrate(
  data: Record<string, unknown>,
  fromVersion: number,
  migrations: Record<number, Migration> = MIGRATIONS,
  targetVersion: number = SAVE_VERSION,
): Record<string, unknown> {
  if (fromVersion > targetVersion) {
    throw new SaveError(
      `Spielstand-Version ${fromVersion} ist neuer als dieses Spiel (${targetVersion}). Bitte Seite neu laden.`,
    );
  }
  let current = data;
  for (let v = fromVersion; v < targetVersion; v++) {
    const step = migrations[v];
    if (!step) throw new SaveError(`Keine Migration von Version ${v} verfügbar.`);
    current = step(current);
  }
  return current;
}

function numberRecord(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isRecord(v)) return out;
  for (const [k, n] of Object.entries(v))
    if (typeof n === 'number' && Number.isFinite(n)) out[k] = n;
  return out;
}

function stringRecord(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isRecord(v)) return out;
  for (const [k, n] of Object.entries(v)) if (typeof n === 'string') out[k] = n;
  return out;
}

/**
 * Builds a valid GameState from migrated data. Unknown/missing fields fall back to a fresh game,
 * so adding new state fields never breaks old saves.
 */
export function hydrate(data: Record<string, unknown>, now: number = Date.now()): GameState {
  const base = newGame(now);
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;

  const skills = { ...base.skills };
  if (isRecord(data.skills)) {
    for (const [id, entry] of Object.entries(data.skills)) {
      if (isRecord(entry)) skills[id] = { xp: Math.max(0, num(entry.xp, 0)) };
    }
  }

  let active: GameState['active'] = null;
  if (
    isRecord(data.active) &&
    typeof data.active.actionId === 'string' &&
    ACTION_MAP.has(data.active.actionId)
  ) {
    active = {
      actionId: data.active.actionId,
      progress: Math.max(0, num(data.active.progress, 0)),
    };
  }

  const ownedTools = Array.isArray(data.ownedTools)
    ? data.ownedTools.filter((t): t is string => typeof t === 'string' && TOOL_MAP.has(t))
    : base.ownedTools;

  // Content can be removed between versions: drop references that no longer resolve.
  const inventory = Object.fromEntries(
    Object.entries(numberRecord(data.inventory)).filter(([id, qty]) => ITEM_MAP.has(id) && qty > 0),
  );
  const equippedTools = Object.fromEntries(
    Object.entries(stringRecord(data.equippedTools)).filter(([, id]) => TOOL_MAP.has(id)),
  );

  const settings = { ...defaultSettings(), ...(isRecord(data.settings) ? data.settings : {}) };

  return {
    ...base,
    createdAt: num(data.createdAt, base.createdAt),
    lastUpdate: num(data.lastUpdate, base.lastUpdate),
    gold: new Decimal(
      typeof data.gold === 'string' || typeof data.gold === 'number' ? data.gold : 0,
    ),
    skills,
    inventory,
    inventorySlots: num(data.inventorySlots, base.inventorySlots),
    ownedTools: Array.from(new Set([...base.ownedTools, ...ownedTools])),
    equippedTools: { ...base.equippedTools, ...equippedTools },
    active,
    fire: Math.max(0, num(data.fire, 0)),
    intelligence: Math.max(0, num(data.intelligence, 0)),
    stats: numberRecord(data.stats),
    settings: settings as GameState['settings'],
    market: hydrateMarket(data.market, base.market),
    nextLucky: Math.max(1, num(data.nextLucky, base.nextLucky)),
    hp: Math.max(1, num(data.hp, base.hp)),
    equipment: Object.fromEntries(
      Object.entries(stringRecord(data.equipment)).filter(([, id]) => ITEM_MAP.get(id)?.equip),
    ),
    combat: hydrateCombat(data.combat),
    research: Math.max(0, num(data.research, 0)),
    techs: stringArray(data.techs).filter((id) => TECH_MAP.has(id)),
    codex: stringArray(data.codex).filter((sym) => ELEMENT_MAP.has(sym)),
    plots: hydratePlots(data.plots, base.plots),
    helpers: Array.isArray(data.helpers)
      ? data.helpers
          .filter(
            (h): h is Record<string, unknown> =>
              isRecord(h) && typeof h.type === 'string' && HELPER_MAP.has(h.type),
          )
          .map((h) => ({
            type: h.type as string,
            actionId:
              typeof h.actionId === 'string' && ACTION_MAP.has(h.actionId) ? h.actionId : null,
            progress: num(h.progress, 0),
            done: num(h.done, 0),
          }))
      : [],
    prestige: hydratePrestige(data.prestige, base.prestige),
    pets: stringArray(data.pets).filter((id) => PETS.some((p) => p.id === id)),
    catState: data.catState === 'alive' || data.catState === 'ghost' ? data.catState : 'unknown',
    quests: hydrateQuests(data.quests),
    tasks: hydrateTasks(data.tasks, base.tasks),
    village: hydrateVillage(data.village, base.village),
    rift: hydrateRift(data.rift, base.rift),
    hero: hydrateHero(data.hero, base.hero),
    progress: hydrateProgress(data.progress, base.progress),
    combatSettings: hydrateCombatSettings(data.combatSettings),
    prayer: hydratePrayer(data.prayer, base.prayer),
    loadouts: hydrateLoadouts(data.loadouts),
    slayer: hydrateSlayer(data.slayer, base.slayer),
    buildings: Object.fromEntries(
      Object.entries(isRecord(data.buildings) ? data.buildings : {}).flatMap(([id, lvl]) => {
        const def = ISLAND_BUILDING_MAP.get(id);
        return def && typeof lvl === 'number' && lvl > 0
          ? [[id, Math.min(def.levels.length, Math.floor(lvl))]]
          : [];
      }),
    ),
    familiar:
      isRecord(data.familiar) &&
      typeof data.familiar.id === 'string' &&
      FAMILIAR_MAP.has(data.familiar.id) &&
      typeof data.familiar.remaining === 'number' &&
      data.familiar.remaining > 0
        ? { id: data.familiar.id, remaining: data.familiar.remaining }
        : null,
    achievements: stringArray(data.achievements).filter((id) => ACHIEVEMENT_MAP.has(id)),
    buffs: Array.isArray(data.buffs)
      ? data.buffs.filter(
          (b): b is { id: string; remaining: number } =>
            isRecord(b) &&
            typeof b.id === 'string' &&
            BUFF_MAP.has(b.id) &&
            typeof b.remaining === 'number',
        )
      : [],
  };
}

function hydrateProgress(v: unknown, fallback: GameState['progress']): GameState['progress'] {
  if (!isRecord(v)) return fallback;
  const num = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
  return {
    lastDaily: typeof v.lastDaily === 'string' ? v.lastDaily : '',
    streak: Math.max(0, num(v.streak, 0)),
    dailyTotal: Math.max(0, num(v.dailyTotal, 0)),
    passClaimed: Array.isArray(v.passClaimed)
      ? v.passClaimed.filter((n): n is number => typeof n === 'number')
      : [],
    chronicle: Math.max(0, num(v.chronicle, 0)),
    avatars: stringArray(v.avatars),
    found: stringArray(v.found).filter((id) => ITEM_MAP.has(id)),
    sets: stringArray(v.sets).filter((id) => COLLECTION_MAP.has(id)),
    title: typeof v.title === 'string' && ACHIEVEMENT_MAP.has(v.title) ? v.title : '',
    frame: typeof v.frame === 'string' && FRAME_MAP.has(v.frame) ? v.frame : '',
    decorHidden: stringArray(v.decorHidden).filter((id) => DECOR_MAP.has(id)),
  };
}

function hydrateHero(v: unknown, fallback: HeroState): HeroState {
  if (!isRecord(v)) return fallback;
  const num = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
  const attrs = numberRecord(v.attrs);
  const bag = Array.isArray(v.bag)
    ? v.bag
        .filter(isRecord)
        .filter((i) => HERO_ITEMS.some((d) => d.id === i.base))
        .map((i) => ({
          uid: num(i.uid, 0),
          base: String(i.base),
          tier: Math.max(1, Math.min(3, num(i.tier, 1))),
        }))
    : [];
  const equipped: HeroState['equipped'] = {};
  for (const [slot, uid] of Object.entries(numberRecord(v.equipped)))
    if (HERO_SLOTS.some((x) => x.id === slot) && bag.some((i) => i.uid === uid))
      equipped[slot as HeroSlot] = uid;
  const status = ['home', 'moving', 'adventure', 'raid', 'dead'].includes(v.status as string)
    ? (v.status as HeroState['status'])
    : 'home';
  const trip = isRecord(v.trip)
    ? {
        kind: (v.trip.kind === 'return' ? 'return' : 'adventure') as 'adventure' | 'return',
        target: num(v.trip.target, 0),
        remaining: Math.max(0, num(v.trip.remaining, 0)),
        total: num(v.trip.total, 1),
      }
    : null;
  return {
    ...fallback,
    name: typeof v.name === 'string' ? v.name.slice(0, 24) : fallback.name,
    avatar: typeof v.avatar === 'string' ? v.avatar : fallback.avatar,
    level: Math.max(1, num(v.level, 1)),
    xp: Math.max(0, num(v.xp, 0)),
    points: Math.max(0, num(v.points, 0)),
    attrs: {
      power: num(attrs.power, 0),
      offense: num(attrs.offense, 0),
      defense: num(attrs.defense, 0),
      resources: num(attrs.resources, 0),
    },
    health: Math.max(0, Math.min(100, num(v.health, 100))),
    home: num(v.home, fallback.home),
    // A hero on a raid is lost with the movement data – bring them home instead.
    status: status === 'raid' ? 'home' : status === 'moving' && !trip ? 'home' : status,
    trip: status === 'moving' ? trip : null,
    at: typeof v.at === 'number' ? v.at : null,
    autoIn: Math.max(0, num(v.autoIn, 0)),
    equipped,
    bag,
    nextUid: Math.max(num(v.nextUid, 1), ...bag.map((i) => i.uid + 1)),
    adventures: Array.isArray(v.adventures)
      ? v.adventures.filter(isRecord).map((a) => ({
          id: num(a.id, 0),
          x: num(a.x, 0),
          y: num(a.y, 0),
          biome: BIOMES.some((b) => b.id === a.biome) ? String(a.biome) : 'meadow',
          level: Math.max(1, num(a.level, 1)),
          hard: a.hard === true,
          name: typeof a.name === 'string' ? a.name : 'Abenteuer',
          expires: num(a.expires, 3600),
        }))
      : [],
    nextAdventureId: num(v.nextAdventureId, 1),
    adventureIn: Math.max(0, num(v.adventureIn, fallback.adventureIn)),
    revive: num(v.revive, 0),
    style: typeof v.style === 'string' && HEROES.some((h) => h.id === v.style) ? v.style : 'farmer',
  };
}

function hydrateRift(v: unknown, fallback: RiftState): RiftState {
  if (!isRecord(v)) return fallback;
  const num = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
  const best: RiftState['best'] = {};
  if (isRecord(v.best))
    for (const [id, b] of Object.entries(v.best))
      if (isRecord(b) && BIOMES.some((x) => x.id === id))
        best[id] = { time: num(b.time, 0), kills: num(b.kills, 0), level: num(b.level, 0) };
  return {
    essence: Math.max(0, num(v.essence, 0)),
    essenceTotal: Math.max(0, num(v.essenceTotal, 0)),
    talents: Object.fromEntries(
      Object.entries(numberRecord(v.talents)).filter(([id]) =>
        RIFT_TALENTS.some((t) => t.id === id),
      ),
    ),
    runs: num(v.runs, 0),
    wins: num(v.wins, 0),
    best,
    evolutions: stringArray(v.evolutions).filter((id) => RIFT_WEAPONS.some((w) => w.id === id)),
    hero:
      typeof v.hero === 'string' && HEROES.some((h) => h.id === v.hero) ? v.hero : fallback.hero,
    biome:
      typeof v.biome === 'string' && BIOMES.some((b) => b.id === v.biome)
        ? v.biome
        : fallback.biome,
    echo: Math.max(0, num(v.echo, fallback.echo)),
    weekly: hydrateWeekly(v.weekly, fallback.weekly),
  };
}

function hydrateWeekly(v: unknown, fallback: RiftState['weekly']): RiftState['weekly'] {
  if (!isRecord(v)) return { ...fallback };
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, x) : 0);
  return {
    week: typeof v.week === 'string' ? v.week : '',
    attempts: num(v.attempts),
    won: v.won === true,
    bestTime: num(v.bestTime),
    bestKills: num(v.bestKills),
    wins: num(v.wins),
  };
}

function hydrateResearch(x: unknown): Village['research'] {
  if (!isRecord(x) || !TROOPS.some((t) => t.id === x.troop)) return null;
  const num = (y: unknown, d: number) => (typeof y === 'number' && Number.isFinite(y) ? y : d);
  return { troop: String(x.troop), remaining: num(x.remaining, 0), total: num(x.total, 1) };
}

function hydrateVillage(v: unknown, fallback: VillageState): VillageState {
  if (!isRecord(v) || !Array.isArray(v.villages)) return fallback;
  const num = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
  const res = (x: unknown) => {
    const r = numberRecord(x);
    return {
      wood: num(r.wood, 0),
      clay: num(r.clay, 0),
      iron: num(r.iron, 0),
      crop: num(r.crop, 0),
    };
  };
  const troops = (x: unknown) =>
    Object.fromEntries(
      Object.entries(numberRecord(x)).filter(([id, n]) => TROOPS.some((t) => t.id === id) && n > 0),
    );
  const queue = (x: unknown) =>
    Array.isArray(x)
      ? x.filter(isRecord).map((q) => ({
          key: String(q.key ?? ''),
          level: num(q.level, 1),
          remaining: Math.max(0, num(q.remaining, 0)),
          total: num(q.total, 1),
        }))
      : [];
  const villages: Village[] = v.villages.filter(isRecord).map((x, i) => {
    const layout = typeof x.layout === 'string' && VALLEYS[x.layout] ? x.layout : 'standard';
    const base = createVillage(
      num(x.id, i + 1),
      typeof x.name === 'string' ? x.name : `Dorf ${i + 1}`,
      num(x.x, 0),
      num(x.y, 0),
      layout,
      x.capital === true,
    );
    const fields = Array.isArray(x.fields) ? x.fields.map((f) => num(f, 0)) : base.fields;
    const q = isRecord(x.queue) ? x.queue : {};
    return {
      ...base,
      fields: base.fields.map((_, j) => fields[j] ?? 0),
      buildings: Object.fromEntries(
        Object.entries(numberRecord(x.buildings)).filter(([id]) =>
          V_BUILDINGS.some((b) => b.id === id),
        ),
      ),
      res: isRecord(x.res) ? res(x.res) : base.res,
      queue: {
        field: queue(q.field),
        center: queue(q.center).filter((it) => V_BUILDINGS.some((b) => b.id === it.key)),
      },
      training: Array.isArray(x.training)
        ? x.training
            .filter(isRecord)
            .filter((t) => TROOPS.some((d) => d.id === t.troop))
            .map((t) => ({
              troop: String(t.troop),
              count: num(t.count, 0),
              each: num(t.each, 1),
              progress: num(t.progress, 0),
            }))
        : [],
      troops: troops(x.troops),
      research: hydrateResearch(x.research),
      celebration: isRecord(x.celebration)
        ? { remaining: num(x.celebration.remaining, 0), cp: num(x.celebration.cp, 0) }
        : null,
      oases: stringArray(x.oases),
    };
  });
  if (!villages.length) return fallback;
  // The world (targets/sites) is regenerated from the fallback and patched with saved progress.
  const targets = fallback.targets.map((t) => {
    const saved = Array.isArray(v.targets)
      ? v.targets.filter(isRecord).find((x) => x.id === t.id)
      : undefined;
    if (!saved) return t;
    return {
      ...t,
      defense: Math.min(t.maxDefense, Math.max(0, num(saved.defense, t.defense))),
      stock: isRecord(saved.stock) ? res(saved.stock) : t.stock,
      owner:
        typeof saved.owner === 'number' && villages.some((vl) => vl.id === saved.owner)
          ? saved.owner
          : null,
    };
  });
  const sites = Array.isArray(v.sites)
    ? fallback.sites.filter((st) =>
        (v.sites as unknown[]).some((x) => isRecord(x) && x.id === st.id),
      )
    : fallback.sites;
  const movements = Array.isArray(v.movements)
    ? v.movements
        .filter(isRecord)
        .filter((m) => ['raid', 'return', 'settle', 'trade'].includes(m.kind as string))
        .map((m) => ({
          id: num(m.id, 0),
          kind: m.kind as 'raid' | 'return' | 'settle' | 'trade',
          from: num(m.from, villages[0]!.id),
          target: String(m.target ?? ''),
          troops: troops(m.troops),
          res: res(m.res),
          remaining: Math.max(0, num(m.remaining, 0)),
          total: num(m.total, 1),
        }))
    : [];
  return {
    ...fallback,
    villages,
    active: villages.some((vl) => vl.id === v.active) ? (v.active as number) : villages[0]!.id,
    researched: stringArray(v.researched).filter((id) => TROOPS.some((t) => t.id === id)),
    cp: Math.max(0, num(v.cp, 0)),
    cpTotal: Math.max(0, num(v.cpTotal, 0)),
    targets,
    sites,
    movements,
    reports: Array.isArray(v.reports)
      ? (v.reports.filter(isRecord) as unknown as VillageState['reports']).slice(0, 30)
      : [],
    unread: num(v.unread, 0),
    nextId: Math.max(num(v.nextId, 2), ...villages.map((vl) => vl.id + 1)),
    protection: Math.max(0, num(v.protection, fallback.protection)),
    invasionIn: Math.max(0, num(v.invasionIn, fallback.invasionIn)),
    invasionsWon: num(v.invasionsWon, 0),
    invasionsLost: num(v.invasionsLost, 0),
    clock: num(v.clock, 0),
  };
}

function hydrateQuests(v: unknown): GameState['quests'] {
  if (!isRecord(v)) return { active: {}, done: [] };
  const active: Record<string, Record<string, number>> = {};
  if (isRecord(v.active)) {
    for (const [id, baseline] of Object.entries(v.active)) {
      if (QUESTS.some((q) => q.id === id)) active[id] = numberRecord(baseline);
    }
  }
  return { active, done: stringArray(v.done).filter((id) => QUESTS.some((q) => q.id === id)) };
}

function hydrateTasks(v: unknown, fallback: GameState['tasks']): GameState['tasks'] {
  if (!isRecord(v) || !Array.isArray(v.list)) return fallback;
  const list = v.list
    .filter(
      (t): t is Record<string, unknown> =>
        isRecord(t) && typeof t.id === 'string' && typeof t.stat === 'string',
    )
    .map((t) => ({
      id: t.id as string,
      template: typeof t.template === 'string' ? t.template : '',
      period: (t.period === 'week' ? 'week' : 'day') as 'day' | 'week',
      stat: t.stat as string,
      target: typeof t.target === 'number' ? t.target : 1,
      baseline: typeof t.baseline === 'number' ? t.baseline : 0,
      claimed: t.claimed === true,
    }));
  return {
    day: typeof v.day === 'string' ? v.day : '',
    week: typeof v.week === 'string' ? v.week : '',
    list,
  };
}

function hydratePrestige(v: unknown, fallback: PrestigeState): PrestigeState {
  if (!isRecord(v)) return fallback;
  const n = (x: unknown, d = 0) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
  return {
    wisdom: Math.max(0, n(v.wisdom)),
    wisdomTotal: Math.max(0, n(v.wisdomTotal)),
    rebirths: n(v.rebirths),
    upgrades: numberRecord(v.upgrades),
    paradigms: n(v.paradigms),
    laws: stringArray(v.laws).filter((id) => LAWS.some((l) => l.id === id)),
    bigBangs: n(v.bigBangs),
    shards: n(v.shards),
    multiverse: numberRecord(v.multiverse),
    runBaseXp: n(v.runBaseXp, fallback.runBaseXp),
    runStartedAt: n(v.runStartedAt, fallback.runStartedAt),
  };
}

function hydratePlots(v: unknown, fallback: GameState['plots']): GameState['plots'] {
  if (!Array.isArray(v) || v.length === 0) return fallback;
  return v.map((p) => {
    const plot: GameState['plots'][number] =
      isRecord(p) && typeof p.seed === 'string' && CROP_MAP.has(p.seed)
        ? { seed: p.seed, elapsed: typeof p.elapsed === 'number' ? p.elapsed : 0 }
        : { seed: null, elapsed: 0 };
    if (isRecord(p) && p.next === null) plot.next = null;
    else if (isRecord(p) && typeof p.next === 'string' && CROP_MAP.has(p.next)) plot.next = p.next;
    return plot;
  });
}

function hydrateCombatSettings(v: unknown): CombatSettings {
  const merged: CombatSettings = {
    ...defaultCombatSettings(),
    ...(isRecord(v) ? (v as Partial<CombatSettings>) : {}),
  };
  if (typeof merged.spell !== 'string' || !SPELL_MAP.has(merged.spell)) merged.spell = 'spark';
  if (merged.potion !== null && !(typeof merged.potion === 'string' && ITEM_MAP.has(merged.potion)))
    merged.potion = null;
  return merged;
}

function hydratePrayer(v: unknown, fallback: PrayerState): PrayerState {
  if (!isRecord(v)) return fallback;
  const points =
    typeof v.points === 'number' && Number.isFinite(v.points) ? Math.max(0, v.points) : 0;
  return { points, active: stringArray(v.active).filter((id) => PRAYER_MAP.has(id)) };
}

function hydrateSlayer(v: unknown, fallback: SlayerState): SlayerState {
  if (!isRecord(v)) return fallback;
  const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, x) : 0);
  const t = v.task;
  const task =
    isRecord(t) && typeof t.monster === 'string' && MONSTER_MAP.has(t.monster) && n(t.left) > 0
      ? { monster: t.monster, left: Math.floor(n(t.left)), total: Math.floor(n(t.total)) }
      : null;
  return {
    task,
    points: n(v.points),
    streak: n(v.streak),
    done: n(v.done),
    blocked: stringArray(v.blocked).filter((id) => MONSTER_MAP.has(id)),
  };
}

function hydrateLoadouts(v: unknown): Loadout[] {
  const base = defaultLoadouts();
  if (!Array.isArray(v)) return base;
  return base.map((def, i) => {
    const l: unknown = v[i];
    if (!isRecord(l)) return def;
    const gear = Object.fromEntries(
      Object.entries(stringRecord(l.gear)).filter(([, id]) => ITEM_MAP.get(id)?.equip),
    );
    return {
      name: typeof l.name === 'string' && l.name ? l.name.slice(0, 24) : def.name,
      gear,
      spell: typeof l.spell === 'string' && SPELL_MAP.has(l.spell) ? l.spell : undefined,
    };
  });
}

function hydrateCombat(v: unknown): CombatState | null {
  if (
    !isRecord(v) ||
    (v.kind !== 'monster' && v.kind !== 'dungeon') ||
    typeof v.target !== 'string'
  )
    return null;
  const known = v.kind === 'monster' ? MONSTER_MAP.has(v.target) : DUNGEON_MAP.has(v.target);
  if (!known || typeof v.monster !== 'string' || !MONSTER_MAP.has(v.monster)) return null;
  const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
  return {
    kind: v.kind,
    target: v.target,
    index: n(v.index),
    monster: v.monster,
    monsterHp: n(v.monsterHp),
    phase: n(v.phase),
    respawn: n(v.respawn),
    playerTimer: n(v.playerTimer),
    monsterTimer: n(v.monsterTimer),
    energy: Math.min(100, n(v.energy)),
    swings: n(v.swings),
    windup: v.windup === true,
    dodged: v.dodged === true,
    weaken: n(v.weaken),
    curse: n(v.curse),
    shield: n(v.shield),
    cooldowns: Object.fromEntries(
      Object.entries(isRecord(v.cooldowns) ? v.cooldowns : {}).filter(
        ([id, t]) => UTILITY_MAP.has(id) && typeof t === 'number' && t > 0,
      ),
    ) as Record<string, number>,
  };
}

function stringArray(v: unknown): string[] {
  return Array.isArray(v)
    ? Array.from(new Set(v.filter((x): x is string => typeof x === 'string')))
    : [];
}

function hydrateMarket(v: unknown, fallback: GameState['market']): GameState['market'] {
  if (!isRecord(v)) return fallback;
  const mults = Object.fromEntries(
    Object.entries(numberRecord(v.mults)).filter(([id, m]) => ITEM_MAP.has(id) && m > 0),
  );
  const t = v.trend;
  const trend =
    isRecord(t) &&
    typeof t.item === 'string' &&
    ITEM_MAP.has(t.item) &&
    typeof t.mult === 'number' &&
    typeof t.remaining === 'number'
      ? { item: t.item, mult: t.mult, remaining: t.remaining }
      : null;
  return {
    mults,
    trend,
    nextTrend: typeof v.nextTrend === 'number' ? v.nextTrend : fallback.nextTrend,
  };
}

export function deserialize(envelope: unknown, now: number = Date.now()): GameState {
  if (!isRecord(envelope) || typeof envelope.v !== 'number' || !isRecord(envelope.data)) {
    throw new SaveError('Ungültiger Spielstand.');
  }
  return hydrate(migrate(envelope.data, envelope.v), now);
}

// --- Base64 export/import (UTF-8 safe) -----------------------------------------

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function exportSave(s: GameState, now: number = Date.now()): string {
  return EXPORT_PREFIX + toBase64(JSON.stringify(serialize(s, now)));
}

export function importSave(text: string, now: number = Date.now()): GameState {
  const trimmed = text.trim();
  const payload = trimmed.startsWith(EXPORT_PREFIX) ? trimmed.slice(EXPORT_PREFIX.length) : trimmed;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64(payload));
  } catch {
    throw new SaveError('Das sieht nicht nach einem Aetherium-Spielstand aus.');
  }
  return deserialize(parsed, now);
}
