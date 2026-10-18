import { useGame } from '../../store/gameStore';
import './rewards.css';

const RARITY = ['common', 'rare', 'epic', 'legendary'];

/** Staged reward reveal: lines pop in one after another with a rarity glow. */
export function RewardReveal() {
  const reward = useGame((s) => s.reward);
  const dismiss = useGame((s) => s.dismissReward);
  if (!reward) return null;
  const best = Math.max(0, ...reward.lines.map((l) => l.rarity));
  return (
    <div className="reward-overlay" onClick={dismiss} role="dialog" aria-label={reward.title}>
      <div
        className={`reward-box rarity-${RARITY[best]}`}
        key={reward.at}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reward-rays" aria-hidden />
        <div className="reward-icon">{reward.icon}</div>
        <h2 className="reward-title">{reward.title}</h2>
        <div className="reward-lines">
          {reward.lines.map((l, i) => (
            <div
              key={i}
              className={`reward-line rarity-${RARITY[l.rarity] ?? 'common'}`}
              style={{ animationDelay: `${0.25 + i * 0.18}s` }}
            >
              <span className="reward-line-icon">{l.icon}</span>
              <span>{l.label}</span>
            </div>
          ))}
        </div>
        <button
          className="btn btn-primary btn-big reward-ok"
          style={{ animationDelay: `${0.35 + reward.lines.length * 0.18}s` }}
          onClick={dismiss}
        >
          Einsammeln!
        </button>
      </div>
    </div>
  );
}
