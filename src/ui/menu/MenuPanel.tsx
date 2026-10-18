import { useState } from 'react';
import { t } from '../../i18n';
import { DebugPanel } from './DebugPanel';
import { SavePanel } from './SavePanel';
import { SettingsPanel } from './SettingsPanel';
import { StatsPanel } from './StatsPanel';

type Section = 'settings' | 'stats' | 'save' | 'debug';

export function MenuPanel() {
  const [section, setSection] = useState<Section>('settings');
  const sections: Section[] = import.meta.env.DEV
    ? ['settings', 'stats', 'save', 'debug']
    : ['settings', 'stats', 'save'];
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
      {section === 'stats' && <StatsPanel />}
      {section === 'save' && <SavePanel />}
      {section === 'debug' && import.meta.env.DEV && <DebugPanel />}
    </div>
  );
}
