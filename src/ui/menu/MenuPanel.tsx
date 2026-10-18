import { t } from '../../i18n';
import { Feed } from '../Feed';
import { useGame, type MenuSection } from '../../store/gameStore';
import { QuestsPanel } from '../quests/QuestsPanel';
import { ResearchPanel } from '../science/ResearchPanel';
import { PassPanel } from '../rewards/PassPanel';
import { AchievementsPanel } from './AchievementsPanel';
import { DebugPanel } from './DebugPanel';
import { EmpirePanel } from './EmpirePanel';
import { PrestigePanel } from './PrestigePanel';
import { SavePanel } from './SavePanel';
import { SettingsPanel } from './SettingsPanel';
import { StatsPanel } from './StatsPanel';

type Section = MenuSection;

const MENU_ICONS: Record<Section, string> = {
  empire: '📚',
  pass: '🏅',
  research: '🔬',
  quests: '📋',
  prestige: '🌅',
  achievements: '🏆',
  stats: '📊',
  log: '📜',
  settings: '⚙️',
  save: '💾',
  debug: '🐞',
};

export function MenuPanel() {
  const section = useGame((s) => s.ui.menuSection);
  const setUi = useGame((s) => s.setUi);
  const setSection = (menuSection: Section) => setUi({ menuSection });
  const sections: Section[] = import.meta.env.DEV
    ? [
        'empire',
        'pass',
        'research',
        'quests',
        'prestige',
        'achievements',
        'stats',
        'log',
        'settings',
        'save',
        'debug',
      ]
    : [
        'empire',
        'pass',
        'research',
        'quests',
        'prestige',
        'achievements',
        'stats',
        'log',
        'settings',
        'save',
      ];
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
            {MENU_ICONS[s]} {t(`menu.${s}`)}
          </button>
        ))}
      </div>
      {section === 'settings' && <SettingsPanel />}
      {section === 'empire' && <EmpirePanel />}
      {section === 'pass' && <PassPanel />}
      {section === 'research' && <ResearchPanel />}
      {section === 'quests' && <QuestsPanel />}
      {section === 'prestige' && <PrestigePanel />}
      {section === 'achievements' && <AchievementsPanel />}
      {section === 'stats' && <StatsPanel />}
      {section === 'log' && <Feed limit={60} />}
      {section === 'save' && <SavePanel />}
      {section === 'debug' && import.meta.env.DEV && <DebugPanel />}
    </div>
  );
}
