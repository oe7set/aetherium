import { useMemo } from 'react';
import { getAction, getItem, getSkill } from '../data';
import { OFFLINE_LINES } from '../data/flavor';
import { defaultRng, flavor, formatDuration } from '../engine';
import { t, type MessageKey } from '../i18n';
import { useGame } from '../store/gameStore';
import { useFmt } from './hooks';

function ItemList({ items }: { items: Record<string, number> }) {
  const { int } = useFmt();
  return (
    <div className="pill-wrap">
      {Object.entries(items).map(([id, qty]) => {
        const it = getItem(id);
        return (
          <span key={id} className="item-pill">
            {it.icon} {int(qty)}× {it.name}
          </span>
        );
      })}
    </div>
  );
}

export function OfflineModal() {
  const summary = useGame((s) => s.offlineSummary);
  const dismiss = useGame((s) => s.dismissOffline);
  const { num, int } = useFmt();
  const intro = useMemo(
    () =>
      summary
        ? flavor(defaultRng, OFFLINE_LINES, { time: formatDuration(summary.elapsedSeconds) })
        : '',
    [summary],
  );
  if (!summary) return null;

  const capped = summary.simulatedSeconds < summary.elapsedSeconds;
  const nothing = summary.actionsCompleted === 0;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal aria-label={t('offline.title')}>
      <div className="modal">
        <h2>🌙 {t('offline.title')}</h2>
        <p className="muted">{intro}</p>
        <p>
          <b>{t('offline.away', { time: formatDuration(summary.elapsedSeconds) })}</b>
          {capped && (
            <small className="muted">
              {' '}
              · {t('offline.capped', { time: formatDuration(summary.simulatedSeconds) })}
            </small>
          )}
        </p>
        {nothing ? (
          <p>{t('offline.nothing')}</p>
        ) : (
          <>
            <p>{t('offline.actions', { count: int(summary.actionsCompleted) })}</p>
            {Object.keys(summary.levels).length > 0 && (
              <>
                <h4 className="group-title">🎉 {t('offline.levels')}</h4>
                <ul className="plain">
                  {Object.entries(summary.levels).map(([id, l]) => (
                    <li key={id}>
                      {getSkill(id).icon} {getSkill(id).name}: {l.from} → <b>{l.to}</b>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="pill-wrap">
              {Object.entries(summary.xp).map(([id, xp]) => (
                <span key={id} className="item-pill">
                  {getSkill(id).icon} +{num(xp)} XP
                </span>
              ))}
            </div>
            {summary.rareDrops.length > 0 && (
              <>
                <h4 className="group-title">✨ {t('offline.rare')}</h4>
                <ItemList
                  items={summary.rareDrops.reduce<Record<string, number>>(
                    (m, d) => ({ ...m, [d.item]: (m[d.item] ?? 0) + d.qty }),
                    {},
                  )}
                />
              </>
            )}
            {Object.keys(summary.gained).length > 0 && (
              <>
                <h4 className="group-title">📦 {t('offline.gained')}</h4>
                <ItemList items={summary.gained} />
              </>
            )}
            {Object.keys(summary.consumed).length > 0 && (
              <>
                <h4 className="group-title">🔻 {t('offline.consumed')}</h4>
                <ItemList items={summary.consumed} />
              </>
            )}
            {Object.keys(summary.lost).length > 0 && (
              <>
                <h4 className="group-title warn">😭 {t('offline.lost')}</h4>
                <ItemList items={summary.lost} />
              </>
            )}
          </>
        )}
        {summary.stopped && (
          <p className="warn">
            ⚠️{' '}
            {t('offline.stopped', {
              reason: `${getAction(summary.stopped.actionId).name} – ${t(
                `stop.${summary.stopped.reason}` as MessageKey,
                {
                  item: summary.stopped.missingItem
                    ? getItem(summary.stopped.missingItem).name
                    : '',
                },
              )}`,
            })}
          </p>
        )}
        {summary.fireWentOut && <p className="muted">🌫️ {t('offline.fireOut')}</p>}
        <button className="btn btn-primary btn-wide" onClick={dismiss} autoFocus>
          {t('offline.ok')}
        </button>
      </div>
    </div>
  );
}
