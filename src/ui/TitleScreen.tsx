import { useState } from 'react';
import { formatDuration, totalLevel } from '../engine';
import { useGame } from '../store/gameStore';
import { unlockAudio, SOUNDS } from './audio';

/** Animated title card shown once per app start. Doubles as the user gesture that unlocks audio. */
export function TitleScreen() {
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem('aetherium.titleSeen') !== '1';
    } catch {
      return true;
    }
  });
  const total = useGame((s) => totalLevel(s.game));
  const created = useGame((s) => s.game.createdAt);
  const rebirths = useGame((s) => s.game.prestige.rebirths);
  const sound = useGame((s) => s.game.settings.sound);
  if (!open) return null;

  const start = () => {
    unlockAudio();
    if (sound) SOUNDS.prestige();
    try {
      sessionStorage.setItem('aetherium.titleSeen', '1');
    } catch {
      /* private mode */
    }
    setOpen(false);
  };

  const isNew = total <= 30 && rebirths === 0;
  return (
    <div className="title-screen" onClick={start} role="dialog" aria-label="Titelbildschirm">
      <div className="title-orbit" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <h1 className="title-logo">
        <span className="title-ae">Æ</span>
        <span className="title-word">AETHERIUM</span>
      </h1>
      <p className="title-sub">Von der Steinaxt zum Teilchenbeschleuniger</p>
      {!isNew && (
        <p className="title-stats">
          📊 Gesamtlevel {total} · ⏳ {formatDuration((Date.now() - created) / 1000)} im Reich
          {rebirths > 0 && ` · 🌅 ${rebirths}× wiedergeboren`}
        </p>
      )}
      <button className="btn btn-gold title-btn" onClick={start} autoFocus>
        {isNew ? '✨ Abenteuer beginnen' : '▶ Weiterspielen'}
      </button>
      <small className="title-hint">Tippe irgendwo, um zu starten</small>
    </div>
  );
}
