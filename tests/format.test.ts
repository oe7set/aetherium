import Decimal from 'break_eternity.js';
import { describe, expect, it } from 'vitest';
import { formatDuration, formatInt, formatNumber } from '../src/engine';

describe('Zahlenformat', () => {
  it('kurz (deutsch)', () => {
    expect(formatNumber(5)).toBe('5');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1234)).toBe('1.234');
    expect(formatNumber(12_345)).toBe('12,35 Tsd.');
    expect(formatNumber(1_500_000)).toBe('1,5 Mio.');
    expect(formatNumber(2e9)).toBe('2 Mrd.');
  });

  it('wissenschaftlich und technisch', () => {
    expect(formatNumber(1_500_000, 'scientific')).toBe('1,5e6');
    expect(formatNumber(15_000_000, 'engineering')).toBe('15e6');
  });

  it('funktioniert jenseits von 1e308', () => {
    expect(formatNumber(new Decimal('1e500'))).toBe('1e500');
    expect(formatNumber(new Decimal('2.5e1000'), 'scientific')).toBe('2,5e1.000');
  });

  it('Ganzzahlen und Dauer', () => {
    expect(formatInt(9999)).toBe('9.999');
    expect(formatDuration(59)).toBe('59 s');
    expect(formatDuration(3700)).toBe('1 Std 1 Min');
    expect(formatDuration(90000)).toBe('1 T 1 Std');
  });
});
