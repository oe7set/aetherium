import { ACTIONS } from './actions';
import { ITEMS } from './items';
import { SKILLS } from './skills';
import { TOOLS } from './tools';
import { ACHIEVEMENTS } from './achievements';
import { AREAS, DUNGEONS, MONSTERS, type MonsterDef } from './combat';
import { CROPS, ELEMENTS, HELPERS, TECHS, type TechDef } from './science';
import { LUCKY_EVENTS, POTION_BUFFS } from './buffs';
import type { AchievementDef, ActionDef, BuffDef, ItemDef, SkillDef, ToolDef } from './types';

export * from './types';
export { ACTIONS } from './actions';
export { ITEMS } from './items';
export { SKILLS, COMING_SOON_SKILLS } from './skills';
export { TOOLS, STARTER_TOOLS, SHOP_OFFERS } from './tools';
export { BALANCE } from './balance';
export { AREAS, DUNGEONS, MONSTERS } from './combat';
export {
  CROPS,
  ELEMENTS,
  ERAS,
  HELPERS,
  MUTATION_CHANCE,
  DISCOVERY_CHANCE,
  TECHS,
} from './science';
export type { CropDef, ElementDef, HelperDef, TechDef, TechUnlock } from './science';
export type { AreaDef, BossPhase, DungeonDef, MonsterDef } from './combat';
export { ACHIEVEMENTS } from './achievements';
export { LUCKY_EVENTS, POTION_BUFFS } from './buffs';

export const BUFFS: BuffDef[] = [...LUCKY_EVENTS, ...POTION_BUFFS];

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
export const MONSTER_MAP = indexById(MONSTERS, 'Monster');
export const AREA_MAP = indexById(AREAS, 'Gebiet');
export const DUNGEON_MAP = indexById(DUNGEONS, 'Dungeon');
export const TECH_MAP = indexById(TECHS, 'Tech');
export const HELPER_MAP = indexById(HELPERS, 'Helfer');
export const CROP_MAP = new Map(CROPS.map((c) => [c.seed, c]));
export const ELEMENT_MAP = new Map(ELEMENTS.map((e) => [e.symbol, e]));
export const ACHIEVEMENT_MAP = indexById(ACHIEVEMENTS, 'Erfolg');
export const BUFF_MAP = indexById(BUFFS, 'Buff');

function lookup<T>(map: Map<string, T>, id: string, kind: string): T {
  const found = map.get(id);
  if (!found) throw new Error(`Unbekannte ${kind}-ID: ${id}`);
  return found;
}

export const getItem = (id: string): ItemDef => lookup(ITEM_MAP, id, 'Item');
export const getAction = (id: string): ActionDef => lookup(ACTION_MAP, id, 'Aktion');
export const getSkill = (id: string): SkillDef => lookup(SKILL_MAP, id, 'Skill');
export const getTool = (id: string): ToolDef => lookup(TOOL_MAP, id, 'Werkzeug');
export const getAchievement = (id: string): AchievementDef => lookup(ACHIEVEMENT_MAP, id, 'Erfolg');
export const getMonster = (id: string): MonsterDef => lookup(MONSTER_MAP, id, 'Monster');
export const getTech = (id: string): TechDef => lookup(TECH_MAP, id, 'Tech');
export const getBuff = (id: string): BuffDef => lookup(BUFF_MAP, id, 'Buff');

export const actionsForSkill = (skill: string): ActionDef[] =>
  ACTIONS.filter((a) => a.skill === skill).sort((a, b) => a.levelReq - b.levelReq);

export const toolsForSkill = (skill: string): ToolDef[] =>
  TOOLS.filter((t) => t.skill === skill).sort((a, b) => a.tier - b.tier);
