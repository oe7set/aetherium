import { t } from '../../i18n';
import { useGame, type MenuSection } from '../../store/gameStore';
import { QuestsPanel } from '../quests/QuestsPanel';
import { AchievementsPanel } from './AchievementsPanel';
import { DebugPanel } from './DebugPanel';
import { EmpirePanel } from './EmpirePanel';
import { PrestigePanel } from './PrestigePanel';
import { SavePanel } from './SavePanel';
import { SettingsPanel } from './SettingsPanel';
import { StatsPanel } from './StatsPanel';

type Section = MenuSection;

export function MenuPanel() {
  const section = useGame((s) => s.ui.menuSection);
  const setUi = useGame((s) => s.setUi);
  const setSection = (menuSection: Section) => setUi({ menuSection });
  const sections: Section[] = import.meta.env.DEV
    ? ['empire', 'quests', 'prestige', 'achievements', 'stats', 'settings', 'save', 'debug']
    : ['empire', 'quests', 'prestige', 'achievements', 'stats', 'settings', 'save'];
  return (
    <div className="panel">
      <div className="segments" role="tablist">
        {sections.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={section === s}
            className={`segment ${section === s ? 'active' : ''}`}
            onClick={(e) => {
              setSection(s);
              e.currentTarget.closest('.sheet-body, .center-panel')?.scrollTo({ top: 0 });
            }}
          >
            {t(`menu.${s}`)}
          </button>
        ))}
      </div>
      {section === 'settings' && <SettingsPanel />}
      {section === 'empire' && <EmpirePanel />}
      {section === 'quests' && <QuestsPanel />}
      {section === 'prestige' && <PrestigePanel />}
      {section === 'achievements' && <AchievementsPanel />}
      {section === 'stats' && <StatsPanel />}
      {section === 'save' && <SavePanel />}
      {section === 'debug' && import.meta.env.DEV && <DebugPanel />}
    </div>
  );
}
