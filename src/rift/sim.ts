// Ätherriss run simulation. Pure TypeScript (no DOM): the canvas renderer only reads this state.
// Deterministic for a given seed and input sequence, so tests can replay runs.
import {
  BASE_STATS,
  BIOMES,
  EXAMINER,
  WEEKLY_BOSS,
  HEROES,
  MAX_PASSIVES,
  MAX_WEAPONS,
  MULTIPLICATIVE_STATS,
  RIFT_PASSIVES,
  RIFT_WEAPONS,
  RUN_MINUTES,
  WEAPON_MAX_LEVEL,
  type BiomeDef,
  type EnemyDef,
  type RiftStats,
  type WeaponDef,
  type WeaponStats,
} from '../data/rift';
import { createRng, type Rng } from '../engine/rng';
import { SHRINE_EVERY, SHRINE_OPTIONS, type ShrineOption } from '../data/riftCurses';

export const WEAPON_MAP = new Map(RIFT_WEAPONS.map((w) => [w.id, w]));
export const PASSIVE_MAP = new Map(RIFT_PASSIVES.map((p) => [p.id, p]));
const ENEMY_MAP = new Map<string, EnemyDef>(
  [...BIOMES.flatMap((b) => [...b.enemies, ...b.bosses]), EXAMINER, WEEKLY_BOSS].map((d) => [
    d.id,
    d,
  ]),
);

export const HERO_RADIUS = 14;
/** Spawn ring distance (just outside the visible area on phones). */
const SPAWN_MIN = 470;
const SPAWN_MAX = 560;
const MAX_ENEMIES = 360;
const MAX_FX_TEXT = 70;
const GRID = 64;

// --- State ----------------------------------------------------------------------------------------

export interface Enemy {
  id: number;
  def: EnemyDef;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  xp: number;
  elite: boolean;
  boss: boolean;
  final: boolean;
  /** Knockback velocity. */
  kx: number;
  ky: number;
  /** Fixed direction for swarm enemies. */
  dx: number;
  dy: number;
  timer: number;
  /** Second timer for bosses with two attacks (warlord: volley, then summons). */
  alt: number;
  flash: number;
  /** Seconds of shielding left (from a nearby shielder): incoming damage is reduced. */
  shield: number;
  /** Per-source hit times for continuous damage (auras, orbits, zones). */
  hits: Record<string, number>;
  dead: boolean;
}

export type ProjectileKind = 'thrown' | 'boomerang' | 'orbit' | 'aimed' | 'lob';

export interface Projectile {
  id: number;
  weapon: string;
  kind: ProjectileKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Boomerang: deceleration direction. */
  ax: number;
  ay: number;
  damage: number;
  radius: number;
  pierce: number;
  life: number;
  maxLife: number;
  knockback: number;
  angle: number;
  /** Orbit index / lob target. */
  slot: number;
  tx: number;
  ty: number;
  hit: number[];
  dead: boolean;
}

export interface EnemyShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
}

export interface Zone {
  weapon: string;
  kind: 'puddle' | 'well';
  x: number;
  y: number;
  radius: number;
  damage: number;
  life: number;
  maxLife: number;
  pull: number;
  tick: number;
}

export interface Gem {
  x: number;
  y: number;
  xp: number;
  magnet: boolean;
}

export type PickupKind = 'chest' | 'heal' | 'magnet' | 'bomb' | 'shrine';
export interface Pickup {
  kind: PickupKind;
  x: number;
  y: number;
}

export type Fx =
  | {
      type: 'beam';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      color: string;
      life: number;
      max: number;
    }
  | { type: 'ring'; x: number; y: number; r: number; color: string; life: number; max: number }
  | { type: 'bolt'; points: number[]; color: string; life: number; max: number }
  | {
      type: 'sweep';
      x: number;
      y: number;
      dir: number;
      len: number;
      height: number;
      color: string;
      life: number;
      max: number;
    }
  | {
      type: 'text';
      x: number;
      y: number;
      text: string;
      color: string;
      life: number;
      max: number;
      big: boolean;
    }
  | { type: 'burst'; x: number; y: number; color: string; life: number; max: number; size: number };

export interface OwnedWeapon {
  id: string;
  level: number;
  timer: number;
  /** Remaining active time (spin), alternating side (sweep). */
  active: number;
  angle: number;
  side: number;
}

export interface OwnedPassive {
  id: string;
  level: number;
}

export type Choice =
  | { kind: 'weapon'; id: string; level: number }
  | { kind: 'passive'; id: string; level: number }
  | { kind: 'heal' }
  | { kind: 'gold' };

export interface ChestResult {
  evolved: string | null;
  upgrades: Choice[];
}

export interface RunConfig {
  hero: string;
  biome: string;
  seed: number;
  /** Stats after meta talents and island bonuses (before in-run passives). */
  stats: RiftStats;
  /** Level of the hero's starting weapon. */
  startWeaponLevel: number;
  /** Weapons that may show up in level-ups. */
  pool: string[];
  rerolls: number;
  skips: number;
  banishes: number;
  revives: number;
  /** Food from the island inventory: heal per item. */
  provisions: number[];
  /** The player's hero avatar (sprite). */
  avatar?: string;
  /** 'dungeon' = adventure: shorter, mid boss at half time, the biome's big boss as final guardian. */
  mode?: 'rift' | 'dungeon';
  /** Run length in minutes (default 15). */
  minutes?: number;
  /** Extra enemy HP/damage multiplier. */
  difficulty?: number;
  /** Wochenboss: booked by `finishWeekly` instead of the adventure. */
  trial?: boolean;
  /** HUD label of the week's rule, e.g. "🌕 Blutmond". */
  trialLabel?: string;
  /** Endless rift: no examiner, a boss every 5 minutes, ends only on death. */
  endless?: boolean;
  /** Beschwörung: the active familiar follows the hero; fighters (power > 0) attack. */
  companion?: { icon: string; power: number };
  /** Flüche (ids, for the result) and their effect on the horde. */
  curses?: string[];
  spawnMult?: number;
  enemySpeed?: number;
  /** Shrines show up every few minutes (default on, off for the weekly boss). */
  shrines?: boolean;
  /** Tagesriss (fixed seed of the day). */
  daily?: boolean;
}

/** Minutes until the final boss of a run. */
export function runMinutes(config: RunConfig): number {
  return config.minutes ?? RUN_MINUTES;
}

export type RunPhase = 'playing' | 'levelup' | 'chest' | 'shrine' | 'paused' | 'dead' | 'won';

export interface RunState {
  config: RunConfig;
  biome: BiomeDef;
  rng: Rng;
  time: number;
  phase: RunPhase;
  stats: RiftStats;
  hero: {
    x: number;
    y: number;
    hp: number;
    fx: number;
    fy: number;
    moving: boolean;
    level: number;
    xp: number;
    xpNext: number;
    invuln: number;
    hurt: number;
  };
  weapons: OwnedWeapon[];
  passives: OwnedPassive[];
  enemies: Enemy[];
  projectiles: Projectile[];
  shots: EnemyShot[];
  zones: Zone[];
  gems: Gem[];
  pickups: Pickup[];
  fx: Fx[];
  kills: number;
  bossKills: number;
  elitesKilled: number;
  damageDealt: number;
  chestsOpened: number;
  evolutions: string[];
  pendingLevels: number;
  choices: Choice[];
  chest: ChestResult | null;
  rerolls: number;
  skips: number;
  banishes: number;
  banished: string[];
  revives: number;
  provisions: number[];
  foodEaten: number;
  /** Extra essence from 'gold' choices when everything is maxed. */
  bonusEssence: number;
  spawnTimer: number;
  swarmTimer: number;
  eliteTimer: number;
  bossesSpawned: string[];
  examinerSpawned: boolean;
  /** Endless mode: last boss wave spawned. */
  endlessWave: number;
  nextId: number;
  /** Shake intensity for the renderer. */
  shake: number;
  /** The familiar following the hero (position + attack timer). */
  companion: { x: number; y: number; timer: number } | null;
  /** Shrines: seconds to the next one, the open offer, stat boni and extra enemy HP gained. */
  shrineTimer: number;
  shrine: ShrineOption[] | null;
  shrinesUsed: number;
  bonus: Partial<RiftStats>;
  enemyHpMult: number;
}

// --- Setup ----------------------------------------------------------------------------------------

export function xpForLevel(level: number): number {
  if (level < 20) return 5 + (level - 1) * 7;
  if (level < 40) return 138 + (level - 20) * 11;
  return 358 + (level - 40) * 15;
}

export function createRun(config: RunConfig): RunState {
  const biome = BIOMES.find((b) => b.id === config.biome) ?? BIOMES[0]!;
  const hero = HEROES.find((h) => h.id === config.hero) ?? HEROES[0]!;
  const run: RunState = {
    config,
    biome,
    rng: createRng(config.seed),
    time: 0,
    phase: 'playing',
    stats: { ...config.stats },
    hero: {
      x: 0,
      y: 0,
      hp: config.stats.maxHp,
      fx: 1,
      fy: 0,
      moving: false,
      level: 1,
      xp: 0,
      xpNext: xpForLevel(1),
      invuln: 1,
      hurt: 0,
    },
    weapons: [],
    passives: [],
    enemies: [],
    projectiles: [],
    shots: [],
    zones: [],
    gems: [],
    pickups: [],
    fx: [],
    kills: 0,
    bossKills: 0,
    elitesKilled: 0,
    damageDealt: 0,
    chestsOpened: 0,
    evolutions: [],
    pendingLevels: 0,
    choices: [],
    chest: null,
    rerolls: config.rerolls,
    skips: config.skips,
    banishes: config.banishes,
    banished: [],
    revives: config.revives,
    provisions: [...config.provisions],
    foodEaten: 0,
    bonusEssence: 0,
    spawnTimer: 0.5,
    swarmTimer: 50,
    eliteTimer: 90,
    bossesSpawned: [],
    examinerSpawned: false,
    endlessWave: 0,
    nextId: 1,
    shake: 0,
    companion: config.companion ? { x: 0, y: 0, timer: 1 } : null,
    shrineTimer: SHRINE_EVERY * 0.6,
    shrine: null,
    shrinesUsed: 0,
    bonus: {},
    enemyHpMult: 1,
  };
  run.weapons.push(newWeapon(hero.weapon, Math.min(WEAPON_MAX_LEVEL, config.startWeaponLevel)));
  recomputeStats(run);
  run.hero.hp = run.stats.maxHp;
  return run;
}

function newWeapon(id: string, level = 1): OwnedWeapon {
  return { id, level, timer: 0.3, active: 0, angle: 0, side: 1 };
}

export function recomputeStats(run: RunState): void {
  const base = run.config.stats;
  const out: RiftStats = { ...base };
  for (const p of run.passives) {
    const def = PASSIVE_MAP.get(p.id);
    if (!def) continue;
    const add = def.perLevel * p.level;
    if (MULTIPLICATIVE_STATS.includes(def.stat)) out[def.stat] += BASE_STATS[def.stat] * add;
    else out[def.stat] += add;
  }
  for (const [k, v] of Object.entries(run.bonus) as [keyof RiftStats, number][]) out[k] += v;
  out.cooldown = Math.max(0.35, out.cooldown);
  const hpGain = out.maxHp - run.stats.maxHp;
  run.stats = out;
  if (hpGain > 0) run.hero.hp += hpGain;
}

/** A weapon's stats at a level, with the hero's multipliers applied. */
export function weaponStats(run: RunState | null, def: WeaponDef, level: number): WeaponStats {
  const s: WeaponStats = { ...def.base };
  for (let i = 0; i < level - 1 && i < def.levels.length; i++) {
    for (const [k, v] of Object.entries(def.levels[i]!) as [keyof WeaponStats, number][]) s[k] += v;
  }
  if (!run) return s;
  const st = run.stats;
  return {
    ...s,
    damage: s.damage * st.might,
    cooldown: Math.max(0.08, s.cooldown * st.cooldown),
    amount: s.amount + st.amount,
    area: s.area * st.area,
    duration: s.duration * st.duration,
    speed:
      def.behavior === 'orbit' || def.behavior === 'spin' || def.behavior === 'lob'
        ? s.speed
        : s.speed * st.speedMult,
  };
}

export function maxLevelOf(def: WeaponDef): number {
  return def.evolvesFrom ? 1 : Math.min(WEAPON_MAX_LEVEL, def.levels.length + 1);
}

// --- Helpers --------------------------------------------------------------------------------------

function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/** Uniform grid over living enemies, rebuilt every step. */
class EnemyGrid {
  private cells = new Map<number, Enemy[]>();
  build(enemies: Enemy[]): void {
    this.cells.clear();
    for (const e of enemies) {
      if (e.dead) continue;
      const k = this.key(Math.floor(e.x / GRID), Math.floor(e.y / GRID));
      let list = this.cells.get(k);
      if (!list) this.cells.set(k, (list = []));
      list.push(e);
    }
  }
  private key(cx: number, cy: number): number {
    return (cx + 32768) * 65536 + (cy + 32768);
  }
  query(x: number, y: number, r: number, fn: (e: Enemy) => void): void {
    const x0 = Math.floor((x - r) / GRID);
    const x1 = Math.floor((x + r) / GRID);
    const y0 = Math.floor((y - r) / GRID);
    const y1 = Math.floor((y + r) / GRID);
    for (let cx = x0; cx <= x1; cx++)
      for (let cy = y0; cy <= y1; cy++) {
        const list = this.cells.get(this.key(cx, cy));
        if (list) for (const e of list) if (!e.dead) fn(e);
      }
  }
}

const grid = new EnemyGrid();

function nearestEnemy(run: RunState, x: number, y: number, maxDist = 700): Enemy | null {
  let best: Enemy | null = null;
  let bd = maxDist * maxDist;
  for (const e of run.enemies) {
    if (e.dead) continue;
    const d = dist2(x, y, e.x, e.y);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}

function randomEnemyNear(run: RunState, range: number): Enemy | null {
  const h = run.hero;
  const r2 = range * range;
  const near = run.enemies.filter((e) => !e.dead && dist2(h.x, h.y, e.x, e.y) < r2);
  return near.length ? near[Math.floor(run.rng() * near.length)]! : null;
}

function pushFx(run: RunState, fx: Fx): void {
  if (fx.type === 'text' && run.fx.length > MAX_FX_TEXT * 2) return;
  run.fx.push(fx);
}

function scaleHp(run: RunState): number {
  return (
    run.biome.difficulty *
    (run.config.difficulty ?? 1) *
    run.enemyHpMult *
    (1 + (run.time / 60) * 0.2)
  );
}

function scaleDamage(run: RunState): number {
  const minute = run.time / 60;
  // The first two minutes are a gentle warm-up.
  const warmup = Math.min(1, 0.6 + minute * 0.2);
  return (
    Math.pow(run.biome.difficulty * (run.config.difficulty ?? 1), 0.7) *
    (1 + minute * 0.04) *
    warmup
  );
}

// --- Damage ---------------------------------------------------------------------------------------

/** Damage factor on shielded enemies, shield range and healer pulse. */
const SHIELD_FACTOR = 0.45;
const SHIELD_RANGE = 140;
const HEAL_RANGE = 170;
const HEAL_EVERY = 3.2;
const HEAL_FRACTION = 0.12;

export function damageEnemy(
  run: RunState,
  e: Enemy,
  amount: number,
  knockback = 0,
  fromX = run.hero.x,
  fromY = run.hero.y,
): void {
  if (e.dead) return;
  const crit = run.rng() < 0.04 + (run.stats.luck - 1) * 0.25;
  const shielded = e.shield > 0 ? SHIELD_FACTOR : 1;
  const dmg = Math.max(1, Math.round(amount * shielded * (crit ? 2 : 1) * (0.9 + run.rng() * 0.2)));
  e.hp -= dmg;
  e.flash = 0.12;
  run.damageDealt += dmg;
  if (knockback > 0) {
    const resist = e.boss ? 0.08 : e.elite ? 0.3 : 1;
    const dx = e.x - fromX;
    const dy = e.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    e.kx += (dx / len) * knockback * 110 * resist;
    e.ky += (dy / len) * knockback * 110 * resist;
  }
  if (run.fx.length < MAX_FX_TEXT * 2)
    pushFx(run, {
      type: 'text',
      x: e.x + (run.rng() - 0.5) * 10,
      y: e.y - e.radius,
      text: String(dmg),
      color: crit ? '#ffd166' : '#ffffff',
      life: 0.6,
      max: 0.6,
      big: crit,
    });
  if (e.hp <= 0) killEnemy(run, e);
}

function killEnemy(run: RunState, e: Enemy): void {
  e.dead = true;
  run.kills++;
  pushFx(run, {
    type: 'burst',
    x: e.x,
    y: e.y,
    color: e.boss ? '#ffd166' : '#ffffff',
    life: 0.35,
    max: 0.35,
    size: e.radius,
  });
  run.gems.push({ x: e.x, y: e.y, xp: e.xp, magnet: false });
  const luck = run.stats.luck;
  if (e.boss || e.elite) {
    run.pickups.push({ kind: 'chest', x: e.x, y: e.y });
    if (e.boss) run.bossKills++;
    else run.elitesKilled++;
    run.shake = Math.max(run.shake, e.boss ? 14 : 6);
  } else {
    const r = run.rng();
    if (r < 0.004 * luck) run.pickups.push({ kind: 'heal', x: e.x, y: e.y });
    else if (r < 0.0055 * luck) run.pickups.push({ kind: 'magnet', x: e.x, y: e.y });
    else if (r < 0.0065 * luck) run.pickups.push({ kind: 'bomb', x: e.x, y: e.y });
  }
  if (e.def.splitInto) {
    for (let i = 0; i < 2; i++) {
      const child = ENEMY_MAP.get(e.def.splitInto);
      if (child) spawnEnemy(run, child, e.x + (i ? 10 : -10), e.y + (i ? -6 : 6));
    }
  }
  if (e.final) {
    run.phase = 'won';
    run.shake = 24;
  }
}

function hurtHero(run: RunState, amount: number): void {
  const h = run.hero;
  if (h.invuln > 0 || run.phase !== 'playing') return;
  const dmg = Math.max(1, amount - run.stats.armor);
  h.hp -= dmg;
  h.invuln = 0.5;
  h.hurt = 0.25;
  run.shake = Math.max(run.shake, 4);
  if (h.hp < run.stats.maxHp * 0.35 && run.provisions.length) {
    const heal = run.provisions.shift()!;
    h.hp = Math.min(run.stats.maxHp, h.hp + heal);
    run.foodEaten++;
    pushFx(run, {
      type: 'text',
      x: h.x,
      y: h.y - 30,
      text: `🍖 +${Math.round(heal)}`,
      color: '#5be38a',
      life: 1.2,
      max: 1.2,
      big: true,
    });
  }
  if (h.hp <= 0) {
    if (run.revives > 0) {
      run.revives--;
      h.hp = run.stats.maxHp * 0.6;
      h.invuln = 2.5;
      for (const e of run.enemies) if (!e.boss) damageEnemy(run, e, 0, 12);
      pushFx(run, { type: 'ring', x: h.x, y: h.y, r: 420, color: '#ffd166', life: 0.8, max: 0.8 });
      pushFx(run, {
        type: 'text',
        x: h.x,
        y: h.y - 40,
        text: '✝️ Zweite Chance!',
        color: '#ffd166',
        life: 1.6,
        max: 1.6,
        big: true,
      });
    } else {
      h.hp = 0;
      run.phase = 'dead';
    }
  }
}

// --- Spawning -------------------------------------------------------------------------------------

export function spawnEnemy(
  run: RunState,
  def: EnemyDef,
  x: number,
  y: number,
  kind: 'normal' | 'elite' | 'boss' | 'final' = 'normal',
): Enemy {
  const hpScale = scaleHp(run);
  let hp = def.hp * hpScale;
  let radius = def.radius;
  let xp = def.xp;
  if (kind === 'elite') {
    hp *= 12;
    radius *= 1.6;
    xp *= 10;
  } else if (kind === 'boss' || kind === 'final') {
    // Bosses are defined with absolute HP; they still grow with the hero.
    hp =
      def.hp *
      (kind === 'final'
        ? run.config.mode === 'dungeon'
          ? 0.8
          : Math.pow(run.biome.difficulty, 0.85)
        : 1) *
      (run.config.difficulty ?? 1) *
      (0.55 + run.hero.level * 0.035);
  }
  const h = run.hero;
  const dx = h.x - x;
  const dy = h.y - y;
  const len = Math.hypot(dx, dy) || 1;
  const e: Enemy = {
    id: run.nextId++,
    def,
    x,
    y,
    hp,
    maxHp: hp,
    speed: def.speed * (kind === 'elite' ? 0.9 : 1) * (run.config.enemySpeed ?? 1),
    damage: def.damage * scaleDamage(run) * (kind === 'elite' ? 1.5 : 1),
    radius,
    xp,
    elite: kind === 'elite',
    boss: kind === 'boss' || kind === 'final',
    final: kind === 'final',
    kx: 0,
    ky: 0,
    dx: dx / len,
    dy: dy / len,
    timer: 1 + run.rng() * 2,
    alt: 3,
    flash: 0,
    shield: 0,
    hits: {},
    dead: false,
  };
  run.enemies.push(e);
  return e;
}

function ringPoint(run: RunState, angle = run.rng() * Math.PI * 2): [number, number] {
  const d = SPAWN_MIN + run.rng() * (SPAWN_MAX - SPAWN_MIN);
  return [run.hero.x + Math.cos(angle) * d, run.hero.y + Math.sin(angle) * d];
}

function spawnPool(run: RunState): EnemyDef[] {
  const minute = run.time / 60;
  return run.biome.enemies.filter((d) => d.from <= minute && d.from < 99);
}

function pickWeighted(run: RunState, pool: EnemyDef[]): EnemyDef {
  // Newer enemy types are more likely, but the early ones never vanish.
  const minute = run.time / 60;
  const weights = pool.map((d) => 1 + Math.max(0, 3 - Math.abs(minute - d.from - 1.5)));
  let r = run.rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}

function updateSpawns(run: RunState, dt: number): void {
  const minute = run.time / 60;
  const living = run.enemies.length;
  const spawnMult = run.config.spawnMult ?? 1;
  const target = Math.min(MAX_ENEMIES, (18 + minute * 22) * spawnMult);
  run.spawnTimer -= dt;
  if (run.spawnTimer <= 0) {
    run.spawnTimer = Math.max(0.15, 0.6 - minute * 0.04);
    const pool = spawnPool(run);
    const batch = living < target ? Math.round((1 + Math.floor(minute / 2.5)) * spawnMult) : 0;
    for (let i = 0; i < batch && pool.length; i++) {
      const [x, y] = ringPoint(run);
      spawnEnemy(run, pickWeighted(run, pool), x, y);
    }
  }
  // Shrines: a choice between risk and reward every few minutes.
  if (run.config.shrines !== false) {
    run.shrineTimer -= dt;
    if (run.shrineTimer <= 0) {
      run.shrineTimer = SHRINE_EVERY;
      const angle = run.rng() * Math.PI * 2;
      run.pickups.push({
        kind: 'shrine',
        x: run.hero.x + Math.cos(angle) * 260,
        y: run.hero.y + Math.sin(angle) * 260,
      });
      announce(run, '⛩️ Ein Schrein ist erschienen!');
    }
  }
  // Swarms: a wall of fast enemies from one direction.
  run.swarmTimer -= dt;
  if (run.swarmTimer <= 0) {
    run.swarmTimer = 45;
    const swarmers = spawnPool(run).filter((d) => d.behavior === 'swarm');
    const def = swarmers[0];
    if (def && living < MAX_ENEMIES) {
      const angle = run.rng() * Math.PI * 2;
      const n = 10 + Math.floor(minute * 3);
      for (let i = 0; i < n; i++) {
        const [x, y] = ringPoint(run, angle + (run.rng() - 0.5) * 0.7);
        spawnEnemy(run, def, x, y);
      }
    }
  }
  // Elites drop chests.
  run.eliteTimer -= dt;
  if (run.eliteTimer <= 0) {
    run.eliteTimer = 75;
    const pool = spawnPool(run).filter((d) => d.behavior !== 'swarm');
    if (pool.length) {
      const [x, y] = ringPoint(run);
      spawnEnemy(run, pickWeighted(run, pool), x, y, 'elite');
    }
  }
  if (run.config.endless) {
    // Endless: a biome boss every 5 minutes, cycling – they grow with time like everything else.
    const wave = Math.floor(minute / 5);
    if (wave > run.endlessWave && run.biome.bosses.length) {
      run.endlessWave = wave;
      const b = run.biome.bosses[(wave - 1) % run.biome.bosses.length]!;
      const [x, y] = ringPoint(run);
      spawnEnemy(run, b, x, y, 'boss');
      announce(run, `♾️ Welle ${wave}: ${b.icon} ${b.name}!`);
    }
    return;
  }
  const total = runMinutes(run.config);
  const dungeon = run.config.mode === 'dungeon';
  // Dungeons: the first biome boss at half time, the second one guards the exit.
  const bosses = dungeon
    ? run.biome.bosses.slice(0, 1).map((b) => ({ def: b, at: total / 2 }))
    : run.biome.bosses.map((b) => ({ def: b, at: b.at }));
  for (const { def: b, at } of bosses) {
    if (minute >= at && !run.bossesSpawned.includes(b.id)) {
      run.bossesSpawned.push(b.id);
      const [x, y] = ringPoint(run);
      spawnEnemy(run, b, x, y, 'boss');
      announce(run, `${b.icon} ${b.name}!`);
    }
  }
  if (minute >= total && !run.examinerSpawned) {
    run.examinerSpawned = true;
    const [x, y] = ringPoint(run);
    const guardian = run.config.trial
      ? WEEKLY_BOSS
      : dungeon
        ? (run.biome.bosses[1] ?? EXAMINER)
        : EXAMINER;
    spawnEnemy(run, guardian, x, y, 'final');
    announce(
      run,
      run.config.trial
        ? `${guardian.icon} ${guardian.name} betritt die Arena!`
        : dungeon
          ? `${guardian.icon} Der Wächter: ${guardian.name}!`
          : '🧑‍⚖️ Der Prüfer erscheint!',
    );
  }
}

function announce(run: RunState, text: string): void {
  pushFx(run, {
    type: 'text',
    x: run.hero.x,
    y: run.hero.y - 80,
    text,
    color: '#ff5d73',
    life: 3,
    max: 3,
    big: true,
  });
}

// --- Enemies --------------------------------------------------------------------------------------

function updateEnemies(run: RunState, dt: number): void {
  const h = run.hero;
  const decay = Math.exp(-dt * 8);
  const enraged = run.examinerSpawned && run.time > (runMinutes(run.config) + 5) * 60 ? 2 : 1;
  for (const e of run.enemies) {
    if (e.dead) continue;
    e.flash = Math.max(0, e.flash - dt);
    if (e.shield > 0) e.shield -= dt;
    const dx = h.x - e.x;
    const dy = h.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    let mx = dx / d;
    let my = dy / d;
    let speed = e.speed * (e.final ? enraged : 1);
    switch (e.def.behavior) {
      case 'swarm':
        if (!e.boss && !e.elite) {
          mx = e.dx;
          my = e.dy;
          if (d > 900) e.dead = true; // flew past
        }
        break;
      case 'shooter':
        e.timer -= dt;
        if (d < 230) {
          // Keep distance: strafe sideways.
          const tmp = mx;
          mx = -my * 0.8 - mx * 0.3;
          my = tmp * 0.8 - my * 0.3;
        }
        if (e.timer <= 0 && d < 520) {
          e.timer = e.boss ? 1.2 : 2.6;
          const v = 230;
          run.shots.push({
            x: e.x,
            y: e.y,
            vx: (dx / d) * v,
            vy: (dy / d) * v,
            damage: e.damage * 0.8,
            life: 3,
          });
        }
        break;
      case 'teleporter':
        e.timer -= dt;
        if (e.timer <= 0 && d > 160) {
          e.timer = 4 + run.rng() * 2;
          pushFx(run, {
            type: 'burst',
            x: e.x,
            y: e.y,
            color: '#b98cff',
            life: 0.3,
            max: 0.3,
            size: e.radius,
          });
          const a = run.rng() * Math.PI * 2;
          const r = 130 + run.rng() * 60;
          e.x = h.x + Math.cos(a) * r;
          e.y = h.y + Math.sin(a) * r;
          pushFx(run, {
            type: 'burst',
            x: e.x,
            y: e.y,
            color: '#b98cff',
            life: 0.3,
            max: 0.3,
            size: e.radius,
          });
        }
        break;
      case 'shielder':
        speed *= 0.9;
        // Spatial grid from the last frame: positions are a frame old, good enough for an aura.
        grid.query(e.x, e.y, SHIELD_RANGE, (o) => {
          if (!o.dead && o !== e && dist2(o.x, o.y, e.x, e.y) < SHIELD_RANGE * SHIELD_RANGE)
            o.shield = Math.max(o.shield, 0.3);
        });
        break;
      case 'healer':
        e.timer -= dt;
        if (d < 260) {
          // Stay behind the front line.
          mx = -mx;
          my = -my;
          speed *= 0.6;
        }
        if (e.timer <= 0) {
          e.timer = HEAL_EVERY;
          let healed = false;
          for (const o of run.enemies) {
            if (o.dead || o.hp >= o.maxHp) continue;
            if (dist2(o.x, o.y, e.x, e.y) > HEAL_RANGE * HEAL_RANGE) continue;
            o.hp = Math.min(o.maxHp, o.hp + o.maxHp * (o.boss ? 0.02 : HEAL_FRACTION));
            healed = true;
          }
          if (healed)
            pushFx(run, {
              type: 'burst',
              x: e.x,
              y: e.y,
              color: '#7be495',
              life: 0.45,
              max: 0.45,
              size: HEAL_RANGE,
            });
        }
        break;
      case 'tank':
        if (e.boss) {
          // Bosses charge every few seconds.
          e.timer -= dt;
          if (e.timer <= 0) e.timer = 4;
          if (e.timer < 0.8) speed *= 2.6;
        }
        break;
      case 'warlord': {
        // Charge every 5 s, a ring of 12 shots every 4 s, reinforcements every 12 s.
        e.timer -= dt;
        if (e.timer <= 0) e.timer = 5;
        if (e.timer < 0.9) speed *= 2.4;
        e.alt -= dt;
        if (e.alt <= 0) {
          e.alt = 4;
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 + run.time;
            run.shots.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * 190,
              vy: Math.sin(a) * 190,
              damage: e.damage * 0.6,
              life: 3.5,
            });
          }
          if (Math.floor(run.time / 12) !== Math.floor((run.time - 4) / 12)) {
            const pool = spawnPool(run).filter((d) => d.behavior !== 'swarm');
            for (let i = 0; i < 5 && pool.length; i++) {
              const a = (i / 5) * Math.PI * 2;
              spawnEnemy(
                run,
                pickWeighted(run, pool),
                e.x + Math.cos(a) * 60,
                e.y + Math.sin(a) * 60,
              );
            }
            announce(run, '🦹 Verstärkung!');
          }
        }
        break;
      }
      default:
        break;
    }
    e.x += (mx * speed + e.kx) * dt;
    e.y += (my * speed + e.ky) * dt;
    e.kx *= decay;
    e.ky *= decay;
    // Contact damage.
    const reach = e.radius + HERO_RADIUS;
    if (dx * dx + dy * dy < reach * reach) hurtHero(run, e.damage);
    // Far-away stragglers are recycled closer to the hero (keeps pressure on).
    if (d > 1100 && !e.boss) {
      const [x, y] = ringPoint(run);
      e.x = x;
      e.y = y;
    }
  }
  // Soft separation so crowds don't collapse into a single point.
  grid.build(run.enemies);
  for (const e of run.enemies) {
    if (e.dead) continue;
    grid.query(e.x, e.y, e.radius * 2, (o) => {
      if (o === e || o.id < e.id) return;
      const dx = o.x - e.x;
      const dy = o.y - e.y;
      const min = (e.radius + o.radius) * 0.8;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min || d2 === 0) return;
      const d = Math.sqrt(d2);
      const push = ((min - d) / d) * 0.5;
      const we = e.boss ? 0.1 : 1;
      const wo = o.boss ? 0.1 : 1;
      e.x -= dx * push * we;
      e.y -= dy * push * we;
      o.x += dx * push * wo;
      o.y += dy * push * wo;
    });
  }
  // Enemy projectiles.
  for (const s of run.shots) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (dist2(s.x, s.y, h.x, h.y) < (HERO_RADIUS + 6) ** 2) {
      hurtHero(run, s.damage);
      s.life = 0;
    }
  }
  run.shots = run.shots.filter((s) => s.life > 0);
}

// --- Weapons --------------------------------------------------------------------------------------

function canHit(e: Enemy, key: string, time: number, interval: number): boolean {
  const last = e.hits[key];
  if (last !== undefined && time - last < interval) return false;
  e.hits[key] = time;
  return true;
}

function fireWeapon(run: RunState, w: OwnedWeapon, def: WeaponDef, st: WeaponStats): void {
  const h = run.hero;
  const n = Math.max(1, Math.round(st.amount));
  const proj = (
    kind: ProjectileKind,
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    extra: Partial<Projectile> = {},
  ): Projectile => {
    const p: Projectile = {
      id: run.nextId++,
      weapon: def.id,
      kind,
      x,
      y,
      vx,
      vy,
      ax: 0,
      ay: 0,
      damage: st.damage,
      radius: st.area,
      pierce: st.pierce,
      life,
      maxLife: life,
      knockback: st.knockback,
      angle: 0,
      slot: 0,
      tx: 0,
      ty: 0,
      hit: [],
      dead: false,
      ...extra,
    };
    run.projectiles.push(p);
    return p;
  };
  switch (def.behavior) {
    case 'thrown':
      for (let i = 0; i < n; i++) {
        const spread = (i - (n - 1) / 2) * 70;
        proj(
          'thrown',
          h.x,
          h.y,
          h.fx * 60 + spread + (run.rng() - 0.5) * 60,
          -st.speed * (0.85 + run.rng() * 0.25),
          st.duration,
        );
      }
      break;
    case 'boomerang': {
      const target = nearestEnemy(run, h.x, h.y, 500);
      const base = target ? Math.atan2(target.y - h.y, target.x - h.x) : Math.atan2(h.fy, h.fx);
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * 0.5;
        const vx = Math.cos(a) * st.speed;
        const vy = Math.sin(a) * st.speed;
        const decel = (2 * st.speed) / st.duration;
        proj('boomerang', h.x, h.y, vx, vy, st.duration * 1.6, {
          ax: -Math.cos(a) * decel,
          ay: -Math.sin(a) * decel,
        });
      }
      break;
    }
    case 'orbit':
      run.projectiles = run.projectiles.filter((p) => p.weapon !== def.id);
      for (let i = 0; i < n; i++)
        proj('orbit', h.x, h.y, 0, 0, st.duration, { slot: i, angle: (i / n) * Math.PI * 2 });
      break;
    case 'aimed': {
      const target = nearestEnemy(run, h.x, h.y, 650);
      const base = target ? Math.atan2(target.y - h.y, target.x - h.x) : Math.atan2(h.fy, h.fx);
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * 0.12;
        proj('aimed', h.x, h.y, Math.cos(a) * st.speed, Math.sin(a) * st.speed, st.duration, {
          angle: a,
        });
      }
      break;
    }
    case 'chain':
      for (let i = 0; i < n; i++) {
        let target = randomEnemyNear(run, 420);
        if (!target) break;
        const points = [h.x, h.y - 300, target.x, target.y];
        const hitIds = new Set<number>();
        let dmg = st.damage;
        for (let j = 0; j <= st.pierce && target; j++) {
          hitIds.add(target.id);
          damageEnemy(run, target, dmg, 0);
          const from: Enemy = target;
          let next: Enemy | null = null;
          let bd = st.area * st.area;
          for (const e of run.enemies) {
            if (e.dead || hitIds.has(e.id)) continue;
            const d = dist2(from.x, from.y, e.x, e.y);
            if (d < bd) {
              bd = d;
              next = e;
            }
          }
          if (next) points.push(next.x, next.y);
          target = next;
          dmg *= 0.85;
        }
        pushFx(run, { type: 'bolt', points, color: def.color, life: 0.22, max: 0.22 });
      }
      break;
    case 'lob':
      for (let i = 0; i < n; i++) {
        const target = randomEnemyNear(run, 380);
        const tx = target ? target.x : h.x + (run.rng() - 0.5) * 300;
        const ty = target ? target.y : h.y + (run.rng() - 0.5) * 300;
        proj('lob', h.x, h.y, (tx - h.x) / st.speed, (ty - h.y) / st.speed, st.speed, {
          tx,
          ty,
          radius: 8,
        });
      }
      break;
    case 'pulse': {
      for (let i = 0; i < n; i++) {
        const r = st.area * (1 + i * 0.25);
        grid.query(h.x, h.y, r, (e) => {
          if (dist2(e.x, e.y, h.x, h.y) < r * r) damageEnemy(run, e, st.damage, st.knockback);
        });
        pushFx(run, { type: 'ring', x: h.x, y: h.y, r, color: def.color, life: 0.45, max: 0.45 });
      }
      break;
    }
    case 'beam': {
      const base = Math.atan2(h.fy, h.fx);
      const width = 10 * run.stats.area;
      for (let i = 0; i < n; i++) {
        const a = n >= 3 ? base + (i / n) * Math.PI * 2 : base + (i - (n - 1) / 2) * 0.35;
        const x2 = h.x + Math.cos(a) * st.area;
        const y2 = h.y + Math.sin(a) * st.area;
        hitSegment(h.x, h.y, x2, y2, width, (e) => damageEnemy(run, e, st.damage, st.knockback));
        pushFx(run, {
          type: 'beam',
          x1: h.x,
          y1: h.y,
          x2,
          y2,
          width,
          color: def.color,
          life: st.duration,
          max: st.duration,
        });
      }
      break;
    }
    case 'sweep': {
      const height = 36 * run.stats.area;
      for (let i = 0; i < n; i++) {
        const dir = (i % 2 === 0 ? 1 : -1) * w.side * (h.fx >= 0 ? 1 : -1);
        const x0 = dir > 0 ? h.x : h.x - st.area;
        const y0 = h.y - height / 2 - i * 12;
        grid.query(h.x, h.y, st.area + 20, (e) => {
          if (
            e.x + e.radius > x0 &&
            e.x - e.radius < x0 + st.area &&
            e.y + e.radius > y0 &&
            e.y - e.radius < y0 + height
          )
            damageEnemy(run, e, st.damage, st.knockback);
        });
        pushFx(run, {
          type: 'sweep',
          x: h.x,
          y: h.y - i * 12,
          dir,
          len: st.area,
          height,
          color: def.color,
          life: 0.22,
          max: 0.22,
        });
      }
      w.side *= -1;
      break;
    }
    case 'well':
      for (let i = 0; i < n; i++) {
        const target = randomEnemyNear(run, 360);
        const x = target ? target.x : h.x + h.fx * 150;
        const y = target ? target.y : h.y + h.fy * 150;
        run.zones.push({
          weapon: def.id,
          kind: 'well',
          x,
          y,
          radius: st.area,
          damage: st.damage,
          life: st.duration,
          maxLife: st.duration,
          pull: st.speed,
          tick: 0,
        });
      }
      break;
    case 'spin':
      w.active = st.duration;
      break;
    case 'aura':
      break;
  }
}

function hitSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  fn: (e: Enemy) => void,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  grid.query(cx, cy, Math.sqrt(len2) / 2 + width + 30, (e) => {
    const t = Math.max(0, Math.min(1, ((e.x - x1) * dx + (e.y - y1) * dy) / len2));
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    const r = width + e.radius;
    if (dist2(e.x, e.y, px, py) < r * r) fn(e);
  });
}

function updateWeapons(run: RunState, dt: number): void {
  const h = run.hero;
  for (const w of run.weapons) {
    const def = WEAPON_MAP.get(w.id);
    if (!def) continue;
    const st = weaponStats(run, def, w.level);
    if (def.behavior === 'aura') {
      grid.query(h.x, h.y, st.area, (e) => {
        if (dist2(e.x, e.y, h.x, h.y) > (st.area + e.radius) ** 2) return;
        if (!canHit(e, def.id, run.time, st.cooldown)) return;
        damageEnemy(run, e, st.damage, st.knockback);
        if (def.id === 'fusion') h.hp = Math.min(run.stats.maxHp, h.hp + 0.15);
      });
      continue;
    }
    if (def.behavior === 'spin' && w.active > 0) {
      w.active -= dt;
      w.angle += st.speed * dt;
      const n = Math.max(1, Math.round(st.amount));
      for (let i = 0; i < n; i++) {
        const a = w.angle + (i / n) * Math.PI * 2;
        const x2 = h.x + Math.cos(a) * st.area;
        const y2 = h.y + Math.sin(a) * st.area;
        hitSegment(h.x, h.y, x2, y2, 8, (e) => {
          if (!canHit(e, def.id, run.time, 0.3)) return;
          damageEnemy(run, e, st.damage, st.knockback);
          if (def.id === 'harvest_moon') h.hp = Math.min(run.stats.maxHp, h.hp + 0.3);
        });
      }
      if (w.active <= 0) w.timer = st.cooldown;
      continue;
    }
    w.timer -= dt;
    if (w.timer <= 0) {
      fireWeapon(run, w, def, st);
      // Orbits and spins run for their duration before the cooldown starts.
      w.timer = def.behavior === 'orbit' ? st.cooldown + st.duration : st.cooldown;
    }
  }
}

function updateProjectiles(run: RunState, dt: number): void {
  const h = run.hero;
  for (const p of run.projectiles) {
    p.life -= dt;
    if (p.life <= 0) {
      p.dead = true;
      if (p.kind === 'lob') landLob(run, p);
      continue;
    }
    switch (p.kind) {
      case 'thrown':
        p.vy += 900 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += dt * 12;
        break;
      case 'boomerang':
        p.vx += p.ax * dt;
        p.vy += p.ay * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += dt * 14;
        // Returning: home in on the hero and vanish on catch.
        if (p.vx * p.ax + p.vy * p.ay > 0) {
          if (p.hit.length && p.slot === 0) {
            p.slot = 1;
            p.hit = [];
          }
          const dx = h.x - p.x;
          const dy = h.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          const v = Math.hypot(p.vx, p.vy);
          p.vx = (dx / d) * v;
          p.vy = (dy / d) * v;
          if (d < 20) p.dead = true;
        }
        break;
      case 'orbit': {
        const def = WEAPON_MAP.get(p.weapon)!;
        const owned = run.weapons.find((w) => w.id === p.weapon);
        const st = weaponStats(run, def, owned?.level ?? 1);
        p.angle += st.speed * dt;
        const r = 85 * run.stats.area;
        p.x = h.x + Math.cos(p.angle) * r;
        p.y = h.y + Math.sin(p.angle) * r;
        break;
      }
      case 'aimed':
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        break;
      case 'lob':
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        continue; // flies over enemies
    }
    const continuous = p.kind === 'orbit';
    grid.query(p.x, p.y, p.radius + 30, (e) => {
      if (p.dead) return;
      const r = p.radius + e.radius;
      if (dist2(p.x, p.y, e.x, e.y) > r * r) return;
      if (continuous) {
        if (canHit(e, `${p.weapon}#${p.slot}`, run.time, 0.45))
          damageEnemy(run, e, p.damage, p.knockback, h.x, h.y);
        return;
      }
      if (p.hit.includes(e.id)) return;
      p.hit.push(e.id);
      damageEnemy(run, e, p.damage, p.knockback, p.x - p.vx * 0.01, p.y - p.vy * 0.01);
      if (p.hit.length >= p.pierce) p.dead = true;
    });
  }
  run.projectiles = run.projectiles.filter((p) => !p.dead);
}

function landLob(run: RunState, p: Projectile): void {
  const def = WEAPON_MAP.get(p.weapon)!;
  const owned = run.weapons.find((w) => w.id === p.weapon);
  const st = weaponStats(run, def, owned?.level ?? 1);
  run.zones.push({
    weapon: def.id,
    kind: 'puddle',
    x: p.tx,
    y: p.ty,
    radius: st.area,
    damage: st.damage,
    life: st.duration,
    maxLife: st.duration,
    pull: 0,
    tick: 0,
  });
  if (def.id === 'philosophers_flood') run.hero.hp = Math.min(run.stats.maxHp, run.hero.hp + 1);
}

function updateZones(run: RunState, dt: number): void {
  for (const z of run.zones) {
    z.life -= dt;
    z.tick -= dt;
    const doTick = z.tick <= 0;
    if (doTick) z.tick = z.kind === 'well' ? 0.35 : 0.45;
    grid.query(z.x, z.y, z.radius, (e) => {
      const d2 = dist2(e.x, e.y, z.x, z.y);
      if (d2 > z.radius * z.radius) return;
      if (z.pull > 0 && !e.boss) {
        const d = Math.sqrt(d2) || 1;
        e.x += ((z.x - e.x) / d) * Math.min(d, z.pull * dt);
        e.y += ((z.y - e.y) / d) * Math.min(d, z.pull * dt);
      }
      if (doTick) damageEnemy(run, e, z.damage, 0, z.x, z.y);
    });
  }
  run.zones = run.zones.filter((z) => z.life > 0);
}

// --- Pickups --------------------------------------------------------------------------------------

function gainXp(run: RunState, xp: number): void {
  const h = run.hero;
  h.xp += xp * run.stats.growth;
  while (h.xp >= h.xpNext) {
    h.xp -= h.xpNext;
    h.level++;
    h.xpNext = xpForLevel(h.level);
    run.pendingLevels++;
  }
}

function updatePickups(run: RunState, dt: number): void {
  const h = run.hero;
  const magnet2 = run.stats.magnet ** 2;
  // Merge distant gems when there are too many (keeps the frame budget).
  if (run.gems.length > 320) {
    let sum = 0;
    run.gems = run.gems.filter((g) => {
      if (dist2(g.x, g.y, h.x, h.y) > 600 * 600) {
        sum += g.xp;
        return false;
      }
      return true;
    });
    if (sum > 0) {
      const [x, y] = ringPoint(run);
      run.gems.push({ x, y, xp: sum, magnet: false });
    }
  }
  for (const g of run.gems) {
    const d2 = dist2(g.x, g.y, h.x, h.y);
    if (g.magnet || d2 < magnet2) {
      g.magnet = true;
      const d = Math.sqrt(d2) || 1;
      const v = 480 * dt;
      g.x += ((h.x - g.x) / d) * Math.min(d, v);
      g.y += ((h.y - g.y) / d) * Math.min(d, v);
      if (d < HERO_RADIUS + 6) {
        g.xp = -g.xp - 1; // mark collected
        gainXp(run, -g.xp - 1);
      }
    }
  }
  run.gems = run.gems.filter((g) => g.xp >= 0);
  for (const p of run.pickups) {
    if (dist2(p.x, p.y, h.x, h.y) > (HERO_RADIUS + 18) ** 2) continue;
    p.x = NaN;
    switch (p.kind) {
      case 'heal':
        h.hp = Math.min(run.stats.maxHp, h.hp + 30);
        pushFx(run, {
          type: 'text',
          x: h.x,
          y: h.y - 30,
          text: '+30 ❤️',
          color: '#5be38a',
          life: 1,
          max: 1,
          big: true,
        });
        break;
      case 'magnet':
        for (const g of run.gems) g.magnet = true;
        break;
      case 'bomb':
        pushFx(run, {
          type: 'ring',
          x: h.x,
          y: h.y,
          r: 600,
          color: '#ff9a4a',
          life: 0.6,
          max: 0.6,
        });
        run.shake = 16;
        for (const e of run.enemies)
          if (!e.dead && !e.boss && dist2(e.x, e.y, h.x, h.y) < 600 * 600)
            damageEnemy(run, e, e.hp + 1);
        break;
      case 'chest':
        openChest(run);
        break;
      case 'shrine':
        openShrine(run);
        break;
    }
  }
  run.pickups = run.pickups.filter((p) => !Number.isNaN(p.x));
}

// --- Level-ups & chests --------------------------------------------------------------------------

export function evolutionFor(run: RunState, w: OwnedWeapon): WeaponDef | null {
  const def = WEAPON_MAP.get(w.id);
  if (!def || def.evolvesFrom || w.level < maxLevelOf(def)) return null;
  const evo = RIFT_WEAPONS.find((x) => x.evolvesFrom === w.id);
  if (!evo || !evo.requires) return null;
  return run.passives.some((p) => p.id === evo.requires) ? evo : null;
}

export function upgradeOptions(run: RunState): Choice[] {
  const out: Choice[] = [];
  for (const w of run.weapons) {
    const def = WEAPON_MAP.get(w.id)!;
    if (w.level < maxLevelOf(def)) out.push({ kind: 'weapon', id: w.id, level: w.level + 1 });
  }
  if (run.weapons.length < MAX_WEAPONS) {
    for (const id of run.config.pool) {
      const def = WEAPON_MAP.get(id);
      if (!def || def.evolvesFrom || run.banished.includes(id)) continue;
      if (run.weapons.some((w) => w.id === id || WEAPON_MAP.get(w.id)?.evolvesFrom === id))
        continue;
      out.push({ kind: 'weapon', id, level: 1 });
    }
  }
  for (const p of run.passives) {
    const def = PASSIVE_MAP.get(p.id)!;
    if (p.level < def.maxLevel) out.push({ kind: 'passive', id: p.id, level: p.level + 1 });
  }
  if (run.passives.length < MAX_PASSIVES) {
    for (const def of RIFT_PASSIVES) {
      if (run.banished.includes(def.id) || run.passives.some((p) => p.id === def.id)) continue;
      out.push({ kind: 'passive', id: def.id, level: 1 });
    }
  }
  return out;
}

function rollChoices(run: RunState): Choice[] {
  const options = upgradeOptions(run);
  if (!options.length) return [{ kind: 'heal' }, { kind: 'gold' }];
  const count = run.rng() < (run.stats.luck - 1) * 0.6 + 0.1 ? 4 : 3;
  const picked: Choice[] = [];
  const pool = [...options];
  while (picked.length < count && pool.length) {
    // Upgrades of owned things are a bit more likely (builds come together).
    const weights = pool.map((c) =>
      c.kind !== 'heal' && c.kind !== 'gold' && c.level > 1 ? 1.6 : 1,
    );
    let r = run.rng() * weights.reduce((a, b) => a + b, 0);
    let i = 0;
    for (; i < pool.length - 1; i++) {
      r -= weights[i]!;
      if (r <= 0) break;
    }
    picked.push(pool.splice(i, 1)[0]!);
  }
  return picked;
}

function applyChoice(run: RunState, c: Choice): void {
  if (c.kind === 'weapon') {
    const owned = run.weapons.find((w) => w.id === c.id);
    if (owned) owned.level = c.level;
    else run.weapons.push(newWeapon(c.id));
  } else if (c.kind === 'passive') {
    const owned = run.passives.find((p) => p.id === c.id);
    if (owned) owned.level = c.level;
    else run.passives.push({ id: c.id, level: 1 });
    recomputeStats(run);
  } else if (c.kind === 'heal') {
    run.hero.hp = Math.min(run.stats.maxHp, run.hero.hp + 25);
  } else {
    // Nothing left to learn: a little extra essence instead.
    run.bonusEssence += 5;
  }
}

/** Picks one of the offered level-up choices. */
export function chooseUpgrade(run: RunState, index: number): void {
  const c = run.choices[index];
  if (run.phase !== 'levelup' || !c) return;
  applyChoice(run, c);
  nextLevelUp(run);
}

export function rerollChoices(run: RunState): boolean {
  if (run.phase !== 'levelup' || run.rerolls <= 0) return false;
  run.rerolls--;
  run.choices = rollChoices(run);
  return true;
}

export function skipLevelUp(run: RunState): boolean {
  if (run.phase !== 'levelup' || run.skips <= 0) return false;
  run.skips--;
  run.hero.hp = Math.min(run.stats.maxHp, run.hero.hp + 10);
  nextLevelUp(run);
  return true;
}

export function banishChoice(run: RunState, index: number): boolean {
  const c = run.choices[index];
  if (
    run.phase !== 'levelup' ||
    run.banishes <= 0 ||
    !c ||
    (c.kind !== 'weapon' && c.kind !== 'passive')
  )
    return false;
  run.banishes--;
  run.banished.push(c.id);
  run.choices = rollChoices(run);
  return true;
}

function nextLevelUp(run: RunState): void {
  run.pendingLevels = Math.max(0, run.pendingLevels - 1);
  if (run.pendingLevels > 0) run.choices = rollChoices(run);
  else {
    run.choices = [];
    run.phase = 'playing';
  }
}

function openChest(run: RunState): void {
  run.chestsOpened++;
  let evolved: string | null = null;
  for (const w of run.weapons) {
    const evo = evolutionFor(run, w);
    if (!evo) continue;
    run.projectiles = run.projectiles.filter((p) => p.weapon !== w.id);
    w.id = evo.id;
    w.level = 1;
    w.timer = 0.2;
    evolved = evo.id;
    run.evolutions.push(evo.id);
    break;
  }
  const upgrades: Choice[] = [];
  if (!evolved) {
    const n = run.rng() < 0.15 * run.stats.luck ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const owned = upgradeOptions(run).filter(
        (c) => c.kind !== 'heal' && c.kind !== 'gold' && c.level > 1,
      );
      const c = owned.length
        ? owned[Math.floor(run.rng() * owned.length)]!
        : ({ kind: 'heal' } as Choice);
      applyChoice(run, c);
      upgrades.push(c);
    }
  }
  run.chest = { evolved, upgrades };
  run.phase = 'chest';
}

export function closeChest(run: RunState): void {
  if (run.phase !== 'chest') return;
  run.chest = null;
  run.phase = run.pendingLevels > 0 ? 'levelup' : 'playing';
  if (run.phase === 'levelup') run.choices = rollChoices(run);
}

// --- Shrines -------------------------------------------------------------------------------------

function openShrine(run: RunState): void {
  const pool = [...SHRINE_OPTIONS];
  const offer: ShrineOption[] = [];
  while (offer.length < 3 && pool.length) {
    offer.push(pool.splice(Math.floor(run.rng() * pool.length), 1)[0]!);
  }
  run.shrine = offer;
  run.phase = 'shrine';
}

function addBonus(run: RunState, key: keyof RiftStats, value: number): void {
  run.bonus[key] = (run.bonus[key] ?? 0) + value;
}

/** Takes a shrine's offer (index) or walks past it (-1). */
export function chooseShrine(run: RunState, index: number): void {
  if (run.phase !== 'shrine' || !run.shrine) return;
  const opt = index >= 0 ? run.shrine[index] : undefined;
  const h = run.hero;
  if (opt) {
    run.shrinesUsed++;
    switch (opt.kind) {
      case 'might':
        addBonus(run, 'might', 0.15);
        run.enemyHpMult *= 1.1;
        break;
      case 'heal':
        h.hp = run.stats.maxHp;
        break;
      case 'gamble':
        if (run.rng() < 0.5) run.pendingLevels += 2;
        else h.hp = Math.max(1, h.hp - run.stats.maxHp * 0.25);
        break;
      case 'elites': {
        const pool = spawnPool(run).filter((d) => d.behavior !== 'swarm');
        for (let i = 0; i < 3 && pool.length; i++) {
          const [x, y] = ringPoint(run);
          spawnEnemy(run, pickWeighted(run, pool), x, y, 'elite');
        }
        run.bonusEssence += 15;
        break;
      }
      case 'greed':
        run.bonusEssence += 30;
        run.enemyHpMult *= 1.12;
        break;
      case 'swift':
        addBonus(run, 'speed', BASE_STATS.speed * 0.15);
        break;
      case 'fortune':
        run.rerolls += 2;
        run.banishes += 1;
        addBonus(run, 'luck', 0.1);
        break;
      case 'armor':
        addBonus(run, 'armor', 2);
        addBonus(run, 'cooldown', 0.05);
        break;
    }
    recomputeStats(run);
    pushFx(run, {
      type: 'text',
      x: h.x,
      y: h.y - 40,
      text: `${opt.icon} ${opt.name}`,
      color: '#ffd166',
      life: 1.6,
      max: 1.6,
      big: true,
    });
  }
  run.shrine = null;
  run.phase = run.pendingLevels > 0 ? 'levelup' : 'playing';
  if (run.phase === 'levelup') run.choices = rollChoices(run);
}

export function togglePause(run: RunState): void {
  if (run.phase === 'playing') run.phase = 'paused';
  else if (run.phase === 'paused') run.phase = 'playing';
}

// --- Main step ------------------------------------------------------------------------------------

export interface RiftInput {
  /** Move direction, length ≤ 1. */
  x: number;
  y: number;
}

/** Advances the run. Large dt is split into small steps for stable collisions. */
export function stepRun(run: RunState, dt: number, input: RiftInput): void {
  let left = Math.min(dt, 0.25);
  while (left > 1e-6 && run.phase === 'playing') {
    const step = Math.min(left, 1 / 60);
    left -= step;
    tick(run, step, input);
  }
}

const COMPANION_RANGE = 230;
const COMPANION_EVERY = 1.1;

/** Beschwörung: the familiar trails the hero and, if it is a fighter, zaps the nearest enemy. */
function updateCompanion(run: RunState, dt: number): void {
  const c = run.companion;
  const def = run.config.companion;
  if (!c || !def) return;
  const h = run.hero;
  // Trail behind the hero with a soft follow.
  const tx = h.x - h.fx * 34 + 18;
  const ty = h.y - h.fy * 34 - 22;
  const k = Math.min(1, dt * 6);
  c.x += (tx - c.x) * k;
  c.y += (ty - c.y) * k;
  if (def.power <= 0) return;
  c.timer -= dt;
  if (c.timer > 0) return;
  let best: Enemy | null = null;
  let bestD = COMPANION_RANGE * COMPANION_RANGE;
  for (const e of run.enemies) {
    if (e.dead) continue;
    const d = dist2(e.x, e.y, c.x, c.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  if (!best) {
    c.timer = 0.3;
    return;
  }
  c.timer = COMPANION_EVERY;
  pushFx(run, {
    type: 'beam',
    x1: c.x,
    y1: c.y,
    x2: best.x,
    y2: best.y,
    width: 3,
    color: '#b98cff',
    life: 0.15,
    max: 0.15,
  });
  damageEnemy(run, best, def.power * run.stats.might, 0.3, c.x, c.y);
}

function tick(run: RunState, dt: number, input: RiftInput): void {
  const h = run.hero;
  run.time += dt;
  const len = Math.hypot(input.x, input.y);
  h.moving = len > 0.05;
  if (h.moving) {
    const k = Math.min(1, len) / (len || 1);
    h.x += input.x * k * run.stats.speed * dt;
    h.y += input.y * k * run.stats.speed * dt;
    h.fx = input.x / len;
    h.fy = input.y / len;
  }
  h.invuln = Math.max(0, h.invuln - dt);
  h.hurt = Math.max(0, h.hurt - dt);
  if (run.stats.regen > 0) h.hp = Math.min(run.stats.maxHp, h.hp + run.stats.regen * dt);
  run.shake = Math.max(0, run.shake - dt * 30);

  updateSpawns(run, dt);
  updateEnemies(run, dt);
  updateWeapons(run, dt);
  updateCompanion(run, dt);
  updateProjectiles(run, dt);
  updateZones(run, dt);
  run.enemies = run.enemies.filter((e) => !e.dead);
  updatePickups(run, dt);
  for (const f of run.fx) {
    f.life -= dt;
    if (f.type === 'text') f.y -= 40 * dt;
  }
  run.fx = run.fx.filter((f) => f.life > 0);

  if (run.phase === 'playing' && run.pendingLevels > 0) {
    run.phase = 'levelup';
    run.choices = rollChoices(run);
  }
}

/** Summary handed to the meta game when a run ends. */
export interface RunResult {
  hero: string;
  biome: string;
  time: number;
  kills: number;
  level: number;
  bossKills: number;
  elites: number;
  won: boolean;
  evolutions: string[];
  foodEaten: number;
  bonusEssence: number;
  mode: 'rift' | 'dungeon';
  endless?: boolean;
  curses?: string[];
  shrines?: number;
  daily?: boolean;
}

export function runResult(run: RunState): RunResult {
  return {
    hero: run.config.hero,
    biome: run.config.biome,
    time: run.time,
    kills: run.kills,
    level: run.hero.level,
    bossKills: run.bossKills,
    elites: run.elitesKilled,
    won: run.phase === 'won',
    evolutions: [...run.evolutions],
    foodEaten: run.foodEaten,
    bonusEssence: run.bonusEssence,
    mode: run.config.mode ?? 'rift',
    endless: run.config.endless === true,
    curses: run.config.curses ?? [],
    shrines: run.shrinesUsed,
    daily: run.config.daily === true,
  };
}
