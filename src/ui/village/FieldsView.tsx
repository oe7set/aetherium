import { useState } from 'react';
import { FIELD_PROD, PROD_SPEED, V_RES_INFO } from '../../data/village';
import {
  bestFieldToUpgrade,
  canUpgradeField,
  fieldCost,
  fieldMax,
  fieldTime,
  fieldType,
  plannedLevel,
  upgradeField,
  type Village,
} from '../../engine';
import { t, type MessageKey } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { TouchCard } from '../TouchCard';
import { AffordHint, CostView } from './CostView';
import { duration } from './vui';

/** Ring positions for the 18 fields (inner ring 7, outer ring 11), in percent. */
const POSITIONS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    out.push([50 + Math.cos(a) * 26, 50 + Math.sin(a) * 26]);
  }
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 - Math.PI / 2 + 0.29;
    out.push([50 + Math.cos(a) * 42, 50 + Math.sin(a) * 42]);
  }
  return out;
})();

export function FieldsView({ village: v, onCenter }: { village: Village; onCenter: () => void }) {
  const game = useGame.getState().game;
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="v-fields-wrap">
      <div className="v-fields">
        <div className="v-fields-ground" aria-hidden />
        <button className="v-fields-village" onClick={onCenter} title="Zum Dorfzentrum">
          <span>🏘️</span>
          <small>{v.name}</small>
        </button>
        {v.fields.map((lvl, i) => {
          const res = fieldType(v, i);
          const [x, y] = POSITIONS[i]!;
          const building = v.queue.field.find((q) => q.key === String(i));
          const ready = canUpgradeField(game, v, i).ok;
          return (
            <button
              key={i}
              className={`v-field res-${res} ${selected === i ? 'selected' : ''} ${ready ? 'ready' : ''} ${building ? 'building' : ''}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              data-touch-keep
              onClick={() => setSelected(i === selected ? null : i)}
              aria-label={`${V_RES_INFO[res].field} Stufe ${lvl}`}
            >
              <span className="v-field-icon">{V_RES_INFO[res].fieldIcon}</span>
              <span className="v-field-level">{lvl}</span>
              {building && <span className="v-field-crane">🏗️</span>}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <FieldDetail village={v} index={selected} onClose={() => setSelected(null)} />
      )}
      <QuickUpgrade village={v} />
      <p className="muted small center">
        Tippe auf ein Feld zum Ausbauen. Leuchtende Felder kannst du sofort ausbauen. Getreide
        versorgt Einwohner und Truppen.
      </p>
    </div>
  );
}

/** One tap: upgrade the lowest field (the resource with least income first). */
function QuickUpgrade({ village: v }: { village: Village }) {
  const act = useGame((s) => s.village);
  const best = bestFieldToUpgrade(useGame.getState().game, v);
  if (best < 0) return null;
  const res = fieldType(v, best);
  return (
    <button
      className="btn btn-primary btn-wide"
      onClick={() => act((s) => upgradeField(s, v.id, best))}
    >
      ⬆️ Bestes Feld ausbauen: {V_RES_INFO[res].fieldIcon} {V_RES_INFO[res].field}{' '}
      {plannedLevel(v, 'field', String(best)) + 1}
    </button>
  );
}

function FieldDetail({
  village: v,
  index,
  onClose,
}: {
  village: Village;
  index: number;
  onClose: () => void;
}) {
  const act = useGame((s) => s.village);
  const game = useGame.getState().game;
  const res = fieldType(v, index);
  const level = v.fields[index] ?? 0;
  const next = plannedLevel(v, 'field', String(index)) + 1;
  const max = next > fieldMax(v);
  const check = canUpgradeField(game, v, index);
  const prodNow = (FIELD_PROD[level] ?? 0) * PROD_SPEED;
  const prodNext = (FIELD_PROD[Math.min(FIELD_PROD.length - 1, next)] ?? 0) * PROD_SPEED;
  return (
    <TouchCard onClose={onClose} className="v-detail">
      <div className="v-detail-head">
        <span className="v-detail-icon">{V_RES_INFO[res].fieldIcon}</span>
        <div>
          <strong>{V_RES_INFO[res].field}</strong> <small className="muted">Stufe {level}</small>
          <br />
          <small>
            Produktion: {prodNow}/h{' '}
            {!max && (
              <>
                → <b>{prodNext}/h</b>
              </>
            )}{' '}
            {V_RES_INFO[res].icon}
          </small>
        </div>
        <button className="btn btn-ghost small" onClick={onClose}>
          ✕
        </button>
      </div>
      {max ? (
        <p className="small muted">
          Höchststufe erreicht{v.capital ? '' : ' (Hauptdorf: bis Stufe 15)'}.
        </p>
      ) : (
        <>
          <div className="v-detail-row">
            <span>Ausbau auf Stufe {next}:</span>
            <CostView cost={fieldCost(v, index, next)} village={v} />
            <span className="muted small">⏱ {duration(fieldTime(v, index, next))}</span>
          </div>
          <AffordHint cost={fieldCost(v, index, next)} village={v} />
          <button
            className="btn btn-primary"
            disabled={!check.ok}
            onClick={() => act((s) => upgradeField(s, v.id, index))}
          >
            {check.ok
              ? `⬆️ Auf Stufe ${next} ausbauen`
              : t(`villageFail.${check.reason}` as MessageKey)}
          </button>
        </>
      )}
    </TouchCard>
  );
}
