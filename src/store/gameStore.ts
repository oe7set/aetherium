import Decimal from 'break_eternity.js';
import { create } from 'zustand';
import { getAction, getItem, getTool } from '../data';
import { BALANCE } from '../data/balance';
import {
  RANDOM_CHATTER,
  WELCOME_LINES,
  BUY_LINES,
  SELL_LINES,
  TOOL_LINES,
  SLOT_LINES,
} from '../data/flavor';
import {
  advance,
  bestAvailableAction,
  applyOfflineProgress,
  buyItem,
  buySlot,
  buyTool,
  clickAction,
  cloneState,
  defaultRng,
  equipTool,
  exportSave,
  flavor,
  importSave,
  newGame,
  sellItem,
  startAction,
  stopAction,
  summaryHasContent,
  consumeItem,
  xpForLevel,
  type GameEvent,
  type GameState,
  type ProgressSummary,
  type Settings,
  type ShopResult,
} from '../engine';
import { t, type MessageKey } from '../i18n';
import { translateEvents, type FeedEntry, type FeedKind, type Popup } from './feed';
import { clearStorage, loadFromStorage, saveToStorage } from './persistence';

export type TabId = 'world' | 'skills' | 'inventory' | 'research' | 'menu';
export type InventorySegment = 'items' | 'shop' | 'tools';

const FEED_LIMIT = 60;
const POPUP_LIMIT = 8;
const POPUP_LIFETIME_MS = 1400;
/** Chance per second for a random chatter line. */
const CHATTER_PER_SECOND = 1 / 90;

export interface UiState {
  tab: TabId;
  selectedSkill: string;
  /** Mobile: skill detail view open inside the Skills sheet. */
  skillDetail: boolean;
  inventorySegment: InventorySegment;
  selectedItem: string | null;
}

export interface GameStore {
  game: GameState;
  feed: FeedEntry[];
  popups: Popup[];
  levelUp: { skill: string; level: number; at: number } | null;
  offlineSummary: ProgressSummary | null;
  lastSavedAt: number | null;
  /** performance.now() of the last simulation tick, for smooth progress interpolation. */
  lastTickAt: number;
  ui: UiState;

  tick: (dtSeconds: number) => void;
  catchUp: (now: number) => void;
  start: (actionId: string) => void;
  stop: () => void;
  click: () => void;
  sell: (item: string, qty: number) => void;
  buy: (item: string, qty: number) => void;
  buyTool: (toolId: string) => void;
  equipTool: (toolId: string) => void;
  buySlot: () => void;
  use: (item: string) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setUi: (patch: Partial<UiState>) => void;
  openSkill: (skill: string) => void;
  /** World tap on a station: start the best doable action of that skill, else open the skill. */
  tapStation: (skill: string) => void;
  dismissOffline: () => void;
  dismissLevelUp: () => void;
  save: () => void;
  exportString: () => string;
  importString: (text: string) => void;
  hardReset: () => void;
  pushFeed: (text: string, kind?: FeedKind) => void;

  // Dev-only helpers (Debug panel)
  debugAdvance: (seconds: number) => void;
  debugGive: (item: string, qty: number) => void;
  debugSetLevel: (skill: string, level: number) => void;
  debugGold: (amount: number) => void;
}

let nextId = 1;

function initialGame(): { game: GameState; summary: ProgressSummary | null } {
  const now = Date.now();
  const loaded = loadFromStorage(now);
  if (!loaded) return { game: newGame(now), summary: null };
  const summary = applyOfflineProgress(loaded, now, defaultRng);
  const show =
    summary.elapsedSeconds >= BALANCE.OFFLINE_SUMMARY_MIN_SECONDS && summaryHasContent(summary);
  return { game: loaded, summary: show ? summary : null };
}

const boot = initialGame();
const isFirstStart = boot.game.createdAt === boot.game.lastUpdate && !boot.game.active;

export const useGame = create<GameStore>()((set, get) => {
  /** Runs a mutation on a copy of the game state and folds resulting events into the UI. */
  const mutate = (fn: (s: GameState, emit: (e: GameEvent) => void) => void): void => {
    const events: GameEvent[] = [];
    const next = cloneState(get().game);
    fn(next, (e) => events.push(e));
    next.lastUpdate = Date.now();
    applyEvents(next, events);
  };

  const applyEvents = (game: GameState, events: GameEvent[]): void => {
    const now = performance.now();
    const { feed, popups, levelUps } = translateEvents(
      events,
      defaultRng,
      game.settings.numberFormat,
    );
    const state = get();
    const freshPopups = state.popups.filter((p) => now - p.at < POPUP_LIFETIME_MS);
    const newFeed = feed.map((f) => ({ ...f, id: nextId++, at: Date.now() }));
    const newPopups = popups.map((p) => ({ ...p, id: nextId++, at: now }));
    const lastLevel = levelUps[levelUps.length - 1];
    set({
      game,
      feed: newFeed.length
        ? [...newFeed.reverse(), ...state.feed].slice(0, FEED_LIMIT)
        : state.feed,
      popups:
        newPopups.length || freshPopups.length !== state.popups.length
          ? [...freshPopups, ...newPopups].slice(-POPUP_LIMIT)
          : state.popups,
      levelUp: lastLevel ? { ...lastLevel, at: now } : state.levelUp,
    });
  };

  const shopFeedback = (res: ShopResult, success: string): void => {
    if (res.ok) get().pushFeed(success, 'gold');
    else get().pushFeed(`❌ ${t(`shopFail.${res.reason}` as MessageKey)}`, 'warn');
  };

  return {
    game: boot.game,
    feed: [
      {
        id: nextId++,
        at: Date.now(),
        kind: 'info',
        text: `👋 ${isFirstStart ? WELCOME_LINES[0] : flavor(defaultRng, WELCOME_LINES.slice(1))}`,
      },
    ],
    popups: [],
    levelUp: null,
    offlineSummary: boot.summary,
    lastSavedAt: null,
    lastTickAt: performance.now(),
    ui: {
      tab: 'world',
      selectedSkill: boot.game.active ? getAction(boot.game.active.actionId).skill : 'woodcutting',
      skillDetail: false,
      inventorySegment: 'items',
      selectedItem: null,
    },

    tick: (dt) => {
      mutate((s, emit) => advance(s, dt, defaultRng, emit));
      set({ lastTickAt: performance.now() });
      const { game } = get();
      if (game.settings.chatter && Math.random() < CHATTER_PER_SECOND * dt) {
        get().pushFeed(`💬 ${flavor(defaultRng, RANDOM_CHATTER)}`, 'chatter');
      }
    },

    catchUp: (now) => {
      const next = cloneState(get().game);
      const summary = applyOfflineProgress(next, now, defaultRng);
      set({ game: next, lastTickAt: performance.now() });
      if (
        summary.elapsedSeconds >= BALANCE.OFFLINE_SUMMARY_MIN_SECONDS &&
        summaryHasContent(summary)
      ) {
        set({ offlineSummary: summary });
      }
    },

    start: (actionId) => {
      mutate((s, emit) => {
        startAction(s, actionId, emit);
      });
      set({ ui: { ...get().ui, selectedSkill: getAction(actionId).skill } });
    },
    stop: () => mutate((s, emit) => stopAction(s, emit)),
    click: () =>
      mutate((s, emit) => {
        clickAction(s, defaultRng, emit);
      }),

    sell: (item, qty) => {
      let res: ShopResult = { ok: false, reason: 'unknown' };
      const amount = Math.min(qty, get().game.inventory[item] ?? 0);
      mutate((s, emit) => {
        res = sellItem(s, item, qty, emit);
      });
      const def = getItem(item);
      shopFeedback(res, `💰 ${flavor(defaultRng, SELL_LINES, { item: def.name, qty: amount })}`);
    },
    buy: (item, qty) => {
      let res: ShopResult = { ok: false, reason: 'unknown' };
      mutate((s) => {
        res = buyItem(s, item, qty);
      });
      shopFeedback(
        res,
        `🛒 ${flavor(defaultRng, BUY_LINES, { item: `${qty}× ${getItem(item).name}` })}`,
      );
    },
    buyTool: (toolId) => {
      let res: ShopResult = { ok: false, reason: 'unknown' };
      mutate((s) => {
        res = buyTool(s, toolId);
      });
      shopFeedback(res, `🛠️ ${flavor(defaultRng, TOOL_LINES, { item: getTool(toolId).name })}`);
    },
    equipTool: (toolId) =>
      mutate((s) => {
        equipTool(s, toolId);
      }),
    buySlot: () => {
      let res: ShopResult = { ok: false, reason: 'unknown' };
      mutate((s) => {
        res = buySlot(s);
      });
      shopFeedback(res, `🎒 ${flavor(defaultRng, SLOT_LINES)}`);
    },
    use: (item) =>
      mutate((s, emit) => {
        consumeItem(s, item, defaultRng, emit);
      }),

    setSetting: (key, value) =>
      mutate((s) => {
        s.settings = { ...s.settings, [key]: value };
      }),
    setUi: (patch) => set({ ui: { ...get().ui, ...patch } }),
    tapStation: (skill) => {
      const best = bestAvailableAction(get().game, skill);
      if (best) get().start(best.id);
      else get().openSkill(skill);
    },
    openSkill: (skill) =>
      set({ ui: { ...get().ui, tab: 'skills', selectedSkill: skill, skillDetail: true } }),
    dismissOffline: () => set({ offlineSummary: null }),
    dismissLevelUp: () => set({ levelUp: null }),

    save: () => {
      const now = Date.now();
      const game = { ...get().game, lastUpdate: now };
      if (saveToStorage(game, now)) set({ lastSavedAt: now });
    },
    exportString: () => exportSave(get().game),
    importString: (text) => {
      const game = importSave(text); // throws SaveError on bad input; UI shows the message
      game.lastUpdate = Date.now();
      set({ game, offlineSummary: null });
      get().save();
    },
    hardReset: () => {
      clearStorage();
      set({ game: newGame(), feed: [], offlineSummary: null, levelUp: null });
      get().save();
    },
    pushFeed: (text, kind = 'info') =>
      set({
        feed: [{ id: nextId++, at: Date.now(), text, kind }, ...get().feed].slice(0, FEED_LIMIT),
      }),

    debugAdvance: (seconds) => {
      const next = cloneState(get().game);
      next.lastUpdate -= seconds * 1000;
      const summary = applyOfflineProgress(next, Date.now(), defaultRng, Infinity);
      set({ game: next, offlineSummary: summary });
    },
    debugGive: (item, qty) =>
      mutate((s) => {
        s.inventory[item] = (s.inventory[item] ?? 0) + qty;
      }),
    debugSetLevel: (skill, level) =>
      mutate((s) => {
        s.skills[skill] = { xp: xpForLevel(level) };
      }),
    debugGold: (amount) =>
      mutate((s) => {
        s.gold = s.gold.add(new Decimal(amount));
      }),
  };
});
