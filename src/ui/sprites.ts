// Emoji sprite cache: every emoji is rendered once per size into an offscreen canvas, then blitted.
// drawImage is much cheaper than fillText for hundreds of entities per frame.

// --- Sprite cache: emoji rendered once to offscreen canvases -------------------------------------

const sprites = new Map<string, HTMLCanvasElement>();
/** Internal resolution factor: sprites stay crisp on high-DPI phones. */
const RES = 2;

export function sprite(emoji: string, size: number): HTMLCanvasElement {
  const px = Math.max(8, Math.round(size / 4) * 4);
  const key = `${emoji}|${px}`;
  let c = sprites.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = Math.ceil(px * 1.3 * RES);
    const ctx = c.getContext('2d')!;
    ctx.font = `${px * RES}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, c.width / 2, c.height / 2 + px * RES * 0.06);
    sprites.set(key, c);
    if (sprites.size > 260) sprites.delete(sprites.keys().next().value!);
  }
  return c;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  x: number,
  y: number,
  size: number,
  angle = 0,
  flip = false,
): void {
  const img = sprite(emoji, size);
  const w = (img.width / RES) * (size / Math.max(8, Math.round(size / 4) * 4));
  if (!angle && !flip) {
    ctx.drawImage(img, x - w / 2, y - w / 2, w, w);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -w / 2, w, w);
  ctx.restore();
}
