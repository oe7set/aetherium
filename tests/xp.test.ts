import { describe, expect, it } from 'vitest';
import { levelForXp, levelProgress, xpForLevel } from '../src/engine/xp';

describe('XP-Kurve (OSRS)', () => {
  it('kennt die bekannten Eckwerte', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(83);
    expect(xpForLevel(10)).toBe(1154);
    expect(xpForLevel(50)).toBe(101333);
    expect(xpForLevel(92)).toBe(6517253);
    expect(xpForLevel(99)).toBe(13034431);
  });

  it('ist streng monoton', () => {
    for (let l = 2; l <= 120; l++) expect(xpForLevel(l)).toBeGreaterThan(xpForLevel(l - 1));
  });

  it('rechnet XP zurück in Level', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(82)).toBe(1);
    expect(levelForXp(83)).toBe(2);
    expect(levelForXp(13034430)).toBe(98);
    expect(levelForXp(13034431)).toBe(99);
    expect(levelForXp(200_000_000)).toBe(99);
    expect(levelForXp(200_000_000, 120)).toBe(120);
  });

  it('liefert Fortschritt innerhalb eines Levels', () => {
    const p = levelProgress(83 + 87);
    expect(p.level).toBe(2);
    expect(p.needed).toBe(174 - 83);
    expect(p.current).toBe(87);
    expect(p.remaining).toBe(4);
    expect(levelProgress(xpForLevel(99)).fraction).toBe(1);
  });
});
