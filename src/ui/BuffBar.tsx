import { getBuff } from '../data';
import { formatDuration } from '../engine';
import { useGame } from '../store/gameStore';

/** Active buffs (lucky events, potions) as small chips with countdown. */
export function BuffBar() {
  const key = useGame((s) =>
    s.game.buffs.map((b) => `${b.id}:${Math.ceil(b.remaining)}`).join('|'),
  );
  if (!key) return null;
  return (
    <div className="buff-bar">
      {key.split('|').map((entry) => {
        const [id = '', secs = '0'] = entry.split(':');
        const b = getBuff(id);
        return (
          <span key={id} className="buff-chip" title={b.desc}>
            {b.icon} {b.name} <b>{formatDuration(Number(secs))}</b>
          </span>
        );
      })}
    </div>
  );
}
