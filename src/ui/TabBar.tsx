import { t } from '../i18n';
import { useGame } from '../store/gameStore';
import { TABS } from './tabs';

export function TabBar({ tabs = TABS }: { tabs?: typeof TABS }) {
  const tab = useGame((s) => s.ui.tab);
  const setUi = useGame((s) => s.setUi);
  return (
    <nav className="tabbar" aria-label="Navigation">
      {tabs.map((tb) => (
        <button
          key={tb.id}
          className={`tab ${tab === tb.id ? 'active' : ''}`}
          aria-current={tab === tb.id ? 'page' : undefined}
          onClick={() =>
            setUi({
              tab: tb.id,
              ...(tb.id === 'skills' && tab === 'skills' ? { skillDetail: false } : {}),
            })
          }
        >
          <span className="tab-icon" aria-hidden>
            {tb.icon}
          </span>
          <span className="tab-label">{t(tb.label)}</span>
        </button>
      ))}
    </nav>
  );
}
