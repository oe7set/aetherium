import { useSyncExternalStore } from 'react';
import { saveToStorage } from '../store/persistence';
import { useGame } from '../store/gameStore';

/** PWA update state: a new version waits in the service worker until the player reloads. */
let needRefresh = false;
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
let registration: ServiceWorkerRegistration | undefined;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function initAppUpdate(): void {
  if (!import.meta.env.PROD) return;
  void import('virtual:pwa-register').then(({ registerSW }) => {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefresh = true;
        notify();
      },
      onRegisteredSW(_url, reg) {
        registration = reg;
        // Long sessions: look for a new deploy every 30 minutes.
        if (reg) window.setInterval(() => void reg.update().catch(() => {}), 30 * 60 * 1000);
      },
    });
  });
}

export function useUpdateReady(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => needRefresh,
  );
}

/** Ask the server for a newer version right now; resolves true if one is waiting. */
export async function checkForUpdate(): Promise<boolean> {
  try {
    await registration?.update();
  } catch {
    // offline – nothing to do
  }
  // Give the new worker a moment to install.
  await new Promise((r) => window.setTimeout(r, 1500));
  return needRefresh;
}

/** Save, then reload – activating a waiting update if there is one. */
export function reloadApp(): void {
  saveToStorage(useGame.getState().game);
  if (needRefresh && updateSW) void updateSW(true);
  else window.location.reload();
}

export const fullscreenSupported = (): boolean =>
  typeof document !== 'undefined' && !!document.fullscreenEnabled;

export function useFullscreen(): boolean {
  return useSyncExternalStore(
    (l) => {
      document.addEventListener('fullscreenchange', l);
      return () => document.removeEventListener('fullscreenchange', l);
    },
    () => !!document.fullscreenElement,
  );
}

export function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  else void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
}
