import { useState } from 'react';
import { DECORS } from '../data/progress';
import { ISLAND_EVENT_MAP } from '../data/islandEvents';
import { IslandEventPanel } from './IslandEventPanel';
import { dailyAvailable, decorShown, decorUnlocked, toggleDecor, weekKey } from '../engine';
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

/** Inselschmuck: unlocked pieces can be switched on and off; locked ones show how to get them. */
function DecorPanel() {
  const key = useGame((s) =>
    DECORS.map((d) => (decorShown(s.game, d.id) ? 2 : decorUnlocked(s.game, d) ? 1 : 0)).join(''),
  );
  const act = useGame((s) => s.hero);
  return (
    <div className="decor-panel">
      {DECORS.map((d, i) => {
        const state = key[i];
        return (
          <button
            key={d.id}
            className={`decor-opt ${state === '2' ? 'on' : ''} ${state === '0' ? 'locked' : ''}`}
            disabled={state === '0'}
            onClick={() => act((s) => void toggleDecor(s, d.id))}
            title={state === '0' ? `🔒 ${d.hint}` : d.name}
          >
            <span>{state === '0' ? '🔒' : d.icon}</span>
            <small>{state === '0' ? d.hint : d.name}</small>
          </button>
        );
      })}
    </div>
  );
}

/** Island screen: system status at a glance – the empty sky gets a job. */
export function WorldHud() {
  const status = useStatus();
  const setUi = useGame((s) => s.setUi);
  const setDailyOpen = useGame((s) => s.setDailyOpen);
  const [decor, setDecor] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const islandEvent = useGame((s) => {
    const ev = s.game.islandEvent;
    return ev.id ? `${ev.id}|${Math.ceil(ev.left / 60)}` : '';
  });
  const decorCount = useGame((s) => DECORS.filter((d) => decorUnlocked(s.game, d)).length);
  const worldBoss = useGame((s) => {
    const f = s.game.worldBoss.fight;
    return f ? Math.ceil((f.hp / f.maxHp) * 100) : null;
  });
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
          🏘️ <small>Dorf</small> {build === 'free' ? 'bauen!' : duration(Number(build.slice(1)))}
        </button>
        <button
          className={`hud-pill ${hero === 'adventure' ? 'glow' : ''}`}
          onClick={() =>
            setUi({ tab: 'rift', heroSegment: hero === 'adventure' ? 'adventures' : 'hero' })
          }
        >
          {game.hero.avatar} <small>Held</small> {heroText}
        </button>
        <button
          className={`hud-pill ${weekly === 'open' ? 'boss' : ''}`}
          onClick={() => setUi({ tab: 'rift', heroSegment: 'start' })}
        >
          🌀 {essence} <small>Essenz</small>
          {weekly === 'open' && <small> · Boss offen</small>}
        </button>
        <button
          className={`hud-pill ${decor ? 'active' : ''}`}
          onClick={() => setDecor(!decor)}
          aria-expanded={decor}
        >
          🎨 <small>Schmuck</small> {decorCount}/{DECORS.length}
        </button>
        {worldBoss !== null && (
          <button
            className="hud-pill boss"
            onClick={() => setUi({ tab: 'rift', heroSegment: 'boss' })}
          >
            👹 <small>Weltboss</small> {worldBoss} %
          </button>
        )}
        {islandEvent && (
          <button
            className={`hud-pill glow ${eventOpen ? 'active' : ''}`}
            onClick={() => setEventOpen(!eventOpen)}
            aria-expanded={eventOpen}
          >
            {ISLAND_EVENT_MAP.get(islandEvent.split('|')[0]!)?.icon}{' '}
            <small>{ISLAND_EVENT_MAP.get(islandEvent.split('|')[0]!)?.name}</small>{' '}
            {islandEvent.split('|')[1]} min
          </button>
        )}
        {daily && (
          <button className="hud-pill glow gift" onClick={() => setDailyOpen(true)}>
            🎁 Tagesbonus
          </button>
        )}
      </div>
      {decor && <DecorPanel />}
      {eventOpen && islandEvent && <IslandEventPanel />}
    </div>
  );
}
