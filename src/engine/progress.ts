import Decimal from 'break_eternity.js';
import { getItem, ITEM_MAP } from '../data';
import { HERO_ITEMS, TIER_NAMES } from '../data/hero';
import {
  CHRONICLE,
  DAILY_REWARDS,
  PASS_SOURCES,
  PASS_TIERS,
  passReward,
  passThreshold,
  type ChronicleCondition,
  type RewardDef,
} from '../data/progress';
import { V_RESOURCES } from '../data/village';
import { gainItem } from './actions';
import type { Emit } from './events';
import { gainHeroXp, rollHeroItem } from './hero';
import { dayKey } from './meta';
import { invalidateMods } from './modifiers';
import type { Rng } from './rng';
import { addResearch } from './science';
import { earnGold } from './shop';
import { totalLevel } from './skills';
import { addStat, type GameState } from './state';
import { activeVillage, bestBuilding, capFor } from './village';

/** One line of a reward reveal (UI). */
export interface RewardLine {
  icon: string;
  label: string;
  /** 0 common … 3 legendary (glow). */
  rarity: number;
}

/** Rewards grow with the whole empire so they stay meaningful. */
export function rewardScale(s: GameState): number {
  return 1 + totalLevel(s) / 120 + s.hero.level / 12 + (s.stats.villagePopulation ?? 0) / 250;
}

export function applyReward(s: GameState, r: RewardDef, rng: Rng, emit: Emit): RewardLine[] {
  const k = rewardScale(s);
  const out: RewardLine[] = [];
  if (r.gold) {
    const gold = Math.round(r.gold * k);
    earnGold(s, new Decimal(gold), emit);
    out.push({ icon: '🪙', label: `${gold} Gold`, rarity: 0 });
  }
  if (r.essence) {
    const e = Math.round(r.essence * k);
    s.rift.essence += e;
    s.rift.essenceTotal += e;
    out.push({ icon: '🌀', label: `${e} Riss-Essenz`, rarity: 1 });
  }
  if (r.research) {
    const rp = Math.round(r.research * k);
    addResearch(s, rp, emit);
    out.push({ icon: '🔬', label: `${rp} Forschungspunkte`, rarity: 0 });
  }
  if (r.resources) {
    const v = activeVillage(s);
    const amount = Math.round(r.resources * k);
    for (const res of V_RESOURCES) v.res[res] = Math.min(capFor(v, res), v.res[res] + amount);
    out.push({ icon: '🏘️', label: `je ${amount} Holz, Lehm, Eisen, Getreide`, rarity: 0 });
  }
  if (r.heroXp) {
    const xp = Math.round(r.heroXp * k);
    gainHeroXp(s, xp, emit);
    out.push({ icon: '⭐', label: `${xp} Helden-XP`, rarity: 1 });
  }
  for (const it of r.items ?? []) {
    if (!ITEM_MAP.has(it.item)) continue;
    gainItem(s, it.item, it.qty, emit);
    const def = getItem(it.item);
    out.push({
      icon: def.icon,
      label: `${it.qty}× ${def.name}`,
      rarity: def.rarity === 'rare' ? 2 : 1,
    });
  }
  if (r.heroItem) {
    const item = rollHeroItem(s, rng, s.hero.level + 5, r.heroItem >= 2, r.heroItem);
    if (item) {
      const def = HERO_ITEMS.find((x) => x.id === item.base)!;
      out.push({
        icon: def.icon,
        label: `${def.name} (${TIER_NAMES[item.tier]})`,
        rarity: item.tier,
      });
    } else out.push({ icon: '🎒', label: 'Heldentaschen voll – Gegenstand verloren!', rarity: 0 });
  }
  if (r.avatar && !s.progress.avatars.includes(r.avatar)) {
    s.progress.avatars = [...s.progress.avatars, r.avatar];
    out.push({ icon: r.avatar, label: 'Neuer Helden-Avatar!', rarity: 3 });
  }
  invalidateMods(s);
  return out;
}

// --- Daily login --------------------------------------------------------------------------------

function previousDay(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return dayKey(d.getTime());
}

export function dailyAvailable(s: GameState, now: number): boolean {
  return s.progress.lastDaily !== dayKey(now);
}

/** Day (1–7) of the streak the next claim would be. */
export function nextDailyDay(s: GameState, now: number): number {
  const today = dayKey(now);
  const continues = s.progress.lastDaily === previousDay(today);
  const streak = continues ? s.progress.streak + 1 : 1;
  return ((streak - 1) % DAILY_REWARDS.length) + 1;
}

export function claimDaily(s: GameState, now: number, rng: Rng, emit: Emit): RewardLine[] | null {
  if (!dailyAvailable(s, now)) return null;
  const today = dayKey(now);
  const continues = s.progress.lastDaily === previousDay(today);
  s.progress.streak = continues ? s.progress.streak + 1 : 1;
  s.progress.lastDaily = today;
  s.progress.dailyTotal++;
  addStat(s, 'dailyClaims');
  s.stats.bestStreak = Math.max(s.stats.bestStreak ?? 0, s.progress.streak);
  const day = ((s.progress.streak - 1) % DAILY_REWARDS.length) + 1;
  return applyReward(s, DAILY_REWARDS[day - 1]!, rng, emit);
}

// --- Ruhmesleiter ---------------------------------------------------------------------------------

function statValue(s: GameState, stat: string): number {
  if (stat === 'totalLevel') return totalLevel(s);
  if (stat === 'heroLevel') return s.hero.level;
  if (stat === 'achievementsUnlocked') return s.achievements.length;
  return s.stats[stat] ?? 0;
}

export function passPoints(s: GameState): number {
  return Math.floor(PASS_SOURCES.reduce((sum, src) => sum + statValue(s, src.stat) * src.per, 0));
}

export function passBreakdown(s: GameState): { label: string; icon: string; points: number }[] {
  return PASS_SOURCES.map((src) => ({
    label: src.label,
    icon: src.icon,
    points: Math.floor(statValue(s, src.stat) * src.per),
  }));
}

/** Highest tier reached. */
export function passTier(s: GameState): number {
  const pts = passPoints(s);
  let tier = 0;
  while (tier < PASS_TIERS && pts >= passThreshold(tier + 1)) tier++;
  return tier;
}

export function passClaimable(s: GameState): number[] {
  const tier = passTier(s);
  const out: number[] = [];
  for (let i = 1; i <= tier; i++) if (!s.progress.passClaimed.includes(i)) out.push(i);
  return out;
}

export function claimPassTier(
  s: GameState,
  tier: number,
  rng: Rng,
  emit: Emit,
): RewardLine[] | null {
  if (tier < 1 || tier > passTier(s) || s.progress.passClaimed.includes(tier)) return null;
  s.progress.passClaimed = [...s.progress.passClaimed, tier];
  addStat(s, 'passClaims');
  return applyReward(s, passReward(tier), rng, emit);
}

// --- Chronik ---------------------------------------------------------------------------------------

export function conditionProgress(
  s: GameState,
  c: ChronicleCondition,
): { value: number; target: number } {
  switch (c.kind) {
    case 'stat':
      return { value: s.stats[c.key] ?? 0, target: c.gte };
    case 'totalLevel':
      return { value: totalLevel(s), target: c.gte };
    case 'building':
      return { value: bestBuilding(s, c.id), target: c.gte };
    case 'heroLevel':
      return { value: s.hero.level, target: c.gte };
    case 'heroPoints': {
      const a = s.hero.attrs;
      return { value: a.power + a.offense + a.defense + a.resources, target: c.gte };
    }
    case 'riftMinutes':
      return { value: s.stats.riftBestMinutes ?? 0, target: c.gte };
    case 'evolutions':
      return { value: s.rift.evolutions.length, target: c.gte };
  }
}

export function currentChronicle(s: GameState) {
  const step = CHRONICLE[s.progress.chronicle];
  if (!step) return null;
  const p = conditionProgress(s, step.condition);
  return { step, index: s.progress.chronicle, ...p, done: p.value >= p.target };
}

export function claimChronicle(s: GameState, rng: Rng, emit: Emit): RewardLine[] | null {
  const cur = currentChronicle(s);
  if (!cur?.done) return null;
  s.progress.chronicle++;
  addStat(s, 'chronicleSteps');
  return applyReward(s, cur.step.reward, rng, emit);
}

/** Badge count for "things to collect" (daily + pass + chronicle). */
export function rewardsWaiting(s: GameState, now: number): number {
  return (
    (dailyAvailable(s, now) ? 1 : 0) + passClaimable(s).length + (currentChronicle(s)?.done ? 1 : 0)
  );
}
