import { useCallback } from 'react';
import { getAction, getMonster, getSkill, SPECIAL_COST, SPECIALS } from '../data';
import { actionDuration, combatStyle, formatSeconds, maxHp } from '../engine';
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
  const dodge = useGame((s) => s.dodge);
  const special = useGame((s) => s.special);
  const style = useGame((s) => combatStyle(s.game));
  if (!combat) return null;
  const alive = combat.monsterHp > 0;
  const canDodge = alive && combat.windup && !combat.dodged;
  const canSpecial = alive && combat.energy >= SPECIAL_COST;
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
      {canDodge && (
        <button className="btn btn-gold quick-dodge" onClick={dodge} aria-label="Ausweichen">
          💨
        </button>
      )}
      {canSpecial && (
        <button
          className="btn btn-gold quick-special"
          onClick={special}
          aria-label={SPECIALS[style].name}
        >
          {SPECIALS[style].icon}
        </button>
      )}
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
  const setUi = useGame((s) => s.setUi);
  const read = useCallback(() => readActiveProgress(), []);

  if (!activeId) {
    return (
      <div className="active-bar idle">
        <Popups />
        <button className="active-idle" onClick={() => setUi({ tab: 'skills' })}>
          <span className="active-icon">🧍</span>
          <span className="active-text">{t('action.idle')}</span>
          <span className="active-go">Skills ›</span>
        </button>
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
