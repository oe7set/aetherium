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
import { PETS, QUESTS } from '../data/meta';
import { LAWS } from '../data/prestige';
import { COLONY_BUILDINGS, FAME_TALENTS } from '../data/colony';
import { BOARD } from './colony/board';
import {
  defaultCombatSettings,
  defaultSettings,
  newGame,
  SAVE_VERSION,
  type CombatSettings,
  type ColonyMatch,
  type ColonyState,
  type CombatState,
  type GameState,
  type PrestigeState,
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
    colony: hydrateColony(data.colony, base.colony),
    combatSettings: {
      ...defaultCombatSettings(),
      ...(isRecord(data.combatSettings) ? (data.combatSettings as Partial<CombatSettings>) : {}),
    },
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

function hydrateColony(v: unknown, fallback: ColonyState): ColonyState {
  if (!isRecord(v)) return fallback;
  const num = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
  const talents = Object.fromEntries(
    Object.entries(numberRecord(v.talents)).filter(([id]) => FAME_TALENTS.some((t) => t.id === id)),
  );
  return {
    match: hydrateMatch(v.match),
    fame: Math.max(0, num(v.fame, 0)),
    fameTotal: Math.max(0, num(v.fameTotal, 0)),
    talents,
    wins: num(v.wins, 0),
    matches: num(v.matches, 0),
    nextRoll: Math.max(0, num(v.nextRoll, fallback.nextRoll)),
    nextOfferId: num(v.nextOfferId, 1),
  };
}

/** A saved match is only kept if its shape is intact; otherwise it is discarded (fresh board). */
function hydrateMatch(v: unknown): ColonyMatch | null {
  const strings = (x: unknown) =>
    Array.isArray(x) ? x.filter((y): y is string => typeof y === 'string') : [];
  if (!isRecord(v) || !Array.isArray(v.players) || !Array.isArray(v.terrain)) return null;
  if (v.terrain.length !== BOARD.hexes.length || v.players.length < 2) return null;
  if (!['setup', 'running', 'finished'].includes(v.phase as string)) return null;
  const nums = (x: unknown) =>
    Array.isArray(x) ? x.filter((n): n is number => typeof n === 'number') : [];
  const players = v.players.filter(isRecord).map((p) => ({
    persona: typeof p.persona === 'string' ? p.persona : 'you',
    res: {
      wood: 0,
      brick: 0,
      wool: 0,
      grain: 0,
      ore: 0,
      ...numberRecord(p.res),
    } as ColonyMatch['players'][number]['res'],
    settlements: nums(p.settlements),
    cities: nums(p.cities),
    roads: nums(p.roads),
    devHand: strings(p.devHand),
    knights: typeof p.knights === 'number' ? p.knights : 0,
    victoryCards: typeof p.victoryCards === 'number' ? p.victoryCards : 0,
  }));
  if (players.length !== v.players.length) return null;
  const buildings: Record<string, string[]> = {};
  if (isRecord(v.buildings))
    for (const [k, list] of Object.entries(v.buildings))
      buildings[k] = strings(list).filter((id) => COLONY_BUILDINGS.some((b) => b.id === id));
  const optIndex = (x: unknown) => (typeof x === 'number' ? x : null);
  const roll = nums(v.lastRoll);
  return {
    seed: typeof v.seed === 'number' ? v.seed : 0,
    terrain: strings(v.terrain),
    numbers: Array.isArray(v.numbers)
      ? v.numbers.map((n) => (typeof n === 'number' ? n : null))
      : [],
    harbors: Array.isArray(v.harbors)
      ? v.harbors.filter(isRecord).map((h) => ({
          edge: typeof h.edge === 'number' ? h.edge : 0,
          kind: typeof h.kind === 'string' ? h.kind : 'any',
        }))
      : [],
    robber: typeof v.robber === 'number' ? v.robber : 0,
    players,
    deck: strings(v.deck),
    phase: v.phase as ColonyMatch['phase'],
    setupQueue: nums(v.setupQueue),
    setupVertex: optIndex(v.setupVertex),
    rolls: typeof v.rolls === 'number' ? v.rolls : 0,
    lastRoll: roll.length === 2 ? [roll[0]!, roll[1]!] : null,
    turn: typeof v.turn === 'number' ? v.turn : 0,
    longestRoad: optIndex(v.longestRoad),
    largestArmy: optIndex(v.largestArmy),
    offers: Array.isArray(v.offers)
      ? v.offers
          .filter(isRecord)
          .filter((o) => typeof o.id === 'number')
          .map((o) => o as unknown as ColonyMatch['offers'][number])
      : [],
    winner: optIndex(v.winner),
    buildings,
    freeRoads: typeof v.freeRoads === 'number' ? v.freeRoads : 0,
    robberMode: v.robberMode === true,
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
  return v.map((p) =>
    isRecord(p) && typeof p.seed === 'string' && CROP_MAP.has(p.seed)
      ? { seed: p.seed, elapsed: typeof p.elapsed === 'number' ? p.elapsed : 0 }
      : { seed: null, elapsed: 0 },
  );
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
