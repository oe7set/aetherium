import { ACTIONS, actionsForSkill, toolsForSkill } from '../src/data';
import * as e from '../src/engine';

/** Shared bot turns for the long-term balance tests (island, village, hero). */
export const noop = () => {};

/** Works towards an item: its maker if the inputs are there, else the first missing input (depth 4). */
export function workTowards(s: e.GameState, item: string, depth = 0): boolean {
  const maker = ACTIONS.filter(
    (a) => a.outputs.some((o) => o.item === item) && a.levelReq <= e.skillLevel(s, a.skill),
  ).pop();
  if (!maker || depth > 4) return false;
  if (e.canPerform(s, maker).ok) return e.startAction(s, maker.id, noop).ok;
  const missing = e.firstMissing(s, maker.inputs);
  return missing ? workTowards(s, missing, depth + 1) : false;
}

/** Island goods the village asks for (and what they are made of) stay in the bag. */
const KEEP = new Set([
  'stone_granite',
  'log_oak',
  'log_maple',
  'ore_copper',
  'ore_tin',
  'ore_iron',
  'coal',
]);

export function islandTurn(s: e.GameState, hour: number): void {
  const skill = ['woodcutting', 'mining', 'fishing'][Math.floor(hour / 6) % 3]!;
  const wanted = e.goodsWanted(s);
  for (const g of wanted?.missing ?? []) KEEP.add(g.item);
  // Sell the bag, buy the best affordable tool, start the best action.
  for (const [item, qty] of Object.entries(s.inventory))
    if (!KEEP.has(item)) e.sellItem(s, item, qty, noop);
  // Every other check-in the village's wishes come first.
  if (wanted && hour % 1 === 0 && wanted.missing.some((g) => workTowards(s, g.item))) return;
  for (const t of toolsForSkill(skill)) if (!s.ownedTools.includes(t.id)) e.buyTool(s, t.id);
  const level = e.skillLevel(s, skill);
  const candidates = actionsForSkill(skill)
    .filter((a) => a.levelReq <= level)
    .reverse();
  if (s.active && candidates[0]?.id === s.active.actionId) return;
  for (const a of candidates) if (e.startAction(s, a.id, noop).ok) break;
}

export function villageTurn(s: e.GameState): void {
  const v = e.activeVillage(s);
  const order = [
    'main',
    'warehouse',
    'granary',
    'rally',
    'barracks',
    'academy',
    'market',
    'smithy',
    'wall',
  ];
  for (let k = 0; k < 3; k++) {
    if (e.netCrop(s, v) < 200) {
      const crop = v.fields
        .map((l, i) => [l, i] as const)
        .filter(([, i]) => e.fieldType(v, i) === 'crop')
        .sort((a, b) => a[0] - b[0])[0];
      if (crop && e.canUpgradeField(s, v, crop[1]).ok) e.upgradeField(s, v.id, crop[1]);
    }
    if (Math.max(v.res.wood, v.res.clay, v.res.iron) > e.storageCap(v) * 0.8)
      e.upgradeBuilding(s, v.id, 'warehouse');
    const cheapest = v.fields.map((_, i) => i).sort((a, b) => v.fields[a]! - v.fields[b]!)[0]!;
    if (e.canUpgradeField(s, v, cheapest).ok) e.upgradeField(s, v.id, cheapest);
    const next = order
      .map((id) => ({ id, lvl: e.buildingLevel(v, id) }))
      .sort((a, b) => a.lvl - b.lvl)
      .find((b) => e.canUpgradeBuilding(s, v, b.id).ok);
    if (next) e.upgradeBuilding(s, v.id, next.id);
  }
  // Keep a small garrison against rift invasions (a quarter of the spare resources).
  if (e.buildingLevel(v, 'barracks') > 0) {
    let n = 1;
    while (e.canTrain(s, v, 'militia', n * 2).ok && n < 200) n *= 2;
    if (e.canTrain(s, v, 'militia', Math.max(1, Math.floor(n / 4))).ok)
      e.trainTroops(s, v.id, 'militia', Math.max(1, Math.floor(n / 4)));
  }
}

export function heroTurn(s: e.GameState, rng: e.Rng): void {
  const h = s.hero;
  if (h.points > 0) e.assignPoints(s, 'power', h.points);
  if (h.status === 'dead') e.reviveHero(s);
  if (e.currentAdventure(s)) e.autoAdventure(s, rng, noop);
  else if (h.status === 'home' && h.health > 40) {
    const adv = [...h.adventures].sort((a, b) => a.level - b.level)[0];
    if (adv) e.startAdventure(s, adv.id);
  }
}
