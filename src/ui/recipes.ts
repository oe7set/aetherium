import { ACTIONS, MONSTERS, SHOP_OFFERS, type ActionDef } from '../data';
import { skillLevel, type GameState } from '../engine';

/** Recipe index: which actions use an item, which make it (built once). */
export const USED_IN = new Map<string, ActionDef[]>();
export const MADE_BY = new Map<string, ActionDef[]>();
for (const a of ACTIONS) {
  for (const i of a.inputs) USED_IN.set(i.item, [...(USED_IN.get(i.item) ?? []), a]);
  for (const o of a.outputs) MADE_BY.set(o.item, [...(MADE_BY.get(o.item) ?? []), a]);
}

const SHOP_ITEMS = new Set(SHOP_OFFERS.map((o) => o.item));
/** Items found as drops of actions (archaeology, hunting …) or monster loot. */
const DROPPED_BY = new Map<string, ActionDef[]>();
for (const a of ACTIONS)
  for (const d of a.drops ?? []) DROPPED_BY.set(d.item, [...(DROPPED_BY.get(d.item) ?? []), a]);
const MONSTER_LOOT = new Set(MONSTERS.flatMap((m) => m.loot.map((l) => l.item)));

export type ItemSource =
  { kind: 'action'; action: ActionDef } | { kind: 'shop' } | { kind: 'combat' } | null;

/**
 * Where to get an item: the best action the player can already do that makes it (else the
 * easiest one), otherwise the shop, a fight (monster loot) or an action that finds it as a drop.
 */
export function itemSource(s: GameState, item: string): ItemSource {
  const makers = MADE_BY.get(item);
  if (makers?.length) {
    const doable = makers
      .filter((a) => skillLevel(s, a.skill) >= a.levelReq)
      .sort((a, b) => b.levelReq - a.levelReq);
    const easiest = [...makers].sort((a, b) => a.levelReq - b.levelReq);
    return { kind: 'action', action: doable[0] ?? easiest[0]! };
  }
  if (SHOP_ITEMS.has(item)) return { kind: 'shop' };
  if (MONSTER_LOOT.has(item)) return { kind: 'combat' };
  const finders = DROPPED_BY.get(item);
  if (finders?.length)
    return { kind: 'action', action: [...finders].sort((a, b) => a.levelReq - b.levelReq)[0]! };
  return null;
}

export interface SkillLink {
  skill: string;
  /** Example items that flow along this link (max 4). */
  items: string[];
}

const LINKS = new Map<string, { from: SkillLink[]; to: SkillLink[] }>();

function groupLinks(pairs: [string, string][]): SkillLink[] {
  const by = new Map<string, Set<string>>();
  for (const [skill, item] of pairs) by.set(skill, (by.get(skill) ?? new Set()).add(item));
  return [...by.entries()]
    .map(([skill, items]) => ({ skill, items: [...items].slice(0, 4) }))
    .sort((a, b) => b.items.length - a.items.length);
}

/**
 * Verbindungen: which skills feed this one (makers of its inputs, also as drops) and which skills
 * use its products – computed from all recipes once per skill.
 */
export function skillLinks(skill: string): { from: SkillLink[]; to: SkillLink[] } {
  const cached = LINKS.get(skill);
  if (cached) return cached;
  const own = ACTIONS.filter((a) => a.skill === skill);
  const from: [string, string][] = [];
  const to: [string, string][] = [];
  for (const a of own) {
    for (const i of a.inputs) {
      const makers = [...(MADE_BY.get(i.item) ?? []), ...(DROPPED_BY.get(i.item) ?? [])];
      for (const m of makers) if (m.skill !== skill) from.push([m.skill, i.item]);
    }
    const products = [...a.outputs.map((o) => o.item), ...(a.drops ?? []).map((d) => d.item)];
    for (const item of products)
      for (const u of USED_IN.get(item) ?? []) if (u.skill !== skill) to.push([u.skill, item]);
  }
  const out = { from: groupLinks(from), to: groupLinks(to) };
  LINKS.set(skill, out);
  return out;
}
