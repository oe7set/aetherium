import { getItem } from '../../data';
import {
  CONSTELLATION_MAX_RANK,
  CONSTELLATIONS,
  constellationCost,
  NIGHT_MULT,
} from '../../data/astronomy';
import {
  canStudy,
  formatDuration,
  isNight,
  secondsToNight,
  starSlots,
  studyConstellation,
  toggleConstellation,
} from '../../engine';
import { useGame } from '../../store/gameStore';
import { useNow } from '../hooks';
import { describeMods } from '../modText';

/** Sternkunde: night indicator plus the constellations with rank, cost and on/off. */
export function StarsPanel() {
  const sig = useGame((s) => JSON.stringify(s.game.stars));
  const checks = useGame((s) => CONSTELLATIONS.map((c) => canStudy(s.game, c.id)).join(','));
  const inventory = useGame((s) => s.game.inventory);
  const slots = useGame((s) => starSlots(s.game));
  const act = useGame((s) => s.combatAct);
  const now = useNow(10000);
  const stars = JSON.parse(sig) as { ranks: Record<string, number>; active: string[] };
  const ok = checks.split(',');
  const night = isNight(now);
  return (
    <section className="buildings stars-panel">
      <p className={`night-banner ${night ? 'on' : ''}`}>
        {night
          ? `🌙 Es ist Nacht: Beobachtungen bringen ×${NIGHT_MULT} Sternenstaub und XP.`
          : `☀️ Tag. Die nächste Nacht beginnt in ${formatDuration(secondsToNight(now))} – dann ×${NIGHT_MULT}.`}
      </p>
      <h4 className="group-title">
        Sternbilder · leuchtend {stars.active.length}/{slots}
      </h4>
      {CONSTELLATIONS.map((c, i) => {
        const rank = stars.ranks[c.id] ?? 0;
        const on = stars.active.includes(c.id);
        const cost = rank < CONSTELLATION_MAX_RANK ? constellationCost(rank) : [];
        const bonus = Object.fromEntries(
          Object.entries(c.perRank).map(([k, v]) => [k, (v ?? 0) * Math.max(1, rank)]),
        );
        return (
          <div key={c.id} className={`building-row ${on ? 'built' : ''}`}>
            <span className="item-icon">{c.icon}</span>
            <span className="shop-meta">
              <strong>
                {c.name}{' '}
                <small className="muted">
                  Rang {rank}/{CONSTELLATION_MAX_RANK} · ab Stufe {c.level}
                </small>
              </strong>
              <small className={on ? 'set-on' : 'muted'}>
                {rank ? (on ? '✦ leuchtet: ' : '○ aus: ') : 'Rang 1: '}
                {describeMods(bonus)}
              </small>
              {cost.length > 0 && (
                <span className="pill-wrap">
                  {cost.map((x) => {
                    const have = inventory[x.item] ?? 0;
                    return (
                      <span key={x.item} className={`item-pill ${have >= x.qty ? '' : 'missing'}`}>
                        {getItem(x.item).icon} {x.qty}× {getItem(x.item).name}{' '}
                        <small>({have})</small>
                      </span>
                    );
                  })}
                </span>
              )}
            </span>
            <span className="shop-buttons">
              <button
                className="btn btn-primary"
                disabled={ok[i] !== 'ok'}
                onClick={() => act((s) => void studyConstellation(s, c.id))}
              >
                {rank >= CONSTELLATION_MAX_RANK ? 'Max' : rank ? 'Ausbauen' : 'Erforschen'}
              </button>
              {rank > 0 && (
                <button
                  className="btn btn-ghost"
                  disabled={!on && stars.active.length >= slots}
                  onClick={() => act((s) => void toggleConstellation(s, c.id))}
                >
                  {on ? 'Ausblenden' : 'Leuchten'}
                </button>
              )}
            </span>
          </div>
        );
      })}
    </section>
  );
}
