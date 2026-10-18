import { useMemo, useState } from 'react';
import { ACHIEVEMENTS } from '../../data';
import { conditionValue, sumMods } from '../../engine';
import { useGame } from '../../store/gameStore';
import { ProgressBar } from '../ProgressBar';
import { describeMods } from '../modText';

type Filter = 'open' | 'done' | 'all';

export function AchievementsPanel() {
  const unlocked = useGame((s) => s.game.achievements);
  const game = useGame((s) => s.game);
  const [filter, setFilter] = useState<Filter>('open');
  const set = useMemo(() => new Set(unlocked), [unlocked]);
  const total = useMemo(
    () => sumMods(unlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.reward ?? {})),
    [unlocked],
  );

  const list = ACHIEVEMENTS.filter((a) =>
    filter === 'all' ? true : filter === 'done' ? set.has(a.id) : !set.has(a.id),
  )
    .map((a) => ({ a, value: conditionValue(game, a.condition), done: set.has(a.id) }))
    .sort((x, y) =>
      filter === 'open' ? y.value / y.a.condition.gte - x.value / x.a.condition.gte : 0,
    );

  return (
    <div className="achievements">
      <p>
        🏆 <b>{unlocked.length}</b> / {ACHIEVEMENTS.length} freigeschaltet
      </p>
      {unlocked.length > 0 && <p className="muted small">Dauerhafte Boni: {describeMods(total)}</p>}
      <div className="chips-row">
        {(['open', 'done', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            className={`chip-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'open' ? 'Offen' : f === 'done' ? 'Geschafft' : 'Alle'}
          </button>
        ))}
      </div>
      <div className="achievement-list">
        {list.slice(0, 120).map(({ a, value, done }) => {
          const hidden = a.secret && !done;
          return (
            <div key={a.id} className={`achievement ${done ? 'done' : ''}`}>
              <span className="achievement-icon">{hidden ? '❓' : a.icon}</span>
              <span className="achievement-body">
                <strong>{hidden ? 'Geheimer Erfolg' : a.name}</strong>
                <small className="muted">
                  {hidden ? 'Wird verraten, sobald du ihn hast.' : a.desc}
                </small>
                {!done && !hidden && (
                  <ProgressBar
                    fraction={Math.min(1, value / a.condition.gte)}
                    height={4}
                    color="var(--gold)"
                  />
                )}
                <small className="reward">🎁 {describeMods(a.reward)}</small>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
