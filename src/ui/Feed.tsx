import { t } from '../i18n';
import { useGame } from '../store/gameStore';

export function Feed({ limit, compact = false }: { limit?: number; compact?: boolean }) {
  const feed = useGame((s) => s.feed);
  const setUi = useGame((s) => s.setUi);
  const entries = limit ? feed.slice(0, limit) : feed;
  return (
    <section
      className={`feed ${compact ? 'feed-compact' : ''}`}
      aria-label={t('feed.title')}
      aria-live="polite"
    >
      {!compact && <h3 className="panel-title">{t('feed.title')}</h3>}
      <ul>
        {entries.map((e) => (
          <li
            key={e.id}
            className={`feed-${e.kind}`}
            onClick={compact ? () => setUi({ tab: 'menu', menuSection: 'log' }) : undefined}
          >
            {e.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
