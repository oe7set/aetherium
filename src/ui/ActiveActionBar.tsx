import { useCallback } from 'react';
import { getAction, getMonster, getSkill } from '../data';
import { actionDuration, formatSeconds, maxHp } from '../engine';
import { t } from '../i18n';
import { useGame } from '../store/gameStore';
import { LiveProgressBar, ProgressBar } from './ProgressBar';
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

function CombatBar() {
  const combat = useGame((s) => s.game.combat);
  const hp = useGame((s) => Math.ceil(s.game.hp));
  const max = useGame((s) => maxHp(s.game));
  const flee = useGame((s) => s.flee);
  const openSkill = useGame((s) => s.openSkill);
  if (!combat) return null;
  const m = getMonster(combat.monster);
  return (
    <div className="active-bar">
      <Popups />
      <button
        className="active-main"
        onClick={() => openSkill('melee')}
        aria-label="Kampf anzeigen"
      >
        <span className="active-icon pulse">{m.icon}</span>
        <span className="active-info">
          <span className="active-title">
            {m.name} <small>· Lvl {m.level}</small>
          </span>
          <ProgressBar fraction={Math.max(0, combat.monsterHp) / m.hp} color="#e5534b" height={8} />
          <ProgressBar fraction={hp / max} color="#ff5e7a" height={5} />
          <small className="active-hint">
            ❤️ {hp}/{max} ·{' '}
            {combat.monsterHp > 0 ? `${Math.ceil(combat.monsterHp)}/${m.hp} LP` : 'Respawn …'}
          </small>
        </span>
      </button>
      <button className="btn btn-stop" onClick={flee} aria-label="Fliehen">
        ■
      </button>
    </div>
  );
}

export function ActiveActionBar() {
  const inCombat = useGame((s) => !!s.game.combat);
  return inCombat ? <CombatBar /> : <ActionBar />;
}

function ActionBar() {
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
