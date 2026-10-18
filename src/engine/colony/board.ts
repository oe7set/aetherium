// Hex-board geometry for the colony: pointy-top hexes in axial coordinates, radius 2 (19 tiles).
// Corners and edges are derived once and shared by every match (only terrain/numbers differ).

export interface Hex {
  q: number;
  r: number;
  x: number;
  y: number;
}

export interface Vertex {
  id: number;
  x: number;
  y: number;
  hexes: number[];
  edges: number[];
  neighbors: number[];
}

export interface Edge {
  id: number;
  a: number;
  b: number;
  hexes: number[];
}

export interface BoardGeometry {
  hexes: Hex[];
  vertices: Vertex[];
  edges: Edge[];
  /** Edges on the coast (one adjacent hex), ordered clockwise. */
  coast: number[];
}

const SQRT3 = Math.sqrt(3);
export const BOARD_RADIUS = 2;

function build(): BoardGeometry {
  const hexes: Hex[] = [];
  for (let r = -BOARD_RADIUS; r <= BOARD_RADIUS; r++) {
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
      if (Math.abs(q + r) > BOARD_RADIUS) continue;
      hexes.push({ q, r, x: SQRT3 * (q + r / 2), y: 1.5 * r });
    }
  }
  const vertices: Vertex[] = [];
  const vertexKey = new Map<string, number>();
  const edges: Edge[] = [];
  const edgeKey = new Map<string, number>();

  const corner = (h: Hex, i: number) => {
    const a = ((60 * i - 30) * Math.PI) / 180;
    return { x: h.x + Math.cos(a), y: h.y + Math.sin(a) };
  };
  const vid = (x: number, y: number): number => {
    const key = `${Math.round(x * 1000)}:${Math.round(y * 1000)}`;
    let id = vertexKey.get(key);
    if (id === undefined) {
      id = vertices.length;
      vertexKey.set(key, id);
      vertices.push({ id, x, y, hexes: [], edges: [], neighbors: [] });
    }
    return id;
  };

  hexes.forEach((h, hi) => {
    const ids = Array.from({ length: 6 }, (_, i) => {
      const c = corner(h, i);
      return vid(c.x, c.y);
    });
    for (const v of ids) vertices[v]!.hexes.push(hi);
    for (let i = 0; i < 6; i++) {
      const a = ids[i]!;
      const b = ids[(i + 1) % 6]!;
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      let eid = edgeKey.get(key);
      if (eid === undefined) {
        eid = edges.length;
        edgeKey.set(key, eid);
        edges.push({ id: eid, a: Math.min(a, b), b: Math.max(a, b), hexes: [] });
        vertices[a]!.edges.push(eid);
        vertices[b]!.edges.push(eid);
        vertices[a]!.neighbors.push(b);
        vertices[b]!.neighbors.push(a);
      }
      edges[eid]!.hexes.push(hi);
    }
  });

  const coast = edges
    .filter((e) => e.hexes.length === 1)
    .map((e) => {
      const va = vertices[e.a]!;
      const vb = vertices[e.b]!;
      return { id: e.id, angle: Math.atan2((va.y + vb.y) / 2, (va.x + vb.x) / 2) };
    })
    .sort((p, q) => p.angle - q.angle)
    .map((e) => e.id);

  return { hexes, vertices, edges, coast };
}

export const BOARD: BoardGeometry = build();

/** Hexes adjacent to each other (sharing an edge). */
export function hexNeighbors(hi: number): number[] {
  const h = BOARD.hexes[hi]!;
  const dirs = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
  ];
  return dirs
    .map(([dq, dr]) => BOARD.hexes.findIndex((o) => o.q === h.q + dq! && o.r === h.r + dr!))
    .filter((i) => i >= 0);
}
