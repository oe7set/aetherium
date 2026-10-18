import { t } from '../i18n';

const PREVIEW = [
  { icon: '🛞', name: 'Das Rad erfinden', note: 'Endlich nicht mehr alles tragen.' },
  { icon: '📜', name: 'Buchdruck', note: 'Copy & Paste, Mittelalter-Edition.' },
  { icon: '🚂', name: 'Dampfmaschine', note: 'Wasser kochen, aber produktiv.' },
  { icon: '⚡', name: 'Elektrizität', note: 'Endlich kann das Kupfer zeigen, was es kann.' },
  { icon: '🖥️', name: 'Quantencomputer', note: 'Rechnet alles gleichzeitig. Auch Unsinn.' },
  { icon: '🚀', name: 'Warp-Antrieb', note: 'Für die ganz langen Holzwege.' },
];

export function ResearchPanel() {
  return (
    <div className="panel research">
      <h3 className="panel-title">🔬 {t('research.title')}</h3>
      <p className="muted">{t('research.locked')}</p>
      <h4 className="group-title">{t('research.preview')}</h4>
      <ol className="tech-preview">
        {PREVIEW.map((n) => (
          <li key={n.name}>
            <span className="tech-icon">{n.icon}</span>
            <span>
              <strong>{n.name}</strong>
              <small className="muted">{n.note}</small>
            </span>
            <span className="phase-badge">🔒</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
