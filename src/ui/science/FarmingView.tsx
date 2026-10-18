import { useState } from 'react';
import { CROPS, CROP_MAP, getItem } from '../../data';
import { formatDuration, growthRate, skillLevel } from '../../engine';
import { useGame } from '../../store/gameStore';
import { useNow } from '../hooks';
import { ProgressBar } from '../ProgressBar';

/** Real-time farming plots. Growth is simulated by the engine (also offline). */
export function FarmingView() {
  const plots = useGame((s) => s.game.plots);
  const inventory = useGame((s) => s.game.inventory);
  const level = useGame((s) => skillLevel(s.game, 'farming'));
  const rate = useGame((s) => growthRate(s.game));
  const plant = useGame((s) => s.plant);
  const harvestPlot = useGame((s) => s.harvestPlot);
  const autoHarvest = useGame((s) => s.game.techs.includes('fertilizer'));
  const [choice, setChoice] = useState<string>('seed_potato');
  useNow(1000);
  const seeds = CROPS.filter((c) => (inventory[c.seed] ?? 0) > 0);

  return (
    <div className="farming">
      <p className="muted small">
        Bei der Ernte gibt es Saat zurück und mit etwas Glück eine <b>Mutation</b> zur nächsten
        Sorte.
        {autoHarvest && ' 🚜 Auto-Ernte aktiv.'}
      </p>
      <label className="field">
        <span>Saat zum Pflanzen</span>
        <select className="input" value={choice} onChange={(e) => setChoice(e.target.value)}>
          {CROPS.map((c) => (
            <option
              key={c.seed}
              value={c.seed}
              disabled={(inventory[c.seed] ?? 0) <= 0 || level < c.level}
            >
              {c.icon} {c.name} (Lvl {c.level}, {formatDuration(c.growTime / rate)}) ×
              {inventory[c.seed] ?? 0}
            </option>
          ))}
        </select>
      </label>
      {seeds.length === 0 && (
        <p className="warn small">
          Keine Saat! Der Krämer verkauft welche, Vogelnester und Ernten liefern mehr.
        </p>
      )}
      <div className="plots">
        {plots.map((p, i) => {
          const crop = p.seed ? CROP_MAP.get(p.seed) : undefined;
          const fraction = crop ? Math.min(1, p.elapsed / crop.growTime) : 0;
          const ready = crop && fraction >= 1;
          return (
            <div key={i} className={`plot ${ready ? 'ready' : ''}`}>
              <span className="plot-icon" style={{ transform: `scale(${0.5 + fraction * 0.6})` }}>
                {crop ? (fraction < 0.3 ? '🌱' : crop.icon) : '🟫'}
              </span>
              {crop ? (
                <>
                  <small>{crop.name}</small>
                  <ProgressBar fraction={fraction} color="#9ccc4a" height={5} />
                  {ready ? (
                    <button className="btn btn-primary" onClick={() => harvestPlot(i)}>
                      Ernten ({getItem(crop.product).icon})
                    </button>
                  ) : (
                    <small className="muted">
                      {formatDuration((crop.growTime - p.elapsed) / rate)}
                    </small>
                  )}
                </>
              ) : (
                <button
                  className="btn"
                  disabled={(inventory[choice] ?? 0) <= 0}
                  onClick={() => plant(i, choice)}
                >
                  Pflanzen
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
