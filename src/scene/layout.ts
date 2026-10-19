// World layout: where each station sits on the island (x, z in world units, y is up).
// The scene reads this; the engine never does.

export type Vec2 = readonly [number, number];

export interface StationDef {
  skill: string;
  label: string;
  /** Where the station object stands. */
  pos: Vec2;
  /** Where the character stands while working there. */
  workPos: Vec2;
}

export const STATIONS: StationDef[] = [
  { skill: 'woodcutting', label: 'Wald', pos: [-6, -3], workPos: [-4.6, -1.8] },
  { skill: 'mining', label: 'Mine', pos: [6.2, -3.5], workPos: [4.8, -2.2] },
  { skill: 'firemaking', label: 'Lagerfeuer', pos: [-2.2, 3], workPos: [-1.2, 2.1] },
  { skill: 'cooking', label: 'Kochstelle', pos: [4, 2.8], workPos: [3.2, 1.8] },
  { skill: 'fishing', label: 'Angelplatz', pos: [-2.6, -5.6], workPos: [-2.6, -5.6] },
  { skill: 'smithing', label: 'Schmiede', pos: [-6.4, 2], workPos: [-5, 1.6] },
  { skill: 'combat', label: 'Arena', pos: [6.8, 5.6], workPos: [5, 4.4] },
  { skill: 'farming', label: 'Felder', pos: [-3.4, 7.2], workPos: [-2.2, 6] },
  { skill: 'crafting', label: 'Werkbank', pos: [-4.6, 4.6], workPos: [-3.8, 3.9] },
  { skill: 'hunting', label: 'Jagdgrund', pos: [-8.6, -0.6], workPos: [-7.4, -0.4] },
  { skill: 'research', label: 'Forschungsturm', pos: [4.2, -8], workPos: [3.4, -6.4] },
  { skill: 'archaeology', label: 'Grabung', pos: [7.6, 0.6], workPos: [6.4, 0.9] },
  { skill: 'alchemy', label: 'Alchemie', pos: [-7, -6], workPos: [-5.9, -5.2] },
  { skill: 'enchanting', label: 'Runenkreis', pos: [5.4, -6.2], workPos: [4.6, -5.2] },
  { skill: 'arcane', label: 'Ätherquelle', pos: [-0.8, 9.6], workPos: [-0.4, 8.4] },
  { skill: 'faith', label: 'Schrein', pos: [-7.1, 6.6], workPos: [-6.2, 5.8] },
  { skill: 'brewing', label: 'Brauerei', pos: [8.4, 3.1], workPos: [7.2, 2.7] },
  { skill: 'jewelcrafting', label: 'Juwelier', pos: [3.6, -1.2], workPos: [3.2, 0] },
];

/** Skills that share a station. */
const STATION_ALIASES: Record<string, string> = {};

export const IDLE_POS: Vec2 = [0, 0.5];

export const ISLAND_RADIUS = 11;

/** River: a gentle S-curve across the island, sampled as points. */
export const RIVER_POINTS: Vec2[] = [
  [-1.5, -10.9],
  [-0.4, -7],
  [1.2, -3],
  [0.4, 0.5],
  [2.6, 5],
  [3.3, 10.9],
];

export function stationFor(skill: string | null): StationDef | undefined {
  const key = skill ? (STATION_ALIASES[skill] ?? skill) : null;
  return STATIONS.find((s) => s.skill === key);
}

/** Deterministic pseudo-random for scatter placement (keeps the world identical across reloads). */
export function scatter(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Distance from point to the river polyline (used to keep trees off the water). */
export function distanceToRiver(x: number, z: number): number {
  let best = Infinity;
  for (let i = 0; i < RIVER_POINTS.length - 1; i++) {
    const [ax, az] = RIVER_POINTS[i]!;
    const [bx, bz] = RIVER_POINTS[i + 1]!;
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), z - (az + t * dz)));
  }
  return best;
}
