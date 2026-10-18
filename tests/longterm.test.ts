import { describe, expect, it } from 'vitest';
import { actionsForSkill, toolsForSkill } from '../src/data';
import * as e from '../src/engine';
import { gameWith } from './helpers';

/**
 * Long-term bot: plays island, village and hero together for three simulated days, like a
 * player who checks in regularly. Prints a day-by-day table (docs/BALANCING.md) and checks
 * that every loop keeps moving.
 */
const noop = () => {};

function islandTurn(s: e.GameState, hour: number): void {
  const skill = ['woodcutting', 'mining', 'fishing'][Math.floor(hour / 6) % 3]!;
  // Sell the bag, buy the best affordable tool, start the best action.
  for (const [item, qty] of Object.entries(s.inventory)) e.sellItem(s, item, qty, noop);
  for (const t of toolsForSkill(skill)) if (!s.ownedTools.includes(t.id)) e.buyTool(s, t.id);
  const level = e.skillLevel(s, skill);
  const candidates = actionsForSkill(skill)
    .filter((a) => a.levelReq <= level)
    .reverse();
  if (s.active && candidates[0]?.id === s.active.actionId) return;
  for (const a of candidates) if (e.startAction(s, a.id, noop).ok) break;
}

function villageTurn(s: e.GameState): void {
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

function heroTurn(s: e.GameState, rng: e.Rng): void {
  const h = s.hero;
  if (h.points > 0) e.assignPoints(s, 'power', h.points);
  if (h.status === 'dead') e.reviveHero(s);
  if (e.currentAdventure(s)) e.autoAdventure(s, rng, noop);
  else if (h.status === 'home' && h.health > 40) {
    const adv = [...h.adventures].sort((a, b) => a.level - b.level)[0];
    if (adv) e.startAdventure(s, adv.id);
  }
}

describe('Langzeit-Bot: Insel + Dorf + Held, 3 Tage', () => {
  it('alle Schleifen kommen voran, nichts bleibt hängen', () => {
    const s = gameWith();
    s.village.protection = 0;
    const rng = e.createRng(42);
    const rows: Record<string, string | number>[] = [];
    const STEP = 300;
    for (let t = 0; t < 3 * 24 * 3600; t += STEP) {
      const hour = t / 3600;
      if (t % 1800 === 0) {
        islandTurn(s, hour);
        villageTurn(s);
        heroTurn(s, rng);
        e.claimDaily(s, t * 1000 + Date.UTC(2026, 0, 5), rng, noop);
      }
      e.advance(s, STEP, rng, noop);
      if ((t + STEP) % (24 * 3600) === 0) {
        const v = e.activeVillage(s);
        rows.push({
          Tag: (t + STEP) / 86400,
          Gesamtlevel: e.totalLevel(s),
          Gold: Math.round(Number(s.gold.toString())),
          Einwohner: e.population(v),
          Hauptgebäude: e.buildingLevel(v, 'main'),
          'Held Stufe': s.hero.level,
          Abenteuer: s.stats.heroAdventures ?? 0,
          'Invasionen ✔/✘': `${s.village.invasionsWon}/${s.village.invasionsLost}`,
          Essenz: s.rift.essence,
        });
      }
    }
    console.table(rows);
    const last = rows[rows.length - 1]!;
    expect(Number(last.Gesamtlevel)).toBeGreaterThan(100);
    expect(Number(last.Einwohner)).toBeGreaterThan(80);
    expect(Number(last['Held Stufe'])).toBeGreaterThanOrEqual(15);
    expect(Number(last.Abenteuer)).toBeGreaterThan(20);
    // A small garrison plus hero and wall should hold most rift invasions.
    expect(s.village.invasionsWon).toBeGreaterThan(s.village.invasionsLost);
    // Every day brings visible progress in every loop.
    for (let i = 1; i < rows.length; i++) {
      expect(Number(rows[i]!.Gesamtlevel)).toBeGreaterThan(Number(rows[i - 1]!.Gesamtlevel));
      expect(Number(rows[i]!.Einwohner)).toBeGreaterThan(Number(rows[i - 1]!.Einwohner));
    }
  }, 120000);
});
