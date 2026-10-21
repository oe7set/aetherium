import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../src/data';
import { CHRONICLE } from '../src/data/progress';
import { deserialize, migrate } from '../src/engine';

describe('Chronik & Erfolge für Masterplan 6.0', () => {
  it('die neuen Chronik-Schritte stehen nach der ersten Forschung', () => {
    const i = CHRONICLE.findIndex((c) => c.title === 'Erforsche eine Technologie');
    expect(i).toBe(12);
    expect(CHRONICLE[13]?.title).toBe('Hole einen Skill-Meilenstein ab');
    expect(CHRONICLE[18]?.title).toBe('Baue den Inselhafen');
  });

  it('alte Spielstände hinter dem eingefügten Block rücken mit', () => {
    const before = migrate({ progress: { chronicle: 15 } }, 13);
    expect((before.progress as { chronicle: number }).chronicle).toBe(20);
    const early = migrate({ progress: { chronicle: 5 } }, 13);
    expect((early.progress as { chronicle: number }).chronicle).toBe(5);
    const s = deserialize({ v: 13, savedAt: 0, data: { gold: '0', progress: { chronicle: 13 } } });
    expect(CHRONICLE[s.progress.chronicle]?.title).toBe('Baue den Inselhafen');
  });

  it('jedes neue System hat eine Erfolgsreihe', () => {
    for (const key of ['empireRanks', 'islandEvents', 'projectStages', 'worldBossKills', 'thefts'])
      expect(ACHIEVEMENTS.some((a) => a.condition.key === key)).toBe(true);
  });
});
