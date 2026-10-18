// Central balancing knobs. Change numbers here, not in the engine.
// Rationale for each value lives in docs/BALANCING.md.

export const BALANCE = {
  /** Simulation ticks per second for the live loop. */
  TICKS_PER_SECOND: 5,
  /** Highest regular level (prestige will raise this to 120 later). */
  MAX_LEVEL: 99,
  /** XP table is generated up to this level so prestige content can reuse it. */
  XP_TABLE_MAX_LEVEL: 120,

  /** Each tap on the active action advances it by this fraction of its duration. */
  CLICK_PROGRESS: 0.12,
  /** Taps beyond this rate per second are ignored (anti auto-clicker, keeps it fair). */
  MAX_CLICKS_PER_SECOND: 8,

  /** Speed bonus per level above an action's requirement … */
  LEVEL_SPEED_BONUS: 0.005,
  /** … capped at this total bonus. */
  LEVEL_SPEED_BONUS_CAP: 0.5,
  /** Actions never get faster than this many seconds. */
  MIN_ACTION_TIME: 0.6,

  /** Campfire: maximum stored burn time in seconds. */
  FIRE_MAX_SECONDS: 3600,
  /** XP multiplier on all skills while the campfire burns. */
  FIRE_XP_BONUS: 0.05,
  /** Cooking burn chance is multiplied by this while the fire burns well (> FIRE_GOOD_SECONDS). */
  FIRE_GOOD_SECONDS: 300,
  FIRE_GOOD_BURN_FACTOR: 0.85,

  /** Each point of intelligence (Newton apples …) gives this much global XP. */
  INTELLIGENCE_XP_BONUS: 0.002,

  /** Inventory. */
  START_INVENTORY_SLOTS: 20,
  MAX_INVENTORY_SLOTS: 120,
  SLOT_BASE_PRICE: 100,
  SLOT_PRICE_GROWTH: 1.35,

  /** Offline progress cap in seconds (24 h). Upgrades can raise it later. */
  OFFLINE_CAP_SECONDS: 24 * 60 * 60,
  /** Show the "while you were away" summary only for absences longer than this. */
  OFFLINE_SUMMARY_MIN_SECONDS: 60,

  /** Autosave interval in milliseconds. */
  AUTOSAVE_MS: 30_000,

  /** Starting gold. */
  START_GOLD: 0,
} as const;
