import { useState } from 'react';
import { ITEMS, SKILLS } from '../../data';
import { useGame } from '../../store/gameStore';

/** Development-only cheats. Not included in production builds (guarded by import.meta.env.DEV). */
export function DebugPanel() {
  const debugAdvance = useGame((s) => s.debugAdvance);
  const debugGive = useGame((s) => s.debugGive);
  const debugSetLevel = useGame((s) => s.debugSetLevel);
  const debugGold = useGame((s) => s.debugGold);
  const [item, setItem] = useState(ITEMS[0]?.id ?? '');
  const [qty, setQty] = useState(10);
  const [skill, setSkill] = useState(SKILLS[0]?.id ?? '');
  const [level, setLevel] = useState(50);

  return (
    <div className="debug">
      <h4 className="group-title">⏩ Zeit vorspulen</h4>
      <div className="btn-row">
        {[60, 600, 3600, 8 * 3600, 24 * 3600].map((s) => (
          <button key={s} className="btn" onClick={() => debugAdvance(s)}>
            +{s >= 3600 ? `${s / 3600} h` : `${s / 60} min`}
          </button>
        ))}
      </div>
      <h4 className="group-title">🎁 Items geben</h4>
      <div className="btn-row">
        <select className="input" value={item} onChange={(e) => setItem(e.target.value)}>
          {ITEMS.map((i) => (
            <option key={i.id} value={i.id}>
              {i.icon} {i.name}
            </option>
          ))}
        </select>
        <input
          className="input narrow"
          type="number"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <button className="btn" onClick={() => debugGive(item, qty)}>
          Geben
        </button>
      </div>
      <h4 className="group-title">📈 Level setzen</h4>
      <div className="btn-row">
        <select className="input" value={skill} onChange={(e) => setSkill(e.target.value)}>
          {SKILLS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {s.name}
            </option>
          ))}
        </select>
        <input
          className="input narrow"
          type="number"
          min={1}
          max={99}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
        />
        <button className="btn" onClick={() => debugSetLevel(skill, level)}>
          Setzen
        </button>
      </div>
      <h4 className="group-title">🪙 Gold</h4>
      <div className="btn-row">
        {[1e3, 1e6, 1e9].map((g) => (
          <button key={g} className="btn" onClick={() => debugGold(g)}>
            +{g.toExponential(0)}
          </button>
        ))}
      </div>
    </div>
  );
}
