// Village world generation: the starting village, raid targets and free valleys around it.
// Kept free of other engine modules so state.ts can use it for new games.
import { PROTECTION, TARGET_TEMPLATES, VALLEYS, V_RESOURCES, type VRes } from '../data/village';
import { createRng, type Rng } from './rng';
import type { RaidTarget, Village, VillageState, ValleySite } from './state';

export const WORLD_SEED = 424242;

export function createVillage(
  id: number,
  name: string,
  x: number,
  y: number,
  layout: string,
  capital: boolean,
): Village {
  const valley = VALLEYS[layout] ?? VALLEYS.standard!;
  return {
    id,
    name,
    capital,
    x,
    y,
    layout: VALLEYS[layout] ? layout : 'standard',
    fields: valley.layout.map(() => 0),
    buildings: { main: 1 },
    res: { wood: 750, clay: 750, iron: 750, crop: 750 },
    queue: { field: [], center: [] },
    training: [],
    troops: {},
    research: null,
    celebration: null,
    oases: [],
  };
}

function ring(rng: Rng, min: number, max: number, taken: Set<string>): [number, number] {
  for (let i = 0; i < 200; i++) {
    const a = rng() * Math.PI * 2;
    const d = min + rng() * (max - min);
    const x = Math.round(Math.cos(a) * d);
    const y = Math.round(Math.sin(a) * d);
    const key = `${x},${y}`;
    if (!taken.has(key) && Math.hypot(x, y) >= min) {
      taken.add(key);
      return [x, y];
    }
  }
  return [Math.round(max), 0];
}

export function stockFor(level: number, kind: RaidTarget['kind']): number {
  const tpl = TARGET_TEMPLATES.find((t) => t.kind === kind)!;
  return Math.round(tpl.stock * Math.pow(level, 1.4));
}

export function defenseFor(level: number, kind: RaidTarget['kind']): number {
  const tpl = TARGET_TEMPLATES.find((t) => t.kind === kind)!;
  return Math.round(tpl.defense * Math.pow(level, 1.6));
}

export function createTargets(rng: Rng, taken: Set<string>): RaidTarget[] {
  const kinds: RaidTarget['kind'][] = [
    'camp',
    'camp',
    'camp',
    'oasis',
    'camp',
    'oasis',
    'ruin',
    'camp',
    'oasis',
    'ruin',
    'oasis',
    'camp',
    'ruin',
    'oasis',
  ];
  return kinds.map((kind, i) => {
    const [x, y] = ring(rng, 2 + i * 0.9, 4 + i * 1.3, taken);
    const level = Math.max(
      1,
      Math.min(12, Math.round(Math.hypot(x, y) / 1.8) + (kind === 'ruin' ? 2 : 0)),
    );
    const tpl = TARGET_TEMPLATES.find((t) => t.kind === kind)!;
    const bonus: VRes | undefined =
      kind === 'oasis' ? V_RESOURCES[Math.floor(rng() * 4)] : undefined;
    const stockMax = stockFor(level, kind);
    const def = defenseFor(level, kind);
    return {
      id: `t${i}`,
      kind,
      name: `${tpl.name}${bonus ? ` (${bonus === 'wood' ? 'Wald' : bonus === 'clay' ? 'Lehm' : bonus === 'iron' ? 'Erz' : 'Weizen'})` : ''}`,
      icon:
        kind === 'oasis'
          ? bonus === 'wood'
            ? '🌳'
            : bonus === 'clay'
              ? '🏜️'
              : bonus === 'iron'
                ? '⛰️'
                : '🌾'
          : tpl.icon,
      level,
      x,
      y,
      defense: def,
      maxDefense: def,
      stock: { wood: stockMax / 2, clay: stockMax / 2, iron: stockMax / 2, crop: stockMax / 2 },
      stockMax,
      bonus,
      owner: null,
    };
  });
}

export function createSites(rng: Rng, taken: Set<string>): ValleySite[] {
  const layouts = [
    'standard',
    'cropper',
    'standard',
    'lumber',
    'granary',
    'standard',
    'cropper',
    'lumber',
  ];
  return layouts.map((layout, i) => {
    const [x, y] = ring(rng, 4 + i, 8 + i * 1.5, taken);
    return { id: `s${i}`, x, y, layout };
  });
}

export function createVillageState(seed = WORLD_SEED): VillageState {
  const rng = createRng(seed);
  const taken = new Set<string>(['0,0']);
  return {
    villages: [createVillage(1, 'Neu-Aetherium', 0, 0, 'standard', true)],
    active: 1,
    researched: [],
    cp: 0,
    cpTotal: 0,
    targets: createTargets(rng, taken),
    sites: createSites(rng, taken),
    movements: [],
    reports: [],
    unread: 0,
    nextId: 2,
    protection: PROTECTION,
    invasionIn: 3 * 3600,
    invasionsWon: 0,
    invasionsLost: 0,
    clock: 0,
  };
}
