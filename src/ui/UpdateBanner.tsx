import { reloadApp, useUpdateReady } from './appUpdate';

/** Shown once the server has a newer version: one tap saves and reloads. */
export function UpdateBanner() {
  const ready = useUpdateReady();
  if (!ready) return null;
  return (
    <div className="update-banner" role="status">
      <span>✨ Neue Version verfügbar!</span>
      <button className="btn btn-primary" onClick={reloadApp}>
        🔄 Neu laden
      </button>
    </div>
  );
}
