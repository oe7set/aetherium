import { getItem } from '../../data';
import { MILESTONE_LEVELS, milestoneMods, milestoneReward } from '../../data/milestones';
import { milestoneKey, skillLevel } from '../../engine';
import { useGame } from '../../store/gameStore';
import { describeMods } from '../modText';

/** Skill-Meilensteine: 10/25/50/75/99 with their lasting bonus and the reward to claim. */
export function MilestonePanel({ skillId }: { skillId: string }) {
  const level = useGame((s) => skillLevel(s.game, skillId));
  const claimed = useGame((s) =>
    MILESTONE_LEVELS.filter((m) => s.game.milestones.includes(milestoneKey(skillId, m))).join(','),
  );
  const claim = useGame((s) => s.claimMilestone);
  const done = new Set(claimed.split(',').map(Number));
  return (
    <section className="buildings milestones-panel">
      <h4 className="group-title">🎖️ Meilensteine</h4>
      {MILESTONE_LEVELS.map((m) => {
        const reached = level >= m;
        const r = milestoneReward(skillId, m);
        const reward = [
          r.gold ? `🪙 ${r.gold.toLocaleString('de-DE')}` : '',
          r.essence ? `🌀 ${r.essence}` : '',
          ...(r.items ?? []).map(
            (i) => `${getItem(i.item).icon} ${i.qty}× ${getItem(i.item).name}`,
          ),
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <div key={m} className={`building-row ${reached ? 'built' : ''}`}>
            <span className="item-icon">{reached ? (done.has(m) ? '✅' : '🎁') : '🔒'}</span>
            <span className="shop-meta">
              <strong>
                Stufe {m}
                {!reached && <small className="muted"> · noch {m - level} Stufen</small>}
              </strong>
              <small className={reached ? 'set-on' : 'muted'}>
                Dauerhaft: {describeMods(milestoneMods(skillId, m))}
              </small>
              <small className="muted">Belohnung: {reward}</small>
            </span>
            <span className="shop-buttons">
              <button
                className="btn btn-primary"
                disabled={!reached || done.has(m)}
                onClick={() => claim(skillId, m)}
              >
                {done.has(m) ? 'Abgeholt' : 'Abholen'}
              </button>
            </span>
          </div>
        );
      })}
    </section>
  );
}
