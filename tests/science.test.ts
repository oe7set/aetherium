import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import {
  advance,
  applyOfflineProgress,
  assignHelper,
  collector,
  consumeItem,
  createRng,
  deserialize,
  harvest,
  helperSpeed,
  hireHelper,
  mod,
  offlineCap,
  plantSeed,
  plotReady,
  researchTech,
  simulate,
  startAction,
  techStatus,
} from '../src/engine';
import { BALANCE } from '../src/data/balance';
import { gameWith, setLevel } from './helpers';

const never = () => 0.999999;

describe('Forschung', () => {
  it('Aktionen erzeugen Forschungspunkte', () => {
    const s = gameWith();
    startAction(s, 'wc_oak', () => {});
    simulate(s, 30, never);
    expect(s.research).toBeGreaterThan(0);
  });

  it('Techs brauchen Voraussetzungen und Punkte und geben Boni', () => {
    const s = gameWith({ research: 1000 });
    expect(techStatus(s, 'wheel')).toBe('locked');
    expect(researchTech(s, 'wheel', () => {})).toBe(false);
    expect(researchTech(s, 'sharp_stones', () => {})).toBe(true);
    expect(researchTech(s, 'wheel', () => {})).toBe(true);
    expect(mod(s, 'speed')).toBeCloseTo(0.03);
    expect(s.research).toBe(1000 - 15 - 60);
  });

  it('Skills sind bis zur Erforschung gesperrt', () => {
    const s = gameWith({ inventory: { herb_mint: 5, ash: 5 } });
    const res = startAction(s, 'brew_healing', () => {});
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('locked');
    s.techs.push('fire_control', 'writing', 'proto_alchemy');
    expect(startAction(s, 'brew_healing', () => {}).ok).toBe(true);
  });

  it('Forschungsnotizen bringen Punkte, Telegraf verlängert Offline', () => {
    const s = gameWith({ inventory: { research_notes: 2 } });
    consumeItem(s, 'research_notes', createRng(1), () => {});
    expect(s.research).toBe(40);
    expect(offlineCap(s)).toBe(BALANCE.OFFLINE_CAP_SECONDS);
    s.techs.push('telegraph');
    expect(offlineCap(gameWith({ techs: ['telegraph'] }))).toBe(
      BALANCE.OFFLINE_CAP_SECONDS + 12 * 3600,
    );
  });
});

describe('Alchemie & Periodensystem', () => {
  it('Analysen entdecken Elemente', () => {
    const s = gameWith({
      inventory: { ash: 400 },
      techs: ['fire_control', 'writing', 'proto_alchemy'],
    });
    startAction(s, 'analyze_ash', () => {});
    const { emit, events } = collector();
    advance(s, 600, createRng(2), emit);
    expect(s.codex.length).toBeGreaterThan(2);
    expect(s.codex.every((sym) => ['C', 'K', 'Ca', 'Na', 'P', 'Mg'].includes(sym))).toBe(true);
    expect(events.some((e) => e.type === 'elementDiscovered')).toBe(true);
    expect(mod(s, 'research')).toBeGreaterThan(0);
  });

  it('Tränke geben Buffs', () => {
    const s = gameWith({ inventory: { potion_haste: 1 } });
    consumeItem(s, 'potion_haste', createRng(1), () => {});
    expect(mod(s, 'speed')).toBeCloseTo(0.2);
  });
});

describe('Landwirtschaft', () => {
  it('Pflanzen wachsen in Echtzeit, auch offline, und mutieren manchmal', () => {
    const s = gameWith({
      lastUpdate: 0,
      inventory: { seed_potato: 3 },
      techs: ['sharp_stones', 'agriculture'],
    });
    expect(plantSeed(s, 0, 'seed_potato', () => {}).ok).toBe(true);
    expect(plotReady(s, 0)).toBe(false);
    applyOfflineProgress(s, 121_000, createRng(1));
    expect(plotReady(s, 0)).toBe(true);
    expect(harvest(s, 0, createRng(1), () => {}).ok).toBe(true);
    expect(s.inventory.potato).toBeGreaterThanOrEqual(3);
    expect(s.inventory.seed_potato).toBeGreaterThanOrEqual(3);
    expect(s.skills.farming!.xp).toBeGreaterThan(0);
  });

  it('ohne Ackerbau kein Pflanzen', () => {
    const s = gameWith({ inventory: { seed_potato: 1 } });
    expect(plantSeed(s, 0, 'seed_potato', () => {})).toEqual({ ok: false, reason: 'locked' });
  });

  it('automatische Ernte mit Kunstdünger', () => {
    const s = gameWith({
      inventory: { seed_potato: 3 },
      techs: ['sharp_stones', 'agriculture', 'irrigation', 'crop_rotation', 'fertilizer'],
    });
    s.plots = [{ seed: null, elapsed: 0 }];
    plantSeed(s, 0, 'seed_potato', () => {});
    advance(s, 3600, createRng(3), () => {});
    expect(s.stats.harvests).toBeGreaterThan(10);
    expect(s.plots[0]!.seed).toBe('seed_potato');
  });
});

describe('Helfer', () => {
  it('arbeiten parallel zur eigenen Aktion', () => {
    const s = gameWith({ gold: new Decimal(1000), techs: ['fire_control', 'writing', 'interns'] });
    expect(hireHelper(s, 'intern').ok).toBe(true);
    expect(hireHelper(s, 'intern')).toEqual({ ok: false, reason: 'slots' });
    expect(assignHelper(s, 0, 'mine_copper')).toBe(true);
    startAction(s, 'wc_oak', () => {});
    simulate(s, 120, never);
    expect(s.inventory.log_oak).toBeGreaterThan(30);
    expect(s.inventory.ore_copper).toBeGreaterThan(5);
    expect(s.inventory.ore_copper).toBeLessThan(15);
    expect(s.helpers[0]!.done).toBe(s.inventory.ore_copper);
  });

  it('Praktikanten lernen dazu', () => {
    const s = gameWith({ techs: ['fire_control', 'writing', 'interns'] });
    const fresh = helperSpeed(s, { type: 'intern', actionId: null, progress: 0, done: 0 });
    const veteran = helperSpeed(s, { type: 'intern', actionId: null, progress: 0, done: 10_000 });
    expect(veteran).toBeCloseTo(fresh * 1.5);
  });

  it('hören auf, wenn Material fehlt', () => {
    const s = gameWith({
      gold: new Decimal(1000),
      techs: ['fire_control', 'writing', 'interns'],
      inventory: { log_oak: 2 },
    });
    hireHelper(s, 'intern');
    assignHelper(s, 0, 'fm_oak');
    const { emit, events } = collector();
    advance(s, 120, never, emit);
    expect(s.helpers[0]!.actionId).toBeNull();
    expect(events.some((e) => e.type === 'helperStopped')).toBe(true);
  });
});

describe('Spielstand v3 → v4', () => {
  it('ergänzt Forschung und Beete', () => {
    const s = deserialize({ v: 3, savedAt: 0, data: { gold: '1' } });
    expect(s.research).toBe(0);
    expect(s.plots.length).toBe(3);
    expect(s.helpers).toEqual([]);
    void setLevel;
  });
});
