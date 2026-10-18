import { getItem, ITEM_MAP, SKILL_MAP, TECH_MAP } from '../data';
import {
  BASE_PROVISIONS,
  BASE_STATS,
  BIOMES,
  ECHO_ESSENCE,
  ECHO_INTERVAL,
  HEROES,
  MULTIPLICATIVE_STATS,
  RIFT_TALENTS,
  RIFT_WEAPONS,
  riftIslandBonus,
  type RiftStats,
} from '../data/rift';
import type { RunConfig, RunResult } from '../rift/sim';
import { gainItem, registerTimeEffect } from './actions';
import { combatLevel } from './combat';
import type { Emit } from './events';
import { itemCount, removeItem } from './inventory';
import { invalidateMods, registerModifierSource } from './modifiers';
import type { Rng } from './rng';
import { hasTech } from './science';
import { skillLevel } from './skills';
import { addStat, type GameState } from './state';
import { villageRiftBonus, villageTribute } from './village';

export const RIFT_TALENT_MAP = new Map(RIFT_TALENTS.map((t) => [t.id, t]));

registerModifierSource('rift', (s) =>
  s.rift.essenceTotal > 0 ? [riftIslandBonus(s.rift.essenceTotal)] : [],
);

export function riftTalentLevel(s: GameState, id: string): number {
  return s.rift.talents[id] ?? 0;
}

export function riftTalentCost(s: GameState, id: string): number {
  const def = RIFT_TALENT_MAP.get(id);
  return def ? def.cost(riftTalentLevel(s, id) + 1) : Infinity;
}

export type RiftResultCode = { ok: true } | { ok: false; reason: string };

export function buyRiftTalent(s: GameState, id: string): RiftResultCode {
  const def = RIFT_TALENT_MAP.get(id);
  if (!def) return { ok: false, reason: 'unknown' };
  if (riftTalentLevel(s, id) >= def.maxLevel) return { ok: false, reason: 'max' };
  const cost = riftTalentCost(s, id);
  if (s.rift.essence < cost) return { ok: false, reason: 'essence' };
  s.rift.essence -= cost;
  s.rift.talents[id] = riftTalentLevel(s, id) + 1;
  addStat(s, 'riftTalents');
  return { ok: true };
}

// --- Unlocks (the main game opens the rift) ------------------------------------------------------

export function heroUnlocked(s: GameState, id: string): boolean {
  const hero = HEROES.find((h) => h.id === id);
  if (!hero) return false;
  const u = hero.unlock;
  if (!u) return true;
  return 'tech' in u ? hasTech(s, u.tech) : skillLevel(s, u.skill) >= u.level;
}

export function heroUnlockText(id: string): string {
  const u = HEROES.find((h) => h.id === id)?.unlock;
  if (!u) return '';
  if ('tech' in u) return `Forschung: ${TECH_MAP.get(u.tech)?.name ?? u.tech}`;
  return `${SKILL_MAP.get(u.skill)?.name ?? u.skill} Level ${u.level}`;
}

/** Biome i opens after surviving 10 minutes in biome i−1 – or with enough combat experience. */
export function biomeUnlocked(s: GameState, id: string): boolean {
  const i = BIOMES.findIndex((b) => b.id === id);
  if (i <= 0) return i === 0;
  const prev = BIOMES[i - 1]!;
  const survived = (s.rift.best[prev.id]?.time ?? 0) >= 600;
  return survived || combatLevel(s) >= 15 + i * 15;
}

export function weaponUnlocked(s: GameState, id: string): boolean {
  const def = RIFT_WEAPONS.find((w) => w.id === id);
  if (!def || def.evolvesFrom) return false;
  return !def.unlockTech || hasTech(s, def.unlockTech);
}

/** Weapons that can appear in level-ups (plus the hero's own weapon, always). */
export function weaponPool(s: GameState, hero: string): string[] {
  const own = HEROES.find((h) => h.id === hero)?.weapon;
  return RIFT_WEAPONS.filter(
    (w) => !w.evolvesFrom && (w.id === own || weaponUnlocked(s, w.id)),
  ).map((w) => w.id);
}

// --- Run setup ------------------------------------------------------------------------------------

/** Hero stats: base + hero bonus + rift talents + island combat skills. */
export function runStats(s: GameState, hero: string): RiftStats {
  const out: RiftStats = { ...BASE_STATS };
  const def = HEROES.find((h) => h.id === hero);
  for (const [k, v] of Object.entries(def?.bonus ?? {}) as [keyof RiftStats, number][]) out[k] += v;
  for (const t of RIFT_TALENTS) {
    const level = riftTalentLevel(s, t.id);
    if (!level || !t.stat || !t.perLevel) continue;
    const add = t.perLevel * level;
    if (MULTIPLICATIVE_STATS.includes(t.stat)) out[t.stat] += BASE_STATS[t.stat] * add;
    else out[t.stat] += add;
  }
  // The island trains the hero: combat skills give small permanent boni.
  out.might += skillLevel(s, 'melee') * 0.0025;
  out.cooldown -= Math.min(0.1, skillLevel(s, 'ranged') * 0.001);
  out.area += skillLevel(s, 'magic') * 0.002;
  out.armor += Math.floor(skillLevel(s, 'defence') / 25);
  out.maxHp += skillLevel(s, 'hitpoints');
  // The village forges and fortifies: smithy → might, wall → armor.
  const village = villageRiftBonus(s);
  out.might += village.might;
  out.armor += village.armor;
  return out;
}

export function provisionSlots(s: GameState): number {
  return BASE_PROVISIONS + riftTalentLevel(s, 't_provisions');
}

/** Heal a food item gives inside the rift (island heal is tiny, rift HP is large). */
export function riftHeal(item: string): number {
  return (ITEM_MAP.get(item)?.heal ?? 0) * 4 + 10;
}

/** Best healing food from the inventory, up to the provision slots. */
export function autoProvisions(s: GameState): string[] {
  const foods = Object.keys(s.inventory)
    .filter((id) => (ITEM_MAP.get(id)?.heal ?? 0) > 0 && itemCount(s, id) > 0)
    .sort((a, b) => riftHeal(b) - riftHeal(a));
  const out: string[] = [];
  for (const id of foods) {
    for (let i = 0; i < itemCount(s, id) && out.length < provisionSlots(s); i++) out.push(id);
    if (out.length >= provisionSlots(s)) break;
  }
  return out;
}

export function canStartRun(s: GameState, hero: string, biome: string): RiftResultCode {
  if (!heroUnlocked(s, hero)) return { ok: false, reason: 'hero' };
  if (!biomeUnlocked(s, biome)) return { ok: false, reason: 'biome' };
  return { ok: true };
}

/** Builds the run config and packs the provisions (food leaves the inventory). */
export function prepareRun(s: GameState, hero: string, biome: string, rng: Rng): RunConfig | null {
  if (!canStartRun(s, hero, biome).ok) return null;
  const provisions: number[] = [];
  for (const item of autoProvisions(s)) {
    if (removeItem(s, item, 1)) provisions.push(riftHeal(item));
  }
  s.rift.hero = hero;
  s.rift.biome = biome;
  s.rift.runs++;
  addStat(s, 'riftRuns');
  return {
    hero,
    biome,
    seed: Math.floor(rng() * 2 ** 31),
    stats: runStats(s, hero),
    startWeaponLevel: 1 + (s.equipment.weapon ? 1 : 0),
    pool: weaponPool(s, hero),
    rerolls: 2 * riftTalentLevel(s, 't_reroll'),
    skips: riftTalentLevel(s, 't_skip'),
    banishes: riftTalentLevel(s, 't_banish'),
    revives: riftTalentLevel(s, 't_revival'),
    provisions,
  };
}

// --- Rewards --------------------------------------------------------------------------------------

export interface RiftReward {
  essence: number;
  items: { item: string; qty: number }[];
  /** Resources of each kind shipped to the active village. */
  village: number;
  record: boolean;
}

export function essenceFor(s: GameState, r: RunResult): number {
  const biome = Math.max(
    0,
    BIOMES.findIndex((b) => b.id === r.biome),
  );
  const base =
    r.time / 12 + r.kills / 40 + r.level * 0.8 + r.bossKills * 12 + r.elites * 3 + r.bonusEssence;
  const won = r.won ? 1.5 : 1;
  const greed = 1 + 0.1 * riftTalentLevel(s, 't_greed');
  return Math.round(base * (1 + 0.6 * biome) * won * greed + (r.won ? 40 : 0));
}

export function finishRun(s: GameState, r: RunResult, rng: Rng, emit: Emit): RiftReward {
  const essence = essenceFor(s, r);
  s.rift.essence += essence;
  s.rift.essenceTotal += essence;
  const best = s.rift.best[r.biome] ?? { time: 0, kills: 0, level: 0 };
  const record = r.time > best.time + 0.5;
  s.rift.best[r.biome] = {
    time: Math.max(best.time, r.time),
    kills: Math.max(best.kills, r.kills),
    level: Math.max(best.level, r.level),
  };
  for (const evo of r.evolutions) if (!s.rift.evolutions.includes(evo)) s.rift.evolutions.push(evo);
  if (r.won) {
    s.rift.wins++;
    addStat(s, 'riftWins');
  }
  addStat(s, 'riftKills', r.kills);
  addStat(s, 'riftBossKills', r.bossKills);
  addStat(s, 'riftEssence', essence);
  s.stats.riftBestMinutes = Math.max(s.stats.riftBestMinutes ?? 0, Math.floor(r.time / 60));

  // Loot for the island: aether cores, rare artefacts, a chest for a victory.
  const items: { item: string; qty: number }[] = [];
  const minutes = r.time / 60;
  const biome = Math.max(
    0,
    BIOMES.findIndex((b) => b.id === r.biome),
  );
  const aether = Math.floor(minutes / 3) + r.bossKills;
  if (aether > 0) items.push({ item: 'aether', qty: aether * (1 + biome) });
  if (rng() < 0.05 * minutes) items.push({ item: 'mana_crystal', qty: 1 + biome });
  if (r.bossKills > 0 && rng() < 0.3 + 0.1 * biome) items.push({ item: 'void_shard', qty: 1 });
  if (r.won) items.push({ item: 'dungeon_chest', qty: 1 + biome });
  for (const it of items)
    if (ITEM_MAP.has(it.item)) gainItem(s, it.item, it.qty, emit, it.item !== 'aether');

  // Tribute for the village: rift spoils are shipped as resources.
  const village = Math.round((Math.floor(minutes) * 40 + r.bossKills * 200) * (1 + biome));
  if (village > 0) villageTribute(s, village);
  invalidateMods(s);
  emit({ type: 'riftFinished', essence, won: r.won, time: r.time, kills: r.kills, record });
  return { essence, items, village, record };
}

/** Food names for the UI. */
export function provisionNames(ids: string[]): string {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, n]) => `${n}× ${getItem(id).icon}`).join(' ');
}

// --- Echo runs (idle) -------------------------------------------------------------------------------

export function echoEssence(s: GameState): number {
  const level = riftTalentLevel(s, 't_echo');
  const unlocked = BIOMES.filter((b) => biomeUnlocked(s, b.id)).length;
  return Math.round(ECHO_ESSENCE * level * (1 + 0.5 * (unlocked - 1)));
}

registerTimeEffect('riftEcho', {
  next: (s) => (riftTalentLevel(s, 't_echo') > 0 ? Math.max(0, s.rift.echo) : Infinity),
  apply: (s, dt, emit) => {
    if (riftTalentLevel(s, 't_echo') <= 0) return;
    s.rift.echo -= dt;
    if (s.rift.echo > 1e-9) return;
    s.rift.echo = ECHO_INTERVAL;
    const essence = echoEssence(s);
    s.rift.essence += essence;
    s.rift.essenceTotal += essence;
    addStat(s, 'riftEchoes');
    invalidateMods(s);
    emit({ type: 'riftEcho', essence });
  },
});
