import Decimal from 'break_eternity.js';
import { ACTION_MAP, ITEM_MAP, TOOL_MAP } from '../data';
import { defaultSettings, newGame, SAVE_VERSION, type GameState } from './state';

/** Shape stored in localStorage / export strings. */
export interface SaveEnvelope {
  v: number;
  savedAt: number;
  data: Record<string, unknown>;
}

/**
 * Migration from version N to N+1, keyed by N. Each receives the raw data object of version N.
 * Never edit an existing migration after release – add a new one and bump SAVE_VERSION.
 */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

export const MIGRATIONS: Record<number, Migration> = {
  // 0 → 1: pre-release prototype saves stored gold as a number and had no inventory slots.
  0: (data) => ({
    ...data,
    gold: String(data.gold ?? 0),
    inventorySlots: data.inventorySlots ?? 20,
  }),
};

export const EXPORT_PREFIX = 'AETH1:';

export class SaveError extends Error {}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Converts the live state into a plain JSON-friendly object. */
export function serialize(s: GameState, now: number = Date.now()): SaveEnvelope {
  const { gold, ...rest } = s;
  return { v: SAVE_VERSION, savedAt: now, data: { ...rest, gold: gold.toString() } };
}

/** Runs all migrations from `fromVersion` up to `SAVE_VERSION`. */
export function migrate(
  data: Record<string, unknown>,
  fromVersion: number,
  migrations: Record<number, Migration> = MIGRATIONS,
  targetVersion: number = SAVE_VERSION,
): Record<string, unknown> {
  if (fromVersion > targetVersion) {
    throw new SaveError(
      `Spielstand-Version ${fromVersion} ist neuer als dieses Spiel (${targetVersion}). Bitte Seite neu laden.`,
    );
  }
  let current = data;
  for (let v = fromVersion; v < targetVersion; v++) {
    const step = migrations[v];
    if (!step) throw new SaveError(`Keine Migration von Version ${v} verfügbar.`);
    current = step(current);
  }
  return current;
}

function numberRecord(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isRecord(v)) return out;
  for (const [k, n] of Object.entries(v)) if (typeof n === 'number' && Number.isFinite(n)) out[k] = n;
  return out;
}

function stringRecord(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isRecord(v)) return out;
  for (const [k, n] of Object.entries(v)) if (typeof n === 'string') out[k] = n;
  return out;
}

/**
 * Builds a valid GameState from migrated data. Unknown/missing fields fall back to a fresh game,
 * so adding new state fields never breaks old saves.
 */
export function hydrate(data: Record<string, unknown>, now: number = Date.now()): GameState {
  const base = newGame(now);
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;

  const skills = { ...base.skills };
  if (isRecord(data.skills)) {
    for (const [id, entry] of Object.entries(data.skills)) {
      if (isRecord(entry)) skills[id] = { xp: Math.max(0, num(entry.xp, 0)) };
    }
  }

  let active: GameState['active'] = null;
  if (
    isRecord(data.active) &&
    typeof data.active.actionId === 'string' &&
    ACTION_MAP.has(data.active.actionId)
  ) {
    active = { actionId: data.active.actionId, progress: Math.max(0, num(data.active.progress, 0)) };
  }

  const ownedTools = Array.isArray(data.ownedTools)
    ? data.ownedTools.filter((t): t is string => typeof t === 'string' && TOOL_MAP.has(t))
    : base.ownedTools;

  // Content can be removed between versions: drop references that no longer resolve.
  const inventory = Object.fromEntries(
    Object.entries(numberRecord(data.inventory)).filter(([id, qty]) => ITEM_MAP.has(id) && qty > 0),
  );
  const equippedTools = Object.fromEntries(
    Object.entries(stringRecord(data.equippedTools)).filter(([, id]) => TOOL_MAP.has(id)),
  );

  const settings = { ...defaultSettings(), ...(isRecord(data.settings) ? data.settings : {}) };

  return {
    ...base,
    createdAt: num(data.createdAt, base.createdAt),
    lastUpdate: num(data.lastUpdate, base.lastUpdate),
    gold: new Decimal(typeof data.gold === 'string' || typeof data.gold === 'number' ? data.gold : 0),
    skills,
    inventory,
    inventorySlots: num(data.inventorySlots, base.inventorySlots),
    ownedTools: Array.from(new Set([...base.ownedTools, ...ownedTools])),
    equippedTools: { ...base.equippedTools, ...equippedTools },
    active,
    fire: Math.max(0, num(data.fire, 0)),
    intelligence: Math.max(0, num(data.intelligence, 0)),
    stats: numberRecord(data.stats),
    settings: settings as GameState['settings'],
  };
}

export function deserialize(envelope: unknown, now: number = Date.now()): GameState {
  if (!isRecord(envelope) || typeof envelope.v !== 'number' || !isRecord(envelope.data)) {
    throw new SaveError('Ungültiger Spielstand.');
  }
  return hydrate(migrate(envelope.data, envelope.v), now);
}

// --- Base64 export/import (UTF-8 safe) -----------------------------------------

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function exportSave(s: GameState, now: number = Date.now()): string {
  return EXPORT_PREFIX + toBase64(JSON.stringify(serialize(s, now)));
}

export function importSave(text: string, now: number = Date.now()): GameState {
  const trimmed = text.trim();
  const payload = trimmed.startsWith(EXPORT_PREFIX) ? trimmed.slice(EXPORT_PREFIX.length) : trimmed;
  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64(payload));
  } catch {
    throw new SaveError('Das sieht nicht nach einem Aetherium-Spielstand aus.');
  }
  return deserialize(parsed, now);
}
