import { getItem, ITEM_MAP } from '../../data';
import { INVENTION_MAX, INVENTIONS, inventionCost } from '../../data/invention';
import { canInvent, disassemble, disassembleYield, invent } from '../../engine';
import { useGame } from '../../store/gameStore';
import { ItemIcon } from '../ItemIcon';
import { describeMods } from '../modText';

/** Erfinden: take gear from the bag apart and build inventions with the parts. */
export function InventionPanel() {
  const inventory = useGame((s) => s.game.inventory);
  const levels = useGame((s) => JSON.stringify(s.game.inventions));
  const checks = useGame((s) => INVENTIONS.map((d) => canInvent(s.game, d.id)).join(','));
  const act = useGame((s) => s.combatAct);
  const lv = JSON.parse(levels) as Record<string, number>;
  const ok = checks.split(',');
  const gear = Object.entries(inventory)
    .filter(([id, n]) => n > 0 && ITEM_MAP.get(id)?.category === 'gear')
    .sort((a, b) => getItem(a[0]).sellPrice - getItem(b[0]).sellPrice);
  return (
    <section className="buildings invention-panel">
      <h4 className="group-title">Erfindungen</h4>
      {INVENTIONS.map((d, i) => {
        const level = lv[d.id] ?? 0;
        const cost = level < INVENTION_MAX ? inventionCost(d, level) : [];
        const bonus = Object.fromEntries(
          Object.entries(d.perLevel).map(([k, v]) => [k, (v ?? 0) * Math.max(1, level)]),
        );
        return (
          <div key={d.id} className={`building-row ${level ? 'built' : ''}`}>
            <span className="item-icon">{d.icon}</span>
            <span className="shop-meta">
              <strong>
                {d.name}{' '}
                <small className="muted">
                  Stufe {level}/{INVENTION_MAX} · ab Erfinden {d.level}
                </small>
              </strong>
              <small className={level ? 'set-on' : 'muted'}>
                {level ? '✓ ' : ''}
                {describeMods(bonus)}
              </small>
              {cost.length > 0 && (
                <span className="pill-wrap">
                  {cost.map((c) => {
                    const have = inventory[c.item] ?? 0;
                    return (
                      <span key={c.item} className={`item-pill ${have >= c.qty ? '' : 'missing'}`}>
                        {getItem(c.item).icon} {c.qty}× {getItem(c.item).name}{' '}
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
                onClick={() => act((s, emit) => void invent(s, d.id, emit))}
              >
                {level >= INVENTION_MAX ? 'Max' : level ? 'Verbessern' : 'Erfinden'}
              </button>
            </span>
          </div>
        );
      })}
      <h4 className="group-title">Ausrüstung zerlegen</h4>
      {gear.length === 0 ? (
        <p className="small muted">
          Keine Ausrüstung im Inventar. Angelegte Teile werden nie zerlegt – zieh sie vorher aus,
          wenn du sie loswerden willst.
        </p>
      ) : (
        gear.map(([id, n]) => {
          const parts = disassembleYield(id);
          return (
            <div key={id} className="building-row">
              <span className="item-icon">
                <ItemIcon id={id} />
              </span>
              <span className="shop-meta">
                <strong>
                  {getItem(id).name} <small className="muted">×{n}</small>
                </strong>
                <small className="muted">
                  → {parts.map((p) => `${p.qty}× ${getItem(p.item).icon}`).join(' ')}
                </small>
              </span>
              <span className="shop-buttons">
                <button
                  className="btn btn-ghost"
                  onClick={() => act((s, emit) => void disassemble(s, id, 1, emit))}
                >
                  Zerlegen
                </button>
                {n > 1 && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => act((s, emit) => void disassemble(s, id, n, emit))}
                  >
                    Alle
                  </button>
                )}
              </span>
            </div>
          );
        })
      )}
    </section>
  );
}
