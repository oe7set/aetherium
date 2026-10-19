import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/data/balance';
import { advance, applyOfflineProgress, createRng, startAction } from '../src/engine';
import { gameWith } from './helpers';

describe('Offline-Fortschritt', () => {
  it('simuliert die Abwesenheit und fasst sie zusammen', () => {
    const s = gameWith({ lastUpdate: 0 });
    startAction(s, 'wc_oak', () => {});
    const summary = applyOfflineProgress(s, 60 * 60 * 1000, createRng(1));
    expect(summary.elapsedSeconds).toBe(3600);
    expect(summary.actionsCompleted).toBeGreaterThan(1000);
    expect(summary.gained.log_oak).toBe(s.inventory.log_oak);
    expect(summary.levels.woodcutting?.from).toBe(1);
    expect(summary.levels.woodcutting!.to).toBeGreaterThan(20);
    expect(s.lastUpdate).toBe(3600 * 1000);
  });

  it('ist identisch zur Live-Simulation mit gleichem Zufall', () => {
    const a = gameWith({ lastUpdate: 0 });
    const b = gameWith({ lastUpdate: 0 });
    startAction(a, 'mine_copper', () => {});
    startAction(b, 'mine_copper', () => {});
    applyOfflineProgress(a, 600_000, createRng(7));
    advance(b, 600, createRng(7), () => {});
    expect(a.inventory).toEqual(b.inventory);
    expect(a.skills.mining!.xp).toBeCloseTo(b.skills.mining!.xp, 6);
  });

  it('wird beim Offline-Deckel abgeschnitten', () => {
    const s = gameWith({ lastUpdate: 0 });
    const summary = applyOfflineProgress(s, 3 * 24 * 3600 * 1000, createRng(1));
    expect(summary.simulatedSeconds).toBe(BALANCE.OFFLINE_CAP_SECONDS);
  });

  it('merkt sich, warum eine Aktion gestoppt hat', () => {
    const s = gameWith({ lastUpdate: 0, inventory: { log_oak: 10 } });
    startAction(s, 'fm_oak', () => {});
    const summary = applyOfflineProgress(s, 3600 * 1000, createRng(1));
    expect(summary.consumed.log_oak).toBe(10);
    expect(summary.stopped?.reason).toBe('noInputs');
    expect(summary.stopped?.missingItem).toBe('log_oak');
    expect(summary.fireWentOut).toBe(true);
  });

  it('24 Stunden schnellste Aktion laufen flott durch', () => {
    const s = gameWith({
      lastUpdate: 0,
      equippedTools: { woodcutting: 'axe_quantum', mining: 'pick_stone' },
    });
    s.skills.woodcutting = { xp: 13_034_431 };
    startAction(s, 'wc_oak', () => {});
    const t0 = performance.now();
    const summary = applyOfflineProgress(s, 24 * 3600 * 1000, createRng(3));
    // Generous bound for slow CI runners; locally ~3.5 s since 1.60 (village, mastery and achievements
    // run per step), CI ~5 s. Guards against 3× regressions.
    expect(performance.now() - t0).toBeLessThan(10000);
    expect(summary.actionsCompleted).toBeGreaterThan(50_000);
  }, 20000);
});
