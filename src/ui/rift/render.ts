// Canvas 2D renderer for the rift. Reads the run state; never mutates gameplay.
import { HEROES } from '../../data/rift';
import { WEAPON_MAP, weaponStats, type RunState } from '../../rift/sim';
import { drawSprite } from '../sprites';
import { motionReduced } from '../a11y';

/** Deterministic hash for ground decoration. */
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export interface View {
  width: number;
  height: number;
  dpr: number;
  /** World px → css px. */
  scale: number;
  /** Low quality: fewer decorations, shadows and glows (weak devices). */
  low?: boolean;
}

const vignettes = new Map<string, HTMLCanvasElement>();

/** Full-screen vignette rendered once per size (a radial gradient over the whole screen is costly). */
function vignette(width: number, height: number, dpr: number, hurt: boolean): HTMLCanvasElement {
  const key = `${Math.round(width)}x${Math.round(height)}@${dpr}${hurt ? 'h' : ''}`;
  let c = vignettes.get(key);
  if (!c) {
    if (vignettes.size > 6) vignettes.clear();
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(width * dpr * 0.5));
    c.height = Math.max(1, Math.round(height * dpr * 0.5));
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(
      c.width / 2,
      c.height / 2,
      Math.min(c.width, c.height) * 0.35,
      c.width / 2,
      c.height / 2,
      Math.max(c.width, c.height) * 0.75,
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, hurt ? 'rgba(170,0,25,0.75)' : 'rgba(0,0,0,0.55)');
    g.fillStyle = grad;
    g.fillRect(0, 0, c.width, c.height);
    vignettes.set(key, c);
  }
  return c;
}

const patterns = new Map<string, CanvasPattern>();
/** All 9 tile offsets, so blotches wrap seamlessly across edges and corners. */
const WRAP = [-256, 0, 256].flatMap((ox) => [-256, 0, 256].map((oy) => [ox, oy] as const));

/** Ground texture per biome: blotches, speckles and grass strokes on a 256 px tile. */
function groundPattern(
  ctx: CanvasRenderingContext2D,
  id: string,
  base: string,
  accent: string,
): CanvasPattern {
  let p = patterns.get(id);
  if (!p) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    let seed = id.length * 977;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // Soft blotches (wrap around the edges so the tile is seamless).
    for (let i = 0; i < 26; i++) {
      const x = rnd() * 256;
      const y = rnd() * 256;
      const r = 18 + rnd() * 46;
      for (const [ox, oy] of WRAP) {
        const grad = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        grad.addColorStop(0, `${accent}88`);
        grad.addColorStop(1, `${accent}00`);
        g.fillStyle = grad;
        g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
      }
    }
    // Speckles and little strokes.
    for (let i = 0; i < 260; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.10)';
      g.fillRect(rnd() * 256, rnd() * 256, 2, 2);
    }
    g.strokeStyle = 'rgba(255,255,255,0.07)';
    g.lineWidth = 1.2;
    for (let i = 0; i < 70; i++) {
      const x = rnd() * 256;
      const y = rnd() * 256;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (rnd() - 0.5) * 4, y - 4 - rnd() * 5);
      g.stroke();
    }
    p = ctx.createPattern(c, 'repeat')!;
    patterns.set(id, p);
  }
  return p;
}

export function viewFor(width: number, height: number, dpr: number): View {
  return { width, height, dpr, scale: Math.max(width / 620, height / 1000, 0.5) };
}

const TILE = 160;

export function render(
  ctx: CanvasRenderingContext2D,
  run: RunState,
  view: View,
  time: number,
): void {
  const { width, height, dpr, scale } = view;
  const h = run.hero;
  const shake = motionReduced ? 0 : run.shake;
  const shakeX = shake ? (Math.sin(time * 91) * shake) / 2 : 0;
  const shakeY = shake ? (Math.cos(time * 77) * shake) / 2 : 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const [base, accent] = run.biome.ground;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // World transform: hero in the centre.
  ctx.setTransform(
    dpr * scale,
    0,
    0,
    dpr * scale,
    dpr * (width / 2 + shakeX),
    dpr * (height / 2 + shakeY),
  );
  ctx.translate(-h.x, -h.y);
  const halfW = width / 2 / scale + TILE;
  const halfH = height / 2 / scale + TILE;
  const x0 = Math.floor((h.x - halfW) / TILE);
  const x1 = Math.floor((h.x + halfW) / TILE);
  const y0 = Math.floor((h.y - halfH) / TILE);
  const y1 = Math.floor((h.y + halfH) / TILE);

  // Ground: pre-rendered texture pattern (cheap) + scattered decoration.
  ctx.fillStyle = groundPattern(ctx, run.biome.id, base, accent);
  ctx.fillRect(x0 * TILE, y0 * TILE, (x1 - x0 + 1) * TILE, (y1 - y0 + 1) * TILE);
  ctx.globalAlpha = 0.5;
  const decor = view.low ? [] : run.biome.decor;
  for (let tx = x0; tx <= x1 && decor.length; tx++)
    for (let ty = y0; ty <= y1; ty++) {
      const r = hash(tx, ty);
      if (r > 0.45) continue;
      const emoji = decor[Math.floor(hash(ty, tx) * decor.length)]!;
      drawSprite(
        ctx,
        emoji,
        tx * TILE + r * TILE * 2,
        ty * TILE + hash(tx + 7, ty) * TILE,
        18 + r * 20,
      );
    }
  ctx.globalAlpha = 1;

  // Zones.
  for (const z of run.zones) {
    const fade = Math.min(1, z.life / 0.4, (z.maxLife - z.life) / 0.2 + 0.2);
    const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.radius);
    const col = WEAPON_MAP.get(z.weapon)?.color ?? '#7dff6b';
    g.addColorStop(0, `${col}aa`);
    g.addColorStop(0.7, `${col}55`);
    g.addColorStop(1, `${col}00`);
    ctx.globalAlpha = fade;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
    ctx.fill();
    if (z.kind === 'well') {
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius * (0.3 + i * 0.25), time * 4 + i, time * 4 + i + Math.PI * 1.2);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;

  // Aura weapons (fire ring / fusion) under everything else.
  for (const w of run.weapons) {
    const def = WEAPON_MAP.get(w.id);
    if (def?.behavior !== 'aura') continue;
    const st = weaponStats(run, def, w.level);
    const pulse = 1 + Math.sin(time * 6) * 0.04;
    const g = ctx.createRadialGradient(h.x, h.y, st.area * 0.2, h.x, h.y, st.area * pulse);
    g.addColorStop(0, `${def.color}00`);
    g.addColorStop(0.75, `${def.color}44`);
    g.addColorStop(1, `${def.color}aa`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(h.x, h.y, st.area * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  // XP gems.
  for (const g of run.gems) {
    const col = g.xp >= 20 ? '#ff5d73' : g.xp >= 5 ? '#5be38a' : '#5aa9ff';
    const s = g.xp >= 20 ? 8 : g.xp >= 5 ? 6 : 5;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y - s);
    ctx.lineTo(g.x + s * 0.7, g.y);
    ctx.lineTo(g.x, g.y + s);
    ctx.lineTo(g.x - s * 0.7, g.y);
    ctx.closePath();
    ctx.fill();
  }

  // Pickups bob a little.
  for (const p of run.pickups) {
    const icon =
      p.kind === 'chest' ? '🎁' : p.kind === 'heal' ? '🍗' : p.kind === 'magnet' ? '🧲' : '💣';
    const bob = Math.sin(time * 4 + p.x) * 3;
    if (p.kind === 'chest') {
      ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 24 + Math.sin(time * 5) * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    drawSprite(ctx, icon, p.x, p.y + bob, p.kind === 'chest' ? 34 : 24);
  }

  // Enemies (shadow, sprite, flash, elite/boss marks).
  for (const e of run.enemies) {
    const size = e.radius * 2.3;
    if (!view.low) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + e.radius * 0.8, e.radius * 0.9, e.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (e.elite || e.boss) {
      ctx.strokeStyle = e.boss ? '#ff5d73' : '#ffd166';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 4 + Math.sin(time * 6) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (e.shield > 0) {
      ctx.strokeStyle = 'rgba(120, 190, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    const wobble = Math.sin(time * 10 + e.id) * 0.08;
    drawSprite(ctx, e.def.icon, e.x, e.y, size, wobble, e.x > h.x);
    if (e.flash > 0) {
      ctx.globalAlpha = Math.min(0.6, e.flash * 5);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (e.boss || e.elite) {
      const w = e.radius * 2.4;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 14, w, 5);
      ctx.fillStyle = e.boss ? '#ff5d73' : '#ffd166';
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 14, (w * Math.max(0, e.hp)) / e.maxHp, 5);
    }
  }

  // Enemy shots.
  ctx.fillStyle = '#ff5d73';
  for (const s of run.shots) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hero.
  const hero = HEROES.find((x) => x.id === run.config.hero) ?? HEROES[0]!;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(h.x, h.y + 14, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const step = h.moving ? Math.sin(time * 14) * 2.5 : 0;
  if (h.invuln > 0 && Math.floor(time * 20) % 2 === 0) ctx.globalAlpha = 0.5;
  drawSprite(ctx, run.config.avatar ?? hero.icon, h.x, h.y - Math.abs(step), 36, 0, h.fx < 0);
  // Beschwörung: the familiar hovers next to the hero.
  if (run.companion && run.config.companion) {
    const bob = Math.sin(time * 4) * 3;
    drawSprite(ctx, run.config.companion.icon, run.companion.x, run.companion.y + bob, 26);
  }
  ctx.globalAlpha = 1;
  if (h.hurt > 0) {
    ctx.fillStyle = `rgba(255, 60, 80, ${h.hurt * 1.6})`;
    ctx.beginPath();
    ctx.arc(h.x, h.y, 18, 0, Math.PI * 2);
    ctx.fill();
  }
  // HP bar under the hero.
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(h.x - 20, h.y + 22, 40, 5);
  ctx.fillStyle = h.hp / run.stats.maxHp < 0.3 ? '#ff5d73' : '#5be38a';
  ctx.fillRect(h.x - 20, h.y + 22, (40 * Math.max(0, h.hp)) / run.stats.maxHp, 5);

  // Projectiles.
  ctx.globalCompositeOperation = 'lighter';
  for (const p of run.projectiles) {
    const def = WEAPON_MAP.get(p.weapon);
    if (!def) continue;
    if (p.kind === 'orbit') {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.2);
      g.addColorStop(0, `${def.color}cc`);
      g.addColorStop(1, `${def.color}00`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'aimed') {
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const p of run.projectiles) {
    const def = WEAPON_MAP.get(p.weapon);
    if (!def) continue;
    if (p.kind === 'aimed')
      drawSprite(ctx, def.icon, p.x, p.y, p.radius * 3.2, p.angle + Math.PI / 4);
    else if (p.kind === 'lob') {
      const t = 1 - p.life / p.maxLife;
      const arc = Math.sin(t * Math.PI) * 60;
      drawSprite(ctx, def.icon, p.x, p.y - arc, 20, t * 10);
    } else drawSprite(ctx, def.icon, p.x, p.y, p.radius * 2.4, p.angle);
  }

  // Spin beams.
  ctx.globalCompositeOperation = 'lighter';
  for (const w of run.weapons) {
    const def = WEAPON_MAP.get(w.id);
    if (def?.behavior !== 'spin' || w.active <= 0) continue;
    const st = weaponStats(run, def, w.level);
    const n = Math.max(1, Math.round(st.amount));
    for (let i = 0; i < n; i++) {
      const a = w.angle + (i / n) * Math.PI * 2;
      beam(
        ctx,
        h.x,
        h.y,
        h.x + Math.cos(a) * st.area,
        h.y + Math.sin(a) * st.area,
        10,
        def.color,
        1,
      );
    }
  }

  // Effects.
  for (const f of run.fx) {
    const a = Math.max(0, f.life / f.max);
    switch (f.type) {
      case 'beam':
        beam(ctx, f.x1, f.y1, f.x2, f.y2, f.width, f.color, a);
        break;
      case 'ring':
        ctx.globalAlpha = a;
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 6 * a + 2;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * (1 - a * 0.7), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      case 'bolt': {
        ctx.globalAlpha = a;
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(f.points[0]!, f.points[1]!);
        for (let i = 2; i < f.points.length; i += 2) {
          const px = f.points[i - 2]!;
          const py = f.points[i - 1]!;
          const nx = f.points[i]!;
          const ny = f.points[i + 1]!;
          // Jagged midpoint.
          ctx.lineTo(
            (px + nx) / 2 + (hash(i, Math.floor(time * 30)) - 0.5) * 24,
            (py + ny) / 2 + (hash(Math.floor(time * 30), i) - 0.5) * 24,
          );
          ctx.lineTo(nx, ny);
        }
        ctx.stroke();
        ctx.lineWidth = 8;
        ctx.globalAlpha = a * 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      }
      case 'sweep': {
        ctx.globalAlpha = a;
        const g = ctx.createLinearGradient(f.x, 0, f.x + f.dir * f.len, 0);
        g.addColorStop(0, `${f.color}00`);
        g.addColorStop(1, `${f.color}dd`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(
          f.x + (f.dir * f.len) / 2,
          f.y,
          f.len / 2,
          (f.height / 2) * (0.4 + a * 0.6),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }
      case 'burst':
        ctx.globalAlpha = a;
        ctx.fillStyle = f.color;
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const r = f.size * (1.6 - a);
          ctx.beginPath();
          ctx.arc(f.x + Math.cos(ang) * r, f.y + Math.sin(ang) * r, 2.5 * a + 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      case 'text':
        break;
    }
  }
  ctx.globalCompositeOperation = 'source-over';

  // Damage numbers on top.
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  for (const f of run.fx) {
    if (f.type !== 'text') continue;
    ctx.globalAlpha = Math.min(1, (f.life / f.max) * 2);
    ctx.font = `${f.big ? 800 : 700} ${f.big ? 18 : 13}px Inter, system-ui, sans-serif`;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  // Off-screen boss arrows.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const e of run.enemies) {
    if (!e.boss && !e.elite) continue;
    const sx = (e.x - h.x) * scale + width / 2;
    const sy = (e.y - h.y) * scale + height / 2;
    if (sx > 0 && sx < width && sy > 0 && sy < height) continue;
    const ang = Math.atan2(sy - height / 2, sx - width / 2);
    const ax = Math.min(width - 24, Math.max(24, sx));
    const ay = Math.min(height - 24, Math.max(24, sy));
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    ctx.fillStyle = e.boss ? '#ff5d73' : '#ffd166';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Vignette (cached), red flash when hurt.
  ctx.drawImage(vignette(width, height, dpr, false), 0, 0, width, height);
  if (h.hurt > 0) {
    ctx.globalAlpha = Math.min(1, h.hurt * 3);
    ctx.drawImage(vignette(width, height, dpr, true), 0, 0, width, height);
    ctx.globalAlpha = 1;
  }
}

function beam(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: string,
  alpha: number,
): void {
  ctx.globalAlpha = alpha * 0.45;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = width * 2.2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width * 0.6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.globalAlpha = 1;
}
