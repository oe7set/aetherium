import { ITEM_MAP } from '../data';
import {
  ADVENTURE_AUTO_WAIT,
  ADVENTURE_LIFETIME,
  ADVENTURE_NAMES,
  ADVENTURE_SPAWN,
  DISMANTLE_ESSENCE,
  HERO_AVATARS,
  HERO_BAG_SIZE,
  HERO_ITEMS,
  HERO_MAX_LEVEL,
  HERO_REGEN,
  HERO_SPEED,
  heroXpForLevel,
  MAX_ADVENTURES,
  MAX_ATTR,
  POINTS_PER_LEVEL,
  TIER_MULT,
  type HeroAttr,
  type HeroSlot,
} from '../data/hero';
import { BIOMES } from '../data/rift';
import { SPEED, STORAGE, V_RESOURCES } from '../data/village';
import { gainItem, registerTimeEffect } from './actions';
import type { Emit } from './events';
import { invalidateMods, mod, registerModifierSource } from './modifiers';
import type { Rng } from './rng';
import { addStat, type Adventure, type GameState, type HeroItem, type Village } from './state';

export const HERO_ITEM_MAP = new Map(HERO_ITEMS.map((i) => [i.id, i]));

export type HeroResult = { ok: true } | { ok: false; reason: string };
const OK: HeroResult = { ok: true };
const fail = (reason: string): HeroResult => ({ ok: false, reason });

// --- Stats ----------------------------------------------------------------------------------------

export function itemStats(item: HeroItem): Record<string, number> {
  const def = HERO_ITEM_MAP.get(item.base);
  const mult = TIER_MULT[item.tier] ?? 1;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(def?.stats ?? {})) out[k] = v * mult;
  return out;
}

/** Summed stats of all equipped items. */
export function heroBonus(s: GameState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const uid of Object.values(s.hero.equipped)) {
    const item = s.hero.bag.find((i) => i.uid === uid);
    if (!item) continue;
    for (const [k, v] of Object.entries(itemStats(item))) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

export function heroStat(s: GameState, key: string): number {
  return heroBonus(s)[key] ?? 0;
}

export function heroAlive(s: GameState): boolean {
  return s.hero.status !== 'dead' && s.hero.health > 0;
}

/** Hero is at home in this village and can join raids, defend or annex oases. */
export function heroAtHome(s: GameState, villageId: number): boolean {
  return heroAlive(s) && s.hero.status === 'home' && s.hero.home === villageId;
}

/** Fighting strength (attack and defence) like the Travian hero. */
export function heroStrength(s: GameState): number {
  return 100 + s.hero.level * 20 + s.hero.attrs.power * 40 + heroStat(s, 'heroPower') * 10;
}

export function heroDefense(s: GameState): number {
  return heroStrength(s) + heroStat(s, 'heroDef') * 10;
}

/** Bonus for troops marching with the hero. */
export function heroOffenseBonus(s: GameState): number {
  return s.hero.attrs.offense * 0.002 + heroStat(s, 'raidAttack');
}

export function heroDefenseBonus(s: GameState): number {
  return s.hero.attrs.defense * 0.002;
}

/** Production bonus for the hero's home village. */
export function heroResourceBonus(s: GameState, villageId: number): number {
  if (s.hero.home !== villageId || s.hero.status === 'dead') return 0;
  return s.hero.attrs.resources * 0.0025 + heroStat(s, 'resources');
}

/** Rift / dungeon stat boni from level, attributes, equipment and health. */
export function heroRiftStats(s: GameState): {
  hpMult: number;
  might: number;
  cooldown: number;
  armor: number;
  area: number;
  speed: number;
  luck: number;
  magnet: number;
  growth: number;
} {
  const h = s.hero;
  const healthFactor = 0.6 + 0.4 * (h.health / 100);
  return {
    hpMult: (1 + 0.02 * (h.level - 1) + heroStat(s, 'riftHp')) * healthFactor,
    might: h.attrs.power * 0.003 + heroStat(s, 'riftMight'),
    cooldown: -Math.min(0.1, h.attrs.offense * 0.001),
    armor: Math.floor(h.attrs.defense / 25) + heroStat(s, 'riftArmor'),
    area: heroStat(s, 'riftArea'),
    speed: heroStat(s, 'riftSpeed'),
    luck: heroStat(s, 'riftLuck'),
    magnet: heroStat(s, 'riftMagnet'),
    growth: heroStat(s, 'riftGrowth'),
  };
}

registerModifierSource('hero', (s) => {
  const xp = heroStat(s, 'xp');
  return xp ? [{ xp }] : [];
});

// --- Progression ----------------------------------------------------------------------------------

export function gainHeroXp(s: GameState, amount: number, emit: Emit): void {
  const h = s.hero;
  if (h.level >= HERO_MAX_LEVEL || amount <= 0) return;
  h.xp += amount * (1 + heroStat(s, 'heroXp'));
  addStat(s, 'heroXp', amount);
  while (h.level < HERO_MAX_LEVEL && h.xp >= heroXpForLevel(h.level)) {
    h.xp -= heroXpForLevel(h.level);
    h.level++;
    h.points += POINTS_PER_LEVEL;
    s.stats.heroLevel = h.level;
    emit({ type: 'heroLevel', level: h.level });
  }
}

export function assignPoints(s: GameState, attr: HeroAttr, n = 1): HeroResult {
  const h = s.hero;
  const k = Math.min(n, h.points, MAX_ATTR - h.attrs[attr]);
  if (k <= 0) return fail(h.points <= 0 ? 'points' : 'max');
  h.attrs[attr] += k;
  h.points -= k;
  invalidateMods(s);
  return OK;
}

/** Re-spec: all points back (costs 50 essence per level). */
export function resetPoints(s: GameState): HeroResult {
  const cost = 50 * s.hero.level;
  if (s.rift.essence < cost) return fail('essence');
  s.rift.essence -= cost;
  const h = s.hero;
  h.points += h.attrs.power + h.attrs.offense + h.attrs.defense + h.attrs.resources;
  h.attrs = { power: 0, offense: 0, defense: 0, resources: 0 };
  invalidateMods(s);
  return OK;
}

export function setHeroLook(s: GameState, name: string, avatar: string): void {
  const clean = name.trim().slice(0, 24);
  if (clean) s.hero.name = clean;
  if (HERO_AVATARS.includes(avatar) || s.progress.avatars.includes(avatar)) s.hero.avatar = avatar;
}

/** Health change; at 0 the hero falls and must be revived. */
export function hurtHero(s: GameState, amount: number, emit: Emit): void {
  const h = s.hero;
  h.health = Math.max(0, Math.min(100, h.health - amount));
  if (h.health <= 0 && h.status !== 'dead') {
    h.status = 'dead';
    h.trip = null;
    h.at = null;
    h.revive = 0;
    addStat(s, 'heroDeaths');
    emit({ type: 'heroDied' });
  }
}

// --- Equipment ------------------------------------------------------------------------------------

export function rollHeroItem(
  s: GameState,
  rng: Rng,
  level: number,
  hard: boolean,
  minTier = 1,
): HeroItem | null {
  if (s.hero.bag.length >= HERO_BAG_SIZE) return null;
  const def = HERO_ITEMS[Math.floor(rng() * HERO_ITEMS.length)]!;
  const r = rng();
  const p3 = Math.min(0.25, 0.01 * level + (hard ? 0.05 : 0));
  const p2 = Math.min(0.55, 0.15 + 0.025 * level + (hard ? 0.1 : 0));
  const tier = Math.max(minTier, r < p3 ? 3 : r < p3 + p2 ? 2 : 1);
  const item: HeroItem = { uid: s.hero.nextUid++, base: def.id, tier };
  s.hero.bag = [...s.hero.bag, item];
  addStat(s, 'heroItems');
  return item;
}

export function equipHeroItem(s: GameState, uid: number): HeroResult {
  const item = s.hero.bag.find((i) => i.uid === uid);
  const def = item && HERO_ITEM_MAP.get(item.base);
  if (!item || !def) return fail('illegal');
  s.hero.equipped = { ...s.hero.equipped, [def.slot]: uid };
  invalidateMods(s);
  return OK;
}

export function unequipSlot(s: GameState, slot: HeroSlot): void {
  const next = { ...s.hero.equipped };
  delete next[slot];
  s.hero.equipped = next;
  invalidateMods(s);
}

export function isEquipped(s: GameState, uid: number): boolean {
  return Object.values(s.hero.equipped).includes(uid);
}

/** Dismantles an item into rift essence. */
export function dismantleItem(s: GameState, uid: number): HeroResult {
  const item = s.hero.bag.find((i) => i.uid === uid);
  if (!item) return fail('illegal');
  if (isEquipped(s, uid)) return fail('equipped');
  s.hero.bag = s.hero.bag.filter((i) => i.uid !== uid);
  const essence = DISMANTLE_ESSENCE[item.tier] ?? 0;
  s.rift.essence += essence;
  s.rift.essenceTotal += essence;
  return OK;
}

// --- Adventures -----------------------------------------------------------------------------------

function homeVillage(s: GameState): Village {
  return s.village.villages.find((v) => v.id === s.hero.home) ?? s.village.villages[0]!;
}

export function heroTravelTime(s: GameState, dist: number): number {
  const speed = HERO_SPEED * (1 + heroStat(s, 'heroSpeed') + mod(s, 'hero.travel'));
  return Math.max(5, Math.round(((dist / speed) * 3600) / SPEED));
}

export function adventureDistance(s: GameState, a: Adventure): number {
  const v = homeVillage(s);
  return Math.hypot(a.x - v.x, a.y - v.y);
}

export function spawnAdventure(s: GameState, rng: Rng): Adventure | null {
  const h = s.hero;
  if (h.adventures.length >= MAX_ADVENTURES) return null;
  const v = homeVillage(s);
  const angle = rng() * Math.PI * 2;
  const dist = 2 + rng() * 9;
  const x = Math.round(v.x + Math.cos(angle) * dist);
  const y = Math.round(v.y + Math.sin(angle) * dist);
  // Around the hero's own level: close ones a little easier, far ones a little harder.
  const level = Math.max(1, Math.round(h.level + (dist - 6) / 3 + rng() * 2 - 1));
  // Four hero levels per biome: the 7th biome (Frostgipfel, difficulty 11) waits until level 25.
  const biome = BIOMES[Math.min(BIOMES.length - 1, Math.floor((level - 1) / 4))]!;
  const names = ADVENTURE_NAMES[biome.id] ?? ['Abenteuer'];
  const adv: Adventure = {
    id: h.nextAdventureId++,
    x,
    y,
    biome: biome.id,
    level,
    hard: rng() < 0.25,
    name: names[Math.floor(rng() * names.length)]!,
    expires: ADVENTURE_LIFETIME,
  };
  h.adventures = [...h.adventures, adv];
  return adv;
}

export function canStartAdventure(s: GameState, id: number): HeroResult {
  const h = s.hero;
  if (!h.adventures.some((a) => a.id === id)) return fail('illegal');
  if (h.status === 'dead') return fail('dead');
  if (h.status !== 'home') return fail('busy');
  if (h.health < 10) return fail('health');
  return OK;
}

export function startAdventure(s: GameState, id: number): HeroResult {
  const check = canStartAdventure(s, id);
  if (!check.ok) return check;
  const a = s.hero.adventures.find((x) => x.id === id)!;
  const time = heroTravelTime(s, adventureDistance(s, a));
  s.hero.status = 'moving';
  s.hero.trip = { kind: 'adventure', target: id, remaining: time, total: time };
  return OK;
}

/**
 * Danger rating of an adventure for auto-resolve, relative to the strength a hero of that level
 * usually has (100 + 60/level): an even match succeeds ~62 %, a hard one ~51 %, easier ones more.
 */
export function adventureDanger(a: Adventure): number {
  return (100 + 60 * a.level) * 0.6 * (a.hard ? 1.6 : 1);
}

/** Chance that an automatic exploration succeeds. */
export function autoChance(s: GameState, a: Adventure): number {
  const score = heroStrength(s) * (0.5 + s.hero.health / 200);
  return Math.max(0.05, Math.min(0.97, score / (score + adventureDanger(a))));
}

export interface AdventureReward {
  success: boolean;
  xp: number;
  item: HeroItem | null;
  resources: number;
  essence: number;
  health: number;
  islandItem: string | null;
}

/** Shared reward logic. `quality` 0..1.2 (live dungeons pay better than auto). */
export function grantAdventure(
  s: GameState,
  a: Adventure,
  success: boolean,
  quality: number,
  healthLoss: number,
  rng: Rng,
  emit: Emit,
): AdventureReward {
  const h = s.hero;
  const mult = (a.hard ? 2 : 1) * quality * (success ? 1 : 0.3);
  const xp = Math.round(80 * a.level * mult);
  gainHeroXp(s, xp, emit);
  const loot = 1 + heroStat(s, 'loot');
  let item: HeroItem | null = null;
  if (success && rng() < (a.hard ? 0.85 : 0.5) * loot * Math.min(1.2, quality))
    item = rollHeroItem(s, rng, a.level, a.hard);
  // Resources for the home village.
  const resources = Math.round(150 * a.level * mult * loot);
  const v = homeVillage(s);
  for (const r of V_RESOURCES) {
    const cap =
      STORAGE[
        Math.min(STORAGE.length - 1, v.buildings[r === 'crop' ? 'granary' : 'warehouse'] ?? 0)
      ]!;
    v.res[r] = Math.min(cap, v.res[r] + resources);
  }
  const essence = Math.round(6 * a.level * mult);
  s.rift.essence += essence;
  s.rift.essenceTotal += essence;
  let islandItem: string | null = null;
  if (success && rng() < 0.4 * loot) {
    const pool = ['aether', 'mana_crystal', 'research_notes', 'coin_pouch', 'gem_ruby'].filter(
      (i) => ITEM_MAP.has(i),
    );
    islandItem = pool[Math.floor(rng() * pool.length)] ?? null;
    if (islandItem) gainItem(s, islandItem, 1 + Math.floor(a.level / 4), emit, true);
  }
  h.adventures = h.adventures.filter((x) => x.id !== a.id);
  h.at = null;
  addStat(s, success ? 'heroAdventures' : 'heroAdventuresFailed');
  emit({
    type: 'heroAdventure',
    name: a.name,
    success,
    xp,
    item: item?.base ?? null,
    tier: item?.tier ?? 0,
  });
  hurtHero(s, healthLoss, emit);
  // Walk home (unless fallen).
  if (h.status !== 'dead') {
    const time = heroTravelTime(s, adventureDistance(s, a));
    h.status = 'moving';
    h.trip = { kind: 'return', target: a.id, remaining: time, total: time };
  }
  invalidateMods(s);
  return { success, xp, item, resources, essence, health: healthLoss, islandItem };
}

/** "Automatisch erkunden": resolves the adventure the hero waits at. */
export function autoAdventure(s: GameState, rng: Rng, emit: Emit): AdventureReward | null {
  const a = s.hero.adventures.find((x) => x.id === s.hero.at);
  if (!a || s.hero.status !== 'adventure') return null;
  const chance = autoChance(s, a);
  const success = rng() < chance;
  const loss = success ? Math.round(5 + 35 * (1 - chance) * rng()) : Math.round(40 + 40 * rng());
  return grantAdventure(s, a, success, 0.7, loss, rng, emit);
}

/** The adventure the hero is currently standing at. */
export function currentAdventure(s: GameState): Adventure | null {
  return s.hero.status === 'adventure'
    ? (s.hero.adventures.find((x) => x.id === s.hero.at) ?? null)
    : null;
}

// --- Revive ---------------------------------------------------------------------------------------

export function reviveCost(s: GameState): number {
  return 120 * s.hero.level;
}

export function reviveTime(s: GameState): number {
  return (10 + 2 * s.hero.level) * 60;
}

/** Revives the hero in the home village (resources + time). Free after 4 hours anyway. */
export function reviveHero(s: GameState): HeroResult {
  const h = s.hero;
  if (h.status !== 'dead') return fail('illegal');
  if (h.revive > 0) return fail('busy');
  const v = homeVillage(s);
  const cost = reviveCost(s);
  if (V_RESOURCES.some((r) => v.res[r] < cost)) return fail('resources');
  for (const r of V_RESOURCES) v.res[r] -= cost;
  h.revive = reviveTime(s);
  return OK;
}

export function moveHeroHome(s: GameState, villageId: number): HeroResult {
  if (!s.village.villages.some((v) => v.id === villageId)) return fail('illegal');
  if (s.hero.status !== 'home' && s.hero.status !== 'dead') return fail('busy');
  s.hero.home = villageId;
  invalidateMods(s);
  return OK;
}

// --- Time -----------------------------------------------------------------------------------------

/** Natural revival after this long, even without paying. */
export const FREE_REVIVE = 4 * 3600;

registerTimeEffect('hero', {
  next: (s) => {
    const h = s.hero;
    let next = h.adventureIn;
    if (h.trip) next = Math.min(next, h.trip.remaining);
    if (h.status === 'adventure') next = Math.min(next, h.autoIn);
    if (h.status === 'dead')
      next = Math.min(next, h.revive > 0 ? h.revive : FREE_REVIVE + h.revive);
    for (const a of h.adventures) if (a.id !== h.at) next = Math.min(next, a.expires);
    return Math.max(0, next);
  },
  apply: (s, dt, emit, rng) => {
    if (dt <= 0) return;
    const h = s.hero;
    if (h.status !== 'dead' && h.health < 100)
      h.health = Math.min(100, h.health + ((HERO_REGEN + heroStat(s, 'regen')) * dt) / 3600);
    // Adventures appear and fade.
    h.adventureIn -= dt;
    if (h.adventureIn <= 1e-6) {
      h.adventureIn = ADVENTURE_SPAWN;
      spawnAdventure(s, rng);
    }
    if (h.adventures.length) {
      for (const a of h.adventures)
        if (a.id !== h.at && !(h.trip?.kind === 'adventure' && h.trip.target === a.id))
          a.expires -= dt;
      if (h.adventures.some((a) => a.expires <= 0))
        h.adventures = h.adventures.filter((a) => a.expires > 0);
    }
    if (h.trip) {
      h.trip.remaining -= dt;
      if (h.trip.remaining <= 1e-6) {
        const trip = h.trip;
        h.trip = null;
        if (trip.kind === 'adventure') {
          h.status = 'adventure';
          h.at = trip.target;
          h.autoIn = ADVENTURE_AUTO_WAIT;
          emit({ type: 'heroArrived' });
        } else h.status = 'home';
      }
    } else if (h.status === 'adventure') {
      h.autoIn -= dt;
      if (h.autoIn <= 1e-6) autoAdventure(s, rng, emit);
    }
    if (h.status === 'dead') {
      if (h.revive > 0) {
        h.revive -= dt;
        if (h.revive <= 1e-6) finishRevive(s, emit);
      } else {
        // Negative counter = time spent dead without paying.
        h.revive -= dt;
        if (-h.revive >= FREE_REVIVE) finishRevive(s, emit);
      }
    }
  },
});

function finishRevive(s: GameState, emit: Emit): void {
  const h = s.hero;
  h.status = 'home';
  h.health = 100;
  h.revive = 0;
  emit({ type: 'heroRevived' });
}

/** Badge for the hero tab: unspent points, an adventure waiting to be played, a fallen hero. */
export function heroAttention(s: GameState): number {
  const h = s.hero;
  return (
    (h.points > 0 ? 1 : 0) +
    (h.status === 'adventure' ? 1 : 0) +
    (h.status === 'dead' && h.revive <= 0 ? 1 : 0)
  );
}

export const HERO_STATUS_TEXT: Record<string, string> = {
  home: 'zu Hause',
  moving: 'unterwegs',
  adventure: 'im Abenteuer',
  raid: 'auf Raubzug',
  dead: 'gefallen',
};
