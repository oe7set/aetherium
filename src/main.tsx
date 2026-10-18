import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { startGameLoop } from './store/loop';
import { App } from './ui/App';
import './ui/styles.css';

startGameLoop();

const root = document.getElementById('root');
if (!root) throw new Error('#root fehlt');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
document.getElementById('splash')?.remove();
