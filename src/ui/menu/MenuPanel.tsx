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
import { MenuHub } from './MenuHub';
import { ProjectsPanel } from './ProjectsPanel';

type Section = MenuSection;

const MENU_ICONS: Record<Section, string> = {
  home: '☰',
  projects: '🏗️',
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
  if (section === 'home')
    return (
      <div className="panel">
        <MenuHub />
      </div>
    );
  return (
    <div className="panel">
      <div className="menu-crumb">
        <button
          className="btn btn-ghost"
          onClick={(e) => {
            setUi({ menuSection: 'home' });
            e.currentTarget.closest('.sheet-body, .center-panel')?.scrollTo({ top: 0 });
          }}
        >
          ← Übersicht
        </button>
        <strong>
          {MENU_ICONS[section]} {t(`menu.${section}`)}
        </strong>
      </div>
      {section === 'settings' && <SettingsPanel />}
      {section === 'projects' && <ProjectsPanel />}
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
