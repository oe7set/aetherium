import { describe, expect, it } from 'vitest';
import { ACTIONS, actionsForSkill, toolsForSkill } from '../src/data';
import * as e from '../src/engine';
import { gameWith } from './helpers';

/**
 * Einstiegs-Bot: a brand-new save, played for two hours with a check-in every five minutes – like
 * a curious new player who follows the chronicle, rotates skills and claims what is offered.
 * Prints a table for docs/BALANCING.md and guards the pacing of the first session.
 */
const noop = () => {};
const SKILLS = ['woodcutting', 'firemaking', 'fishing', 'cooking', 'mining', 'smithing'];

function islandTurn(s: e.GameState, turn: number): void {
  // Sell surplus every half hour, keep inputs for the next crafts.
  if (turn % 6 === 5)
    for (const [item, qty] of Object.entries(s.inventory))
      if (qty > 30) e.sellItem(s, item, qty - 30, noop);
  for (const skill of SKILLS)
    for (const t of toolsForSkill(skill)) if (!s.ownedTools.includes(t.id)) e.buyTool(s, t.id);
  // Lowest skill first, best doable action; fall back to the next skill.
  const order = [...SKILLS].sort((a, b) => e.skillLevel(s, a) - e.skillLevel(s, b));
  for (const skill of order) {
    const level = e.skillLevel(s, skill);
    const doable = actionsForSkill(skill)
      .filter((a) => a.levelReq <= level && e.canPerform(s, a).ok)
      .reverse();
    if (doable[0] && e.startAction(s, doable[0].id, noop).ok) return;
    // Missing an ingredient? Go and make it (like the recipe jump in the UI).
    const first = actionsForSkill(skill).find((a) => a.levelReq <= level);
    const missing = first && e.firstMissing(s, first.inputs);
    const maker =
      missing &&
      ACTIONS.find(
        (a) =>
          a.outputs.some((o) => o.item === missing) &&
          a.levelReq <= e.skillLevel(s, a.skill) &&
          e.canPerform(s, a).ok,
      );
    if (maker && e.startAction(s, maker.id, noop).ok) return;
  }
}

function villageTurn(s: e.GameState): void {
  const v = e.activeVillage(s);
  const field = e.bestFieldToUpgrade(s, v);
  if (field >= 0) e.upgradeField(s, v.id, field);
  for (const id of ['main', 'rally', 'barracks', 'warehouse', 'granary'])
    if (e.canUpgradeBuilding(s, v, id).ok) {
      e.upgradeBuilding(s, v.id, id);
      break;
    }
}

function claimAll(s: e.GameState, rng: e.Rng): void {
  while (e.claimChronicle(s, rng, noop));
  for (const m of e.claimableMilestones(s)) e.claimMilestone(s, m.skill, m.level, rng, noop);
  while (e.claimEmpireRank(s, rng, noop));
  if (s.hero.points > 0) e.assignPoints(s, 'power', s.hero.points);
}

describe('Einstiegs-Bot: die ersten zwei Stunden', () => {
  it('jede Viertelstunde bringt sichtbaren Fortschritt', () => {
    const rng = e.createRng(2024);
    const s = gameWith();
    const rows: Record<string, string | number>[] = [];
    for (let turn = 0; turn < 24; turn++) {
      claimAll(s, rng);
      islandTurn(s, turn);
      villageTurn(s);
      e.advance(s, 300, rng, noop);
      if (turn % 3 === 2) {
        rows.push({
          Minute: (turn + 1) * 5,
          Gesamtlevel: e.totalLevel(s),
          'Skills ≥10': SKILLS.filter((k) => e.skillLevel(s, k) >= 10).length,
          Gold: Math.round(s.gold.toNumber()),
          'Gold verdient': Math.round(s.stats.goldEarned ?? 0),
          Werkzeuge: s.ownedTools.length,
          Chronik: s.progress.chronicle,
          Reichsrang: s.empireRank,
          Felder: v(s),
        });
      }
    }
    console.table(rows);
    const at = (min: number) => rows.find((r) => r.Minute === min)!;
    // First quarter hour: a few levels and the first chronicle steps.
    expect(Number(at(15).Gesamtlevel)).toBeGreaterThan(SKILLS.length + 15);
    expect(Number(at(15).Chronik)).toBeGreaterThanOrEqual(2);
    // After an hour: several skills at 10, first tool bought.
    expect(Number(at(60)['Skills ≥10'])).toBeGreaterThanOrEqual(3);
    expect(Number(at(60).Werkzeuge)).toBeGreaterThan(Number(rows[0]!.Werkzeuge));
    // Steady growth in every row.
    for (let i = 1; i < rows.length; i++)
      expect(Number(rows[i]!.Gesamtlevel)).toBeGreaterThan(Number(rows[i - 1]!.Gesamtlevel));
    expect(s.empireRank).toBeGreaterThanOrEqual(1);
  });
});

function v(s: e.GameState): number {
  return e.activeVillage(s).fields.reduce((a, b) => a + b, 0);
}
