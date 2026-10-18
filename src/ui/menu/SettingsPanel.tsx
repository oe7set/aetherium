import type { GraphicsSetting, NumberFormat } from '../../engine';
import { t } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { requestNotifications } from '../notify';

const FORMATS: NumberFormat[] = ['short', 'scientific', 'engineering'];
const GRAPHICS: GraphicsSetting[] = ['auto', 'low', 'medium', 'high'];

export function SettingsPanel() {
  const settings = useGame((s) => s.game.settings);
  const setSetting = useGame((s) => s.setSetting);
  return (
    <div className="settings">
      <h4 className="group-title">🔊 Klang</h4>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.sound}
          onChange={(e) => setSetting('sound', e.target.checked)}
        />
        <span>{t('menu.sound')}</span>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.music}
          onChange={(e) => setSetting('music', e.target.checked)}
        />
        <span>🎵 Musik (für jeden Bereich ein eigenes Thema)</span>
      </label>
      {settings.music && (
        <label className="setting-row">
          <span>🔊 Lautstärke</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.musicVolume}
            onChange={(e) => setSetting('musicVolume', Number(e.target.value))}
          />
        </label>
      )}
      <h4 className="group-title">⚙️ Anzeige & Leistung</h4>
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
      <label className="field">
        <span>⚡ Leistung & Akku</span>
        <select
          className="input"
          value={settings.performance}
          onChange={(e) => setSetting('performance', e.target.value as typeof settings.performance)}
        >
          <option value="auto">Automatisch (Handy = Eco)</option>
          <option value="eco">Eco – kühl & sparsam (30 FPS, weniger Effekte)</option>
          <option value="smooth">Flüssig – 60 FPS, alle Effekte</option>
        </select>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.haptics}
          onChange={(e) => setSetting('haptics', e.target.checked)}
        />
        <span>📳 Vibration bei Belohnungen</span>
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
          checked={settings.notifications}
          onChange={async (e) => {
            const want = e.target.checked;
            setSetting('notifications', want ? await requestNotifications() : false);
          }}
        />
        <span>🔔 {t('menu.notifications')}</span>
      </label>
      <p className="muted small">{t('menu.shortcuts')}</p>
      <p className="muted small">
        {t('menu.version', { version: __APP_VERSION__ })} · {t('app.subtitle')}
      </p>
    </div>
  );
}
