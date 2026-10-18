import { useState } from 'react';
import { ACTIONS, ELEMENTS, type ElementDef } from '../../data';
import { useGame } from '../../store/gameStore';

/** Periodic table as a collection codex. Unknown elements show where they can be found. */
export function CodexPanel() {
  const codex = useGame((s) => s.game.codex);
  const [selected, setSelected] = useState<ElementDef | null>(null);
  const known = new Set(codex);
  const source = selected ? ACTIONS.find((a) => a.elements?.includes(selected.symbol)) : undefined;

  return (
    <div className="codex">
      <p>
        ⚛️ <b>{codex.length}</b> / {ELEMENTS.length} Elemente entdeckt · jedes gibt +0,4 % Forschung
        und +0,1 % XP
      </p>
      <p className="muted small">
        Elemente entdeckst du mit Analysen in der Alchemie. Tippe ein Feld an, um die Quelle zu
        sehen.
      </p>
      <div className="periodic-scroll">
        <div className="periodic">
          {ELEMENTS.map((el) => (
            <button
              key={el.symbol}
              className={`element ${known.has(el.symbol) ? 'known' : ''} ${selected?.symbol === el.symbol ? 'selected' : ''}`}
              style={{ gridRow: el.row, gridColumn: el.col }}
              onClick={() => setSelected(el)}
              title={known.has(el.symbol) ? el.name : '???'}
            >
              <small>{el.z}</small>
              <b>{known.has(el.symbol) ? el.symbol : '?'}</b>
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <div className="notice">
          <b>
            {selected.z}.{' '}
            {known.has(selected.symbol)
              ? `${selected.name} (${selected.symbol})`
              : 'Unbekanntes Element'}
          </b>
          <br />
          <small className="muted">
            {source
              ? `Quelle: ${source.name} (Alchemie Lvl ${source.levelReq})`
              : 'Quelle unbekannt.'}
          </small>
        </div>
      )}
    </div>
  );
}
