import { useState } from 'react';
import { t } from '../../i18n';
import { AchievementsPanel } from './AchievementsPanel';
import { DebugPanel } from './DebugPanel';
import { SavePanel } from './SavePanel';
import { SettingsPanel } from './SettingsPanel';
import { StatsPanel } from './StatsPanel';

type Section = 'settings' | 'achievements' | 'stats' | 'save' | 'debug';

export function MenuPanel() {
  const [section, setSection] = useState<Section>('achievements');
  const sections: Section[] = import.meta.env.DEV
    ? ['achievements', 'stats', 'settings', 'save', 'debug']
    : ['achievements', 'stats', 'settings', 'save'];
  return (
    <div className="panel">
      <div className="segments" role="tablist">
        {sections.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={section === s}
            className={`segment ${section === s ? 'active' : ''}`}
            onClick={() => setSection(s)}
          >
            {t(`menu.${s}`)}
          </button>
        ))}
      </div>
      {section === 'settings' && <SettingsPanel />}
      {section === 'achievements' && <AchievementsPanel />}
      {section === 'stats' && <StatsPanel />}
      {section === 'save' && <SavePanel />}
      {section === 'debug' && import.meta.env.DEV && <DebugPanel />}
    </div>
  );
}
