import { V_BUILDINGS, V_RES_INFO, V_RESOURCES } from '../../data/village';
import {
  activeVillage,
  capFor,
  cpPerHour,
  fieldType,
  instantCost,
  instantFinish,
  netCrop,
  population,
  production,
  cancelQueue,
  type Village,
} from '../../engine';
import { useGame } from '../../store/gameStore';
import { CenterView } from './CenterView';
import { EmpireView } from './EmpireView';
import { FieldsView } from './FieldsView';
import { MarketView } from './MarketView';
import { MilitaryView } from './MilitaryView';
import { ReportsView } from './ReportsView';
import { WorldMap } from './WorldMap';
import { duration, short, villageKey } from './vui';
import './village.css';

export type VillageSegment =
  'fields' | 'center' | 'map' | 'military' | 'market' | 'reports' | 'empire';

const SEGMENTS: [VillageSegment, string][] = [
  ['fields', '🌾 Felder'],
  ['center', '🏘️ Dorf'],
  ['map', '🗺️ Karte'],
  ['military', '⚔️ Militär'],
  ['market', '⚖️ Markt'],
  ['reports', '📜 Berichte'],
  ['empire', '👑 Reich'],
];

export function VillagePanel() {
  useGame((s) => villageKey(s.game));
  const game = useGame.getState().game;
  const act = useGame((s) => s.village);
  const seg = useGame((s) => s.ui.villageSegment);
  const setUi = useGame((s) => s.setUi);
  const setSeg = (villageSegment: VillageSegment) => setUi({ villageSegment });
  const v = activeVillage(game);
  const unread = game.village.unread;
  return (
    <div className="panel village">
      {game.village.villages.length > 1 && (
        <div className="village-switch">
          {game.village.villages.map((x) => (
            <button
              key={x.id}
              className={`chip ${x.id === v.id ? 'active' : ''}`}
              onClick={() =>
                act((s) => {
                  s.village.active = x.id;
                })
              }
            >
              {x.capital ? '👑' : '🏡'} {x.name}
            </button>
          ))}
        </div>
      )}
      <ResourceBar village={v} />
      <div className="segments v-segments" role="tablist">
        {SEGMENTS.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={seg === k}
            className={`segment ${seg === k ? 'active' : ''}`}
            onClick={() => {
              setSeg(k);
              if (k === 'reports')
                act((s) => {
                  s.village.unread = 0;
                });
            }}
          >
            {label}
            {k === 'reports' && unread > 0 && <span className="v-badge">{unread}</span>}
          </button>
        ))}
      </div>
      {seg !== 'map' && <BuildQueue village={v} compact={seg !== 'fields' && seg !== 'center'} />}
      {seg === 'fields' && <FieldsView village={v} onCenter={() => setSeg('center')} />}
      {seg === 'center' && <CenterView village={v} onSegment={setSeg} />}
      {seg === 'map' && <WorldMap village={v} />}
      {seg === 'military' && <MilitaryView village={v} />}
      {seg === 'market' && <MarketView village={v} />}
      {seg === 'reports' && <ReportsView />}
      {seg === 'empire' && <EmpireView village={v} />}
    </div>
  );
}

function ResourceBar({ village: v }: { village: Village }) {
  const game = useGame.getState().game;
  const prod = production(game, v);
  const net = netCrop(game, v);
  return (
    <div className="v-resbar">
      {V_RESOURCES.map((r) => {
        const cap = capFor(v, r);
        const fill = Math.min(1, v.res[r] / cap);
        const rate = r === 'crop' ? net : prod[r];
        return (
          <div
            key={r}
            className={`v-res ${fill >= 0.98 ? 'full' : ''}`}
            title={`${V_RES_INFO[r].name}: ${Math.floor(v.res[r])} / ${cap}`}
          >
            <span className="v-res-icon">{V_RES_INFO[r].icon}</span>
            <span className="v-res-num">
              <strong>{short(v.res[r])}</strong>
              <small className={rate < 0 ? 'neg' : ''}>
                {rate < 0 ? '−' : '+'}
                {short(Math.abs(rate))}/h
              </small>
            </span>
            <span className="v-res-bar">
              <i style={{ width: `${fill * 100}%`, background: V_RES_INFO[r].color }} />
            </span>
          </div>
        );
      })}
      <div className="v-res v-meta" title="Einwohner · Kulturpunkte">
        <span className="v-res-icon">👥</span>
        <span className="v-res-num">
          <strong>{population(v)}</strong>
          <small>
            🎭 {short(game.village.cp)} (+{short(cpPerHour(game))}/h)
          </small>
        </span>
      </div>
    </div>
  );
}

function BuildQueue({ village: v, compact }: { village: Village; compact: boolean }) {
  const act = useGame((s) => s.village);
  const game = useGame.getState().game;
  const lanes = (['field', 'center'] as const).filter((l) => v.queue[l].length);
  if (!lanes.length && compact) return null;
  if (!lanes.length)
    return (
      <div className="v-queue idle">
        🧑‍🔧 Die Baumeister drehen Däumchen – tippe ein Feld oder Gebäude an.
      </div>
    );
  return (
    <div className="v-queue">
      {lanes.map((lane) =>
        v.queue[lane].map((q, i) => {
          const name =
            lane === 'field'
              ? V_RES_INFO[fieldType(v, Number(q.key))].field
              : (V_BUILDINGS.find((b) => b.id === q.key)?.name ?? q.key);
          const running = i === 0;
          const cost = instantCost(q);
          return (
            <div key={`${lane}${i}`} className={`v-queue-row ${running ? '' : 'waiting'}`}>
              <span className="v-queue-icon">{lane === 'field' ? '🌾' : '🏗️'}</span>
              <span className="v-queue-name">
                {name} <small>Stufe {q.level}</small>
              </span>
              {running ? (
                <>
                  <span className="v-queue-bar">
                    <i style={{ width: `${(1 - q.remaining / q.total) * 100}%` }} />
                  </span>
                  <span className="v-queue-time">{duration(q.remaining)}</span>
                  <button
                    className="btn small"
                    disabled={game.gold.lt(cost)}
                    title="Mit Inselgold sofort fertigstellen"
                    onClick={() => act((s, emit) => instantFinish(s, v.id, lane, emit))}
                  >
                    ⚡ {short(cost)} 🪙
                  </button>
                </>
              ) : (
                <>
                  <span className="v-queue-time muted">wartet</span>
                  <button
                    className="btn btn-ghost small"
                    onClick={() => act((s) => cancelQueue(s, v.id, lane))}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          );
        }),
      )}
    </div>
  );
}
