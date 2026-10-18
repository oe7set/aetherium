import { memo } from 'react';
import { pips, RESOURCE_INFO, type Resource } from '../../data/colony';
import { BOARD, vertexOwner, type ColonyMatch } from '../../engine';
import { playerColor } from './colonyUi';

export type BoardMode =
  'none' | 'road' | 'settlement' | 'city' | 'building' | 'robber' | 'setupSettlement' | 'setupRoad';

const S = 50;

const TERRAIN_FILL: Record<string, [string, string]> = {
  wood: ['#3f9a4c', '#1d5a2a'],
  brick: ['#d8774f', '#8a3a24'],
  wool: ['#a9e070', '#5c9a34'],
  grain: ['#f6d76a', '#c49a2a'],
  ore: ['#a3a9b8', '#555b6a'],
  desert: ['#ecd9a4', '#b89a5c'],
};

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((60 * i - 30) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

const HOUSE = 'M-8,7 L8,7 L8,-2 L0,-10 L-8,-2 Z';
const CITY = 'M-12,8 L12,8 L12,-4 L4,-4 L4,-9 L-2,-14 L-8,-9 L-8,-4 L-12,-4 Z';

interface Props {
  match: ColonyMatch;
  mode: BoardMode;
  targets: Set<number>;
  selected: number | null;
  onVertex: (v: number) => void;
  onEdge: (e: number) => void;
  onHex: (h: number) => void;
}

function HexBoardImpl({ match: m, mode, targets, selected, onVertex, onEdge, onHex }: Props) {
  const lastSum = m.lastRoll ? m.lastRoll[0] + m.lastRoll[1] : null;
  const vertexMode =
    mode === 'settlement' || mode === 'city' || mode === 'building' || mode === 'setupSettlement';
  const edgeMode = mode === 'road' || mode === 'setupRoad';
  return (
    <svg
      className="hexboard"
      viewBox="-255 -240 510 480"
      role="img"
      aria-label="Spielbrett der Kolonie"
    >
      <defs>
        {Object.entries(TERRAIN_FILL).map(([k, [a, b]]) => (
          <radialGradient key={k} id={`terrain-${k}`} cx="40%" cy="35%" r="75%">
            <stop offset="0%" stopColor={a} />
            <stop offset="100%" stopColor={b} />
          </radialGradient>
        ))}
        <radialGradient id="board-sea" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#1f6f9a" />
          <stop offset="100%" stopColor="#0b2240" />
        </radialGradient>
        <filter id="token-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.5" />
        </filter>
      </defs>

      <polygon className="board-sea" points={hexPoints(0, 0, 238)} fill="url(#board-sea)" />
      <polygon className="board-coast" points={hexPoints(0, 0, 222)} />

      {/* Harbors: a pier from the coast edge to a small token offshore. */}
      {m.harbors.map((hb, i) => {
        const e = BOARD.edges[hb.edge]!;
        const a = BOARD.vertices[e.a]!;
        const b = BOARD.vertices[e.b]!;
        const mx = ((a.x + b.x) / 2) * S;
        const my = ((a.y + b.y) / 2) * S;
        const len = Math.hypot(mx, my) || 1;
        const hx = mx + (mx / len) * 26;
        const hy = my + (my / len) * 26;
        const res = hb.kind === 'any' ? null : RESOURCE_INFO[hb.kind as Resource];
        return (
          <g key={i} className="harbor">
            <line x1={a.x * S} y1={a.y * S} x2={hx} y2={hy} />
            <line x1={b.x * S} y1={b.y * S} x2={hx} y2={hy} />
            <circle cx={hx} cy={hy} r={13} />
            <text x={hx} y={hy + (res ? -1 : 4)} textAnchor="middle" fontSize={res ? 11 : 10}>
              {res ? res.icon : '3:1'}
            </text>
            {res && (
              <text x={hx} y={hy + 10} textAnchor="middle" fontSize={7} className="harbor-rate">
                2:1
              </text>
            )}
          </g>
        );
      })}

      {BOARD.hexes.map((h, hi) => {
        const terrain = m.terrain[hi] ?? 'desert';
        const n = m.numbers[hi];
        const cx = h.x * S;
        const cy = h.y * S;
        const hot = n === 6 || n === 8;
        const active = lastSum !== null && n === lastSum && m.robber !== hi;
        const clickable = mode === 'robber' && hi !== m.robber;
        return (
          <g
            key={hi}
            className={`hex ${active ? 'hex-active' : ''} ${clickable ? 'hex-target' : ''}`}
            onClick={clickable ? () => onHex(hi) : undefined}
          >
            <polygon points={hexPoints(cx, cy, S - 2)} fill={`url(#terrain-${terrain})`} />
            <text x={cx} y={cy - 22} textAnchor="middle" fontSize={15} className="hex-icon">
              {terrain === 'desert' ? '🏜️' : RESOURCE_INFO[terrain as Resource].icon}
            </text>
            {n != null && (
              <g filter="url(#token-shadow)">
                <circle cx={cx} cy={cy + 4} r={15} className="token" />
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  fontSize={hot ? 15 : 13}
                  className={`token-num ${hot ? 'hot' : ''}`}
                >
                  {n}
                </text>
                <text
                  x={cx}
                  y={cy + 16}
                  textAnchor="middle"
                  fontSize={6}
                  className={`token-pips ${hot ? 'hot' : ''}`}
                >
                  {'•'.repeat(pips(n))}
                </text>
              </g>
            )}
            {m.robber === hi && (
              <g
                className="robber"
                transform={`translate(${cx + (n == null ? 0 : 20)}, ${cy + 2})`}
              >
                <ellipse cx={0} cy={12} rx={9} ry={3.5} />
                <path d="M-7,12 Q-8,-2 0,-4 Q8,-2 7,12 Z" />
                <circle cx={0} cy={-8} r={6} />
              </g>
            )}
          </g>
        );
      })}

      {/* Roads */}
      {m.players.map((p, pi) =>
        p.roads.map((e) => {
          const edge = BOARD.edges[e]!;
          const a = BOARD.vertices[edge.a]!;
          const b = BOARD.vertices[edge.b]!;
          return (
            <g key={`${pi}-${e}`} className="road">
              <line x1={a.x * S} y1={a.y * S} x2={b.x * S} y2={b.y * S} className="road-outline" />
              <line
                x1={a.x * S}
                y1={a.y * S}
                x2={b.x * S}
                y2={b.y * S}
                stroke={playerColor(p.persona)}
                className="road-fill"
              />
            </g>
          );
        }),
      )}

      {edgeMode &&
        [...targets].map((e) => {
          const edge = BOARD.edges[e]!;
          const a = BOARD.vertices[edge.a]!;
          const b = BOARD.vertices[edge.b]!;
          return (
            <g key={`t-${e}`} className="edge-target" onClick={() => onEdge(e)}>
              <line x1={a.x * S} y1={a.y * S} x2={b.x * S} y2={b.y * S} className="edge-hit" />
              <line x1={a.x * S} y1={a.y * S} x2={b.x * S} y2={b.y * S} className="edge-glow" />
            </g>
          );
        })}

      {/* Settlements & cities */}
      {BOARD.vertices.map((v) => {
        const owner = vertexOwner(m, v.id);
        const pending = mode === 'setupRoad' && selected === v.id;
        if (owner === null && !pending) return null;
        const p = m.players[owner ?? 0]!;
        const city = owner !== null && p.cities.includes(v.id);
        const goods = m.buildings[v.id] ?? [];
        return (
          <g
            key={`b-${v.id}`}
            className={`piece ${pending ? 'pending' : ''} ${selected === v.id ? 'selected' : ''}`}
            transform={`translate(${v.x * S}, ${v.y * S})`}
          >
            <path d={city ? CITY : HOUSE} fill={playerColor(p.persona)} />
            {goods.length > 0 && (
              <g className="piece-goods">
                <circle cx={11} cy={-11} r={7} />
                <text x={11} y={-8} textAnchor="middle" fontSize={8}>
                  {goods.length}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {vertexMode &&
        [...targets].map((vid) => {
          const v = BOARD.vertices[vid]!;
          return (
            <g
              key={`vt-${vid}`}
              className={`vertex-target ${selected === vid ? 'selected' : ''}`}
              onClick={() => onVertex(vid)}
            >
              <circle cx={v.x * S} cy={v.y * S} r={16} className="vertex-hit" />
              <circle cx={v.x * S} cy={v.y * S} r={7} className="vertex-glow" />
            </g>
          );
        })}
    </svg>
  );
}

export const HexBoard = memo(HexBoardImpl);
