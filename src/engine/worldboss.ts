import { WORLD_BOSS, WORLD_BOSS_MAP, WORLD_BOSSES } from '../data/worldboss';
import type { RewardDef } from '../data/progress';
import { gainItem, registerTimeEffect } from './actions';
import { combatLevel, playerStats } from './combat';
import type { Emit } from './events';
import { heroAlive, heroStrength } from './hero';
import { applyReward, type RewardLine } from './progress';
import type { Rng } from './rng';
import { addStat, type GameState, type WorldBossFight } from './state';
import { attackValue } from './village';

/** Weltbosse: island guard, village troops and the hero wear the giant down together. */

export type WorldBossSource = 'island' | 'village' | 'hero' | 'strike';

/** Damage per second of each passive source right now. */
export function worldBossRates(s: GameState): Record<'island' | 'village' | 'hero', number> {
  const st = playerStats(s);
  const island = (st.maxHit * 0.5) / Math.max(0.6, st.speed);
  let troops = 0;
  for (const v of s.village.villages) troops += attackValue(v, v.troops);
  const village = troops / 1000;
  const hero = heroAlive(s) && s.hero.status === 'home' ? heroStrength(s) / 100 : 0;
  return { island, village, hero };
}

function phaseOf(f: WorldBossFight): number {
  const frac = f.hp / f.maxHp;
  return frac > 2 / 3 ? 0 : frac > 1 / 3 ? 1 : 2;
}

/** Spawns the next boss in the rotation. */
export function spawnWorldBoss(s: GameState, emit: Emit): void {
  const wb = s.worldBoss;
  const def = WORLD_BOSSES[wb.kills % WORLD_BOSSES.length]!;
  const maxHp = Math.round(
    WORLD_BOSS.baseHp * (1 + combatLevel(s) / 50) * (1 + WORLD_BOSS.hpPerKill * wb.kills),
  );
  s.worldBoss = {
    ...wb,
    fight: {
      boss: def.id,
      hp: maxHp,
      maxHp,
      left: WORLD_BOSS.duration,
      dmg: { island: 0, village: 0, hero: 0, strike: 0 },
      rates: worldBossRates(s),
      recalc: WORLD_BOSS.recalc,
      strikeCd: 0,
    },
  };
  emit({ type: 'worldBoss', boss: def.id, event: 'spawn' });
}

function hit(f: WorldBossFight, source: WorldBossSource, amount: number): void {
  const dmg = Math.min(f.hp, amount * (WORLD_BOSS.phaseArmor[phaseOf(f)] ?? 1));
  f.hp -= dmg;
  f.dmg[source] += dmg;
}

/** Manual strike: a big burst every minute (active play pays). */
export function strikeWorldBoss(s: GameState, rng: Rng, emit: Emit): number {
  const f = s.worldBoss.fight;
  if (!f || f.hp <= 0 || f.strikeCd > 0) return 0;
  const before = f.hp;
  hit(f, 'strike', playerStats(s).maxHit * (10 + rng() * 10));
  f.strikeCd = WORLD_BOSS.strikeCooldown;
  addStat(s, 'worldBossStrikes');
  if (f.hp <= 0) finishWorldBoss(s, true, rng, emit);
  return before - (s.worldBoss.fight?.hp ?? 0);
}

export interface WorldBossResult {
  boss: string;
  won: boolean;
  damage: number;
  lines: RewardLine[];
  unique?: string;
}

function finishWorldBoss(s: GameState, won: boolean, rng: Rng, emit: Emit): WorldBossResult | null {
  const wb = s.worldBoss;
  const f = wb.fight;
  if (!f) return null;
  const def = WORLD_BOSS_MAP.get(f.boss)!;
  const damage = f.maxHp - f.hp;
  const share = damage / f.maxHp;
  const scale = (1 + 0.2 * wb.kills) * (won ? 1 : 0.3 * share);
  const reward: RewardDef = {
    gold: Math.round(3000 * scale),
    essence: Math.round(60 * scale),
    heroXp: Math.round(300 * scale),
    items: won
      ? [
          { item: 'imprint_stone', qty: 1 },
          { item: 'protect_rune', qty: 1 },
        ]
      : [],
  };
  const lines = applyReward(s, reward, rng, emit);
  let unique: string | undefined;
  if (won && rng() < WORLD_BOSS.uniqueChance) {
    unique = def.unique;
    gainItem(s, unique, 1, emit, true);
  }
  const time = WORLD_BOSS.duration - f.left;
  s.worldBoss = {
    ...wb,
    fight: null,
    next: WORLD_BOSS.interval,
    kills: wb.kills + (won ? 1 : 0),
    bestTime: won ? Math.min(wb.bestTime || Infinity, time) : wb.bestTime,
    history: [{ boss: f.boss, won, damage: Math.round(damage), time }, ...wb.history].slice(0, 5),
    last: { boss: f.boss, won, damage: Math.round(damage), lines, unique },
  };
  if (won) addStat(s, 'worldBossKills');
  emit({ type: 'worldBoss', boss: f.boss, event: won ? 'killed' : 'escaped' });
  return { boss: f.boss, won, damage, lines, unique };
}

registerTimeEffect('worldBoss', {
  next: (s) => {
    const wb = s.worldBoss;
    const f = wb.fight;
    if (!f) return Math.max(0, wb.next);
    const rate = f.rates.island + f.rates.village + f.rates.hero;
    const armor = WORLD_BOSS.phaseArmor[phaseOf(f)] ?? 1;
    // Next phase threshold, the end of the fight, the next recalculation.
    const phaseHp = phaseOf(f) === 0 ? (f.maxHp * 2) / 3 : phaseOf(f) === 1 ? f.maxHp / 3 : 0;
    const toPhase = rate > 0 ? (f.hp - phaseHp) / (rate * armor) : Infinity;
    return Math.max(0, Math.min(f.left, f.recalc, toPhase, f.strikeCd > 0 ? f.strikeCd : Infinity));
  },
  apply: (s, dt, emit, rng) => {
    const wb = s.worldBoss;
    if (!wb.fight) {
      // Bosses only come once the player has a fighting chance.
      if (combatLevel(s) < 10) return;
      wb.next -= dt;
      if (wb.next <= 1e-6) spawnWorldBoss(s, emit);
      return;
    }
    const f = wb.fight;
    const phase = phaseOf(f);
    hit(f, 'island', f.rates.island * dt);
    hit(f, 'village', f.rates.village * dt);
    hit(f, 'hero', f.rates.hero * dt);
    f.left -= dt;
    f.strikeCd = Math.max(0, f.strikeCd - dt);
    f.recalc -= dt;
    if (f.recalc <= 1e-6) {
      f.recalc = WORLD_BOSS.recalc;
      f.rates = worldBossRates(s);
    }
    if (phaseOf(f) > phase && f.hp > 0) emit({ type: 'worldBoss', boss: f.boss, event: 'phase' });
    if (f.hp <= 1e-6) finishWorldBoss(s, true, rng, emit);
    else if (f.left <= 1e-6) finishWorldBoss(s, false, rng, emit);
  },
});
