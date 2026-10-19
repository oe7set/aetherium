import { getItem } from '../../data';
import { ISLAND_BUILDINGS } from '../../data/construction';
import { buildIsland, canBuildIsland } from '../../engine';
import { useGame } from '../../store/gameStore';
import { describeMods } from '../modText';

/** Baukunst: the nine island buildings with level, next cost and bonus. */
export function BuildingsPanel() {
  const levels = useGame((s) => ISLAND_BUILDINGS.map((b) => s.game.buildings[b.id] ?? 0).join(','));
  const checks = useGame((s) =>
    ISLAND_BUILDINGS.map((b) => canBuildIsland(s.game, b.id)).join(','),
  );
  const inventory = useGame((s) => s.game.inventory);
  const act = useGame((s) => s.combatAct);
  const lv = levels.split(',').map(Number);
  const ok = checks.split(',');
  return (
    <section className="buildings">
      <h4 className="group-title">Inselbauten</h4>
      {ISLAND_BUILDINGS.map((b, i) => {
        const level = lv[i] ?? 0;
        const next = b.levels[level];
        const current = level > 0 ? b.levels[level - 1] : undefined;
        return (
          <div key={b.id} className={`building-row ${level > 0 ? 'built' : ''}`}>
            <span className="item-icon">{b.icon}</span>
            <span className="shop-meta">
              <strong>
                {b.name}{' '}
                <small className="muted">
                  Stufe {level}/{b.levels.length}
                </small>
              </strong>
              <small className="muted">{b.desc}</small>
              {current && <small className="set-on">✓ {describeMods(current.mods)}</small>}
              {next && (
                <small>
                  Nächste (Baukunst {next.level}): {describeMods(next.mods)}
                </small>
              )}
              {next && (
                <span className="pill-wrap">
                  {next.cost.map((c) => {
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
                onClick={() => act((s, emit) => void buildIsland(s, b.id, emit))}
              >
                {!next ? 'Fertig' : level === 0 ? 'Bauen' : 'Ausbauen'}
              </button>
            </span>
          </div>
        );
      })}
    </section>
  );
}
