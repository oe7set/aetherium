import { useEffect, useState } from 'react';
import { getAction } from '../data';
import { LOADING_TIPS } from '../data/flavor';
import { pick, defaultRng } from '../engine';
import { DAY_SECONDS } from '../scene/time';
import { useGame } from '../store/gameStore';

interface Station {
  skill: string;
  label: string;
  icon: string;
  className: string;
}

const STATIONS: Station[] = [
  { skill: 'woodcutting', label: 'Wald', icon: '🌳', className: 'st-forest' },
  { skill: 'mining', label: 'Mine', icon: '🪨', className: 'st-mine' },
  { skill: 'firemaking', label: 'Lagerfeuer', icon: '🔥', className: 'st-fire' },
  { skill: 'cooking', label: 'Kochstelle', icon: '🍲', className: 'st-cook' },
  { skill: 'fishing', label: 'Angelplatz', icon: '🎣', className: 'st-fish' },
  { skill: 'smithing', label: 'Schmiede', icon: '⚒️', className: 'st-forge' },
  { skill: 'combat', label: 'Arena', icon: '⚔️', className: 'st-arena' },
  { skill: 'farming', label: 'Felder', icon: '🌾', className: 'st-farm' },
  { skill: 'crafting', label: 'Werkbank', icon: '🪚', className: 'st-craft' },
  { skill: 'research', label: 'Turm', icon: '🗼', className: 'st-tower' },
  { skill: 'archaeology', label: 'Grabung', icon: '🏺', className: 'st-dig' },
  { skill: 'hunting', label: 'Jagd', icon: '🦌', className: 'st-hunt' },
  { skill: 'alchemy', label: 'Alchemie', icon: '⚗️', className: 'st-alch' },
  { skill: 'enchanting', label: 'Runen', icon: '🔯', className: 'st-ench' },
  { skill: 'arcane', label: 'Äther', icon: '💠', className: 'st-arc' },
  { skill: 'faith', label: 'Schrein', icon: '🛕', className: 'st-faith' },
  { skill: 'brewing', label: 'Brauerei', icon: '🍺', className: 'st-brew' },
  { skill: 'jewelcrafting', label: 'Juwelier', icon: '💎', className: 'st-jewel' },
  { skill: 'slayer', label: 'Kopfgeld', icon: '🎯', className: 'st-slayer' },
  { skill: 'summoning', label: 'Beschwörung', icon: '🐾', className: 'st-summon' },
  { skill: 'thieving', label: 'Markt', icon: '🗝️', className: 'st-thief' },
  { skill: 'construction', label: 'Bauplatz', icon: '🔨', className: 'st-build' },
  { skill: 'cartography', label: 'Karten', icon: '🧭', className: 'st-map' },
  { skill: 'agility', label: 'Parcours', icon: '🏃', className: 'st-agi' },
  { skill: 'astronomy', label: 'Sterne', icon: '🔭', className: 'st-astro' },
  { skill: 'sailing', label: 'Hafen', icon: '⚓', className: 'st-sail' },
  { skill: 'husbandry', label: 'Weide', icon: '🐄', className: 'st-herd' },
  { skill: 'fletching', label: 'Bogner', icon: '🪶', className: 'st-fletch' },
];

function skyFor(phase: number): { sky: string; night: number } {
  // phase 0..1: 0 = midnight, 0.5 = noon
  const daylight = Math.max(0, Math.sin((phase - 0.25) * Math.PI * 2) * 0.5 + 0.5);
  return {
    sky: `hsl(${205 + (1 - daylight) * 25} ${45 + daylight * 25}% ${10 + daylight * 55}%)`,
    night: 1 - daylight,
  };
}

/**
 * Phase-1 world: a lightweight 2D diorama with tappable stations. Phase 2 replaces it with the
 * React-Three-Fiber island; this view stays as the battery-saver fallback.
 */
export function WorldView() {
  const activeSkill = useGame((s) =>
    s.game.active ? getAction(s.game.active.actionId).skill : null,
  );
  const fire = useGame((s) => s.game.fire > 0);
  const tapStation = useGame((s) => s.tapStation);
  const [tip, setTip] = useState(() => pick(defaultRng, LOADING_TIPS));
  const [phase, setPhase] = useState(() => ((Date.now() / 1000) % DAY_SECONDS) / DAY_SECONDS);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTip(pick(defaultRng, LOADING_TIPS));
    }, 15_000);
    const sky = window.setInterval(
      () => setPhase(((Date.now() / 1000) % DAY_SECONDS) / DAY_SECONDS),
      5_000,
    );
    return () => {
      window.clearInterval(id);
      window.clearInterval(sky);
    };
  }, []);

  const { sky, night } = skyFor(phase);
  const stationSkill = activeSkill;
  const characterAt = STATIONS.find((s) => s.skill === stationSkill)?.className ?? 'st-idle';

  return (
    <div className="world" style={{ ['--sky' as string]: sky, ['--night' as string]: night }}>
      <div className="world-sky">
        <span className="celestial sun" style={{ transform: `rotate(${phase * 360}deg)` }}>
          <span>☀️</span>
        </span>
        <span className="celestial moon" style={{ transform: `rotate(${phase * 360 + 180}deg)` }}>
          <span>🌙</span>
        </span>
        <span className="stars" aria-hidden>
          ✦ · ✧ · ✦ · ✧
        </span>
      </div>
      <div className="world-island">
        <span className="deco deco-river" aria-hidden />
        {STATIONS.map((st) => (
          <button
            key={st.skill}
            className={`station ${st.className} ${activeSkill === st.skill ? 'active' : ''} ${
              st.skill === 'firemaking' && fire ? 'lit' : ''
            }`}
            onClick={() => tapStation(st.skill)}
            aria-label={st.label}
          >
            <span className="station-icon">
              {st.skill === 'firemaking' && !fire ? '🪵' : st.icon}
            </span>
            <span className="station-label">{st.label}</span>
          </button>
        ))}
        <span className={`character ${characterAt} ${activeSkill ? 'working' : ''}`} aria-hidden>
          🧑‍🌾
        </span>
      </div>
      <p className="world-tip">💡 {tip}</p>
    </div>
  );
}
