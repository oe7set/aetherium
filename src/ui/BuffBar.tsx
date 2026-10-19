import { getBuff } from '../data';
import { FAMILIAR_MAP } from '../data/summoning';
import { formatDuration } from '../engine';
import { useGame } from '../store/gameStore';

/** Active buffs (lucky events, potions) as small chips with countdown. */
export function BuffBar() {
  const key = useGame((s) =>
    s.game.buffs.map((b) => `${b.id}:${Math.ceil(b.remaining)}`).join('|'),
  );
  const fam = useGame((s) =>
    s.game.familiar ? `${s.game.familiar.id}:${Math.ceil(s.game.familiar.remaining)}` : '',
  );
  if (!key && !fam) return null;
  const [famId = '', famSecs = '0'] = fam.split(':');
  const f = FAMILIAR_MAP.get(famId);
  return (
    <div className="buff-bar">
      {f && (
        <span className="buff-chip familiar" title={f.desc}>
          {f.icon} {f.name} <b>{formatDuration(Number(famSecs))}</b>
        </span>
      )}
      {key &&
        key.split('|').map((entry) => {
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
