import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { startGameLoop } from './store/loop';
import { App } from './ui/App';
import { initAppUpdate } from './ui/appUpdate';
import { unlockAudio } from './ui/audio';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/800.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './ui/styles.css';
import './ui/theme.css';

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

// Offline start & home-screen install (PWA); new versions wait for the player's reload.
initAppUpdate();
