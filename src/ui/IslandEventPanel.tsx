import { getItem, getSkill } from '../data';
import { activeIslandEvent, buyTraderDeal } from '../engine';
import { useGame } from '../store/gameStore';
import { useFmt } from './hooks';
import { ItemIcon } from './ItemIcon';
import { describeMods } from './modText';
import { duration } from './village/vui';

/** Running island event: what it boosts, what drops, and the Wanderhändler's stock. */
export function IslandEventPanel() {
  const key = useGame((s) => {
    const ev = s.game.islandEvent;
    return `${ev.id}|${Math.ceil(ev.left / 10)}|${ev.deals.map((d) => d.bought).join()}`;
  });
  const gold = useGame((s) => s.game.gold);
  const act = useGame((s) => s.combatAct);
  const { int } = useFmt();
  const game = useGame.getState().game;
  const ev = activeIslandEvent(game);
  if (!ev || !key) return null;
  return (
    <div className="island-event glass">
      <div className="island-event-head">
        <span className="island-event-icon">{ev.icon}</span>
        <div>
          <strong>{ev.name}</strong>
          <small className="muted">noch {duration(game.islandEvent.left)}</small>
        </div>
      </div>
      <p className="small">{ev.desc}</p>
      <small className="set-on">✓ {describeMods(ev.mods)}</small>
      {ev.drop && (
        <small className="muted">
          {ev.skills.map((sk) => getSkill(sk).icon).join('')} Beim Arbeiten findest du manchmal:{' '}
          {getItem(ev.drop.item).icon} {getItem(ev.drop.item).name} (
          {Math.round(ev.drop.chance * 100)} % je Aktion)
        </small>
      )}
      {ev.trader && (
        <ul className="trader-deals">
          {game.islandEvent.deals.map((d, i) => (
            <li key={d.item} className={d.bought ? 'bought' : ''}>
              <ItemIcon id={d.item} />
              <span>
                {d.qty}× {getItem(d.item).name}
              </span>
              <button
                className="btn btn-primary"
                disabled={d.bought || gold.lt(d.price)}
                onClick={() => act((s, emit) => void buyTraderDeal(s, i, emit))}
              >
                {d.bought ? 'Gekauft' : `🪙 ${int(d.price)}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
