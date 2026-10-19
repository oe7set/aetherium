import { ITEM_MAP } from '../data';

/** Mixes a hex colour towards white (amt > 0) or black (amt < 0). */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)),
  );
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
}

/** Rock chunk with big coloured veins – the colour has to read even at pill size. */
function OreArt({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden>
      <polygon points="3,20 7,8 17,4 27,9 30,20 23,28 9,29" fill="#6a707c" />
      <polygon points="7,8 17,4 27,9 19,12 10,12" fill="#8c93a0" />
      <polygon points="9,13 17,10 22,15 17,21 10,19" fill={color} />
      <polygon points="18,19 25,15 28,21 22,25" fill={shade(color, -0.2)} />
      <polygon points="7,21 12,20 13,26 8,26" fill={shade(color, -0.1)} />
      <polygon points="11,13.5 16,11.5 17,14 12,15.5" fill={shade(color, 0.6)} />
      <polygon points="21,17.5 24,16.5 25,18.5" fill={shade(color, 0.6)} />
    </svg>
  );
}

/** Ingot: bright top, coloured front, darker side – reads as metal at any size. */
function BarArt({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden>
      <polygon points="9,11 25,11 29,22 5,22" fill={color} />
      <polygon points="9,11 25,11 22,7 12,7" fill={shade(color, 0.45)} />
      <polygon points="25,11 22,7 26,18 29,22" fill={shade(color, -0.3)} />
      <polygon points="5,22 29,22 29,25 5,25" fill={shade(color, -0.45)} />
      <polygon points="11,13 16,13 15,15 10,15" fill={shade(color, 0.6)} opacity="0.8" />
    </svg>
  );
}

/**
 * An item's icon: drawn art for ores and bars (as emoji they all look the same), otherwise the
 * emoji. Sized by the surrounding font-size like an emoji would be.
 */
export function ItemIcon({ id }: { id: string }) {
  const def = ITEM_MAP.get(id);
  if (!def) return null;
  if (!def.art) return <>{def.icon}</>;
  return (
    <span className="item-art" role="img" aria-label={def.name}>
      {def.art.kind === 'ore' ? <OreArt color={def.art.color} /> : <BarArt color={def.art.color} />}
    </span>
  );
}
