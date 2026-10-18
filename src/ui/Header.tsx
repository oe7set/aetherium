import { BALANCE } from '../data/balance';
import { formatDuration, formatNumber, totalLevel } from '../engine';
import { t } from '../i18n';
import { useGame } from '../store/gameStore';

export function Header() {
  const gold = useGame((s) => formatNumber(s.game.gold, s.game.settings.numberFormat));
  const total = useGame((s) => totalLevel(s.game));
  const fire = useGame((s) => Math.ceil(s.game.fire));
  const intelligence = useGame((s) => s.game.intelligence);
  const fireFraction = fire / BALANCE.FIRE_MAX_SECONDS;

  return (
    <header className="header">
      <div className="brand" aria-label={t('app.title')}>
        <span className="brand-mark">Æ</span>
        <span className="brand-name">{t('app.title')}</span>
      </div>
      <div className="header-stats">
        <span className="chip" title={t('header.gold')}>
          🪙 <b>{gold}</b>
        </span>
        <span className="chip" title={t('header.totalLevel')}>
          📊 <b>{total}</b>
        </span>
        <span
          className={`chip ${fire > 0 ? 'chip-fire' : 'chip-dim'}`}
          title={fire > 0 ? `${t('header.fire')}: ${formatDuration(fire)}` : t('header.fireOut')}
          style={{ ['--fire' as string]: fireFraction }}
        >
          {fire > 0 ? '🔥' : '🪵'} <b>{fire > 0 ? formatDuration(fire) : '–'}</b>
        </span>
        {intelligence > 0 && (
          <span className="chip" title={t('header.intelligence')}>
            🧠 <b>{intelligence}</b>
          </span>
        )}
      </div>
    </header>
  );
}
