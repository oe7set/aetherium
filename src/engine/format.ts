import Decimal, { type DecimalSource } from 'break_eternity.js';
import type { NumberFormat } from './state';

// German short scale. Index = power of 1000.
const SHORT_UNITS = ['', ' Tsd.', ' Mio.', ' Mrd.', ' Bio.', ' Brd.', ' Trio.', ' Trd.', ' Quad.', ' Qard.', ' Quin.', ' Quind.'];

const deFixed = (n: number, digits: number): string =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: digits });

function mantissaExp(value: Decimal): { m: number; e: number } {
  const e = Math.floor(value.abs().log10().toNumber());
  const m = value.div(Decimal.pow(10, e)).toNumber();
  return { m, e };
}

/**
 * Formats numbers and Decimals for display.
 * - short: 1.234 / 12,3 Tsd. / 1,5 Mio. (falls back to scientific beyond the unit table)
 * - scientific: 1,23e6
 * - engineering: 1,23e6 with exponent multiple of 3
 */
export function formatNumber(value: DecimalSource, format: NumberFormat = 'short', digits = 2): string {
  const d = new Decimal(value);
  if (d.isNan()) return 'NaN';
  const abs = d.abs();
  const sign = d.lt(0) ? '-' : '';
  if (abs.lt(1000)) {
    const n = abs.toNumber();
    return sign + deFixed(n, n < 10 && !Number.isInteger(n) ? Math.min(digits, 2) : n < 100 ? 1 : 0);
  }
  if (format === 'short') {
    const e3 = Math.floor(abs.log10().toNumber() / 3);
    if (e3 === 1 && abs.lt(10_000)) return sign + deFixed(Math.floor(abs.toNumber()), 0);
    const unit = SHORT_UNITS[e3];
    if (unit !== undefined) return sign + deFixed(abs.div(Decimal.pow(1000, e3)).toNumber(), digits) + unit;
  }
  const { m, e } = mantissaExp(abs);
  if (format === 'engineering') {
    const ee = Math.floor(e / 3) * 3;
    return sign + deFixed(m * Math.pow(10, e - ee), digits) + 'e' + ee.toLocaleString('de-DE');
  }
  return sign + deFixed(m, digits) + 'e' + e.toLocaleString('de-DE');
}

/** Integers stay exact below 10.000 (inventory counts etc.). */
export function formatInt(value: number, format: NumberFormat = 'short'): string {
  if (Math.abs(value) < 10_000) return Math.floor(value).toLocaleString('de-DE');
  return formatNumber(value, format);
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d} T ${h} Std`;
  if (h > 0) return `${h} Std ${m} Min`;
  if (m > 0) return `${m} Min ${sec} s`;
  return `${sec} s`;
}

export function formatPercent(fraction: number, digits = 1): string {
  return deFixed(fraction * 100, digits) + ' %';
}

export function formatSeconds(seconds: number): string {
  return deFixed(seconds, 2) + ' s';
}
