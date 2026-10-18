import { useEffect, useState } from 'react';
import { ACTION_MAP, getAction, getSkill } from '../data';
import { canPerform, dailyAvailable, weekKey } from '../engine';
import { useGame } from '../store/gameStore';
import { duration } from './village/vui';

const RECENT_KEY = 'aetherium.recent';
const RECENT_MAX = 4;

function loadRecent(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as unknown;
    return Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** Remembers the last started actions (per device) for one-tap restarts on the island. */
function useRecentActions(): string[] {
  const active = useGame((s) => s.game.active?.actionId ?? null);
  const [recent, setRecent] = useState(loadRecent);
  useEffect(() => {
    if (!active) return;
    setRecent((prev) => {
      const next = [active, ...prev.filter((id) => id !== active)].slice(0, RECENT_MAX + 1);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // storage blocked – the list just lives for this session
      }
      return next;
    });
  }, [active]);
  return recent.filter((id) => id !== active && ACTION_MAP.has(id)).slice(0, RECENT_MAX);
}

/** One status line per system, as a primitive string so the HUD re-renders once a second at most. */
function useStatus(): string {
  return useGame((s) => {
    const g = s.game;
    const v = g.village.villages.find((x) => x.id === g.village.active) ?? g.village.villages[0];
    const q = v ? [...v.queue.field, ...v.queue.center] : [];
    const build = q.length ? `⏳${Math.ceil(Math.min(...q.map((x) => x.remaining)))}` : 'free';
    const h = g.hero;
    const hero =
      h.status === 'dead'
        ? `dead${Math.ceil(h.revive)}`
        : h.trip
          ? `trip${Math.ceil(h.trip.remaining)}`
          : h.status;
    const w = g.rift.weekly;
    const weekly = w.week === weekKey(Date.now()) && w.won ? 'done' : 'open';
    const daily = dailyAvailable(g, Date.now()) ? 'daily' : '';
    return [build, hero, g.rift.essence, weekly, daily].join('|');
  });
}

/** Island screen: system status at a glance plus quick restarts – the empty sky gets a job. */
export function WorldHud() {
  const status = useStatus();
  const recent = useRecentActions();
  const setUi = useGame((s) => s.setUi);
  const start = useGame((s) => s.start);
  const setDailyOpen = useGame((s) => s.setDailyOpen);
  const game = useGame.getState().game;
  const [build, hero, essence, weekly, daily] = status.split('|') as [
    string,
    string,
    string,
    string,
    string,
  ];
  const heroText = hero.startsWith('trip')
    ? `unterwegs ${duration(Number(hero.slice(4)))}`
    : hero.startsWith('dead')
      ? `erholt sich ${duration(Number(hero.slice(4)))}`
      : hero === 'adventure'
        ? 'Abenteuer wartet!'
        : hero === 'raid'
          ? 'auf Raubzug'
          : 'zu Hause';
  return (
    <div className="world-hud">
      <div className="world-hud-row">
        <button
          className={`hud-pill ${build === 'free' ? 'glow' : ''}`}
          onClick={() => setUi({ tab: 'village', villageSegment: 'fields' })}
        >
          🏘️ {build === 'free' ? 'Bauen!' : duration(Number(build.slice(1)))}
        </button>
        <button
          className={`hud-pill ${hero === 'adventure' ? 'glow' : ''}`}
          onClick={() =>
            setUi({ tab: 'rift', heroSegment: hero === 'adventure' ? 'adventures' : 'hero' })
          }
        >
          {game.hero.avatar} {heroText}
        </button>
        <button
          className={`hud-pill ${weekly === 'open' ? 'boss' : ''}`}
          onClick={() => setUi({ tab: 'rift', heroSegment: 'start' })}
        >
          🌀 {essence}
          {weekly === 'open' && <small> · Boss</small>}
        </button>
        {daily && (
          <button className="hud-pill glow gift" onClick={() => setDailyOpen(true)}>
            🎁 Tagesbonus
          </button>
        )}
      </div>
      {recent.length > 0 && (
        <div className="world-hud-row recent">
          <small>Weiter mit</small>
          {recent.map((id) => {
            const a = getAction(id);
            const ok = canPerform(game, a).ok;
            return (
              <button
                key={id}
                className="hud-pill action"
                disabled={!ok}
                onClick={() => start(id)}
                title={`${getSkill(a.skill).name}: ${a.name}`}
              >
                {a.icon} {a.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
