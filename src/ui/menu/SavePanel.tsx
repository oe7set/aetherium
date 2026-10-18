import { useState } from 'react';
import { SaveError } from '../../engine';
import { t } from '../../i18n';
import { useGame } from '../../store/gameStore';

export function SavePanel() {
  const save = useGame((s) => s.save);
  const exportString = useGame((s) => s.exportString);
  const importString = useGame((s) => s.importString);
  const hardReset = useGame((s) => s.hardReset);
  const lastSavedAt = useGame((s) => s.lastSavedAt);
  const [exported, setExported] = useState('');
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(exported);
      setMessage(t('menu.copied'));
    } catch {
      setMessage('Kopieren nicht möglich – bitte manuell markieren.');
    }
  };

  const doImport = () => {
    try {
      importString(importText);
      setMessage(t('menu.importOk'));
      setImportText('');
    } catch (err) {
      setMessage(`❌ ${err instanceof SaveError ? err.message : 'Import fehlgeschlagen.'}`);
    }
  };

  return (
    <div className="save-panel">
      <div className="btn-row">
        <button
          className="btn btn-primary"
          onClick={() => {
            save();
            setMessage(t('menu.saved'));
          }}
        >
          💾 {t('menu.saveNow')}
        </button>
        <button className="btn" onClick={() => setExported(exportString())}>
          📤 {t('menu.export')}
        </button>
      </div>
      {lastSavedAt && (
        <p className="muted small">
          {t('menu.lastSave', { time: new Date(lastSavedAt).toLocaleTimeString('de-DE') })}
        </p>
      )}
      {exported && (
        <>
          <p className="muted small">{t('menu.exportHint')}</p>
          <textarea
            className="input code"
            readOnly
            value={exported}
            rows={4}
            onFocus={(e) => e.target.select()}
          />
          <button className="btn" onClick={doCopy}>
            📋 {t('menu.copy')}
          </button>
        </>
      )}
      <h4 className="group-title">📥 {t('menu.import')}</h4>
      <textarea
        className="input code"
        rows={3}
        value={importText}
        placeholder={t('menu.importPlaceholder')}
        onChange={(e) => setImportText(e.target.value)}
      />
      <button className="btn" disabled={!importText.trim()} onClick={doImport}>
        {t('menu.import')}
      </button>
      {message && <p className="notice">{message}</p>}
      <h4 className="group-title danger">☠️ {t('menu.reset')}</h4>
      {confirmReset && <p className="warn small">{t('menu.resetConfirm')}</p>}
      <button
        className="btn btn-danger"
        onClick={() => {
          if (confirmReset) {
            hardReset();
            setConfirmReset(false);
            setMessage('Neues Spiel, neues Glück.');
          } else setConfirmReset(true);
        }}
      >
        {t('menu.reset')}
      </button>
    </div>
  );
}
