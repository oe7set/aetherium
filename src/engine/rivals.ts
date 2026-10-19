import { combatLevel } from './combat';
import { totalLevel } from './skills';
import type { GameState } from './state';

/**
 * Endless-rift leaderboard without a server: every player can copy a short record code and paste
 * the codes of friends. The checksum only guards against typos and casual editing, not cheating.
 */
export interface RivalRecord {
  name: string;
  /** Best endless-rift time in seconds. */
  endless: number;
  wins: number;
  total: number;
  combat: number;
  /** Day the code was made (ms). */
  at: number;
}

const PREFIX = 'AE1-';

function checksum(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).slice(0, 4);
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function myRecord(s: GameState, now: number = Date.now()): RivalRecord {
  return {
    name: s.hero.name || 'Namenlos',
    endless: s.stats.riftEndlessBest ?? 0,
    wins: s.rift.wins,
    total: totalLevel(s),
    combat: combatLevel(s),
    at: now,
  };
}

export function recordCode(r: RivalRecord): string {
  const body = toBase64Url(
    JSON.stringify([r.name.slice(0, 24), r.endless, r.wins, r.total, r.combat, r.at]),
  );
  return `${PREFIX}${body}.${checksum(body)}`;
}

export function parseRecordCode(code: string): RivalRecord | null {
  const clean = code.trim();
  if (!clean.startsWith(PREFIX)) return null;
  const [body = '', sum = ''] = clean.slice(PREFIX.length).split('.');
  if (!body || checksum(body) !== sum) return null;
  try {
    const v: unknown = JSON.parse(fromBase64Url(body));
    if (!Array.isArray(v) || v.length !== 6) return null;
    const [name, endless, wins, total, combat, at] = v as unknown[];
    const nums = [endless, wins, total, combat, at];
    if (typeof name !== 'string' || !nums.every((n) => typeof n === 'number' && n >= 0))
      return null;
    return {
      name: name.slice(0, 24),
      endless: endless as number,
      wins: wins as number,
      total: total as number,
      combat: combat as number,
      at: at as number,
    };
  } catch {
    return null;
  }
}

/** Ranking: longest endless run first, then rift wins. */
export function rankRivals(list: RivalRecord[]): RivalRecord[] {
  return [...list].sort((a, b) => b.endless - a.endless || b.wins - a.wins);
}
