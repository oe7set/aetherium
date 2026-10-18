import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';

const COLORS = ['#f2c94c', '#b085f5', '#6fbf4a', '#5aa9e6', '#ff8a3d', '#ff5ec4'];

/** Celebration burst for level-ups and achievements (pure CSS, ~40 elements, auto-removed). */
export function Confetti() {
  const levelAt = useGame((s) => s.levelUp?.at ?? 0);
  const achAt = useGame((s) => s.achievementToast?.at ?? 0);
  const rewardAt = useGame((s) => s.reward?.at ?? 0);
  const trigger = Math.max(levelAt, achAt, rewardAt);
  const [burst, setBurst] = useState<number | null>(null);

  useEffect(() => {
    if (!trigger) return;
    setBurst(trigger);
    const id = window.setTimeout(() => setBurst(null), 2000);
    return () => window.clearTimeout(id);
  }, [trigger]);

  if (!burst) return null;
  return (
    <div className="confetti" key={burst} aria-hidden>
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: COLORS[i % COLORS.length],
            animationDelay: `${(i % 7) * 0.06}s`,
            animationDuration: `${1.4 + (i % 5) * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
