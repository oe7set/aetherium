import { EMPIRE_RANK_MODS, EMPIRE_RANKS, EMPIRE_SOURCES } from '../../data/empire';
import { empireRankReached, empireScore, empireValues } from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { describeMods } from '../modText';
import { ProgressBar } from '../ProgressBar';

/** Reichsrang: current rank, progress to the next one, where the points come from. */
export function EmpireRankCard({ details = false }: { details?: boolean }) {
  const score = useGame((s) => empireScore(s.game));
  const claimed = useGame((s) => s.game.empireRank);
  const reached = useGame((s) => empireRankReached(s.game));
  const claim = useGame((s) => s.claimEmpireRank);
  const { int } = useFmt();
  const rank = EMPIRE_RANKS[claimed]!;
  const next = EMPIRE_RANKS[claimed + 1];
  const from = rank.score;
  const ready = reached > claimed;
  const values = details ? empireValues(useGame.getState().game) : {};
  return (
    <div className={`empire-rank glass ${ready ? 'ready' : ''}`}>
      <div className="empire-rank-head">
        <span className="empire-rank-icon">{rank.icon}</span>
        <div>
          <small className="muted">
            Reichsrang {claimed + 1}/{EMPIRE_RANKS.length}
          </small>
          <strong>{rank.name}</strong>
          <small>
            {int(score)} Reichspunkte
            {claimed > 0 &&
              ` · ${describeMods(Object.fromEntries(Object.entries(EMPIRE_RANK_MODS).map(([k, v]) => [k, v * claimed])))}`}
          </small>
        </div>
      </div>
      {next && (
        <>
          <ProgressBar
            fraction={Math.min(1, (score - from) / (next.score - from))}
            color="var(--gold)"
            height={8}
          />
          <small className="muted">
            Nächster Rang: {next.icon} {next.name} ab {int(next.score)} Punkten
          </small>
        </>
      )}
      {ready && next && (
        <button className="btn btn-primary btn-big" onClick={claim}>
          👑 Aufsteigen zu „{next.name}"!
        </button>
      )}
      {details && (
        <ul className="empire-sources">
          {EMPIRE_SOURCES.map((src) => {
            const v = values[src.key] ?? 0;
            return (
              <li key={src.key}>
                {src.icon} {src.label}: {int(v)}{' '}
                <small className="muted">→ {int(v * src.per)}</small>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
