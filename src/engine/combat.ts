import { DUNGEON_MAP, getItem, getMonster, ITEMS, MONSTER_MAP } from '../data';
import type { MonsterDef } from '../data/combat';
import {
  SPECIAL_COST,
  SPECIAL_GAIN_HIT,
  SPECIAL_GAIN_MISS,
  SPECIAL_KILL_GOLD,
  SPECIAL_XP,
  SPELL_MAP,
  SPELLS,
  type SpellDef,
} from '../data/spells';
import type { CombatStyle, EquipDef, EquipSlot } from '../data/types';
import {
  EPS,
  gainItem,
  onActionStart,
  registerRunnerFactory,
  registerTimeEffect,
  rollDrops,
  stopAction,
  xpMultiplierFor,
} from './actions';
import type { CombatStopReason, Emit } from './events';
import { itemCount, removeItem, addItem, freeSlots } from './inventory';
import { invalidateMods, mod, modFor, registerModifierSource } from './modifiers';
import { randInt, type Rng } from './rng';
import { addResearch } from './science';
import { earnGold } from './shop';
import { addXp, skillLevel } from './skills';
import { addStat, type CombatState, type GameState } from './state';

/** Seconds between respawns. */
export const RESPAWN_SECONDS = 1.5;
/** Seconds per regenerated hit point. */
export const HP_REGEN_SECONDS = 10;
const UNARMED: EquipDef = { slot: 'weapon', style: 'melee', speed: 2.4, attack: 0, strength: 0 };
const RUNE_ITEM = 'rune_basic';

registerModifierSource('equipment', (s) =>
  Object.entries(s.equipment)
    .filter(([slot, id]) => slot !== 'ammo' && id)
    .map(([, id]) => getItem(id as string).equip?.mods ?? {}),
);

// --- Player stats -------------------------------------------------------------------------------

export function weaponDef(s: GameState): EquipDef {
  const id = s.equipment.weapon;
  return (id && getItem(id).equip) || UNARMED;
}

export function combatStyle(s: GameState): CombatStyle {
  return weaponDef(s).style ?? 'melee';
}

export function maxHp(s: GameState): number {
  return Math.floor(skillLevel(s, 'hitpoints') * (1 + mod(s, 'combat.hp')));
}

function gearSum(s: GameState, key: 'attack' | 'strength' | 'defence'): number {
  let sum = 0;
  for (const [slot, id] of Object.entries(s.equipment)) {
    if (!id) continue;
    if (slot === 'ammo' && (key !== 'strength' || combatStyle(s) !== 'ranged')) continue;
    sum += getItem(id).equip?.[key] ?? 0;
  }
  return sum;
}

export interface PlayerCombatStats {
  style: CombatStyle;
  level: number;
  accuracy: number;
  maxHit: number;
  speed: number;
  defenceRating: number;
  maxHp: number;
}

// --- Spells -------------------------------------------------------------------------------------

function hasReagents(s: GameState, sp: SpellDef): boolean {
  return (
    itemCount(s, RUNE_ITEM) >= sp.runes &&
    (!sp.catalyst || itemCount(s, sp.catalyst.item) >= sp.catalyst.qty)
  );
}

export function spellUnlocked(s: GameState, sp: SpellDef): boolean {
  return skillLevel(s, 'magic') >= sp.level;
}

/** The spell that will actually be cast: the chosen one, else the spark when its reagents run out. */
export function castSpell(s: GameState): SpellDef | null {
  const chosen = SPELL_MAP.get(s.combatSettings.spell);
  if (chosen && spellUnlocked(s, chosen) && hasReagents(s, chosen)) return chosen;
  const spark = SPELLS[0]!;
  return hasReagents(s, spark) ? spark : null;
}

export function playerStats(s: GameState): PlayerCombatStats {
  const style = combatStyle(s);
  const level = skillLevel(s, style);
  const atk = gearSum(s, 'attack');
  const str = gearSum(s, 'strength');
  const def = gearSum(s, 'defence');
  const spell = style === 'magic' ? castSpell(s) : null;
  return {
    style,
    level,
    accuracy:
      (level + 8) * (atk + 64) * (1 + modFor(s, 'combat.accuracy', style)) * (spell?.accuracy ?? 1),
    maxHit: Math.max(
      1,
      Math.floor(
        0.5 +
          (((level + 8) * (str + 64)) / 640) *
            (1 + modFor(s, 'combat.damage', style)) *
            (spell?.damage ?? 1),
      ),
    ),
    speed: weaponDef(s).speed ?? 2.4,
    defenceRating: (skillLevel(s, 'defence') + 8) * (def + 64) * (1 + mod(s, 'combat.defence')),
    maxHp: maxHp(s),
  };
}

/** OSRS-style hit chance from two ratings. */
export function hitChance(attack: number, defence: number): number {
  return attack > defence ? 1 - (defence + 2) / (2 * (attack + 1)) : attack / (2 * (defence + 1));
}

export function monsterDefenceRating(m: MonsterDef): number {
  return (m.defence + 9) * 64;
}

export function monsterAccuracy(m: MonsterDef): number {
  return (m.attack + 9) * 64;
}

/** Player hit chance against a monster, including weakness bonus and boss evasion. */
export function playerHitChance(s: GameState, m: MonsterDef, phase = 0): number {
  const st = playerStats(s);
  const acc = st.accuracy * (m.weakness === st.style ? 1.25 : 1);
  const evade = m.phases?.[phase]?.evade ?? 0;
  return hitChance(acc, monsterDefenceRating(m)) * (1 - evade);
}

export function monsterHitChance(s: GameState, m: MonsterDef): number {
  return hitChance(monsterAccuracy(m), playerStats(s).defenceRating);
}

export function combatLevel(s: GameState): number {
  const best = Math.max(skillLevel(s, 'melee'), skillLevel(s, 'ranged'), skillLevel(s, 'magic'));
  return Math.floor((skillLevel(s, 'defence') + skillLevel(s, 'hitpoints')) / 4 + best * 0.65);
}

/** Rough kills per hour estimate for the UI (ignores eating and deaths). */
export function estimateKillTime(s: GameState, m: MonsterDef): number {
  const st = playerStats(s);
  const dps = (playerHitChance(s, m) * ((1 + st.maxHit) / 2)) / st.speed;
  return dps > 0 ? m.hp / dps + RESPAWN_SECONDS : Infinity;
}

// --- Equipment ----------------------------------------------------------------------------------

export type EquipResult =
  { ok: true } | { ok: false; reason: 'notEquippable' | 'level' | 'space' | 'notEnough' };

export function canWear(s: GameState, itemId: string): boolean {
  const eq = getItem(itemId).equip;
  if (!eq) return false;
  return !eq.req || skillLevel(s, eq.req.skill) >= eq.req.level;
}

export function equipItem(s: GameState, itemId: string): EquipResult {
  const eq = getItem(itemId).equip;
  if (!eq) return { ok: false, reason: 'notEquippable' };
  if (itemCount(s, itemId) <= 0) return { ok: false, reason: 'notEnough' };
  if (!canWear(s, itemId)) return { ok: false, reason: 'level' };
  if (eq.slot === 'ammo') {
    // Ammo stays in the inventory; the slot only selects which stack to shoot.
    s.equipment.ammo = itemId;
    return { ok: true };
  }
  const old = s.equipment[eq.slot];
  const freesSlot = itemCount(s, itemId) === 1;
  if (old && itemCount(s, old) <= 0 && freeSlots(s) <= 0 && !freesSlot)
    return { ok: false, reason: 'space' };
  removeItem(s, itemId, 1);
  if (old) addItem(s, old, 1);
  s.equipment[eq.slot] = itemId;
  invalidateMods(s);
  return { ok: true };
}

export function unequip(s: GameState, slot: EquipSlot): EquipResult {
  const id = s.equipment[slot];
  if (!id) return { ok: true };
  if (slot !== 'ammo') {
    if (itemCount(s, id) <= 0 && freeSlots(s) <= 0) return { ok: false, reason: 'space' };
    addItem(s, id, 1);
  }
  delete s.equipment[slot];
  invalidateMods(s);
  return { ok: true };
}

/** Armour slots that „Bestes anlegen" fills; weapons, jewellery and ammo stay a personal choice. */
export const ARMOUR_SLOTS: EquipSlot[] = [
  'head',
  'cape',
  'body',
  'hands',
  'legs',
  'feet',
  'shield',
];

/** Rough armour value: flat stats plus 100 per +100 % of modifiers. */
export function gearScore(eq: EquipDef): number {
  const mods = Object.values(eq.mods ?? {}).reduce<number>((a, v) => a + (v ?? 0), 0);
  return (eq.attack ?? 0) + (eq.strength ?? 0) + (eq.defence ?? 0) + mods * 100;
}

/** Puts on the best wearable armour per slot; returns how many pieces changed. */
export function equipBest(s: GameState): number {
  let changed = 0;
  for (const slot of ARMOUR_SLOTS) {
    const current = s.equipment[slot];
    let best = current;
    let bestScore = current ? gearScore(getItem(current).equip ?? { slot }) : -1;
    for (const id of Object.keys(s.inventory)) {
      const eq = getItem(id).equip;
      if (!eq || eq.slot !== slot || itemCount(s, id) <= 0 || !canWear(s, id)) continue;
      const score = gearScore(eq);
      if (score > bestScore) {
        best = id;
        bestScore = score;
      }
    }
    if (best && best !== current && equipItem(s, best).ok) changed++;
  }
  return changed;
}

// --- Food ---------------------------------------------------------------------------------------

export const FOODS = ITEMS.filter((i) => (i.heal ?? 0) > 0).sort(
  (a, b) => (a.heal ?? 0) - (b.heal ?? 0),
);

/** The food that would be eaten next: the chosen one if available, else the best in the bag. */
export function nextFood(s: GameState): string | null {
  const chosen = s.combatSettings.food;
  if (chosen && itemCount(s, chosen) > 0) return chosen;
  for (let i = FOODS.length - 1; i >= 0; i--) {
    const f = FOODS[i]!;
    if (itemCount(s, f.id) > 0) return f.id;
  }
  return null;
}

export function eat(s: GameState, emit: Emit, itemId: string | null = nextFood(s)): boolean {
  if (!itemId || itemCount(s, itemId) <= 0) return false;
  const heal = getItem(itemId).heal ?? 0;
  if (heal <= 0) return false;
  removeItem(s, itemId, 1);
  s.hp = Math.min(maxHp(s), s.hp + heal);
  addStat(s, 'foodEaten');
  emit({ type: 'ate', item: itemId, heal });
  return true;
}

function autoEat(s: GameState, emit: Emit): void {
  const threshold = s.combatSettings.autoEat;
  if (threshold <= 0) return;
  const max = maxHp(s);
  let guard = 0;
  while (s.hp <= max * threshold && guard++ < 20) {
    if (!eat(s, emit)) break;
  }
}

// --- Combat flow --------------------------------------------------------------------------------

function currentMonsterId(c: CombatState): string {
  if (c.kind === 'dungeon') {
    const d = DUNGEON_MAP.get(c.target);
    return d?.monsters[c.index] ?? d?.monsters[0] ?? 'chicken';
  }
  return c.target;
}

function spawn(s: GameState, c: CombatState): void {
  const m = getMonster(currentMonsterId(c));
  c.monster = m.id;
  c.monsterHp = m.hp;
  c.phase = 0;
  c.respawn = 0;
  c.playerTimer = playerStats(s).speed * 0.5;
  c.monsterTimer = m.speed;
}

export function startCombat(
  s: GameState,
  kind: 'monster' | 'dungeon',
  target: string,
  emit: Emit,
): boolean {
  if (kind === 'monster' && !MONSTER_MAP.has(target)) return false;
  if (kind === 'dungeon' && !DUNGEON_MAP.has(target)) return false;
  stopAction(s, emit);
  const c: CombatState = {
    kind,
    target,
    index: 0,
    monster: '',
    monsterHp: 0,
    phase: 0,
    respawn: 0,
    playerTimer: 0,
    monsterTimer: 0,
    energy: 0,
  };
  spawn(s, c);
  s.combat = c;
  if (s.hp <= 0) s.hp = maxHp(s);
  emit({ type: 'combatStarted', monster: c.monster });
  return true;
}

export function stopCombat(s: GameState, emit: Emit, reason: CombatStopReason = 'manual'): void {
  if (!s.combat) return;
  const monster = s.combat.monster;
  s.combat = null;
  emit({ type: 'combatStopped', monster, reason });
}

// Starting a skilling action ends combat.
onActionStart((s, emit) => stopCombat(s, emit));

function missingAmmo(s: GameState): 'noAmmo' | 'noRunes' | null {
  const style = combatStyle(s);
  if (style === 'ranged') {
    const ammo = s.equipment.ammo;
    return ammo && itemCount(s, ammo) > 0 ? null : 'noAmmo';
  }
  if (style === 'magic') return castSpell(s) ? null : 'noRunes';
  return null;
}

function grantCombatXp(s: GameState, damage: number, emit: Emit, factor = 1): void {
  const style = combatStyle(s);
  const target = s.combatSettings.training === 'defence' ? 'defence' : style;
  addXp(s, target, damage * 4 * factor * xpMultiplierFor(s, target), emit);
  addXp(s, 'hitpoints', damage * 1.33 * xpMultiplierFor(s, 'hitpoints'), emit);
}

type KillHook = (s: GameState, monster: string, rng: Rng, emit: Emit) => void;
const killHooks: KillHook[] = [];
/** Runs after every kill (pets, quests …). */
export function onMonsterKilled(fn: KillHook): void {
  killHooks.push(fn);
}

function killMonster(
  s: GameState,
  c: CombatState,
  m: MonsterDef,
  rng: Rng,
  emit: Emit,
  goldMult = 1,
): void {
  addResearch(s, m.level * 0.4);
  addStat(s, 'monstersKilled');
  addStat(s, `kills.${m.id}`);
  if (m.boss) addStat(s, 'bossKills');
  emit({ type: 'monsterKilled', monster: m.id });
  for (const hook of killHooks) hook(s, m.id, rng, emit);
  earnGold(s, Math.round(randInt(rng, m.gold[0], m.gold[1]) * goldMult), emit);
  const lootBonus = mod(s, 'combat.loot');
  for (const { entry, qty } of rollDrops(rng, m.loot, mod(s, 'rare') + lootBonus)) {
    gainItem(s, entry.item, qty, emit, entry.rare);
  }
  if (c.kind === 'dungeon') {
    const d = DUNGEON_MAP.get(c.target);
    c.index++;
    if (d && c.index >= d.monsters.length) {
      c.index = 0;
      addStat(s, 'dungeonsCompleted');
      addStat(s, `dungeon.${d.id}`);
      emit({ type: 'dungeonCompleted', dungeon: d.id });
      for (const { entry, qty } of rollDrops(rng, d.reward))
        gainItem(s, entry.item, qty, emit, true);
    }
  }
  c.respawn = RESPAWN_SECONDS;
}

/** Spends one shot's worth of ammo or reagents (with the gear's chance to keep them). */
function payShot(s: GameState, rng: Rng, style: CombatStyle): SpellDef | null {
  if (style === 'ranged' && s.equipment.ammo) {
    const save = mod(s, 'combat.ammoSave');
    if (save <= 0 || rng() >= save) removeItem(s, s.equipment.ammo, 1);
  }
  if (style !== 'magic') return null;
  const spell = castSpell(s);
  if (!spell) return null;
  const save = mod(s, 'combat.runeSave');
  if (save <= 0 || rng() >= save) {
    removeItem(s, RUNE_ITEM, spell.runes);
    if (spell.catalyst) removeItem(s, spell.catalyst.item, spell.catalyst.qty);
  }
  return spell;
}

function gainEnergy(s: GameState, c: CombatState, amount: number): void {
  c.energy = Math.min(SPECIAL_COST, c.energy + amount * (1 + mod(s, 'combat.energy')));
}

/** Applies a landed hit: damage, XP, side effects, boss phases and the kill. */
function landHit(
  s: GameState,
  c: CombatState,
  m: MonsterDef,
  raw: number,
  rng: Rng,
  emit: Emit,
  opts: { spell?: SpellDef | null; special?: boolean; heal?: number } = {},
): void {
  const damage = Math.max(1, Math.min(c.monsterHp, raw));
  c.monsterHp -= damage;
  addStat(s, 'damageDealt', damage);
  emit({ type: 'hit', target: 'monster', damage, special: opts.special });
  grantCombatXp(s, damage, emit, (opts.spell?.xp ?? 1) * (opts.special ? SPECIAL_XP : 1));
  const heal = damage * ((opts.spell?.drain ?? 0) + (opts.heal ?? 0));
  if (heal > 0) s.hp = Math.min(maxHp(s), s.hp + heal);
  const freeze = opts.spell?.freeze;
  if (freeze && rng() < freeze.chance) c.monsterTimer += freeze.seconds;
  if (m.phases) {
    const frac = c.monsterHp / m.hp;
    let phase = 0;
    m.phases.forEach((p, i) => {
      if (frac <= p.below) phase = i;
    });
    if (phase !== c.phase) {
      c.phase = phase;
      emit({ type: 'bossPhase', monster: m.id, phase });
    }
  }
  if (c.monsterHp <= 0) killMonster(s, c, m, rng, emit, opts.special ? 1 + SPECIAL_KILL_GOLD : 1);
}

function playerAttack(s: GameState, c: CombatState, rng: Rng, emit: Emit): void {
  const m = getMonster(c.monster);
  const st = playerStats(s);
  c.playerTimer += st.speed;
  const spell = payShot(s, rng, st.style);
  if (rng() >= playerHitChance(s, m, c.phase)) {
    gainEnergy(s, c, SPECIAL_GAIN_MISS);
    emit({ type: 'hit', target: 'monster', damage: 0 });
    return;
  }
  gainEnergy(s, c, SPECIAL_GAIN_HIT);
  landHit(s, c, m, randInt(rng, 1, st.maxHit), rng, emit, { spell });
}

export type SpecialResult = 'ok' | 'noCombat' | 'notReady' | 'noAmmo';

/**
 * The optional active part of combat: a full energy bar can be spent on a style-specific special
 * attack. Purely a bonus on top of the idle fight – it never fires on its own.
 */
export function specialAttack(s: GameState, rng: Rng, emit: Emit): SpecialResult {
  const c = s.combat;
  if (!c || c.monsterHp <= 0) return 'noCombat';
  if (c.energy < SPECIAL_COST) return 'notReady';
  if (missingAmmo(s)) return 'noAmmo';
  c.energy -= SPECIAL_COST;
  const m = getMonster(c.monster);
  const st = playerStats(s);
  addStat(s, 'specialsUsed');
  emit({ type: 'special', style: st.style });
  if (st.style === 'melee') {
    landHit(s, c, m, Math.round(st.maxHit * (1.5 + rng() * 0.5)), rng, emit, { special: true });
  } else if (st.style === 'ranged') {
    const chance = Math.min(1, playerHitChance(s, m, c.phase) * 1.4);
    for (let shot = 0; shot < 2 && c.monsterHp > 0; shot++) {
      if (shot > 0 && missingAmmo(s)) break;
      payShot(s, rng, 'ranged');
      if (rng() < chance)
        landHit(s, c, m, randInt(rng, 1, st.maxHit), rng, emit, { special: true });
      else emit({ type: 'hit', target: 'monster', damage: 0 });
    }
  } else {
    const spell = payShot(s, rng, 'magic');
    landHit(s, c, m, Math.round(st.maxHit * 1.6), rng, emit, { spell, special: true, heal: 0.3 });
  }
  return 'ok';
}

function monsterAttack(s: GameState, c: CombatState, rng: Rng, emit: Emit): void {
  const m = getMonster(c.monster);
  const phase = m.phases?.[c.phase];
  c.monsterTimer += m.speed * (phase?.speedMult ?? 1);
  if (rng() >= monsterHitChance(s, m)) {
    emit({ type: 'hit', target: 'player', damage: 0 });
    return;
  }
  const damage = randInt(rng, 1, m.maxHit + (phase?.maxHitBonus ?? 0));
  s.hp -= damage;
  addStat(s, 'damageTaken', damage);
  emit({ type: 'hit', target: 'player', damage });
  autoEat(s, emit);
  if (s.hp <= 0) {
    addStat(s, 'deaths');
    s.hp = maxHp(s);
    stopCombat(s, emit, 'died');
    emit({ type: 'playerDied', monster: m.id });
  }
}

registerRunnerFactory('combat', (s, rng, emit) => {
  const c = s.combat;
  if (!c) return [];
  // A dead monster (HP 0) means we are waiting for the next spawn.
  const dead = () => c.monsterHp <= 0;
  return [
    {
      validate: () => {
        const missing = dead() ? null : missingAmmo(s);
        if (!missing) return true;
        stopCombat(s, emit, missing);
        return false;
      },
      timeLeft: () => Math.max(0, dead() ? c.respawn : Math.min(c.playerTimer, c.monsterTimer)),
      needsFire: () => false,
      progress: (dt) => {
        if (dead()) c.respawn -= dt;
        else {
          c.playerTimer -= dt;
          c.monsterTimer -= dt;
        }
      },
      ready: () => (dead() ? c.respawn <= EPS : c.playerTimer <= EPS || c.monsterTimer <= EPS),
      complete: () => {
        if (dead()) {
          spawn(s, c);
          emit({ type: 'monsterSpawned', monster: c.monster });
        } else if (c.playerTimer <= EPS) playerAttack(s, c, rng, emit);
        else monsterAttack(s, c, rng, emit);
      },
    },
  ];
});

// Slow natural regeneration, in and out of combat.
registerTimeEffect('hpRegen', {
  next: () => Infinity,
  apply: (s, dt) => {
    const max = maxHp(s);
    if (s.hp < max) s.hp = Math.min(max, s.hp + dt / HP_REGEN_SECONDS);
  },
});
