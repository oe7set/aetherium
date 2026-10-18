import type { GraphicsSetting, NumberFormat } from '../../engine';
import { t } from '../../i18n';
import { useGame } from '../../store/gameStore';

const FORMATS: NumberFormat[] = ['short', 'scientific', 'engineering'];
const GRAPHICS: GraphicsSetting[] = ['auto', 'low', 'medium', 'high'];

export function SettingsPanel() {
  const settings = useGame((s) => s.game.settings);
  const setSetting = useGame((s) => s.setSetting);
  return (
    <div className="settings">
      <label className="field">
        <span>{t('menu.numberFormat')}</span>
        <select
          className="input"
          value={settings.numberFormat}
          onChange={(e) => setSetting('numberFormat', e.target.value as NumberFormat)}
        >
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {t(`menu.format.${f}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{t('menu.graphics')}</span>
        <select
          className="input"
          value={settings.graphics}
          onChange={(e) => setSetting('graphics', e.target.value as GraphicsSetting)}
        >
          {GRAPHICS.map((g) => (
            <option key={g} value={g}>
              {t(`menu.graphics.${g}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.batteryMode}
          onChange={(e) => setSetting('batteryMode', e.target.checked)}
        />
        <span>🔋 {t('menu.batteryMode')}</span>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.nerdMode}
          onChange={(e) => setSetting('nerdMode', e.target.checked)}
        />
        <span>{t('menu.nerdMode')}</span>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.chatter}
          onChange={(e) => setSetting('chatter', e.target.checked)}
        />
        <span>{t('menu.chatter')}</span>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.sound}
          onChange={(e) => setSetting('sound', e.target.checked)}
        />
        <span>{t('menu.sound')}</span>
      </label>
      <p className="muted small">{t('menu.shortcuts')}</p>
      <p className="muted small">
        {t('menu.version', { version: __APP_VERSION__ })} · {t('app.subtitle')}
      </p>
    </div>
  );
}
