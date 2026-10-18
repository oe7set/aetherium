import { useState } from 'react';
import {
  CELEBRATIONS,
  CRANNY,
  MAIN_SPEED,
  SPEED,
  STORAGE,
  TROOPS,
  V_BUILDINGS,
  type VBuildingDef,
} from '../../data/village';
import {
  buildingCost,
  buildingLevel,
  buildingTime,
  canUpgradeBuilding,
  plannedLevel,
  population,
  requirementsMet,
  startCelebration,
  upgradeBuilding,
  V_BUILDING_MAP,
  type Village,
} from '../../engine';
import { t, type MessageKey } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { ResearchPanel, TrainPanel } from './MilitaryView';
import type { VillageSegment } from './VillagePanel';
import { CostView } from './CostView';
import { duration } from './vui';

/**
 * Free spots on the village square (away from building lots and the two roads), in a fixed
 * pseudo-random order. The first ones get cottages as the population grows, some get trees.
 */
const FREE_SPOTS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let x = 8; x <= 92; x += 7)
    for (let y = 8; y <= 92; y += 7) {
      if (Math.hypot(x - 50, y - 50) > 42) continue;
      if (Math.abs(x - 50) < 5 || Math.abs(y - 49) < 5) continue;
      if (V_BUILDINGS.some((b) => Math.hypot(b.pos[0] - x, b.pos[1] - y) < 11)) continue;
      out.push([x, y]);
    }
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
})();
const TREES = ['🌳', '🌲', '🌷', '🌳', '🌼', '🌲'];

function tierClass(level: number): string {
  return level >= 15 ? 'tier-aether' : level >= 10 ? 'tier-gold' : level >= 5 ? 'tier-silver' : '';
}

export function CenterView({
  village: v,
  onSegment,
}: {
  village: Village;
  onSegment: (s: VillageSegment) => void;
}) {
  const game = useGame.getState().game;
  const [selected, setSelected] = useState<string | null>(null);
  const wall = buildingLevel(v, 'wall');
  return (
    <div className="v-center-wrap">
      <div
        className={`v-center ${wall > 0 ? 'walled' : ''}`}
        style={{ '--wall': Math.min(1, wall / 20) } as React.CSSProperties}
      >
        <div className="v-center-ground" aria-hidden />
        <div className="v-center-plaza" aria-hidden />
        {FREE_SPOTS.map(([x, y], i) => {
          const cottages = Math.min(
            Math.floor(population(v) / 12),
            Math.floor(FREE_SPOTS.length * 0.6),
          );
          const tree = i >= FREE_SPOTS.length - 6;
          if (i >= cottages && !tree) return null;
          return (
            <span
              key={`d${i}`}
              className={`v-decor ${tree ? 'tree' : 'cottage'}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-hidden
            >
              {tree ? TREES[i % TREES.length] : i % 3 === 0 ? '🏡' : '🏠'}
            </span>
          );
        })}
        {V_BUILDINGS.map((b) => {
          const lvl = buildingLevel(v, b.id);
          const available = requirementsMet(v, b);
          const building = v.queue.center.some((q) => q.key === b.id);
          const ready = canUpgradeBuilding(game, v, b.id).ok;
          if (b.id === 'wall') return null;
          return (
            <button
              key={b.id}
              className={`v-bld ${lvl ? `built ${tierClass(lvl)}` : available ? 'site' : 'locked'} ${ready ? 'ready' : ''} ${selected === b.id ? 'selected' : ''} ${building ? 'building' : ''} ${b.id === 'main' ? 'main' : ''}`}
              style={{ left: `${b.pos[0]}%`, top: `${b.pos[1]}%` }}
              onClick={() => setSelected(selected === b.id ? null : b.id)}
              title={b.name}
            >
              <span className="v-bld-icon">
                {lvl || building ? b.icon : available ? '🏗️' : '🔒'}
              </span>
              {lvl > 0 && <span className="v-bld-level">{lvl}</span>}
              {lvl > 0 && <span className="v-bld-name">{b.name}</span>}
              {building && <span className="v-field-crane">⚒️</span>}
            </button>
          );
        })}
        <button
          className={`v-wall-btn ${selected === 'wall' ? 'selected' : ''}`}
          onClick={() => setSelected('wall')}
        >
          🧱 Mauer {wall}
        </button>
      </div>
      {selected ? (
        <BuildingDetail
          village={v}
          def={V_BUILDING_MAP.get(selected)!}
          onClose={() => setSelected(null)}
          onSegment={onSegment}
        />
      ) : (
        <p className="muted small center">
          Tippe auf ein Gebäude. 🏗️ = Bauplatz bereit, grün = jetzt ausbaubar, gedämpft =
          Voraussetzungen fehlen. Mit den Einwohnern wachsen auch die Wohnhäuser.
        </p>
      )}
    </div>
  );
}

function effectText(def: VBuildingDef, level: number): string {
  switch (def.effect) {
    case 'buildSpeed':
      return `Bauzeit ×${Math.pow(MAIN_SPEED, level).toFixed(2)}`;
    case 'storage':
      return `Lager: ${STORAGE[level] ?? 0} je Rohstoff`;
    case 'granary':
      return `Kornspeicher: ${STORAGE[level] ?? 0} Getreide`;
    case 'cranny':
      return `Versteckt ${CRANNY[level] ?? 0} je Rohstoff`;
    case 'wall':
      return `+${level * 3} % Verteidigung, Grundschutz ${Math.round(25 * Math.pow(level, 1.5))}`;
    case 'prodBonus':
      return `+${level * 5} % Produktion`;
    case 'smithy':
      return `+${(level * 1.5).toFixed(1)} % Angriff & Verteidigung`;
    case 'barracks':
    case 'stable':
      return `Ausbildung ×${Math.pow(0.94, Math.max(0, level - 1)).toFixed(2)}`;
    case 'rally':
      return `Truppentempo +${level * 5} %`;
    case 'library':
      return `+${level * 2} % Forschung auf der Insel`;
    case 'harbor':
      return `Inselkurs ×${(1 + 0.1 * Math.max(0, level - 1)).toFixed(1)}`;
    case 'market':
      return `${level} Händler (je 750)`;
    case 'residence':
      return `${Math.floor(level / 10)} Expansionsplätze`;
    default:
      return '';
  }
}

function BuildingDetail({
  village: v,
  def,
  onClose,
  onSegment,
}: {
  village: Village;
  def: VBuildingDef;
  onClose: () => void;
  onSegment: (s: VillageSegment) => void;
}) {
  const act = useGame((s) => s.village);
  const game = useGame.getState().game;
  const level = buildingLevel(v, def.id);
  const next = plannedLevel(v, 'center', def.id) + 1;
  const max = next > def.maxLevel;
  const check = canUpgradeBuilding(game, v, def.id);
  return (
    <div className="v-detail glass">
      <div className="v-detail-head">
        <span className="v-detail-icon">{def.icon}</span>
        <div>
          <strong>{def.name}</strong>{' '}
          <small className="muted">
            Stufe {level}/{def.maxLevel}
          </small>
          <br />
          <small>{def.desc}</small>
        </div>
        <button className="btn btn-ghost small" onClick={onClose}>
          ✕
        </button>
      </div>
      {level > 0 && (
        <p className="small v-effect">
          Aktuell: {effectText(def, level)}
          {!max && (
            <>
              {' '}
              · Stufe {next}: {effectText(def, next)}
            </>
          )}
        </p>
      )}
      {!requirementsMet(v, def) && (
        <p className="small v-req">
          Benötigt:{' '}
          {Object.entries(def.requires)
            .map(([k, lvl]) =>
              k.startsWith('field:')
                ? `${{ wood: 'Holzfäller', clay: 'Lehmgrube', iron: 'Eisenmine', crop: 'Getreidefarm' }[k.slice(6)]} ${lvl}`
                : `${V_BUILDING_MAP.get(k)?.name} ${lvl}`,
            )
            .join(', ')}
        </p>
      )}
      {!max && requirementsMet(v, def) && (
        <>
          <div className="v-detail-row">
            <span>{level ? `Ausbau auf Stufe ${next}` : 'Bauen'}:</span>
            <CostView cost={buildingCost(def.id, next)} village={v} />
            <span className="muted small">⏱ {duration(buildingTime(v, def.id, next))}</span>
          </div>
          <button
            className="btn btn-primary"
            disabled={!check.ok}
            onClick={() => act((s) => upgradeBuilding(s, v.id, def.id))}
          >
            {check.ok
              ? level
                ? `⬆️ Auf Stufe ${next} ausbauen`
                : `🏗️ ${def.name} bauen`
              : t(`villageFail.${check.reason}` as MessageKey)}
          </button>
        </>
      )}
      {max && <p className="small muted">Höchststufe erreicht.</p>}

      {/* Building-specific actions. */}
      {level > 0 && def.id === 'barracks' && <TrainPanel village={v} building="barracks" />}
      {level > 0 && def.id === 'stable' && <TrainPanel village={v} building="stable" />}
      {level >= 10 && def.id === 'residence' && <TrainPanel village={v} building="residence" />}
      {level > 0 && def.id === 'academy' && <ResearchPanel village={v} />}
      {level > 0 && def.id === 'townhall' && <Celebrations village={v} />}
      {level > 0 && (def.id === 'market' || def.id === 'harbor') && (
        <button className="btn" onClick={() => onSegment('market')}>
          ⚖️ Zum Markt
        </button>
      )}
      {level > 0 && def.id === 'rally' && (
        <button className="btn" onClick={() => onSegment('military')}>
          🗺️ Raubzüge planen
        </button>
      )}
      {def.id === 'residence' && level < 10 && level > 0 && (
        <p className="small muted">
          Ab Stufe 10: Siedler ({TROOPS.find((x) => x.id === 'settler')?.icon}) für neue Dörfer.
        </p>
      )}
    </div>
  );
}

function Celebrations({ village: v }: { village: Village }) {
  const act = useGame((s) => s.village);
  if (v.celebration)
    return (
      <p className="small">
        🎉 Fest läuft noch {duration(v.celebration.remaining)} (+{v.celebration.cp} Kulturpunkte)
      </p>
    );
  return (
    <div className="v-list">
      {CELEBRATIONS.map((c) => (
        <div key={c.id} className="v-list-row">
          <span>
            {c.icon} {c.name}{' '}
            <small className="muted">
              +{c.cp} KP · ⏱ {duration(c.time / SPEED)}
            </small>
          </span>
          <CostView cost={c.cost} village={v} />
          <button
            className="btn small"
            disabled={buildingLevel(v, 'townhall') < c.townhall}
            onClick={() => act((s) => startCelebration(s, v.id, c.id))}
          >
            {buildingLevel(v, 'townhall') < c.townhall ? `Rathaus ${c.townhall}` : 'Feiern'}
          </button>
        </div>
      ))}
    </div>
  );
}
