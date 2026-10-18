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
