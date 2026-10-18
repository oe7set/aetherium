import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { startGameLoop } from './store/loop';
import { App } from './ui/App';
import { unlockAudio } from './ui/audio';
import './ui/styles.css';

startGameLoop();
// Browsers only allow audio after a user gesture.
window.addEventListener('pointerdown', unlockAudio, { once: true });

const root = document.getElementById('root');
if (!root) throw new Error('#root fehlt');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
document.getElementById('splash')?.remove();

// Offline start & home-screen install (PWA). Only in production builds.
if (import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}
