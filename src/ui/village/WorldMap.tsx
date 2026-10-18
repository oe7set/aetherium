import { useEffect, useRef, useState } from 'react';
import { VALLEYS, V_RES_INFO } from '../../data/village';
import { BIOMES } from '../../data/rift';
import {
  adventureDistance,
  autoChance,
  canFound,
  canStartAdventure,
  distance,
  foundVillage,
  heroTravelTime,
  moveHeroHome,
  population,
  startAdventure,
  type Village,
} from '../../engine';
import { t, type MessageKey } from '../../i18n';
import { useGame } from '../../store/gameStore';
import {
  renderMap,
  screenToTile,
  terrainAt,
  TERRAIN_NAMES,
  WORLD_R,
  type MapView,
} from './mapRender';
import { RaidForm } from './MilitaryView';
import { duration } from './vui';

const BASE_TILE = 46;

export function WorldMap({ village: v }: { village: Village }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cam = useRef({ x: v.x, y: v.y, zoom: 0.8 });
  const pointers = useRef(new Map<number, { x: number; y: number; sx: number; sy: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const [selected, setSelected] = useState<[number, number] | null>([v.x, v.y]);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // Render loop (≈30 fps is plenty for a map; saves battery on phones).
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // Eco: 15 fps is plenty for marching dots; smooth: 30 fps.
      if (now - last < (document.documentElement.classList.contains('perf-eco') ? 66 : 33)) return;
      last = now;
      const rect = wrapRef.current!.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      const c = cam.current;
      const view: MapView = {
        width: w,
        height: h,
        dpr,
        cx: c.x,
        cy: c.y,
        tile: BASE_TILE * c.zoom,
      };
      renderMap(ctx, useGame.getState().game, view, now / 1000, selectedRef.current);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const clampCam = () => {
    const c = cam.current;
    c.x = Math.max(-WORLD_R, Math.min(WORLD_R, c.x));
    c.y = Math.max(-WORLD_R, Math.min(WORLD_R, c.y));
    c.zoom = Math.max(0.5, Math.min(2, c.zoom));
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), zoom: cam.current.zoom };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const p = pointers.current.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      cam.current.zoom =
        pinch.current.zoom * (Math.hypot(a!.x - b!.x, a!.y - b!.y) / pinch.current.dist);
    } else {
      const tile = BASE_TILE * cam.current.zoom;
      cam.current.x -= dx / tile;
      cam.current.y -= dy / tile;
    }
    clampCam();
  };
  const onUp = (e: React.PointerEvent) => {
    const p = pointers.current.get(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (!p || Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 8) return;
    const rect = wrapRef.current!.getBoundingClientRect();
    const c = cam.current;
    const view: MapView = {
      width: rect.width,
      height: rect.height,
      dpr: 1,
      cx: c.x,
      cy: c.y,
      tile: BASE_TILE * c.zoom,
    };
    const [tx, ty] = screenToTile(view, e.clientX - rect.left, e.clientY - rect.top);
    if (Math.abs(tx) <= WORLD_R && Math.abs(ty) <= WORLD_R) setSelected([tx, ty]);
  };
  const zoom = (f: number) => {
    cam.current.zoom *= f;
    clampCam();
  };

  return (
    <div className="v-map-wrap">
      <div
        ref={wrapRef}
        className="v-map"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={(e) => zoom(e.deltaY < 0 ? 1.1 : 0.9)}
      >
        <canvas ref={canvasRef} className="v-map-canvas" />
        <div className="v-map-tools">
          <button onClick={() => zoom(1.25)} aria-label="Hineinzoomen">
            ＋
          </button>
          <button onClick={() => zoom(0.8)} aria-label="Herauszoomen">
            －
          </button>
          <button
            onClick={() => {
              cam.current = { ...cam.current, x: v.x, y: v.y };
              setSelected([v.x, v.y]);
            }}
            aria-label="Zum Dorf"
          >
            🏠
          </button>
        </div>
        <div className="v-map-legend">
          🏰 Dorf · ⛺ Lager · 🏝️ Oase · 🌀 Ruine · 🏞️ Tal · ❗ Abenteuer
        </div>
      </div>
      {selected && <TileInfo village={v} x={selected[0]} y={selected[1]} />}
    </div>
  );
}

function TileInfo({ village: v, x, y }: { village: Village; x: number; y: number }) {
  useGame(
    (s) =>
      `${s.game.hero.status}|${s.game.hero.adventures.length}|${s.game.village.movements.length}|${s.game.village.villages.length}`,
  );
  const act = useGame((s) => s.village);
  const heroAct = useGame((s) => s.hero);
  const game = useGame.getState().game;
  const vs = game.village;
  const village = vs.villages.find((x2) => x2.x === x && x2.y === y);
  const target = vs.targets.find((t2) => t2.x === x && t2.y === y);
  const site = vs.sites.find((s2) => s2.x === x && s2.y === y);
  const adv = game.hero.adventures.find((a) => a.x === x && a.y === y);
  const dist = distance(v.x, v.y, x, y);
  const head = (icon: string, title: string, sub: string) => (
    <div className="v-detail-head">
      <span className="v-detail-icon">{icon}</span>
      <div>
        <strong>{title}</strong>
        <br />
        <small className="muted">{sub}</small>
      </div>
    </div>
  );
  const coords = `(${x}|${y}) · ${dist.toFixed(1)} Felder von ${v.name}`;
  if (village)
    return (
      <div className="v-detail glass">
        {head(village.capital ? '🏰' : '🏡', village.name, `${coords} · 👥 ${population(village)}`)}
        <div className="row gap">
          {village.id !== vs.active && (
            <button
              className="btn"
              onClick={() =>
                act((s) => {
                  s.village.active = village.id;
                })
              }
            >
              Auswählen
            </button>
          )}
          {game.hero.home !== village.id && (
            <button className="btn" onClick={() => heroAct((s) => moveHeroHome(s, village.id))}>
              {game.hero.avatar} Held hierher verlegen
            </button>
          )}
        </div>
      </div>
    );
  if (adv) {
    const check = canStartAdventure(game, adv.id);
    const biome = BIOMES.find((b) => b.id === adv.biome)!;
    return (
      <div className="v-detail glass">
        {head(
          adv.hard ? '💀' : '❗',
          `Abenteuer: ${adv.name}`,
          `${coords} · ${biome.icon} ${biome.name} · Stufe ${adv.level}${adv.hard ? ' · schwer' : ''}`,
        )}
        <p className="small">
          Erfolgschance automatisch: <b>{Math.round(autoChance(game, adv) * 100)} %</b> · Weg{' '}
          {duration(heroTravelTime(game, adventureDistance(game, adv)))} · verschwindet in{' '}
          {duration(adv.expires)}. Live als Echtzeit-Dungeon gibt es bessere Beute.
        </p>
        <button
          className="btn btn-primary"
          disabled={!check.ok}
          onClick={() => heroAct((s) => startAdventure(s, adv.id))}
        >
          {check.ok
            ? `${game.hero.avatar} Held losschicken`
            : t(`heroFail.${check.reason}` as MessageKey)}
        </button>
      </div>
    );
  }
  if (target)
    return (
      <div className="v-detail glass">
        {head(
          target.icon,
          `${target.name} · Stufe ${target.level}`,
          `${coords} · 🛡️ ${Math.round(target.defense)}/${target.maxDefense}${target.bonus ? ` · +25 % ${V_RES_INFO[target.bonus].name}` : ''}`,
        )}
        {target.owner === null ? (
          <RaidForm village={v} target={target} />
        ) : (
          <p className="small">
            🚩 Annektiert von {vs.villages.find((x2) => x2.id === target.owner)?.name}.
          </p>
        )}
      </div>
    );
  if (site) {
    const check = canFound(game, v, site.id);
    return (
      <div className="v-detail glass">
        {head('🏞️', `Freies Tal ${VALLEYS[site.layout]?.name}`, coords)}
        <button
          className="btn btn-primary"
          disabled={!check.ok}
          onClick={() => act((s) => foundVillage(s, v.id, site.id))}
        >
          {check.ok ? '🧳 Siedler schicken' : t(`villageFail.${check.reason}` as MessageKey)}
        </button>
      </div>
    );
  }
  return <div className="v-detail glass">{head('🗺️', TERRAIN_NAMES[terrainAt(x, y)], coords)}</div>;
}
