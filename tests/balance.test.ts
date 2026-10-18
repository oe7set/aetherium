import { describe, expect, it } from 'vitest';
import { actionsForSkill, toolsForSkill } from '../src/data';
import {
  actionDuration,
  actionXp,
  newGame,
  skillLevel,
  xpForLevel,
  type GameState,
} from '../src/engine';

/**
 * Analytical progression estimate: always do the best unlocked action, always own the best
 * tool for the level. No clicks, no buffs, no prestige. Returns hours to reach `target`.
 */
function hoursTo(skill: string, target: number, prepare?: (s: GameState) => void): number {
  const s = newGame(0);
  prepare?.(s);
  let seconds = 0;
  for (let level = skillLevel(s, skill); level < target; level++) {
    s.skills[skill] = { xp: xpForLevel(level) };
    const tool = toolsForSkill(skill)
      .filter((t) => t.levelReq <= level)
      .pop();
    if (tool) s.equippedTools[skill] = tool.id;
    const best = actionsForSkill(skill)
      .filter((a) => a.levelReq <= level)
      .pop()!;
    const xpNeeded = xpForLevel(level + 1) - xpForLevel(level);
    seconds += (xpNeeded / actionXp(s, best)) * actionDuration(s, best);
  }
  return seconds / 3600;
}

describe('Balancing-Kurve', () => {
  it('erste Erfolgserlebnisse in Sekunden, Mittelziele in Minuten', () => {
    expect(hoursTo('woodcutting', 2) * 3600).toBeLessThan(40);
    expect(hoursTo('woodcutting', 10) * 60).toBeLessThan(15);
    expect(hoursTo('woodcutting', 30) * 60).toBeLessThan(180);
  });

  it('Level 99 ist ein Langzeitziel (Dutzende Stunden), aber kein Jahrzehnt', () => {
    for (const skill of ['woodcutting', 'mining', 'fishing']) {
      const h = hoursTo(skill, 99);
      expect(h, skill).toBeGreaterThan(20);
      expect(h, skill).toBeLessThan(400);
    }
  });

  it('Prestige beschleunigt spürbar', () => {
    const normal = hoursTo('mining', 99);
    const wise = hoursTo('mining', 99, (s) => {
      s.prestige.wisdomTotal = 50;
    });
    expect(wise).toBeLessThan(normal / 2);
  });

  it('gibt eine Übersicht aus (für docs/BALANCING.md)', () => {
    const rows = ['woodcutting', 'mining', 'fishing', 'hunting'].map((skill) => ({
      skill,
      '10': `${(hoursTo(skill, 10) * 60).toFixed(1)} min`,
      '50': `${hoursTo(skill, 50).toFixed(1)} h`,
      '99': `${hoursTo(skill, 99).toFixed(0)} h`,
    }));
    console.table(rows);
    expect(rows.length).toBe(4);
  });
});

describe('Dorf-Tempo (Bot spielt 10 Stunden)', () => {
  it('erste Ziele kommen zügig: Felder ≥1 < 3 h, Kaserne < 8 h', async () => {
    const e = await import('../src/engine');
    const { gameWith } = await import('./helpers');
    const s = gameWith();
    const v = e.activeVillage(s);
    const rng = e.createRng(1);
    let allFields = Infinity;
    let barracks = Infinity;
    const order = ['main', 'warehouse', 'granary', 'rally', 'barracks', 'academy', 'market'];
    for (let t = 0; t < 10 * 3600; t += 60) {
      for (let k = 0; k < 3; k++) {
        if (e.netCrop(s, v) < 150) {
          const crop = v.fields
            .map((l, i) => [l, i] as const)
            .filter(([, i]) => e.fieldType(v, i) === 'crop')
            .sort((a, b) => a[0] - b[0])[0];
          if (crop && e.canUpgradeField(s, v, crop[1]).ok) e.upgradeField(s, v.id, crop[1]);
        }
        if (Math.max(v.res.wood, v.res.clay, v.res.iron) > e.storageCap(v) * 0.8)
          e.upgradeBuilding(s, v.id, 'warehouse');
        const cheapest = v.fields
          .map((_, i) => i)
          .sort((a, b) => (v.fields[a] ?? 0) - (v.fields[b] ?? 0))[0]!;
        if (e.canUpgradeField(s, v, cheapest).ok) e.upgradeField(s, v.id, cheapest);
        for (const id of order)
          if (e.canUpgradeBuilding(s, v, id).ok) {
            e.upgradeBuilding(s, v.id, id);
            break;
          }
      }
      e.advance(s, 60, rng, () => {});
      if (allFields === Infinity && v.fields.every((l) => l >= 1)) allFields = t / 3600;
      if (barracks === Infinity && (v.buildings.barracks ?? 0) >= 1) barracks = t / 3600;
    }
    expect(allFields).toBeLessThan(3);
    expect(barracks).toBeLessThan(8);
  }, 60000);
});
