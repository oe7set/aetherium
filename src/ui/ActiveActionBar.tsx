import { useCallback } from 'react';
import { getAction, getSkill } from '../data';
import { actionDuration, formatSeconds } from '../engine';
import { t } from '../i18n';
import { useGame } from '../store/gameStore';
import { LiveProgressBar } from './ProgressBar';
import { Popups } from './Popups';

/** Interpolated progress of the active action, read every animation frame. */
function readActiveProgress(): number {
  const { game, lastTickAt } = useGame.getState();
  if (!game.active) return 0;
  const def = getAction(game.active.actionId);
  const duration = actionDuration(game, def);
  const sinceTick = (performance.now() - lastTickAt) / 1000;
  const stalled = def.requiresFire && game.fire <= 0;
  return (game.active.progress + (stalled ? 0 : Math.min(sinceTick, 0.25))) / duration;
}

export function ActiveActionBar() {
  const activeId = useGame((s) => s.game.active?.actionId ?? null);
  const duration = useGame((s) =>
    s.game.active ? actionDuration(s.game, getAction(s.game.active.actionId)) : 0,
  );
  const click = useGame((s) => s.click);
  const stop = useGame((s) => s.stop);
  const read = useCallback(() => readActiveProgress(), []);

  if (!activeId) {
    return (
      <div className="active-bar idle">
        <Popups />
        <span className="active-icon">🧍</span>
        <span className="active-text">{t('action.idle')}</span>
      </div>
    );
  }

  const def = getAction(activeId);
  const skill = getSkill(def.skill);
  return (
    <div className="active-bar">
      <Popups />
      <button
        className="active-main"
        onClick={click}
        aria-label={`${def.name} – ${t('action.tapHint')}`}
      >
        <span className="active-icon pulse">{def.icon}</span>
        <span className="active-info">
          <span className="active-title">
            {def.name} <small>· {formatSeconds(duration)}</small>
          </span>
          <LiveProgressBar read={read} color={skill.color} />
          <small className="active-hint">👆 {t('action.tapHint')}</small>
        </span>
      </button>
      <button className="btn btn-stop" onClick={stop} aria-label={t('action.stop')}>
        ■
      </button>
    </div>
  );
}
