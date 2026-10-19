/** Last started action per skill (per device), so a tap on an island station repeats it. */
const KEY = 'aetherium.lastActions';

let cache: Record<string, string> | null = null;

function load(): Record<string, string> {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as unknown;
    cache = raw && typeof raw === 'object' ? (raw as Record<string, string>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

export function lastActionFor(skill: string): string | undefined {
  return load()[skill];
}

export function rememberAction(skill: string, actionId: string): void {
  const map = load();
  if (map[skill] === actionId) return;
  map[skill] = actionId;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // storage blocked – remembered for this session only
  }
}
