import { useEffect, useState } from 'react';
import {
  agenda,
  collectionsClaimable,
  passClaimable,
  taskProgress,
  type AgendaItem,
} from '../engine';
import { useGame } from '../store/gameStore';
import { goToAgenda } from './agendaNav';

/** The list itself – used in the overlay and at the top of the Reichsbuch. */
export function AgendaList({ onGo, limit }: { onGo?: () => void; limit?: number }) {
  const [items, setItems] = useState<AgendaItem[]>(() =>
    agenda(useGame.getState().game, Date.now()),
  );
  useEffect(() => {
    const id = window.setInterval(
      () => setItems(agenda(useGame.getState().game, Date.now())),
      1500,
    );
    return () => window.clearInterval(id);
  }, []);
  const shown = limit ? items.slice(0, limit) : items;
  if (!items.length)
    return (
      <p className="agenda-empty">
        ✨ Alles erledigt! Dein Reich läuft wie ein Uhrwerk. Zeit für einen Tee – oder einen Riss.
      </p>
    );
  return (
    <ul className="agenda-list">
      {shown.map((it) => (
        <li key={it.id}>
          <button
            className={`agenda-item ${it.kind}`}
            onClick={() => {
              onGo?.();
              goToAgenda(it.target);
            }}
          >
            <span className="agenda-icon">{it.icon}</span>
            <span className="agenda-text">
              <strong>{it.title}</strong>
              <small>{it.detail}</small>
            </span>
            <span className="agenda-go">{it.kind === 'reward' ? 'Holen ›' : 'Los ›'}</span>
          </button>
        </li>
      ))}
      {limit && items.length > limit && (
        <li>
          <button
            className="agenda-more"
            onClick={() => useGame.getState().setUi({ agenda: true })}
          >
            … und {items.length - limit} weitere ansehen ›
          </button>
        </li>
      )}
    </ul>
  );
}

/** One tap for every waiting Ruhmesleiter tier, Sammelbuch set and finished task. */
function ClaimAll() {
  const count = useGame(
    (s) =>
      passClaimable(s.game).length +
      collectionsClaimable(s.game).length +
      s.game.tasks.list.filter((tk) => !tk.claimed && taskProgress(s.game, tk) >= tk.target).length,
  );
  const claimAll = useGame((s) => s.claimAllRewards);
  if (count < 2) return null;
  return (
    <button className="btn btn-gold btn-wide claim-all" onClick={claimAll}>
      🎁 Alle {count} Belohnungen abholen
    </button>
  );
}

/** "Was jetzt?" overlay. */
export function AgendaPanel() {
  const open = useGame((s) => s.ui.agenda);
  const setUi = useGame((s) => s.setUi);
  if (!open) return null;
  const close = () => setUi({ agenda: false });
  return (
    <div className="qnav-overlay" onClick={close} role="dialog" aria-label="Was jetzt?">
      <div className="qnav agenda-box" onClick={(e) => e.stopPropagation()}>
        <header className="agenda-head">
          <div>
            <h3>📌 Was jetzt?</h3>
            <small className="muted">Alles, was in deinem Reich gerade auf dich wartet</small>
          </div>
          <button className="sheet-close" onClick={close} aria-label="Schließen">
            ✕
          </button>
        </header>
        <ClaimAll />
        <div className="qnav-body">
          <AgendaList onGo={close} />
        </div>
      </div>
    </div>
  );
}
