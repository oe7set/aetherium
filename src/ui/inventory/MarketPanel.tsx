import { getItem, ITEM_MAP } from '../../data';
import { formatDuration, marketMult, trendMult, unitPrice } from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { ItemIcon } from '../ItemIcon';

/** Dynamic market overview: today's trend, depressed prices, best things to sell right now. */
export function MarketPanel() {
  const trend = useGame((s) => s.game.market.trend);
  const mults = useGame((s) => s.game.market.mults);
  const inventory = useGame((s) => s.game.inventory);
  const game = useGame((s) => s.game);
  const sell = useGame((s) => s.sell);
  const { num, int } = useFmt();

  const sellable = Object.entries(inventory)
    .filter(([id]) => ITEM_MAP.has(id) && getItem(id).sellPrice > 0)
    .map(([id, qty]) => ({
      id,
      qty,
      price: unitPrice(game, id),
      mult: marketMult(game, id) * trendMult(game, id),
    }))
    .sort((a, b) => b.price * b.qty - a.price * a.qty);

  return (
    <div className="market">
      <h3 className="panel-title">📈 Marktplatz</h3>
      <p className="muted small">
        Preise reagieren auf Angebot und Nachfrage: Wer viel auf einmal verkauft, drückt den Preis.
        Nach etwa 15 Minuten hat sich der Markt größtenteils erholt.
      </p>
      {trend ? (
        <div className={`trend ${trend.mult >= 1 ? 'up' : 'down'}`}>
          <span className="item-icon">
            <ItemIcon id={trend.item} />
          </span>
          <span>
            <strong>
              {trend.mult >= 1 ? 'Gefragt' : 'Ladenhüter'}: {getItem(trend.item).name}
            </strong>
            <small>
              Preis ×{trend.mult.toFixed(2).replace('.', ',')} · noch{' '}
              {formatDuration(trend.remaining)}
            </small>
          </span>
        </div>
      ) : (
        <p className="muted">Gerade ist es ruhig auf dem Markt. Die Händler spielen Karten.</p>
      )}
      {Object.keys(mults).length > 0 && (
        <>
          <h4 className="group-title">Gedrückte Preise (erholen sich)</h4>
          <div className="pill-wrap">
            {Object.entries(mults).map(([id, m]) => (
              <span key={id} className="item-pill down">
                {getItem(id).icon} {getItem(id).name} {Math.round(m * 100)} %
              </span>
            ))}
          </div>
        </>
      )}
      <h4 className="group-title">Dein Inventar zum aktuellen Kurs</h4>
      <div className="shop-list">
        {sellable.map((e) => (
          <div key={e.id} className="shop-row">
            <span className="item-icon">
              <ItemIcon id={e.id} />
            </span>
            <span className="shop-meta">
              <strong>
                {getItem(e.id).name} <small className="muted">×{int(e.qty)}</small>
              </strong>
              <small className={e.mult > 1.01 ? 'up' : e.mult < 0.99 ? 'down' : 'muted'}>
                {num(e.price)} 🪙/Stk. ({Math.round(e.mult * 100)} %)
              </small>
            </span>
            <span className="shop-buttons">
              <button
                className="btn"
                onClick={() => sell(e.id, Math.max(1, Math.floor(e.qty / 4)))}
              >
                ¼
              </button>
              <button className="btn btn-gold" onClick={() => sell(e.id, e.qty)}>
                Alle
              </button>
            </span>
          </div>
        ))}
        {sellable.length === 0 && (
          <p className="muted">Nichts zu verkaufen. Zeit, etwas zu sammeln!</p>
        )}
      </div>
    </div>
  );
}
