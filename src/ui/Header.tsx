import { BALANCE } from '../data/balance';
import {
  affordableTechs,
  dailyAvailable,
  formatDuration,
  formatNumber,
  maxHp,
  passClaimable,
  totalLevel,
} from '../engine';
import { t } from '../i18n';
import { useGame } from '../store/gameStore';

export function Header() {
  const gold = useGame((s) => formatNumber(s.game.gold, s.game.settings.numberFormat));
  const total = useGame((s) => totalLevel(s.game));
  const fire = useGame((s) => Math.ceil(s.game.fire));
  const intelligence = useGame((s) => s.game.intelligence);
  const hp = useGame((s) => Math.ceil(s.game.hp));
  const max = useGame((s) => maxHp(s.game));
  const inCombat = useGame((s) => !!s.game.combat);
  const research = useGame((s) => formatNumber(s.game.research, s.game.settings.numberFormat));
  const hasResearch = useGame((s) => s.game.research > 0 || s.game.techs.length > 0);
  const canResearch = useGame((s) => affordableTechs(s.game).length > 0);
  const setUi = useGame((s) => s.setUi);
  const openSkill = useGame((s) => s.openSkill);
  const wisdom = useGame((s) => s.game.prestige.wisdomTotal);
  const daily = useGame((s) => dailyAvailable(s.game, Date.now()));
  const gifts = useGame(
    (s) => (dailyAvailable(s.game, Date.now()) ? 1 : 0) + passClaimable(s.game).length,
  );
  const setDailyOpen = useGame((s) => s.setDailyOpen);
  const fireFraction = fire / BALANCE.FIRE_MAX_SECONDS;

  return (
    <header className="header">
      <button
        className="brand qnav-btn"
        aria-label="Schnellzugriff öffnen"
        title="Schnellzugriff (K)"
        onClick={() => setUi({ quickNav: true })}
      >
        <span className="qnav-compass">🧭</span>
        <span className="brand-mark">Æ</span>
        <span className="brand-name">{t('app.title')}</span>
      </button>
      <div className="header-stats">
        <button
          className="chip"
          title="Gold – zum Krämer"
          onClick={() => setUi({ tab: 'inventory', inventorySegment: 'shop' })}
        >
          🪙 <b>{gold}</b>
        </button>
        {hasResearch && (
          <button
            className={`chip ${canResearch ? 'chip-glow' : ''}`}
            title="Forschungspunkte"
            onClick={() => setUi({ tab: 'menu', menuSection: 'research' })}
          >
            🔬 <b>{research}</b>
          </button>
        )}
        {wisdom > 0 && (
          <span className="chip" title="Weisheit (gesamt)">
            🦉 <b>{wisdom}</b>
          </span>
        )}
        <button
          className="chip"
          title={`${t('header.totalLevel')} – zu den Skills`}
          onClick={() => setUi({ tab: 'skills', skillDetail: false })}
        >
          📊 <b>{total}</b>
        </button>
        <button
          onClick={() => openSkill('firemaking')}
          className={`chip ${fire > 0 ? 'chip-fire' : 'chip-dim'}`}
          title={fire > 0 ? `${t('header.fire')}: ${formatDuration(fire)}` : t('header.fireOut')}
          style={{ ['--fire' as string]: fireFraction }}
        >
          {fire > 0 ? '🔥' : '🪵'} <b>{fire > 0 ? formatDuration(fire) : '–'}</b>
        </button>
        {(inCombat || hp < max) && (
          <span className={`chip ${hp < max * 0.35 ? 'chip-danger' : ''}`} title="Lebenspunkte">
            ❤️ <b>{hp}</b>
          </span>
        )}
        {gifts > 0 && (
          <button
            className="chip chip-glow chip-gift"
            title="Belohnungen warten"
            onClick={() =>
              daily ? setDailyOpen(true) : setUi({ tab: 'menu', menuSection: 'pass' })
            }
          >
            🎁 <b>{gifts}</b>
          </button>
        )}
        {intelligence > 0 && (
          <span className="chip" title={t('header.intelligence')}>
            🧠 <b>{intelligence}</b>
          </span>
        )}
      </div>
    </header>
  );
}
