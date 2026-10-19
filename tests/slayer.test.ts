import { describe, expect, it } from 'vitest';
import {
  advance,
  buySlayer,
  collector,
  createRng,
  deserialize,
  equipItem,
  newSlayerTask,
  playerHitChance,
  serialize,
  slayerCandidates,
  startCombat,
} from '../src/engine';
import { getMonster } from '../src/data';
import { gameWith, setLevel } from './helpers';

function hunter() {
  const s = gameWith({ inventory: { cooked_shark: 500, bronze_sword: 1 } });
  for (const sk of ['melee', 'defence', 'hitpoints']) setLevel(s, sk, 40);
  s.hp = 40;
  equipItem(s, 'bronze_sword');
  return s;
}

describe('Kopfgeldjagd', () => {
  it('Aufträge passen zur Kampfstufe, keine Bosse, keine gesperrten', () => {
    const s = hunter();
    const pool = slayerCandidates(s);
    expect(pool.length).toBeGreaterThan(2);
    for (const id of pool) {
      expect(getMonster(id).boss).toBeFalsy();
      expect(getMonster(id).slayer ?? 0).toBe(0);
    }
    s.slayer.blocked = [pool[0]!];
    expect(slayerCandidates(s)).not.toContain(pool[0]);
  });

  it('Kills zählen, geben Kopfgeld-XP und am Ende Punkte und Gold', () => {
    const s = hunter();
    const { emit, events } = collector();
    newSlayerTask(s, createRng(1), emit);
    const task = s.slayer.task!;
    task.left = 3;
    task.total = 3;
    startCombat(s, 'monster', task.monster, emit);
    advance(s, 600, createRng(2), emit);
    expect(s.slayer.task).toBeNull();
    expect(s.slayer.points).toBeGreaterThan(0);
    expect(s.skills.slayer!.xp).toBeGreaterThan(0);
    expect(s.stats.slayerTasks).toBe(1);
    expect(events.some((e) => e.type === 'slayerTaskDone')).toBe(true);
  });

  it('Kopfgeldturm braucht die Stufe, Laden kostet Punkte', () => {
    const s = hunter();
    expect(startCombat(s, 'monster', 'gargoyle', () => {})).toBe(false);
    setLevel(s, 'slayer', 30);
    expect(startCombat(s, 'monster', 'gargoyle', () => {})).toBe(true);

    expect(buySlayer(s, 'helm', createRng(1), () => {})).toBe('points');
    s.slayer.points = 500;
    expect(buySlayer(s, 'helm', createRng(1), () => {})).toBe('ok');
    expect(s.inventory.slayer_helm).toBe(1);
    expect(buySlayer(s, 'skip', createRng(1), () => {})).toBe('noTask');
  });

  it('Kopfgeldhelm wirkt nur gegen das Ziel und alles überlebt das Laden', () => {
    const s = hunter();
    s.inventory.slayer_helm = 1;
    equipItem(s, 'slayer_helm');
    newSlayerTask(s, createRng(3), () => {});
    const target = getMonster(s.slayer.task!.monster);
    const other = getMonster(s.slayer.task!.monster === 'cow' ? 'goblin' : 'cow');
    const withTask = playerHitChance(s, target);
    const task = s.slayer.task;
    s.slayer.task = null;
    expect(playerHitChance(s, target)).toBeLessThan(withTask);
    s.slayer.task = task;
    expect(playerHitChance(s, other)).toBe(playerHitChance(s, other));
    s.slayer.points = 77;
    const loaded = deserialize(serialize(s, 0), 0);
    expect(loaded.slayer.task?.monster).toBe(task!.monster);
    expect(loaded.slayer.points).toBe(77);
  });
});
