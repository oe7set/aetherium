import { describe, expect, it } from 'vitest';
import { CHRONICLE, DAILY_REWARDS, passThreshold } from '../src/data/progress';
import { ITEM_MAP } from '../src/data';
import {
  activeVillage,
  applyOfflineProgress,
  claimChronicle,
  claimDaily,
  claimPassTier,
  createRng,
  currentChronicle,
  dailyAvailable,
  deserialize,
  nextDailyDay,
  passClaimable,
  passPoints,
  passTier,
  rebirth,
  rewardsWaiting,
  serialize,
  setHeroLook,
  upgradeField,
} from '../src/engine';
import { gameWith } from './helpers';

const noop = () => {};
const DAY = 24 * 3600 * 1000;
const t0 = new Date('2026-03-02T10:00:00').getTime();

describe('Tägliche Belohnung', () => {
  it('Serie wächst an Folgetagen und reißt nach einer Pause', () => {
    const s = gameWith();
    expect(dailyAvailable(s, t0)).toBe(true);
    expect(claimDaily(s, t0, createRng(1), noop)!.length).toBeGreaterThan(0);
    expect(dailyAvailable(s, t0 + 3600_000)).toBe(false);
    expect(claimDaily(s, t0 + 3600_000, createRng(1), noop)).toBeNull();
    expect(nextDailyDay(s, t0 + DAY)).toBe(2);
    claimDaily(s, t0 + DAY, createRng(1), noop);
    claimDaily(s, t0 + 2 * DAY, createRng(1), noop);
    expect(s.progress.streak).toBe(3);
    claimDaily(s, t0 + 5 * DAY, createRng(1), noop);
    expect(s.progress.streak).toBe(1);
  });

  it('Tag 7 bringt edle Heldenausrüstung', () => {
    const s = gameWith();
    for (let d = 0; d < 7; d++) claimDaily(s, t0 + d * DAY, createRng(d), noop);
    expect(s.progress.streak).toBe(7);
    expect(s.hero.bag.some((i) => i.tier >= 2)).toBe(true);
    for (const r of DAILY_REWARDS)
      for (const it of r.items ?? []) expect(ITEM_MAP.has(it.item), it.item).toBe(true);
  });
});

describe('Ruhmesleiter', () => {
  it('sammelt Punkte aus allen Systemen und vergibt Stufen', () => {
    const s = gameWith();
    const before = passPoints(s);
    s.stats.villageBuildingLevels = 40;
    s.stats.heroAdventures = 6;
    s.stats.riftKills = 4000;
    expect(passPoints(s)).toBeGreaterThan(before + 300);
    expect(passTier(s)).toBeGreaterThan(2);
    const tiers = passClaimable(s);
    expect(tiers.length).toBe(passTier(s));
    expect(claimPassTier(s, tiers[0]!, createRng(1), noop)).not.toBeNull();
    expect(claimPassTier(s, tiers[0]!, createRng(1), noop)).toBeNull();
    expect(passThreshold(10)).toBeGreaterThan(passThreshold(9));
  });

  it('Stufe 10 schaltet einen Avatar frei', () => {
    const s = gameWith();
    s.stats.villageBuildingLevels = 10000;
    for (let t = 1; t <= 10; t++) claimPassTier(s, t, createRng(t), noop);
    expect(s.progress.avatars).toContain('🐉');
    setHeroLook(s, 'Drache', '🐉');
    expect(s.hero.avatar).toBe('🐉');
  });
});

describe('Chronik', () => {
  it('führt Schritt für Schritt durch die Systeme', () => {
    const s = gameWith();
    const first = currentChronicle(s)!;
    expect(first.index).toBe(0);
    expect(first.done).toBe(false);
    expect(claimChronicle(s, createRng(1), noop)).toBeNull();
    s.stats.treesFelled = 10;
    expect(currentChronicle(s)!.done).toBe(true);
    expect(rewardsWaiting(s, t0)).toBeGreaterThanOrEqual(2); // daily + chronicle
    expect(claimChronicle(s, createRng(1), noop)!.length).toBeGreaterThan(0);
    expect(currentChronicle(s)!.index).toBe(1);
    expect(CHRONICLE.length).toBeGreaterThanOrEqual(20);
    for (const step of CHRONICLE)
      for (const it of step.reward.items ?? []) expect(ITEM_MAP.has(it.item), it.item).toBe(true);
  });
});

describe('Fortschritt bleibt erhalten', () => {
  it('Speichern, Laden, Wiedergeburt (auch der Held)', () => {
    const s = gameWith();
    claimDaily(s, t0, createRng(1), noop);
    s.progress.chronicle = 5;
    s.hero.level = 7;
    const loaded = deserialize(serialize(s));
    expect(loaded.progress.streak).toBe(1);
    expect(loaded.progress.chronicle).toBe(5);
    s.skills.woodcutting = { xp: 1e7 };
    rebirth(s, noop);
    expect(s.progress.chronicle).toBe(5);
    expect(s.hero.level).toBe(7);
  });

  it('Offline-Übersicht zeigt das Dorf', () => {
    const s = gameWith();
    upgradeField(s, activeVillage(s).id, 0);
    s.lastUpdate = Date.now() - 3600_000;
    const summary = applyOfflineProgress(s, Date.now(), createRng(1));
    expect(summary.village.built.length).toBeGreaterThan(0);
    expect(summary.village.resources).toBeGreaterThan(0);
  });
});
