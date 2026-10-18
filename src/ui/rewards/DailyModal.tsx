import { useEffect } from 'react';
import { DAILY_REWARDS, type RewardDef } from '../../data/progress';
import { dailyAvailable, nextDailyDay } from '../../engine';
import { useGame } from '../../store/gameStore';

function rewardIcons(r: RewardDef): string {
  const parts: string[] = [];
  if (r.heroItem) parts.push(r.heroItem >= 2 ? '🗡️✨' : '🗡️');
  if (r.gold) parts.push('🪙');
  if (r.essence) parts.push('🌀');
  if (r.resources) parts.push('🏘️');
  if (r.research) parts.push('🔬');
  if (r.heroXp) parts.push('⭐');
  if (r.items?.length) parts.push('🎁');
  return parts.slice(0, 3).join('');
}

/** Daily login calendar; opens once per session when a reward is waiting. */
export function DailyModal() {
  const open = useGame((s) => s.dailyOpen);
  const setOpen = useGame((s) => s.setDailyOpen);
  const claim = useGame((s) => s.claimDaily);
  const available = useGame((s) => dailyAvailable(s.game, Date.now()));
  const streak = useGame((s) => s.game.progress.streak);

  useEffect(() => {
    if (!available) return;
    let shown = false;
    const id = window.setInterval(() => {
      let titleDone = true;
      try {
        titleDone = sessionStorage.getItem('aetherium.titleSeen') === '1';
        shown = sessionStorage.getItem('aetherium.dailyShown') === '1';
      } catch {
        /* private mode */
      }
      if (titleDone && !shown) {
        try {
          sessionStorage.setItem('aetherium.dailyShown', '1');
        } catch {
          /* ignore */
        }
        setOpen(true);
        window.clearInterval(id);
      }
    }, 800);
    return () => window.clearInterval(id);
  }, [available, setOpen]);

  if (!open) return null;
  const day = nextDailyDay(useGame.getState().game, Date.now());
  return (
    <div
      className="reward-overlay"
      role="dialog"
      aria-label="Tägliche Belohnung"
      onClick={() => setOpen(false)}
    >
      <div className="daily-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="reward-title">Tägliche Belohnung</h2>
        <p className="daily-sub">
          {available
            ? `Tag ${day} deiner Serie`
            : `Serie: ${streak} Tag${streak === 1 ? '' : 'e'} – komm morgen wieder!`}
        </p>
        <div className="daily-grid">
          {DAILY_REWARDS.map((r, i) => {
            const d = i + 1;
            const state = available
              ? d < day
                ? 'done'
                : d === day
                  ? 'today'
                  : 'next'
              : d <= ((streak - 1) % 7) + 1
                ? 'done'
                : 'next';
            return (
              <div key={d} className={`daily-day ${state} ${d === 7 ? 'big' : ''}`}>
                <small>Tag {d}</small>
                <span className="daily-icons">{rewardIcons(r)}</span>
                {state === 'done' && <span className="daily-check">✓</span>}
              </div>
            );
          })}
        </div>
        {available ? (
          <button className="btn btn-primary btn-big reward-ok" onClick={claim}>
            🎁 Abholen
          </button>
        ) : (
          <button className="btn" onClick={() => setOpen(false)}>
            Schließen
          </button>
        )}
        <p className="daily-hint">
          Jeden Tag einloggen: Belohnungen wachsen mit deinem Reich. Tag 7 = edle Ausrüstung.
        </p>
      </div>
    </div>
  );
}
