import { ACTIONS } from './actions';
import { ITEMS } from './items';
import { SKILLS } from './skills';
import { TOOLS } from './tools';
import type { ActionDef, ItemDef, SkillDef, ToolDef } from './types';

export * from './types';
export { ACTIONS } from './actions';
export { ITEMS } from './items';
export { SKILLS, COMING_SOON_SKILLS } from './skills';
export { TOOLS, STARTER_TOOLS, SHOP_OFFERS } from './tools';
export { BALANCE } from './balance';

function indexById<T extends { id: string }>(list: T[], kind: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const entry of list) {
    if (map.has(entry.id)) throw new Error(`Doppelte ${kind}-ID: ${entry.id}`);
    map.set(entry.id, entry);
  }
  return map;
}

export const ITEM_MAP = indexById(ITEMS, 'Item');
export const ACTION_MAP = indexById(ACTIONS, 'Aktion');
export const SKILL_MAP = indexById(SKILLS, 'Skill');
export const TOOL_MAP = indexById(TOOLS, 'Werkzeug');

function lookup<T>(map: Map<string, T>, id: string, kind: string): T {
  const found = map.get(id);
  if (!found) throw new Error(`Unbekannte ${kind}-ID: ${id}`);
  return found;
}

export const getItem = (id: string): ItemDef => lookup(ITEM_MAP, id, 'Item');
export const getAction = (id: string): ActionDef => lookup(ACTION_MAP, id, 'Aktion');
export const getSkill = (id: string): SkillDef => lookup(SKILL_MAP, id, 'Skill');
export const getTool = (id: string): ToolDef => lookup(TOOL_MAP, id, 'Werkzeug');

export const actionsForSkill = (skill: string): ActionDef[] =>
  ACTIONS.filter((a) => a.skill === skill).sort((a, b) => a.levelReq - b.levelReq);

export const toolsForSkill = (skill: string): ToolDef[] =>
  TOOLS.filter((t) => t.skill === skill).sort((a, b) => a.tier - b.tier);
