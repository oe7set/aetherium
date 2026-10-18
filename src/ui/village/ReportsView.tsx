import { TROOPS, V_RES_INFO, V_RESOURCES } from '../../data/village';
import { useGame } from '../../store/gameStore';
import { duration } from './vui';

export function ReportsView() {
  const vs = useGame.getState().game.village;
  if (!vs.reports.length)
    return (
      <p className="muted small center">
        Noch keine Berichte. Raubzüge, Invasionen und Gründungen landen hier.
      </p>
    );
  return (
    <div className="v-reports">
      {vs.reports.map((r) => (
        <article key={r.id} className={`v-report glass ${r.won ? 'won' : 'lost'} kind-${r.kind}`}>
          <header>
            <strong>{r.title}</strong>
            <small className="muted">vor {duration(vs.clock - r.at)}</small>
          </header>
          <p className="small">{r.text}</p>
          {r.loot && V_RESOURCES.some((x) => (r.loot?.[x] ?? 0) > 0) && (
            <p className="small">
              {r.kind === 'invasion' ? 'Verlust: ' : 'Beute: '}
              {V_RESOURCES.map((x) =>
                r.loot![x] > 0 ? `${V_RES_INFO[x].icon} ${r.loot![x]} ` : '',
              ).join('')}
            </p>
          )}
          {r.losses && Object.values(r.losses).some((n) => n > 0) && (
            <p className="small muted">
              {Object.entries(r.losses)
                .filter(([, n]) => n > 0)
                .map(([id, n]) => `${TROOPS.find((x) => x.id === id)?.icon ?? id} −${n}`)
                .join('  ')}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
