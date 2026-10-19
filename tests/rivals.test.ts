import { describe, expect, it } from 'vitest';
import { myRecord, parseRecordCode, rankRivals, recordCode } from '../src/engine';
import { gameWith } from './helpers';

describe('Endlos-Rangliste', () => {
  it('Rekord-Codes überleben den Umweg über die Zwischenablage, auch mit Umlauten', () => {
    const s = gameWith();
    s.hero.name = 'Jürgen Ätherfuß';
    s.stats.riftEndlessBest = 754;
    const rec = myRecord(s, 1_700_000_000_000);
    const back = parseRecordCode(`  ${recordCode(rec)}\n`);
    expect(back).toEqual(rec);
  });

  it('kaputte oder veränderte Codes werden abgelehnt', () => {
    const code = recordCode(myRecord(gameWith(), 0));
    expect(parseRecordCode('hallo')).toBeNull();
    expect(parseRecordCode(code.slice(0, -1) + (code.endsWith('a') ? 'b' : 'a'))).toBeNull();
    expect(parseRecordCode(code.replace('AE1-', 'AE1-x'))).toBeNull();
  });

  it('sortiert nach Endlos-Zeit, dann Siegen', () => {
    const base = { name: '', wins: 0, total: 0, combat: 0, at: 0 };
    const list = rankRivals([
      { ...base, name: 'a', endless: 100 },
      { ...base, name: 'b', endless: 300 },
      { ...base, name: 'c', endless: 100, wins: 3 },
    ]);
    expect(list.map((r) => r.name)).toEqual(['b', 'c', 'a']);
  });
});
