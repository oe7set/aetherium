import { getItem } from '../data';
import { CAT_STATES, PETS, QUESTS, TASK_TEMPLATES, type QuestDef } from '../data/meta';
import { gainItem, registerCompletionHook } from './actions';
import { onMonsterKilled } from './combat';
import type { Emit } from './events';
import { itemCount, removeItem } from './inventory';
import { invalidateMods, registerModifierSource } from './modifiers';
import { createRng, type Rng } from './rng';
import { applyReward } from './progress';
import { addResearch } from './science';
import { earnGold } from './shop';
import { addXp, skillLevel, totalLevel } from './skills';
import { addStat, type GameState, type TaskState } from './state';

// --- Pets ------------------------------------------------------------------------------------------

export const PET_MAP = new Map(PETS.map((p) => [p.id, p]));

registerModifierSource('pets', (s) =>
  s.pets.map((id) => {
    if (id === 'pet_cat' && s.catState !== 'unknown') return CAT_STATES[s.catState].mods;
    return PET_MAP.get(id)?.mods ?? {};
  }),
);

function findPet(s: GameState, id: string, emit: Emit): void {
  if (s.pets.includes(id)) return;
  s.pets.push(id);
  addStat(s, 'petsFound');
  invalidateMods(s);
  emit({ type: 'petFound', pet: id });
}

registerCompletionHook('pets', (s, def, rng, emit) => {
  for (const pet of PETS) {
    if (pet.source.skill === def.skill && !s.pets.includes(pet.id) && rng() < pet.chance)
      findPet(s, pet.id, emit);
  }
});

onMonsterKilled((s, monster, rng, emit) => {
  for (const pet of PETS) {
    if (pet.source.monster === monster && !s.pets.includes(pet.id) && rng() < pet.chance)
      findPet(s, pet.id, emit);
  }
});

/** Looking into the box collapses the wave function – once. */
export function observeCat(s: GameState, rng: Rng): 'alive' | 'ghost' | null {
  if (!s.pets.includes('pet_cat') || s.catState !== 'unknown') return null;
  s.catState = rng() < 0.5 ? 'alive' : 'ghost';
  invalidateMods(s);
  return s.catState;
}

// --- Quests ----------------------------------------------------------------------------------------

export const QUEST_MAP = new Map(QUESTS.map((q) => [q.id, q]));

export type QuestStatus = 'done' | 'active' | 'available' | 'locked';

export function questStatus(s: GameState, id: string): QuestStatus {
  if (s.quests.done.includes(id)) return 'done';
  if (s.quests.active[id]) return 'active';
  const q = QUEST_MAP.get(id);
  return q && (q.requires ?? []).every((r) => s.quests.done.includes(r)) ? 'available' : 'locked';
}

export function acceptQuest(s: GameState, id: string): boolean {
  const q = QUEST_MAP.get(id);
  if (!q || questStatus(s, id) !== 'available') return false;
  const baseline: Record<string, number> = {};
  for (const o of q.objectives) if (o.type === 'stat') baseline[o.key] = s.stats[o.key] ?? 0;
  s.quests.active[id] = baseline;
  return true;
}

export interface ObjectiveProgress {
  label: string;
  current: number;
  target: number;
  done: boolean;
}

export function questProgress(s: GameState, q: QuestDef): ObjectiveProgress[] {
  const baseline = s.quests.active[q.id] ?? {};
  return q.objectives.map((o) => {
    let current = 0;
    let target = 0;
    if (o.type === 'stat') {
      current = (s.stats[o.key] ?? 0) - (baseline[o.key] ?? 0);
      target = o.amount;
    } else if (o.type === 'deliver') {
      current = itemCount(s, o.item);
      target = o.qty;
    } else if (o.type === 'building') {
      current = Math.max(0, ...s.village.villages.map((v) => v.buildings[o.id] ?? 0));
      target = o.level;
    } else if (o.type === 'heroLevel') {
      current = s.hero.level;
      target = o.level;
    } else {
      current = skillLevel(s, o.skill);
      target = o.level;
    }
    return { label: o.label, current: Math.min(current, target), target, done: current >= target };
  });
}

export function completeQuest(
  s: GameState,
  id: string,
  emit: Emit,
  rng: Rng = createRng(Date.now()),
): boolean {
  const q = QUEST_MAP.get(id);
  if (!q || questStatus(s, id) !== 'active') return false;
  if (!questProgress(s, q).every((p) => p.done)) return false;
  for (const o of q.objectives) if (o.type === 'deliver') removeItem(s, o.item, o.qty);
  delete s.quests.active[id];
  s.quests.done.push(id);
  const r = q.rewards;
  if (r.gold) earnGold(s, r.gold, emit);
  if (r.research) addResearch(s, r.research, emit);
  for (const it of r.items ?? []) gainItem(s, it.item, it.qty, emit);
  for (const x of r.xp ?? []) addXp(s, x.skill, x.amount, emit);
  if (r.extra) applyReward(s, r.extra, rng, emit);
  addStat(s, 'questsCompleted');
  emit({ type: 'questCompleted', quest: id });
  return true;
}

// --- Daily & weekly tasks -----------------------------------------------------------------------------

export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** ISO-ish week key (Monday start). */
export function weekKey(now: number): string {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return `W${dayKey(d.getTime())}`;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const BASIC_TASKS = ['trees', 'ores', 'fish', 'cook', 'gold', 'clicks'];

function generateTasks(
  s: GameState,
  period: 'day' | 'week',
  key: string,
  count: number,
): TaskState[] {
  const rng = createRng(hash(`${key}:${period}`));
  // Prefer things the player actually does; fall back to the basics.
  const pool = TASK_TEMPLATES.filter(
    (t) => BASIC_TASKS.includes(t.id) || (s.stats[t.stat] ?? 0) > 0,
  );
  const picks: typeof pool = [];
  while (picks.length < Math.min(count, pool.length)) {
    const t = pool[Math.floor(rng() * pool.length)]!;
    if (!picks.includes(t)) picks.push(t);
  }
  const scale = 1 + totalLevel(s) / 400;
  return picks.map((t) => ({
    id: `${period}:${t.id}`,
    template: t.id,
    period,
    stat: t.stat,
    target: Math.max(1, Math.round(t.base * scale * (period === 'week' ? 6 : 1))),
    baseline: s.stats[t.stat] ?? 0,
    claimed: false,
  }));
}

/** Rolls new tasks when the day or week changes. Uses real time, not simulated time. */
export function ensureTasks(s: GameState, now: number): boolean {
  const day = dayKey(now);
  const week = weekKey(now);
  let changed = false;
  if (s.tasks.day !== day) {
    s.tasks.list = [
      ...s.tasks.list.filter((t) => t.period === 'week'),
      ...generateTasks(s, 'day', day, 3),
    ];
    s.tasks.day = day;
    changed = true;
  }
  if (s.tasks.week !== week) {
    s.tasks.list = [
      ...s.tasks.list.filter((t) => t.period === 'day'),
      ...generateTasks(s, 'week', week, 2),
    ];
    s.tasks.week = week;
    changed = true;
  }
  return changed;
}

export function taskProgress(s: GameState, t: TaskState): number {
  return Math.min(t.target, (s.stats[t.stat] ?? 0) - t.baseline);
}

export function taskReward(
  s: GameState,
  t: TaskState,
): { gold: number; research: number; chest: number } {
  const scale = 1 + totalLevel(s) / 100;
  return t.period === 'day'
    ? { gold: Math.round(250 * scale), research: Math.round(20 * scale), chest: 0 }
    : { gold: Math.round(2500 * scale), research: Math.round(200 * scale), chest: 1 };
}

export function claimTask(s: GameState, id: string, emit: Emit): boolean {
  const t = s.tasks.list.find((x) => x.id === id);
  if (!t || t.claimed || taskProgress(s, t) < t.target) return false;
  t.claimed = true;
  const r = taskReward(s, t);
  earnGold(s, r.gold, emit);
  addResearch(s, r.research, emit);
  if (r.chest) gainItem(s, 'dungeon_chest', r.chest, emit, true);
  addStat(s, 'tasksCompleted');
  emit({ type: 'taskCompleted', task: id });
  return true;
}

export function taskLabel(t: TaskState): string {
  const tpl = TASK_TEMPLATES.find((x) => x.id === t.template);
  return `${tpl?.icon ?? '📋'} ${(tpl?.label ?? t.template).replace('{n}', t.target.toLocaleString('de-DE'))}`;
}

export function questRewardText(q: QuestDef): string {
  const parts: string[] = [];
  if (q.rewards.gold) parts.push(`${q.rewards.gold.toLocaleString('de-DE')} Gold`);
  if (q.rewards.research) parts.push(`${q.rewards.research.toLocaleString('de-DE')} Forschung`);
  for (const it of q.rewards.items ?? []) parts.push(`${it.qty}× ${getItem(it.item).name}`);
  for (const x of q.rewards.xp ?? []) parts.push(`${x.amount} XP`);
  const x = q.rewards.extra;
  if (x?.essence) parts.push(`${x.essence} Riss-Essenz`);
  if (x?.resources) parts.push(`je ${x.resources} Dorf-Rohstoffe`);
  if (x?.heroXp) parts.push(`${x.heroXp} Helden-XP`);
  if (x?.heroItem)
    parts.push(
      ['', 'Heldenausrüstung', 'edle Heldenausrüstung', 'legendäre Heldenausrüstung'][x.heroItem]!,
    );
  if (x?.avatar) parts.push(`Avatar ${x.avatar}`);
  return parts.join(', ');
}
