import { t } from '../i18n';
import {
  affordableTechs,
  villageAttention,
  QUEST_MAP,
  questProgress,
  taskProgress,
} from '../engine';
import { useGame } from '../store/gameStore';
import { TABS } from './tabs';

export function TabBar({ tabs = TABS }: { tabs?: typeof TABS }) {
  const tab = useGame((s) => s.ui.tab);
  const setUi = useGame((s) => s.setUi);
  // Badges: claimable tasks/quests and affordable research draw attention to new goals.
  const questBadge = useGame(
    (s) =>
      s.game.tasks.list.filter((tk) => !tk.claimed && taskProgress(s.game, tk) >= tk.target)
        .length +
      Object.keys(s.game.quests.active).filter((id) => {
        const q = QUEST_MAP.get(id);
        return q && questProgress(s.game, q).every((p) => p.done);
      }).length,
  );
  const researchBadge = useGame((s) => affordableTechs(s.game).length);
  const villageBadge = useGame((s) => villageAttention(s.game));
  const badges: Partial<Record<string, number>> = {
    menu: questBadge + researchBadge,
    village: villageBadge,
  };
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
          {(badges[tb.id] ?? 0) > 0 && <span className="tab-badge">{badges[tb.id]}</span>}
        </button>
      ))}
    </nav>
  );
}
