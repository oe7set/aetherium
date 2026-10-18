import { deserialize, serialize, type GameState } from '../engine';

const STORAGE_KEY = 'aetherium.save';
const BACKUP_KEY = 'aetherium.save.backup';

export function loadFromStorage(now: number = Date.now()): GameState | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    return deserialize(JSON.parse(raw), now);
  } catch (err) {
    // Keep the broken save around instead of silently overwriting it.
    console.error('Spielstand konnte nicht geladen werden', err);
    try {
      localStorage.setItem(`${BACKUP_KEY}.${now}`, raw);
    } catch {
      /* storage full – nothing we can do */
    }
    return null;
  }
}

export function saveToStorage(state: GameState, now: number = Date.now()): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(state, now)));
    return true;
  } catch (err) {
    console.error('Speichern fehlgeschlagen', err);
    return false;
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
