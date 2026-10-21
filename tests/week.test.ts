import { describe, expect, it } from 'vitest';
import { PROJECTS } from '../src/data/projects';
import * as e from '../src/engine';
import { actionsForSkill, toolsForSkill } from '../src/data';
import { heroTurn, islandTurn, noop, villageTurn, workTowards } from './bot';
import { gameWith } from './helpers';

/**
 * Wochen-Bot: seven days over every loop – island, village, hero, plus the Masterplan 6.0 goals
 * (Großprojekte, Reichsränge, Meilensteine, Weltbosse, Insel-Ereignisse, Dorflieferung). Prints a
 * day table for docs/BALANCING.md and checks that no day is a dead stretch.
 */
function metaTurn(s: e.GameState, rng: e.Rng): void {
  e.collectVillageSupply(s, noop);
  // Deliver only when it finishes a stage – the village needs the same goods.
  for (const p of PROJECTS) if (e.canFinishStage(s, p.id)) e.deliverProject(s, p.id, noop);
  for (const m of e.claimableMilestones(s)) e.claimMilestone(s, m.skill, m.level, rng, noop);
  while (e.claimEmpireRank(s, rng, noop));
  while (e.claimChronicle(s, rng, noop));
  e.strikeWorldBoss(s, rng, noop);
  const deals = s.islandEvent.deals;
  for (let i = 0; i < deals.length; i++)
    if (s.gold.gte(deals[i]!.price * 20)) e.buyTraderDeal(s, i, noop);
}

const ROTATION = [
  'woodcutting',
  'mining',
  'fishing',
  'firemaking',
  'cooking',
  'smithing',
  'farming',
  'construction',
  'crafting',
  'fletching',
  'herblore',
  'brewing',
  'jewelcrafting',
  'thieving',
  'sailing',
  'astronomy',
  'agility',
  'cartography',
  'husbandry',
  'invention',
];

/** Plays the lowest skill that has something doable (like a completionist player). */
const RAW = /^(log_|ore_|stone_|bar_|plank_|fish_|raw_)|^(nails|rope|coal)$/;

function rotateTurn(s: e.GameState, hour: number): void {
  const wanted = e.goodsWanted(s);
  // A full bag stops every craft: sell all but raw materials and the goods the village wants.
  if (e.freeSlots(s) < 4)
    for (const [item, qty] of Object.entries(s.inventory))
      if (!RAW.test(item) && !wanted?.missing.some((g) => g.item === item))
        e.sellItem(s, item, qty, noop);
  if (wanted && hour % 2 === 0 && wanted.missing.some((g) => workTowards(s, g.item))) return;
  for (const skill of ROTATION)
    for (const tool of toolsForSkill(skill))
      if (!s.ownedTools.includes(tool.id)) e.buyTool(s, tool.id);
  const order = ROTATION.filter((k) => e.skillLevel(s, k) < 99).sort(
    (a, b) => e.skillLevel(s, a) - e.skillLevel(s, b),
  );
  for (const skill of order) {
    const level = e.skillLevel(s, skill);
    const best = actionsForSkill(skill)
      .filter((a) => a.levelReq <= level && e.canPerform(s, a).ok)
      .pop();
    if (best && e.startAction(s, best.id, noop).ok) return;
    const first = actionsForSkill(skill).find((a) => a.levelReq <= level);
    const missing = first && e.firstMissing(s, first.inputs);
    if (missing && workTowards(s, missing)) return;
  }
  islandTurn(s, hour);
}

describe('Wochen-Bot: 7 Tage über alle Systeme', () => {
  it('jeder Tag bringt neue Ziele, keine Durststrecke', () => {
    const s = gameWith();
    s.village.protection = 0;
    const rng = e.createRng(7);
    const rows: Record<string, string | number>[] = [];
    const STEP = 600;
    for (let t = 0; t < 7 * 24 * 3600; t += STEP) {
      const hour = t / 3600;
      if (t % 3600 === 0) {
        metaTurn(s, rng);
        // Sell the surplus once a day, then rotate skills.
        if (hour % 24 === 0)
          for (const [item, qty] of Object.entries(s.inventory))
            if (qty > 200) e.sellItem(s, item, qty - 200, noop);
        rotateTurn(s, hour);
        villageTurn(s);
        heroTurn(s, rng);
        e.claimDaily(s, t * 1000 + Date.UTC(2026, 0, 5), rng, noop);
      }
      e.advance(s, STEP, rng, noop);
      if ((t + STEP) % (24 * 3600) === 0) {
        rows.push({
          Tag: (t + STEP) / 86400,
          Gesamtlevel: e.totalLevel(s),
          Einwohner: e.totalPopulation(s),
          Held: s.hero.level,
          Reichspunkte: e.empireScore(s),
          Reichsrang: s.empireRank,
          Meilensteine: s.milestones.length,
          Großprojekt: s.stats.projectStages ?? 0,
          Weltbosse: s.worldBoss.kills,
          Ereignisse: s.stats.islandEvents ?? 0,
          Erfolge: s.achievements.length,
          Chronik: s.progress.chronicle,
        });
      }
    }
    console.table(rows);
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1]!;
      const b = rows[i]!;
      // Every day: more empire points and a higher total level.
      expect(Number(b.Reichspunkte)).toBeGreaterThan(Number(a.Reichspunkte));
      expect(Number(b.Gesamtlevel)).toBeGreaterThan(Number(a.Gesamtlevel));
    }
    // Something to unlock at least every other day (achievements, milestones, ranks).
    const goals = (r: Record<string, string | number>) =>
      Number(r.Erfolge) + Number(r.Meilensteine) + Number(r.Reichsrang);
    for (let i = 2; i < rows.length; i += 2)
      expect(goals(rows[i]!)).toBeGreaterThan(goals(rows[i - 2]!));
    const last = rows[rows.length - 1]!;
    expect(Number(last.Reichsrang)).toBeGreaterThanOrEqual(3);
    expect(Number(last.Ereignisse)).toBeGreaterThanOrEqual(50);
  }, 120000);
});
