import { getItem, getSkill } from '../../data';
import { GUILD, GUILD_RANKS, GUILDS, GUILD_MAP } from '../../data/guilds';
import {
  canDeliver,
  defaultRng,
  deliverOrder,
  dropOrder,
  formatDuration,
  guildRank,
  guildRep,
  itemCount,
} from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { ItemIcon } from '../ItemIcon';
import { itemSource } from '../recipes';

/** Zunftaufträge: the order board plus reputation per guild. */
export function GuildBoard() {
  // Re-render when orders, reputation or the relevant item counts change.
  useGame((s) =>
    JSON.stringify([
      s.game.guilds.orders.map((o) => [o.id, Math.floor(o.left / 60)]),
      s.game.guilds.rep,
      s.game.guilds.orders.flatMap((o) => o.lines.map((l) => s.game.inventory[l.item] ?? 0)),
    ]),
  );
  const act = useGame((s) => s.combatAct);
  const jump = useGame((s) => s.jumpToAction);
  const game = useGame.getState().game;
  const { int } = useFmt();
  return (
    <div className="guild-board">
      <p className="small muted">
        Die Zünfte der Insel bestellen Waren aus mehreren Skills. Liefern bringt Gold, XP für die
        herstellenden Skills und Ruf – ab Rang {GUILD.extraSlotRank} kommt ein zusätzlicher Auftrag,
        ab Rang 5 ein Münzbeutel pro Lieferung und eilige ⚡ Sonderaufträge mit seltenen Extras.
        Neue Aufträge kommen alle paar Minuten.
      </p>
      <div className="guild-ranks">
        {GUILDS.map((g) => {
          const rank = guildRank(game, g.id);
          const rep = guildRep(game, g.id);
          return (
            <div key={g.id} className="guild-rank glass" title={g.desc}>
              <span>{g.icon}</span>
              <strong>{g.name}</strong>
              <small>
                {GUILD_RANKS[rank]} · {rep % GUILD.repPerRank}/{GUILD.repPerRank}
              </small>
            </div>
          );
        })}
      </div>
      {game.guilds.orders.length === 0 && (
        <p className="small">📜 Noch keine Aufträge – sie kommen in wenigen Minuten.</p>
      )}
      {game.guilds.orders.map((o) => {
        const g = GUILD_MAP.get(o.guild)!;
        const ready = canDeliver(game, o);
        return (
          <div
            key={o.id}
            className={`guild-order glass ${ready ? 'ready' : ''} ${o.special ? 'special' : ''}`}
          >
            <div className="guild-order-head">
              <span>{g.icon}</span>
              <strong>{o.special ? `⚡ Sonderauftrag: ${g.name}` : g.name}</strong>
              <small className="muted">noch {formatDuration(o.left)}</small>
            </div>
            <ul>
              {o.lines.map((l) => {
                const have = itemCount(game, l.item);
                const src = itemSource(game, l.item);
                return (
                  <li key={l.item} className={have >= l.qty ? 'ok' : ''}>
                    <button
                      className="item-pill link"
                      onClick={() => src?.kind === 'action' && jump(src.action.id)}
                    >
                      <ItemIcon id={l.item} /> {l.qty}× {getItem(l.item).name}
                    </button>{' '}
                    <small className="muted">
                      ({int(Math.min(have, l.qty))}/{l.qty}) · {getSkill(l.skill).icon} +{int(l.xp)}{' '}
                      XP
                    </small>
                  </li>
                );
              })}
            </ul>
            <div className="guild-order-foot">
              <span>
                🪙 {int(o.gold)} · ⭐ +{o.rep} Ruf
                {o.special &&
                  ` · ${getItem(o.special.item).icon} ${o.special.qty}× ${getItem(o.special.item).name}`}
              </span>
              <button
                className="btn btn-ghost"
                onClick={() => act((s) => void dropOrder(s, o.id, defaultRng))}
              >
                Ablehnen
              </button>
              <button
                className="btn btn-primary"
                disabled={!ready}
                onClick={() => act((s, emit) => void deliverOrder(s, o.id, defaultRng, emit))}
              >
                Liefern
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
