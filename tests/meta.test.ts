import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import {
  acceptQuest,
  advance,
  claimTask,
  collector,
  completeQuest,
  createRng,
  deserialize,
  ensureTasks,
  mod,
  observeCat,
  questStatus,
  rebirth,
  startAction,
  startCombat,
  taskProgress,
} from '../src/engine';
import { gameWith, setLevel } from './helpers';

describe('Haustiere', () => {
  it('fallen extrem selten und geben Boni', () => {
    const s = gameWith();
    startAction(s, 'wc_oak', () => {});
    const { emit, events } = collector();
    // A rng that always hits gives the pet on the first completion.
    advance(s, 3.1, () => 0, emit);
    expect(s.pets).toContain('pet_beaver');
    expect(events.some((e) => e.type === 'petFound')).toBe(true);
    expect(mod(s, 'speed.woodcutting')).toBeGreaterThanOrEqual(0.05);
  });

  it('Bosse können Haustiere fallen lassen', () => {
    const s = gameWith({ inventory: { cooked_shark: 3000 } });
    for (const sk of ['melee', 'defence', 'hitpoints']) setLevel(s, sk, 99);
    s.hp = 99;
    s.inventory.rune_sword = 1;
    startCombat(s, 'monster', 'peer_reviewer_2', () => {});
    advance(s, 3600 * 8, createRng(11), () => {});
    expect(s.stats['kills.peer_reviewer_2']).toBeGreaterThan(20);
  });

  it('Schrödingers Katze kollabiert genau einmal', () => {
    const s = gameWith({ pets: ['pet_cat'] });
    const state = observeCat(s, createRng(1));
    expect(state === 'alive' || state === 'ghost').toBe(true);
    expect(observeCat(s, createRng(2))).toBeNull();
    expect(s.catState).toBe(state);
  });
});

describe('Quests', () => {
  it('Annehmen, Fortschritt, Abgeben mit Belohnung', () => {
    const s = gameWith({ inventory: { log_oak: 30 } });
    expect(questStatus(s, 'q_fire')).toBe('locked');
    expect(acceptQuest(s, 'q_first_steps')).toBe(true);
    expect(completeQuest(s, 'q_first_steps', () => {})).toBe(true);
    expect(s.inventory.log_oak).toBe(5);
    expect(s.gold.gte(80)).toBe(true);
    expect(questStatus(s, 'q_fire')).toBe('available');
  });

  it('Stat-Ziele zählen erst ab dem Annehmen', () => {
    const s = gameWith({ stats: { fishCaught: 500 } });
    acceptQuest(s, 'q_fisher');
    expect(completeQuest(s, 'q_fisher', () => {})).toBe(false);
    s.stats.fishCaught = 550;
    expect(completeQuest(s, 'q_fisher', () => {})).toBe(true);
  });
});

describe('Aufträge', () => {
  it('werden täglich neu gewürfelt und lassen sich einlösen', () => {
    const s = gameWith({ stats: { treesFelled: 10 } });
    const day1 = new Date(2026, 9, 18, 12).getTime();
    expect(ensureTasks(s, day1)).toBe(true);
    expect(s.tasks.list.filter((t) => t.period === 'day')).toHaveLength(3);
    expect(s.tasks.list.filter((t) => t.period === 'week')).toHaveLength(2);
    expect(ensureTasks(s, day1 + 1000)).toBe(false);
    const task = s.tasks.list[0]!;
    s.stats[task.stat] = (s.stats[task.stat] ?? 0) + task.target;
    expect(taskProgress(s, task)).toBe(task.target);
    const gold = s.gold;
    expect(claimTask(s, task.id, () => {})).toBe(true);
    expect(s.gold.gt(gold)).toBe(true);
    expect(claimTask(s, task.id, () => {})).toBe(false);
    const ids = s.tasks.list.filter((t) => t.period === 'day').map((t) => t.id);
    ensureTasks(s, day1 + 86_400_000);
    expect(s.tasks.list.filter((t) => t.period === 'day').every((t) => !t.claimed)).toBe(true);
    void ids;
  });

  it('bleiben bei der Wiedergeburt erhalten, ebenso Haustiere', () => {
    const s = gameWith({ gold: new Decimal(0), pets: ['pet_mole'] });
    for (const id of Object.keys(s.skills)) setLevel(s, id, 40);
    ensureTasks(s, Date.now());
    rebirth(s, () => {});
    expect(s.pets).toEqual(['pet_mole']);
    expect(s.tasks.list.length).toBe(5);
  });
});

describe('Spielstand v5 → v6', () => {
  it('ergänzt Haustiere, Quests und Aufträge', () => {
    const s = deserialize({ v: 5, savedAt: 0, data: { gold: '1' } });
    expect(s.pets).toEqual([]);
    expect(s.quests).toEqual({ active: {}, done: [] });
    expect(s.catState).toBe('unknown');
  });
});
