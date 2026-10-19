import { dailyAvailable, weekKey } from '../engine';
import { useGame } from '../store/gameStore';
import { duration } from './village/vui';

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

/** Island screen: system status at a glance – the empty sky gets a job. */
export function WorldHud() {
  const status = useStatus();
  const setUi = useGame((s) => s.setUi);
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
    </div>
  );
}
