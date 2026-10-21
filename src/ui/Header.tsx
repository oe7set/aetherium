import { BALANCE } from '../data/balance';
import {
  affordableTechs,
  empireRankReached,
  empireScore,
  formatDuration,
  formatNumber,
  maxHp,
  totalLevel,
} from '../engine';
import { EMPIRE_RANKS } from '../data/empire';
import { t } from '../i18n';
import { useGame } from '../store/gameStore';
import { useAgendaSummary } from './agendaNav';
import { HeroStats, VillageStats } from './HeaderStats';

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
  const todo = useAgendaSummary();
  const tab = useGame((s) => s.ui.tab);
  const fireFraction = fire / BALANCE.FIRE_MAX_SECONDS;

  return (
    <header className={`header ${tab === 'village' || tab === 'rift' ? 'header-ctx' : ''}`}>
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
      {tab === 'village' ? (
        <div className="header-stats ctx-stats">
          <VillageStats />
        </div>
      ) : tab === 'rift' ? (
        <div className="header-stats ctx-stats">
          <HeroStats />
        </div>
      ) : (
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
          <EmpireChip />
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
          {intelligence > 0 && (
            <span className="chip" title={t('header.intelligence')}>
              🧠 <b>{intelligence}</b>
            </span>
          )}
        </div>
      )}
      <button
        className={`agenda-btn ${todo.rewards > 0 ? 'has-reward' : ''} ${todo.count ? '' : 'empty'}`}
        onClick={() => setUi({ agenda: true })}
        aria-label={`Was jetzt? ${todo.count} offen`}
        title="Was jetzt?"
      >
        <span>{todo.rewards > 0 ? '🎁' : '📌'}</span>
        {todo.count > 0 && <b>{todo.count}</b>}
      </button>
    </header>
  );
}

/** Reichsrang as a ring: fills towards the next rank, glows when a rank waits to be claimed. */
function EmpireChip() {
  const key = useGame((s) => {
    const g = s.game;
    const score = empireScore(g);
    const next = EMPIRE_RANKS[g.empireRank + 1];
    const from = EMPIRE_RANKS[g.empireRank]?.score ?? 0;
    const frac = next ? Math.min(1, (score - from) / (next.score - from)) : 1;
    return `${g.empireRank}|${Math.floor(frac * 40) / 40}|${empireRankReached(g) > g.empireRank ? 1 : 0}`;
  });
  const setUi = useGame((s) => s.setUi);
  const [rank, frac, ready] = key.split('|');
  const def = EMPIRE_RANKS[Number(rank)];
  return (
    <button
      className={`chip chip-ring ${ready === '1' ? 'ready' : ''}`}
      style={{ ['--ring' as string]: frac }}
      title={`Reichsrang: ${def?.name ?? ''}`}
      onClick={() => setUi({ tab: 'menu', menuSection: 'home' })}
    >
      <span className="chip-ring-icon">{def?.icon}</span>
    </button>
  );
}
