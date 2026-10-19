import Decimal from 'break_eternity.js';
import { create } from 'zustand';
import { ACTION_MAP, getAction, getItem, getTool, HELPER_MAP, type EquipSlot } from '../data';

const getHelperName = (type: string) => HELPER_MAP.get(type)?.name ?? type;
import { BALANCE } from '../data/balance';
import { COLLECTION_MAP } from '../data/collections';
import {
  RANDOM_CHATTER,
  WELCOME_LINES,
  BUY_LINES,
  SELL_LINES,
  TOOL_LINES,
  SLOT_LINES,
} from '../data/flavor';
import {
  bestAvailableAction,
  canPerform,
  advance,
  acceptQuest,
  claimTask,
  completeQuest,
  ensureTasks,
  observeCat,
  bigBang,
  buyMultiverseUpgrade,
  buyWisdomUpgrade,
  paradigmShift,
  rebirth,
  assignHelper,
  dismissHelper,
  harvest,
  setPlotNext,
  uprootPlot,
  hireHelper,
  plantSeed,
  researchTech,
  type FarmResult,
  type HelperResult,
  eat,
  equipItem,
  startCombat,
  equipBest,
  specialAttack,
  dodge,
  stopCombat,
  unequip as unequipSlot,
  type CombatSettings,
  type EquipResult,
  checkAchievementsFast,
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
  collectionsClaimable,
  consumeAll,
  passClaimable,
  taskProgress,
  formatNumber,
  consumeItem,
  xpForLevel,
  type GameEvent,
  type GameState,
  type ProgressSummary,
  type Settings,
  type ShopResult,
  type VResult,
  type RewardLine,
  claimDaily,
  claimPassTier,
  claimChronicle,
  claimCollection,
  currentChronicle,
  type HeroResult,
  type AdventureReward,
  prepareDungeon,
  prepareWeekly,
  finishWeekly,
  type WeeklyReward,
  finishDungeon,
  buyRiftTalent,
  finishRun,
  prepareRun,
  type RiftReward,
  type Rng,
} from '../engine';
import { t, type MessageKey } from '../i18n';
import type { RunConfig, RunResult } from '../rift/sim';
import { playEventSounds, SOUNDS } from '../ui/audio';
import { duckMusic } from '../ui/music';
import { notifyInBackground } from '../ui/notify';
import { translateEvents, type FeedEntry, type FeedKind, type Popup } from './feed';
import { lastActionFor, rememberAction } from './lastActions';
import { clearStorage, loadFromStorage, saveToStorage } from './persistence';

export type TabId = 'world' | 'skills' | 'inventory' | 'village' | 'rift' | 'menu';
export type MenuSection =
  | 'empire'
  | 'pass'
  | 'research'
  | 'quests'
  | 'prestige'
  | 'achievements'
  | 'stats'
  | 'settings'
  | 'save'
  | 'log'
  | 'debug';
export type QuestSegment = 'tasks' | 'quests' | 'pets';
export type InventorySegment = 'items' | 'gear' | 'market' | 'shop' | 'tools' | 'album';

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
  menuSection: MenuSection;
  villageSegment: 'fields' | 'center' | 'map' | 'military' | 'market' | 'reports' | 'empire';
  heroSegment: 'hero' | 'adventures' | 'start' | 'talents' | 'codex';
  /** Quick navigation overlay. */
  quickNav: boolean;
  /** Action card to scroll to and highlight in the skill view (recipe jumps). */
  focusAction: string | null;
  questSegment: QuestSegment;
  /** "Was jetzt?" overlay. */
  agenda: boolean;
}

export interface GameStore {
  game: GameState;
  feed: FeedEntry[];
  popups: Popup[];
  levelUp: { skill: string; level: number; at: number } | null;
  achievementToast: { ids: string[]; at: number } | null;
  offlineSummary: ProgressSummary | null;
  lastSavedAt: number | null;
  /** performance.now() of the last simulation tick, for smooth progress interpolation. */
  lastTickAt: number;
  ui: UiState;
  /** Reward reveal modal (daily, Ruhmesleiter, Chronik). */
  reward: { title: string; icon: string; lines: RewardLine[]; at: number } | null;
  dailyOpen: boolean;

  tick: (dtSeconds: number) => void;
  catchUp: (now: number) => void;
  start: (actionId: string) => void;
  stop: () => void;
  click: () => void;
  sell: (item: string, qty: number) => void;
  /** Sells whole stacks at once (e.g. all junk) with a single feed line. */
  sellStacks: (items: string[]) => void;
  buy: (item: string, qty: number) => void;
  buyTool: (toolId: string) => void;
  equipTool: (toolId: string) => void;
  buySlot: () => void;
  use: (item: string) => void;
  consumeStack: (item: string) => void;
  fight: (kind: 'monster' | 'dungeon', target: string) => void;
  flee: () => void;
  equip: (item: string) => void;
  unequip: (slot: EquipSlot) => void;
  equipBest: () => void;
  eatNow: () => void;
  /** Fires the charged special attack (optional active play). */
  special: () => void;
  /** Dodges a telegraphed heavy monster attack. */
  dodge: () => void;
  research: (tech: string) => void;
  plant: (plot: number, seed: string) => void;
  harvestPlot: (plot: number) => void;
  uproot: (plot: number) => void;
  setPlotNext: (plot: number, next: string | null | undefined) => void;
  hire: (type: string) => void;
  assign: (helper: number, actionId: string | null) => void;
  dismissHelperAt: (helper: number) => void;
  doRebirth: () => void;
  doParadigmShift: (laws: string[]) => void;
  doBigBang: () => void;
  buyTalent: (id: string) => void;
  buyMultiverse: (id: string) => void;
  takeQuest: (id: string) => void;
  turnInQuest: (id: string) => void;
  claim: (taskId: string) => void;
  peekCat: () => void;
  setCombatSetting: <K extends keyof CombatSettings>(key: K, value: CombatSettings[K]) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setUi: (patch: Partial<UiState>) => void;
  openSkill: (skill: string) => void;
  /** Opens the skill of an action and scrolls to its card. */
  jumpToAction: (actionId: string) => void;
  /** Packs provisions and returns the config for a new rift run (null if locked). */
  riftPrepare: (hero: string, biome: string, endless?: boolean) => RunConfig | null;
  /** Books the rewards of a finished rift run. */
  riftFinish: (result: RunResult) => RiftReward | null;
  riftTalent: (id: string) => void;
  claimDaily: () => void;
  claimPass: (tier: number) => void;
  /** Claims every waiting Ruhmesleiter tier, finished task and Sammelbuch set in one reveal. */
  claimAllRewards: () => void;
  claimChronicle: () => void;
  claimCollection: (id: string) => void;
  dismissReward: () => void;
  setDailyOpen: (open: boolean) => void;
  /** Runs a hero action; failures become warnings (heroFail.*). */
  hero: (
    fn: (s: GameState, emit: (e: GameEvent) => void, rng: Rng) => HeroResult | void,
  ) => boolean;
  /** Config for the adventure the hero stands at, as a live dungeon. */
  dungeonPrepare: () => RunConfig | null;
  dungeonFinish: (result: RunResult) => AdventureReward | null;
  /** Wochenboss: start and book (the first win of the week opens a reward reveal). */
  weeklyPrepare: (hero: string) => RunConfig | null;
  weeklyFinish: (result: RunResult) => WeeklyReward | null;
  /** Runs a village action; a failed result becomes a warning line in the feed. */
  village: (
    fn: (s: GameState, emit: (e: GameEvent) => void, rng: Rng) => VResult | void,
  ) => boolean;
  /** World tap on a station: repeat its last action (double tap: open the skill). */
  tapStation: (skill: string) => void;
  dismissOffline: () => void;
  dismissLevelUp: () => void;
  dismissAchievement: () => void;
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
/** Island double tap detection (see tapStation). */
const lastStationTap = { skill: '', at: 0 };

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
    const emit = (e: GameEvent) => events.push(e);
    fn(next, emit);
    checkAchievementsFast(next, emit);
    next.lastUpdate = Date.now();
    applyEvents(next, events);
  };

  const applyEvents = (game: GameState, events: GameEvent[]): void => {
    const now = performance.now();
    if (events.length) {
      if (game.settings.sound) playEventSounds(events);
      if (events.some((e) => e.type === 'levelUp' || e.type === 'heroLevel')) duckMusic(1.2);
      notifyInBackground(events, game.settings.notifications);
    }
    const { feed, popups, levelUps, achievements } = translateEvents(
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
      achievementToast: achievements.length
        ? { ids: achievements, at: now }
        : state.achievementToast,
    });
  };

  const showReward = (title: string, icon: string, lines: RewardLine[]): void => {
    set({ reward: { title, icon, lines, at: performance.now() } });
    duckMusic(2.5);
    const best = Math.max(0, ...lines.map((l) => l.rarity));
    if (get().game.settings.sound) (best >= 2 ? SOUNDS.achievement : SOUNDS.rare)();
    try {
      if (get().game.settings.haptics) navigator.vibrate?.(best >= 2 ? [30, 40, 60] : 25);
    } catch {
      /* not supported */
    }
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
    achievementToast: null,
    offlineSummary: boot.summary,
    reward: null,
    dailyOpen: false,
    lastSavedAt: null,
    lastTickAt: performance.now(),
    ui: {
      tab: 'world',
      selectedSkill: boot.game.active ? getAction(boot.game.active.actionId).skill : 'woodcutting',
      skillDetail: false,
      inventorySegment: 'items',
      selectedItem: null,
      menuSection: 'empire',
      villageSegment: 'fields',
      heroSegment: 'hero',
      quickNav: false,
      focusAction: null,
      questSegment: 'tasks',
      agenda: false,
    },

    tick: (dt) => {
      mutate((s, emit) => {
        advance(s, dt, defaultRng, emit);
        ensureTasks(s, Date.now());
      });
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
      const skill = getAction(actionId).skill;
      if (get().game.active?.actionId === actionId) rememberAction(skill, actionId);
      set({ ui: { ...get().ui, selectedSkill: skill } });
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
    sellStacks: (items) => {
      const before = get().game.gold;
      let sold = 0;
      mutate((s, emit) => {
        for (const id of items) {
          const qty = s.inventory[id] ?? 0;
          if (qty > 0 && sellItem(s, id, qty, emit).ok) sold += qty;
        }
      });
      if (sold > 0)
        get().pushFeed(
          `🗑️ ${sold} Teile Plunder verkauft (+${formatNumber(get().game.gold.sub(before), get().game.settings.numberFormat)} Gold). Platz geschaffen!`,
        );
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
    consumeStack: (item) =>
      mutate((s, emit) => {
        consumeAll(s, item, defaultRng, emit);
      }),

    fight: (kind, target) =>
      mutate((s, emit) => {
        startCombat(s, kind, target, emit);
      }),
    flee: () => mutate((s, emit) => stopCombat(s, emit)),
    equip: (item) => {
      let res = { ok: true } as EquipResult;
      mutate((s) => {
        res = equipItem(s, item);
      });
      if (!res.ok) get().pushFeed(`❌ ${t(`equipFail.${res.reason}` as MessageKey)}`, 'warn');
    },
    unequip: (slot) => {
      let res = { ok: true } as EquipResult;
      mutate((s) => {
        res = unequipSlot(s, slot);
      });
      if (!res.ok) get().pushFeed(`❌ ${t(`equipFail.${res.reason}` as MessageKey)}`, 'warn');
    },
    equipBest: () => {
      let n = 0;
      mutate((s) => {
        n = equipBest(s);
      });
      get().pushFeed(
        n > 0
          ? `🛡️ ${n} Ausrüstungsteil${n === 1 ? '' : 'e'} angelegt.`
          : '🛡️ Du trägst schon das Beste.',
        'info',
      );
    },
    eatNow: () =>
      mutate((s, emit) => {
        eat(s, emit);
      }),
    special: () =>
      mutate((s, emit) => {
        specialAttack(s, defaultRng, emit);
      }),
    dodge: () =>
      mutate((s) => {
        dodge(s);
      }),
    research: (tech) =>
      mutate((s, emit) => {
        researchTech(s, tech, emit);
      }),
    plant: (plot, seed) => {
      let res = { ok: true } as FarmResult;
      mutate((s, emit) => {
        res = plantSeed(s, plot, seed, emit);
      });
      if (!res.ok) get().pushFeed(`❌ ${t(`farmFail.${res.reason}` as MessageKey)}`, 'warn');
    },
    harvestPlot: (plot) =>
      mutate((s, emit) => {
        harvest(s, plot, defaultRng, emit);
      }),
    uproot: (plot) =>
      mutate((s, emit) => {
        uprootPlot(s, plot, defaultRng, emit);
      }),
    setPlotNext: (plot, next) =>
      mutate((s) => {
        setPlotNext(s, plot, next);
      }),
    hire: (type) => {
      let res = { ok: true } as HelperResult;
      mutate((s) => {
        res = hireHelper(s, type);
      });
      if (!res.ok) get().pushFeed(`❌ ${t(`helperFail.${res.reason}` as MessageKey)}`, 'warn');
      else get().pushFeed(`🤝 ${getHelperName(type)} eingestellt! Weise eine Aufgabe zu.`, 'gold');
    },
    assign: (helper, actionId) =>
      mutate((s) => {
        assignHelper(s, helper, actionId);
      }),
    dismissHelperAt: (helper) =>
      mutate((s) => {
        dismissHelper(s, helper);
      }),
    doRebirth: () => {
      mutate((s, emit) => {
        rebirth(s, emit);
      });
      get().save();
    },
    doParadigmShift: (laws) => {
      mutate((s, emit) => {
        paradigmShift(s, laws, emit);
      });
      get().save();
    },
    doBigBang: () => {
      mutate((s, emit) => {
        bigBang(s, emit);
      });
      get().save();
    },
    buyTalent: (id) =>
      mutate((s) => {
        buyWisdomUpgrade(s, id);
      }),
    buyMultiverse: (id) =>
      mutate((s) => {
        buyMultiverseUpgrade(s, id);
      }),
    takeQuest: (id) =>
      mutate((s) => {
        acceptQuest(s, id);
      }),
    turnInQuest: (id) =>
      mutate((s, emit) => {
        completeQuest(s, id, emit, defaultRng);
      }),
    claim: (taskId) =>
      mutate((s, emit) => {
        claimTask(s, taskId, emit);
      }),
    peekCat: () => {
      let result: 'alive' | 'ghost' | null = null;
      mutate((s) => {
        result = observeCat(s, defaultRng);
      });
      if (result === 'alive')
        get().pushFeed(
          '🐈 Die Kiste ist offen: Die Katze lebt! Sie schnurrt dich vorwurfsvoll an.',
          'rare',
        );
      if (result === 'ghost')
        get().pushFeed(
          '👻 Die Kiste ist offen: Eine Geisterkatze! Halb tot, halb lebendig, voll flauschig.',
          'rare',
        );
    },
    setCombatSetting: (key, value) =>
      mutate((s) => {
        s.combatSettings = { ...s.combatSettings, [key]: value };
      }),
    setSetting: (key, value) =>
      mutate((s) => {
        s.settings = { ...s.settings, [key]: value };
      }),
    setUi: (patch) => set({ ui: { ...get().ui, ...patch } }),
    tapStation: (skill) => {
      if (skill === 'combat') {
        get().openSkill('melee');
        return;
      }
      if (skill === 'research') {
        get().setUi({ tab: 'menu', menuSection: 'research' });
        return;
      }
      if (skill === 'farming') {
        get().openSkill('farming');
        return;
      }
      // Double tap on the same station: open the skill to pick what to do. A single tap starts
      // right away – the last action of that skill, else the best one available.
      const now = Date.now();
      if (lastStationTap.skill === skill && now - lastStationTap.at < 400) {
        lastStationTap.at = 0;
        get().openSkill(skill);
        return;
      }
      lastStationTap.skill = skill;
      lastStationTap.at = now;
      const game = get().game;
      const lastId = lastActionFor(skill);
      const last = lastId && ACTION_MAP.has(lastId) ? getAction(lastId) : undefined;
      const pick = last && canPerform(game, last).ok ? last : bestAvailableAction(game, skill);
      if (pick) get().start(pick.id);
      else get().openSkill(skill);
    },
    riftPrepare: (hero, biome, endless = false) => {
      let cfg: RunConfig | null = null;
      mutate((s) => {
        cfg = prepareRun(s, hero, biome, defaultRng, endless);
      });
      return cfg;
    },
    riftFinish: (result) => {
      let reward: RiftReward | null = null;
      mutate((s, emit) => {
        reward = finishRun(s, result, defaultRng, emit);
      });
      return reward;
    },
    riftTalent: (id) =>
      mutate((s) => {
        buyRiftTalent(s, id);
      }),
    claimDaily: () => {
      let lines: RewardLine[] | null = null;
      let day = 1;
      mutate((s, emit) => {
        lines = claimDaily(s, Date.now(), defaultRng, emit);
        day = ((s.progress.streak - 1) % 7) + 1;
      });
      if (lines) showReward(`Tag ${day} der Serie!`, '🎁', lines);
      set({ dailyOpen: false });
    },
    claimPass: (tier) => {
      let lines: RewardLine[] | null = null;
      mutate((s, emit) => {
        lines = claimPassTier(s, tier, defaultRng, emit);
      });
      if (lines) showReward(`Ruhmesleiter Stufe ${tier}`, '🏅', lines);
    },
    claimAllRewards: () => {
      const lines: RewardLine[] = [];
      let tasks = 0;
      mutate((s, emit) => {
        for (const tier of passClaimable(s))
          lines.push(...(claimPassTier(s, tier, defaultRng, emit) ?? []));
        for (const c of collectionsClaimable(s))
          lines.push(...(claimCollection(s, c.id, defaultRng, emit) ?? []));
        for (const tk of s.tasks.list)
          if (!tk.claimed && taskProgress(s, tk) >= tk.target && claimTask(s, tk.id, emit)) tasks++;
      });
      if (tasks) lines.push({ icon: '📋', label: `${tasks} Aufträge abgeschlossen`, rarity: 1 });
      if (lines.length) showReward('Alles abgeholt!', '🎁', lines);
    },
    claimChronicle: () => {
      const step = currentChronicle(get().game);
      let lines: RewardLine[] | null = null;
      mutate((s, emit) => {
        lines = claimChronicle(s, defaultRng, emit);
      });
      if (lines && step) showReward(`Chronik: ${step.step.title}`, step.step.icon, lines);
    },
    claimCollection: (id) => {
      const def = COLLECTION_MAP.get(id);
      let lines: RewardLine[] | null = null;
      mutate((s, emit) => {
        lines = claimCollection(s, id, defaultRng, emit);
      });
      if (lines && def) showReward(`Sammelbuch: ${def.name}`, def.icon, lines);
    },
    dismissReward: () => set({ reward: null }),
    setDailyOpen: (open) => set({ dailyOpen: open }),
    hero: (fn) => {
      let result: HeroResult | void = undefined;
      mutate((s, emit) => {
        result = fn(s, emit, defaultRng);
      });
      const r = result as HeroResult | void;
      if (r && !r.ok) {
        get().pushFeed(`❌ ${t(`heroFail.${r.reason}` as MessageKey)}`, 'warn');
        return false;
      }
      return true;
    },
    dungeonPrepare: () => {
      let cfg: RunConfig | null = null;
      mutate((s) => {
        cfg = prepareDungeon(s, defaultRng);
      });
      return cfg;
    },
    dungeonFinish: (result) => {
      let reward: AdventureReward | null = null;
      mutate((s, emit) => {
        reward = finishDungeon(s, result, defaultRng, emit);
      });
      return reward;
    },
    weeklyPrepare: (hero) => {
      let cfg: RunConfig | null = null;
      mutate((s) => {
        cfg = prepareWeekly(s, hero, Date.now(), defaultRng);
      });
      return cfg;
    },
    weeklyFinish: (result) => {
      let reward: WeeklyReward | null = null;
      mutate((s, emit) => {
        reward = finishWeekly(s, result, Date.now(), defaultRng, emit);
      });
      const r = reward as WeeklyReward | null;
      if (r?.lines)
        showReward(
          r.firstWin ? 'Wochenboss besiegt!' : 'Mutiger Versuch',
          r.firstWin ? '🦹' : '🎖️',
          r.lines,
        );
      return r;
    },
    village: (fn) => {
      let result: VResult | void = undefined;
      mutate((s, emit) => {
        result = fn(s, emit, defaultRng);
      });
      const r = result as VResult | void;
      if (r && !r.ok) {
        get().pushFeed(`❌ ${t(`villageFail.${r.reason}` as MessageKey)}`, 'warn');
        return false;
      }
      return true;
    },
    openSkill: (skill) =>
      set({ ui: { ...get().ui, tab: 'skills', selectedSkill: skill, skillDetail: true } }),
    jumpToAction: (actionId) =>
      set({
        ui: {
          ...get().ui,
          tab: 'skills',
          selectedSkill: getAction(actionId).skill,
          skillDetail: true,
          selectedItem: null,
          focusAction: actionId,
        },
      }),
    dismissOffline: () => set({ offlineSummary: null }),
    dismissLevelUp: () => set({ levelUp: null }),
    dismissAchievement: () => set({ achievementToast: null }),

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
