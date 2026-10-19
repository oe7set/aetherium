import {
  LAWS,
  MULTIVERSE_UPGRADES,
  PRESTIGE,
  WISDOM_UPGRADES,
  type UpgradeDef,
} from '../data/prestige';
import type { Emit } from './events';
import { invalidateMods, mod, registerModifierSource } from './modifiers';
import { ensurePlots } from './science';
import { totalLevel } from './skills';
import { addStat, newGame, type GameState } from './state';
import { xpForLevel } from './xp';

// --- Modifiers ------------------------------------------------------------------------------------

function upgradeMods(defs: UpgradeDef[], levels: Record<string, number>) {
  return defs
    .filter((d) => d.mods && (levels[d.id] ?? 0) > 0)
    .map((d) =>
      Object.fromEntries(
        Object.entries(d.mods ?? {}).map(([k, v]) => [k, (v ?? 0) * (levels[d.id] ?? 0)]),
      ),
    );
}

registerModifierSource('prestige', (s) => {
  const p = s.prestige;
  const sets = [
    {
      xp: p.wisdomTotal * PRESTIGE.WISDOM_XP,
      research: p.wisdomTotal * PRESTIGE.WISDOM_RESEARCH + p.paradigms * PRESTIGE.PARADIGM_RESEARCH,
      gold: p.wisdomTotal * PRESTIGE.WISDOM_GOLD,
    },
    ...upgradeMods(WISDOM_UPGRADES, p.upgrades),
    ...upgradeMods(MULTIVERSE_UPGRADES, p.multiverse),
    ...p.laws.map((id) => LAWS.find((l) => l.id === id)?.mods ?? {}),
  ];
  return sets;
});

// --- Helpers ----------------------------------------------------------------------------------------

export function upgradeLevel(s: GameState, id: string): number {
  return s.prestige.upgrades[id] ?? 0;
}

export function multiverseLevel(s: GameState, id: string): number {
  return s.prestige.multiverse[id] ?? 0;
}

export function totalXp(s: GameState): number {
  return Object.values(s.skills).reduce((sum, sk) => sum + sk.xp, 0);
}

/** XP earned since the last reset (start-level XP from „Vorwissen" does not count). */
export function runXp(s: GameState): number {
  return Math.max(0, totalXp(s) - s.prestige.runBaseXp);
}

export function wisdomGain(s: GameState): number {
  return Math.floor(Math.sqrt(runXp(s) / PRESTIGE.WISDOM_XP_DIVISOR) * (1 + mod(s, 'wisdom')));
}

export type PrestigeCheck = { ok: true } | { ok: false; reason: string };

export function canRebirth(s: GameState): PrestigeCheck {
  if (totalLevel(s) < PRESTIGE.REBIRTH_TOTAL_LEVEL) {
    return {
      ok: false,
      reason: `Gesamtlevel ${PRESTIGE.REBIRTH_TOTAL_LEVEL} benötigt (aktuell ${totalLevel(s)}).`,
    };
  }
  if (wisdomGain(s) < 1) return { ok: false, reason: 'Du würdest noch keine Weisheit gewinnen.' };
  return { ok: true };
}

export function lawSlots(s: GameState): number {
  return 1 + multiverseLevel(s, 'second_law');
}

export function canParadigmShift(s: GameState): PrestigeCheck {
  if (s.prestige.rebirths < 1) return { ok: false, reason: 'Erst einmal wiedergeboren werden.' };
  if (s.techs.length < PRESTIGE.PARADIGM_TECHS) {
    return {
      ok: false,
      reason: `${PRESTIGE.PARADIGM_TECHS} erforschte Technologien benötigt (aktuell ${s.techs.length}).`,
    };
  }
  return { ok: true };
}

export function canBigBang(s: GameState): PrestigeCheck {
  if (s.prestige.paradigms < PRESTIGE.BIG_BANG_PARADIGMS) {
    return {
      ok: false,
      reason: `${PRESTIGE.BIG_BANG_PARADIGMS} Paradigmenwechsel benötigt (aktuell ${s.prestige.paradigms}).`,
    };
  }
  return { ok: true };
}

export function shardGain(s: GameState): number {
  return 1 + Math.floor(s.prestige.paradigms / 3) + Math.floor(s.prestige.wisdomTotal / 500);
}

// --- Resets ------------------------------------------------------------------------------------------

/**
 * Starts a fresh run while keeping meta progress. Everything not explicitly kept is reset to a
 * new game. Called by all three prestige layers.
 */
function resetRun(s: GameState): void {
  const fresh = newGame(s.lastUpdate);
  const keepTools = upgradeLevel(s, 'heirlooms') > 0;
  const keepHelpers = upgradeLevel(s, 'loyal_helpers') > 0;
  const kept = {
    createdAt: s.createdAt,
    lastUpdate: s.lastUpdate,
    settings: s.settings,
    achievements: s.achievements,
    stats: s.stats,
    codex: s.codex,
    techs: s.techs,
    research: s.research,
    prestige: s.prestige,
    ownedTools: keepTools ? s.ownedTools : fresh.ownedTools,
    equippedTools: keepTools ? s.equippedTools : fresh.equippedTools,
    helpers: keepHelpers ? s.helpers.map((h) => ({ ...h, actionId: null, progress: 0 })) : [],
    combatSettings: s.combatSettings,
    loadouts: s.loadouts,
    pets: s.pets,
    catState: s.catState,
    quests: s.quests,
    tasks: s.tasks,
    // The village is its own world: buildings, troops and villages survive every reset.
    village: s.village,
    // Rift meta progression is permanent, too (talents are its own prestige).
    rift: s.rift,
    // The hero and the motivation layer belong to the player, not to a run.
    hero: s.hero,
    progress: s.progress,
  };
  Object.assign(s, fresh, kept);

  // Ahnen-Talente that shape the new start.
  const start = 1 + 5 * upgradeLevel(s, 'head_start');
  if (start > 1) {
    for (const id of Object.keys(s.skills)) {
      s.skills[id] = { xp: Math.max(s.skills[id]?.xp ?? 0, xpForLevel(Math.min(99, start))) };
    }
  }
  const goldLevel = upgradeLevel(s, 'starting_gold');
  if (goldLevel > 0) s.gold = s.gold.add(1000 * 10 ** (goldLevel - 1));
  s.inventorySlots += 8 * upgradeLevel(s, 'pockets');
  s.hp = Math.max(10, Math.floor(start >= 10 ? start : 10));
  s.prestige.runBaseXp = totalXp(s);
  s.prestige.runStartedAt = s.lastUpdate;
  ensurePlots(s);
  invalidateMods(s);
}

export function rebirth(s: GameState, emit: Emit): number {
  if (!canRebirth(s).ok) return 0;
  const gain = wisdomGain(s);
  s.prestige.wisdom += gain;
  s.prestige.wisdomTotal += gain;
  s.prestige.rebirths++;
  addStat(s, 'rebirths');
  resetRun(s);
  emit({ type: 'prestige', layer: 'rebirth', gain });
  return gain;
}

export function paradigmShift(s: GameState, laws: string[], emit: Emit): boolean {
  if (!canParadigmShift(s).ok) return false;
  const chosen = Array.from(new Set(laws.filter((id) => LAWS.some((l) => l.id === id)))).slice(
    0,
    lawSlots(s),
  );
  // A paradigm shift includes a rebirth (if one would yield wisdom).
  const gain = canRebirth(s).ok ? wisdomGain(s) : 0;
  s.prestige.wisdom += gain;
  s.prestige.wisdomTotal += gain;
  s.prestige.paradigms++;
  s.prestige.laws = chosen;
  s.techs = [];
  s.research = 0;
  addStat(s, 'paradigmShifts');
  resetRun(s);
  emit({ type: 'prestige', layer: 'paradigm', gain: s.prestige.paradigms });
  return true;
}

export function bigBang(s: GameState, emit: Emit): number {
  if (!canBigBang(s).ok) return 0;
  const shards = shardGain(s);
  const memory = Math.min(1, 0.25 * multiverseLevel(s, 'cosmic_memory'));
  const p = s.prestige;
  p.shards += shards;
  p.bigBangs++;
  p.wisdomTotal = Math.floor(p.wisdomTotal * memory);
  p.wisdom = p.wisdomTotal;
  p.upgrades = {};
  p.paradigms = 0;
  p.laws = [];
  s.techs = [];
  s.research = 0;
  if (multiverseLevel(s, 'eternal_codex') <= 0) {
    s.codex = [];
    s.stats.codexSize = 0;
  }
  addStat(s, 'bigBangs');
  resetRun(s);
  emit({ type: 'prestige', layer: 'bigbang', gain: shards });
  return shards;
}

// --- Shops ----------------------------------------------------------------------------------------------

export function upgradeCost(def: UpgradeDef, currentLevel: number): number {
  return def.cost(currentLevel + 1);
}

export function buyWisdomUpgrade(s: GameState, id: string): boolean {
  const def = WISDOM_UPGRADES.find((u) => u.id === id);
  if (!def) return false;
  const level = upgradeLevel(s, id);
  if (level >= def.maxLevel) return false;
  const cost = upgradeCost(def, level);
  if (s.prestige.wisdom < cost) return false;
  s.prestige.wisdom -= cost;
  s.prestige.upgrades[id] = level + 1;
  if (id === 'pockets') s.inventorySlots += 8;
  invalidateMods(s);
  return true;
}

export function buyMultiverseUpgrade(s: GameState, id: string): boolean {
  const def = MULTIVERSE_UPGRADES.find((u) => u.id === id);
  if (!def) return false;
  const level = multiverseLevel(s, id);
  if (level >= def.maxLevel) return false;
  const cost = upgradeCost(def, level);
  if (s.prestige.shards < cost) return false;
  s.prestige.shards -= cost;
  s.prestige.multiverse[id] = level + 1;
  invalidateMods(s);
  return true;
}
