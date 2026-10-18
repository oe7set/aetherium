import { useEffect } from 'react';
import { getAchievement } from '../data';
import { useGame } from '../store/gameStore';

export function AchievementToast() {
  const toast = useGame((s) => s.achievementToast);
  const dismiss = useGame((s) => s.dismissAchievement);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(dismiss, 3500);
    return () => window.clearTimeout(id);
  }, [toast, dismiss]);
  if (!toast) return null;
  const first = getAchievement(toast.ids[0]!);
  const more = toast.ids.length - 1;
  return (
    <div className="achievement-toast" key={toast.at} onClick={dismiss} role="status">
      <span className="achievement-icon">{first.icon}</span>
      <span>
        <small>🏆 Erfolg{more > 0 ? ` (+${more})` : ''}</small>
        <strong>{first.name}</strong>
      </span>
    </div>
  );
}
