import { describe, expect, it } from 'vitest';
import { ITEM_MAP } from '../src/data';
import { PROJECTS } from '../src/data/projects';
import {
  canFinishStage,
  deliverProject,
  deserialize,
  mod,
  projectDone,
  projectStage,
  projectUnlocked,
  serialize,
} from '../src/engine';
import { gameWith } from './helpers';

const noop = () => {};

describe('Großprojekte', () => {
  it('alle Waren existieren', () => {
    for (const p of PROJECTS)
      for (const st of p.stages)
        for (const c of st.cost) expect(ITEM_MAP.has(c.item), c.item).toBe(true);
  });

  it('Teil-Lieferungen zählen, ein voller Abschnitt gibt Bonus und XP', () => {
    const s = gameWith({ inventory: { stone_block: 30, plank_oak: 80 } });
    expect(deliverProject(s, 'lighthouse', noop)).toBe(110);
    expect(projectStage(s, 'lighthouse')).toBe(0);
    expect(s.projects.lighthouse!.delivered.stone_block).toBe(30);
    expect(canFinishStage(s, 'lighthouse')).toBe(false);
    s.inventory.stone_block = 40;
    expect(canFinishStage(s, 'lighthouse')).toBe(true);
    const base = mod(s, 'speed.fishing');
    deliverProject(s, 'lighthouse', noop);
    expect(projectStage(s, 'lighthouse')).toBe(1);
    expect(s.inventory.stone_block).toBe(10);
    expect(mod(s, 'speed.fishing')).toBeCloseTo(base + 0.04);
    expect(s.skills.construction!.xp).toBeGreaterThan(0);
    expect(deserialize(serialize(s, 0), 0).projects).toEqual(s.projects);
  });

  it('der Ätherium-Turm wartet auf alle anderen', () => {
    const s = gameWith();
    expect(projectUnlocked(s, 'aetherium_tower')).toBe(false);
    for (const p of PROJECTS)
      if (p.id !== 'aetherium_tower') s.projects[p.id] = { stage: p.stages.length, delivered: {} };
    expect(PROJECTS.filter((p) => projectDone(s, p.id))).toHaveLength(4);
    expect(projectUnlocked(s, 'aetherium_tower')).toBe(true);
  });
});
