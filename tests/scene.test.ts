import { describe, expect, it } from 'vitest';
import { distanceToRiver, ISLAND_RADIUS, STATIONS } from '../src/scene/layout';
import { detectQuality, PROFILES, resolveQuality } from '../src/scene/quality';
import { dayPhase, daylight } from '../src/scene/time';

describe('Grafikqualität', () => {
  it('erkennt schwache Geräte', () => {
    expect(detectQuality({ deviceMemory: 2, hardwareConcurrency: 4 }, 400)).toBe('low');
    expect(
      detectQuality({ deviceMemory: 4, hardwareConcurrency: 8, userAgent: 'Android' }, 400),
    ).toBe('medium');
    expect(
      detectQuality({ deviceMemory: 8, hardwareConcurrency: 12, userAgent: 'Windows' }, 1600),
    ).toBe('high');
  });

  it('respektiert manuelle Wahl und begrenzt die Pixel-Ratio auf 2', () => {
    expect(resolveQuality('low', 'high').level).toBe('low');
    expect(resolveQuality('auto', 'medium').level).toBe('medium');
    for (const p of Object.values(PROFILES)) expect(p.dpr).toBeLessThanOrEqual(2);
    expect(PROFILES.low.shadows).toBe(false);
  });
});

describe('Welt-Layout', () => {
  it('Stationen liegen auf der Insel und nicht im Fluss', () => {
    for (const st of STATIONS) {
      expect(Math.hypot(st.pos[0], st.pos[1])).toBeLessThan(ISLAND_RADIUS - 1);
      expect(distanceToRiver(st.pos[0], st.pos[1]), st.skill).toBeGreaterThan(1.2);
    }
  });

  it('Tag/Nacht-Zyklus', () => {
    expect(daylight(0.5)).toBeGreaterThan(0.9);
    expect(daylight(0)).toBeLessThan(0.1);
    expect(dayPhase(0)).toBe(0);
  });
});
