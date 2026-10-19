import { useState } from 'react';
import { ACTIONS, ELEMENTS, getSkill, type ElementDef } from '../../data';
import { ELEMENT_GROUP_OF } from '../../data/science';
import { elementGroupProgress, skillLevel } from '../../engine';
import { useGame } from '../../store/gameStore';
import { ProgressBar } from '../ProgressBar';

/**
 * Periodic table as a collection codex: elements are coloured by chemical group, every complete
 * group grants its own bonus, and each element shows where it can be found (with a jump there).
 */
export function CodexPanel() {
  const codex = useGame((s) => s.game.codex);
  const jump = useGame((s) => s.jumpToAction);
  const [selected, setSelected] = useState<ElementDef | null>(null);
  const [focusGroup, setFocusGroup] = useState<string | null>(null);
  const game = useGame.getState().game;
  const known = new Set(codex);
  const groups = elementGroupProgress(game);
  const doneGroups = groups.filter((g) => g.done).length;
  const sources = selected ? ACTIONS.filter((a) => a.elements?.includes(selected.symbol)) : [];
  const selGroup = selected ? ELEMENT_GROUP_OF.get(selected.symbol) : undefined;

  return (
    <div className="codex">
      <div className="codex-head">
        <span>
          ⚛️ <b>{codex.length}</b> / {ELEMENTS.length} Elemente · {doneGroups}/{groups.length}{' '}
          Gruppen
        </span>
        <ProgressBar fraction={codex.length / ELEMENTS.length} color="#4ad9b0" height={6} />
        <small className="muted">
          Jedes Element: +0,4 % Forschung, +0,1 % XP. Eine vollständige Gruppe gibt ihren eigenen
          Bonus, das ganze Periodensystem +10 % XP. Elemente findest du mit Analysen in der
          Alchemie.
        </small>
      </div>
      <div className="periodic-scroll">
        <div className="periodic">
          {ELEMENTS.map((el) => {
            const g = ELEMENT_GROUP_OF.get(el.symbol);
            const dim = focusGroup && g?.id !== focusGroup;
            return (
              <button
                key={el.symbol}
                className={`element ${known.has(el.symbol) ? 'known' : ''} ${selected?.symbol === el.symbol ? 'selected' : ''} ${dim ? 'dim' : ''}`}
                style={
                  {
                    gridRow: el.row,
                    gridColumn: el.col,
                    '--gc': g?.color ?? '#888',
                  } as React.CSSProperties
                }
                onClick={() => setSelected(el)}
                title={known.has(el.symbol) ? el.name : '???'}
              >
                <small>{el.z}</small>
                <b>{known.has(el.symbol) ? el.symbol : '?'}</b>
              </button>
            );
          })}
        </div>
      </div>
      {selected && (
        <div
          className="notice codex-detail"
          style={{ '--gc': selGroup?.color } as React.CSSProperties}
        >
          <b>
            {selected.z}.{' '}
            {known.has(selected.symbol)
              ? `${selected.name} (${selected.symbol})`
              : 'Unbekanntes Element'}
          </b>
          {selGroup && <small className="codex-group-tag">{selGroup.name}</small>}
          {sources.length ? (
            <div className="codex-sources">
              {sources.map((a) => {
                const ok = skillLevel(game, a.skill) >= a.levelReq;
                return (
                  <button
                    key={a.id}
                    className={`chip-btn ${ok ? '' : 'locked'}`}
                    onClick={() => jump(a.id)}
                  >
                    {a.icon} {a.name} · {getSkill(a.skill).name} Lv {a.levelReq} ↪
                  </button>
                );
              })}
            </div>
          ) : (
            <small className="muted">Quelle unbekannt.</small>
          )}
        </div>
      )}
      <h4 className="group-title">Elementgruppen</h4>
      <div className="codex-groups">
        {groups.map(({ group, found, done }) => (
          <button
            key={group.id}
            className={`codex-group ${done ? 'done' : ''} ${focusGroup === group.id ? 'active' : ''}`}
            style={{ '--gc': group.color } as React.CSSProperties}
            onClick={() => setFocusGroup(focusGroup === group.id ? null : group.id)}
          >
            <span className="codex-group-name">
              <i className="codex-dot" /> {group.name}
              <small>
                {found}/{group.symbols.length}
              </small>
            </span>
            <ProgressBar fraction={found / group.symbols.length} color={group.color} height={4} />
            <small className={done ? 'codex-bonus on' : 'codex-bonus'}>
              {done ? '✔ ' : '🔒 '}
              {group.bonus}
            </small>
          </button>
        ))}
      </div>
    </div>
  );
}
