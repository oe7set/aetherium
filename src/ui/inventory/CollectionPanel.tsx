import { COLLECTIONS } from '../../data/collections';
import { getItem } from '../../data';
import { useGame } from '../../store/gameStore';

/** Sammelbuch: every item ever found fills a slot; full sets give a permanent bonus. */
export function CollectionPanel() {
  const found = useGame((s) => s.game.progress.found);
  const sets = useGame((s) => s.game.progress.sets);
  const claim = useGame((s) => s.claimCollection);
  const have = new Set(found);
  const done = sets.length;
  return (
    <div className="album">
      <p className="muted small">
        Jeder Gegenstand zählt, sobald er einmal in deiner Tasche war – auch nach einer
        Wiedergeburt. Volle Sets bringen eine Belohnung und einen <b>dauerhaften Bonus</b>. {done}/
        {COLLECTIONS.length} Sets vollständig.
      </p>
      {COLLECTIONS.map((c) => {
        const got = c.items.filter((i) => have.has(i)).length;
        const complete = got >= c.items.length;
        const claimed = sets.includes(c.id);
        return (
          <section
            key={c.id}
            className={`album-set${claimed ? ' claimed' : complete ? ' ready' : ''}`}
          >
            <header className="album-head">
              <span className="album-icon">{c.icon}</span>
              <div className="album-title">
                <strong>{c.name}</strong>
                <small className="muted">{c.desc}</small>
              </div>
              <span className="album-count">
                {got}/{c.items.length}
              </span>
            </header>
            <div className="album-slots">
              {c.items.map((id) => {
                const def = getItem(id);
                const ok = have.has(id);
                return (
                  <span
                    key={id}
                    className={`album-slot${ok ? ' found' : ''}`}
                    title={ok ? def.name : '???'}
                  >
                    {ok ? def.icon : '?'}
                  </span>
                );
              })}
            </div>
            <div className="album-foot">
              <small>✨ {c.bonusText}</small>
              {claimed ? (
                <small className="album-done">✔ aktiv</small>
              ) : (
                <button
                  className="btn btn-primary album-btn"
                  disabled={!complete}
                  onClick={() => claim(c.id)}
                >
                  {complete ? 'Abschließen' : 'Unvollständig'}
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
