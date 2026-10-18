import { PASS_TIERS, passReward, passThreshold, type RewardDef } from '../../data/progress';
import { passBreakdown, passPoints, passTier } from '../../engine';
import { useGame } from '../../store/gameStore';

function rewardText(r: RewardDef): { icon: string; label: string } {
  if (r.avatar) return { icon: r.avatar, label: 'Avatar + Ausrüstung' };
  if (r.heroItem)
    return {
      icon: r.heroItem >= 3 ? '👑' : r.heroItem === 2 ? '🗡️' : '🪖',
      label: ['', 'Ausrüstung', 'Edle Ausrüstung', 'Legendär'][r.heroItem]!,
    };
  if (r.essence) return { icon: '🌀', label: 'Essenz' };
  if (r.gold) return { icon: '🪙', label: 'Gold' };
  if (r.resources) return { icon: '🏘️', label: 'Rohstoffe' };
  return { icon: '🔬', label: 'Forschung + XP' };
}

/** Ruhmesleiter: one progress track fed by every system. */
export function PassPanel() {
  useGame((s) => `${passPoints(s.game)}|${s.game.progress.passClaimed.length}`);
  const claim = useGame((s) => s.claimPass);
  const game = useGame.getState().game;
  const points = passPoints(game);
  const tier = passTier(game);
  const next = Math.min(PASS_TIERS, tier + 1);
  const from = tier > 0 ? passThreshold(tier) : 0;
  const to = passThreshold(next);
  const claimed = new Set(game.progress.passClaimed);
  return (
    <div className="pass">
      <div className="pass-head glass">
        <span className="pass-medal">🏅</span>
        <div>
          <strong className="pass-tier">Stufe {tier}</strong>{' '}
          <small className="muted">/ {PASS_TIERS}</small>
          <div className="chronicle-bar">
            <i
              style={{
                width: `${tier >= PASS_TIERS ? 100 : ((points - from) / (to - from)) * 100}%`,
              }}
            />
          </div>
          <small className="muted">
            {points} Ruhmpunkte{tier < PASS_TIERS ? ` · nächste Stufe bei ${to}` : ' · Maximum!'}
          </small>
        </div>
      </div>
      <div className="pass-track" role="list">
        {Array.from({ length: PASS_TIERS }, (_, i) => {
          const t = i + 1;
          const r = rewardText(passReward(t));
          const reached = t <= tier;
          const done = claimed.has(t);
          return (
            <div
              key={t}
              role="listitem"
              className={`pass-node ${reached ? 'reached' : ''} ${done ? 'claimed' : ''} ${t % 10 === 0 ? 'milestone' : ''}`}
            >
              <small>{t}</small>
              <span className="pass-node-icon">{r.icon}</span>
              <small className="pass-node-label">{r.label}</small>
              {reached && !done ? (
                <button className="btn btn-primary small" onClick={() => claim(t)}>
                  Holen
                </button>
              ) : (
                <span className="pass-node-state">{done ? '✓' : '🔒'}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="glass pass-sources">
        <strong>Woher kommen Ruhmpunkte?</strong>
        <div className="pass-source-grid">
          {passBreakdown(game).map((b) => (
            <span key={b.label}>
              {b.icon} {b.label}: <b>{b.points}</b>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
