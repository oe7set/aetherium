// World map renderer (Travian-like grid). Terrain is pre-rendered once into an offscreen canvas and
// only blitted per frame; entities are drawn on top with the shared emoji sprite cache.
import type { GameState } from '../../engine';
import { drawSprite } from '../sprites';

export const WORLD_R = 16;
const T = 40; // internal pixels per tile in the terrain canvas
const SIZE = (WORLD_R * 2 + 1) * T;

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise (bilinear) for natural-looking terrain. */
function noise(x: number, y: number, scale: number, seed: number): number {
  const fx = x / scale;
  const fy = y / scale;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = hash(x0 + seed, y0);
  const b = hash(x0 + 1 + seed, y0);
  const c = hash(x0 + seed, y0 + 1);
  const d = hash(x0 + 1 + seed, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

export type Terrain = 'water' | 'sand' | 'grass' | 'meadow' | 'forest' | 'hills' | 'mountain';

export const TERRAIN_NAMES: Record<Terrain, string> = {
  water: 'See',
  sand: 'Ufer',
  grass: 'Grasland',
  meadow: 'Blumenwiese',
  forest: 'Wald',
  hills: 'Hügel',
  mountain: 'Gebirge',
};

export function terrainAt(x: number, y: number): Terrain {
  // Keep the home valley open and friendly.
  if (Math.hypot(x, y) < 2.2) return 'grass';
  const e = noise(x + 50, y + 50, 5, 11) * 0.7 + noise(x + 50, y + 50, 2.5, 23) * 0.3;
  const m = noise(x + 50, y + 50, 4, 37);
  if (e < 0.24) return 'water';
  if (e < 0.3) return 'sand';
  if (e > 0.78) return 'mountain';
  if (e > 0.66) return 'hills';
  if (m > 0.62) return 'forest';
  if (m < 0.3) return 'meadow';
  return 'grass';
}

const COLORS: Record<Terrain, [string, string]> = {
  water: ['#2c6aa0', '#1d4f7d'],
  sand: ['#d9c38a', '#bfa66c'],
  grass: ['#5b9a45', '#4a8538'],
  meadow: ['#73ad52', '#5e9641'],
  forest: ['#2f6b35', '#25572b'],
  hills: ['#8a8a5a', '#717147'],
  mountain: ['#8b8e99', '#6c6f7a'],
};

const DECOR: Partial<Record<Terrain, string[]>> = {
  forest: ['🌲', '🌳', '🌲'],
  hills: ['🪨', '⛰️'],
  mountain: ['🏔️', '⛰️'],
  meadow: ['🌼', '🌷', '🌱'],
  water: ['〰️'],
};

let terrainCanvas: HTMLCanvasElement | null = null;

function terrainLayer(): HTMLCanvasElement {
  if (terrainCanvas) return terrainCanvas;
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d')!;
  for (let y = -WORLD_R; y <= WORLD_R; y++)
    for (let x = -WORLD_R; x <= WORLD_R; x++) {
      const t = terrainAt(x, y);
      const px = (x + WORLD_R) * T;
      const py = (y + WORLD_R) * T;
      const [a, b] = COLORS[t];
      const g = ctx.createLinearGradient(px, py, px + T, py + T);
      g.addColorStop(0, a);
      g.addColorStop(1, b);
      ctx.fillStyle = g;
      ctx.fillRect(px, py, T, T);
      // Soft texture speckles.
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 4; i++)
        ctx.fillRect(px + hash(x * 7 + i, y) * T, py + hash(x, y * 7 + i) * T, 2, 2);
      const decor = DECOR[t];
      if (decor && hash(x * 3, y * 5) < 0.75) {
        ctx.globalAlpha = t === 'water' ? 0.35 : 0.85;
        drawSprite(
          ctx,
          decor[Math.floor(hash(y, x) * decor.length)]!,
          px + T * (0.3 + hash(x, y) * 0.4),
          py + T * (0.3 + hash(y, x + 1) * 0.4),
          T * 0.5,
        );
        ctx.globalAlpha = 1;
      }
      // Grid lines.
      ctx.strokeStyle = 'rgba(0,0,0,0.13)';
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
    }
  // Fade the world's edge into the sea of fog.
  const fog = ctx.createRadialGradient(
    SIZE / 2,
    SIZE / 2,
    SIZE * 0.35,
    SIZE / 2,
    SIZE / 2,
    SIZE * 0.72,
  );
  fog.addColorStop(0, 'rgba(8,10,22,0)');
  fog.addColorStop(1, 'rgba(8,10,22,0.85)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, SIZE, SIZE);
  terrainCanvas = c;
  return c;
}

export interface MapView {
  width: number;
  height: number;
  dpr: number;
  /** Camera centre in tile coordinates. */
  cx: number;
  cy: number;
  /** CSS pixels per tile. */
  tile: number;
}

export function screenToTile(view: MapView, sx: number, sy: number): [number, number] {
  return [
    Math.round(view.cx + (sx - view.width / 2) / view.tile),
    Math.round(view.cy + (sy - view.height / 2) / view.tile),
  ];
}

const center = (v: number) => (v + WORLD_R + 0.5) * T;

/** Hero position on the map (interpolated while travelling). */
export function heroMapPos(game: GameState): [number, number] | null {
  const h = game.hero;
  const home = game.village.villages.find((v) => v.id === h.home) ?? game.village.villages[0]!;
  if (h.status === 'dead') return null;
  if (h.trip) {
    const adv = h.adventures.find((a) => a.id === h.trip!.target);
    if (!adv) return [home.x, home.y];
    const p = 1 - h.trip.remaining / h.trip.total;
    const [fx, fy, tx, ty] =
      h.trip.kind === 'adventure' ? [home.x, home.y, adv.x, adv.y] : [adv.x, adv.y, home.x, home.y];
    return [fx + (tx - fx) * p, fy + (ty - fy) * p];
  }
  if (h.status === 'adventure') {
    const adv = h.adventures.find((a) => a.id === h.at);
    if (adv) return [adv.x, adv.y];
  }
  if (h.status === 'raid') return null; // drawn with the raid movement
  return [home.x, home.y];
}

export function renderMap(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  view: MapView,
  time: number,
  selected: [number, number] | null,
): void {
  const { width, height, dpr, tile } = view;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#080a16';
  ctx.fillRect(0, 0, width, height);
  const k = tile / T;
  ctx.setTransform(
    dpr * k,
    0,
    0,
    dpr * k,
    dpr * (width / 2 - (view.cx + WORLD_R + 0.5) * tile),
    dpr * (height / 2 - (view.cy + WORLD_R + 0.5) * tile),
  );
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(terrainLayer(), 0, 0);
  const labels = tile >= 30;
  const vs = game.village;

  // Movements: dashed paths with a marching dot.
  for (const m of vs.movements) {
    const from = vs.villages.find((v) => v.id === m.from);
    if (!from) continue;
    let tx: number;
    let ty: number;
    const target = vs.targets.find((t) => t.id === m.target);
    const site = vs.sites.find((t) => t.id === m.target);
    const to = vs.villages.find((v) => String(v.id) === m.target);
    if (target) [tx, ty] = [target.x, target.y];
    else if (site) [tx, ty] = [site.x, site.y];
    else if (to) [tx, ty] = [to.x, to.y];
    else continue;
    const back = m.kind === 'return';
    const [ax, ay, bx, by] = back ? [tx, ty, from.x, from.y] : [from.x, from.y, tx, ty];
    const p = 1 - m.remaining / m.total;
    ctx.strokeStyle =
      m.kind === 'raid'
        ? 'rgba(255,93,115,0.85)'
        : m.kind === 'return'
          ? 'rgba(91,227,138,0.85)'
          : 'rgba(255,209,102,0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 7]);
    ctx.lineDashOffset = -time * 30;
    ctx.beginPath();
    ctx.moveTo(center(ax), center(ay));
    ctx.lineTo(center(bx), center(by));
    ctx.stroke();
    ctx.setLineDash([]);
    const px = center(ax + (bx - ax) * p);
    const py = center(ay + (by - ay) * p);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(px, py, 13, 0, Math.PI * 2);
    ctx.fill();
    drawSprite(
      ctx,
      m.hero ? game.hero.avatar : m.kind === 'settle' ? '🧳' : m.kind === 'trade' ? '🐫' : '⚔️',
      px,
      py,
      20,
    );
  }

  // Free valleys.
  for (const s of vs.sites) {
    ctx.globalAlpha = 0.75;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(center(s.x) - T * 0.42, center(s.y) - T * 0.42, T * 0.84, T * 0.84);
    ctx.setLineDash([]);
    drawSprite(ctx, '🏞️', center(s.x), center(s.y), T * 0.6);
    ctx.globalAlpha = 1;
  }

  // Raid targets.
  for (const t of vs.targets) {
    const x = center(t.x);
    const y = center(t.y);
    ctx.fillStyle = t.kind === 'ruin' ? 'rgba(124,92,255,0.35)' : 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(x, y, T * 0.42, 0, Math.PI * 2);
    ctx.fill();
    drawSprite(ctx, t.icon, x, y - 2, T * 0.62);
    if (t.owner !== null) drawSprite(ctx, '🚩', x + T * 0.3, y - T * 0.3, T * 0.35);
    else {
      // Defence bar and level badge.
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x - T * 0.36, y + T * 0.32, T * 0.72, 4);
      ctx.fillStyle = '#ff5d73';
      ctx.fillRect(x - T * 0.36, y + T * 0.32, (T * 0.72 * t.defense) / t.maxDefense, 4);
      ctx.fillStyle = '#f6ead0';
      ctx.beginPath();
      ctx.arc(x + T * 0.32, y - T * 0.3, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2a18';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(t.level), x + T * 0.32, y - T * 0.3 + 0.5);
    }
  }

  // Adventures pulse.
  for (const a of game.hero.adventures) {
    const x = center(a.x);
    const y = center(a.y);
    const pulse = 1 + Math.sin(time * 4 + a.id) * 0.12;
    ctx.strokeStyle = a.hard ? 'rgba(255,93,115,0.95)' : 'rgba(255,209,102,0.95)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, T * 0.4 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = a.hard ? 'rgba(255,93,115,0.25)' : 'rgba(255,209,102,0.25)';
    ctx.fill();
    drawSprite(ctx, a.hard ? '💀' : '❗', x, y, T * 0.5);
  }

  // Own villages.
  for (const v of vs.villages) {
    const x = center(v.x);
    const y = center(v.y);
    const g = ctx.createRadialGradient(x, y, 2, x, y, T * 0.75);
    g.addColorStop(0, 'rgba(255,209,102,0.55)');
    g.addColorStop(1, 'rgba(255,209,102,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, T * 0.75, 0, Math.PI * 2);
    ctx.fill();
    drawSprite(ctx, v.capital ? '🏰' : '🏡', x, y - 2, T * 0.75);
    if (labels) label(ctx, v.name, x, y + T * 0.55, v.id === vs.active ? '#ffd166' : '#ffffff');
  }

  // The hero.
  const hp = heroMapPos(game);
  if (hp) {
    const x = center(hp[0]) + T * 0.28;
    const y = center(hp[1]) - T * 0.28 + Math.sin(time * 3) * 2;
    ctx.fillStyle = 'rgba(94,242,255,0.35)';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    drawSprite(ctx, game.hero.avatar, x, y, 22);
  }

  // Selection.
  if (selected) {
    const x = center(selected[0]);
    const y = center(selected[1]);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#5ef2ff';
    ctx.shadowBlur = 10;
    ctx.strokeRect(x - T / 2 + 1, y - T / 2 + 1, T - 2, T - 2);
    ctx.shadowBlur = 0;
  }
}

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
): void {
  ctx.font = '600 10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 8;
  ctx.fillStyle = 'rgba(8,10,22,0.75)';
  ctx.fillRect(x - w / 2, y - 7, w, 14);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
