import { useState } from 'react';
import { t } from '../../i18n';
import { AchievementsPanel } from './AchievementsPanel';
import { DebugPanel } from './DebugPanel';
import { EmpirePanel } from './EmpirePanel';
import { PrestigePanel } from './PrestigePanel';
import { SavePanel } from './SavePanel';
import { SettingsPanel } from './SettingsPanel';
import { StatsPanel } from './StatsPanel';

type Section = 'empire' | 'prestige' | 'settings' | 'achievements' | 'stats' | 'save' | 'debug';

export function MenuPanel() {
  const [section, setSection] = useState<Section>('empire');
  const sections: Section[] = import.meta.env.DEV
    ? ['empire', 'prestige', 'achievements', 'stats', 'settings', 'save', 'debug']
    : ['empire', 'prestige', 'achievements', 'stats', 'settings', 'save'];
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
      {section === 'prestige' && <PrestigePanel />}
      {section === 'achievements' && <AchievementsPanel />}
      {section === 'stats' && <StatsPanel />}
      {section === 'save' && <SavePanel />}
      {section === 'debug' && import.meta.env.DEV && <DebugPanel />}
    </div>
  );
}
