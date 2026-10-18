import { actionsForSkill, getSkill } from '../data';
import { actionDuration, canPerform, skillLevel } from '../engine';
import { useGame } from '../store/gameStore';
import { TouchCard } from './TouchCard';

/** Tap on an island station: its best actions one tap away, plus the way into the full skill. */
export function StationCard() {
  const skill = useGame((s) => s.ui.stationCard);
  const setUi = useGame((s) => s.setUi);
  const start = useGame((s) => s.start);
  const stop = useGame((s) => s.stop);
  const openSkill = useGame((s) => s.openSkill);
  const running = useGame((s) => s.game.active?.actionId ?? null);
  if (!skill) return null;
  const game = useGame.getState().game;
  const def = getSkill(skill);
  const level = skillLevel(game, skill);
  const all = actionsForSkill(skill);
  const doable = all
    .filter((a) => canPerform(game, a).ok)
    .sort((a, b) => b.levelReq - a.levelReq)
    .slice(0, 4);
  const next = all.filter((a) => a.levelReq > level).sort((a, b) => a.levelReq - b.levelReq)[0];
  const blocked = all
    .filter((a) => a.levelReq <= level && !canPerform(game, a).ok)
    .sort((a, b) => b.levelReq - a.levelReq)[0];
  const close = () => setUi({ stationCard: null });
  return (
    <TouchCard onClose={close} className="station-card">
      <div className="station-head">
        <span className="station-icon">{def.icon}</span>
        <div>
          <strong>{def.name}</strong> <small className="muted">Level {level}</small>
          <br />
          <small className="muted">{def.desc}</small>
        </div>
      </div>
      {doable.length === 0 && (
        <p className="small muted">
          Gerade nichts machbar{blocked ? ` – für „${blocked.name}" fehlen Zutaten` : ''}.
        </p>
      )}
      <div className="station-actions">
        {doable.map((a, i) => {
          const isRunning = running === a.id;
          return (
            <button
              key={a.id}
              className={`station-action ${i === 0 ? 'best' : ''} ${isRunning ? 'running' : ''}`}
              onClick={() => {
                if (isRunning) stop();
                else start(a.id);
                close();
              }}
            >
              <span className="station-action-icon">{a.icon}</span>
              <span className="station-action-name">
                {a.name}
                <small>
                  Lv {a.levelReq} · {a.xp} XP · {actionDuration(game, a).toFixed(1)} s
                  {i === 0 ? ' · beste' : ''}
                </small>
              </span>
              <span className="station-action-go">{isRunning ? '⏹' : '▶'}</span>
            </button>
          );
        })}
      </div>
      {next && (
        <small className="muted">
          🔓 Nächstes: {next.icon} {next.name} ab Level {next.levelReq}
        </small>
      )}
      <button
        className="btn"
        onClick={() => {
          close();
          openSkill(skill);
        }}
      >
        📖 Alle {def.name}-Aktionen
      </button>
    </TouchCard>
  );
}
