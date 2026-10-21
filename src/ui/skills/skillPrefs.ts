// Per-viewer conveniences (browser storage, may be unavailable): favourites, collapsed groups,
// and the level at which a skill was last opened (for the „new" badge).
export function readJson<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked – the list still works, it just forgets */
  }
}
export const FAV_KEY = 'aetherium.favSkills';
export const FOLD_KEY = 'aetherium.foldedGroups';
export const SEEN_KEY = 'aetherium.seenLevels';

/** Remembers the level a skill had when the player last looked at it. */
export function markSkillSeen(id: string, level: number): void {
  const seen = readJson<Record<string, number>>(SEEN_KEY, {});
  if ((seen[id] ?? 0) >= level) return;
  writeJson(SEEN_KEY, { ...seen, [id]: level });
}
