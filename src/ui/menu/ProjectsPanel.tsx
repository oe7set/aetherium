import { PROJECTS } from '../../data/projects';
import {
  deliverProject,
  projectDelivered,
  projectDone,
  projectStage,
  projectUnlocked,
} from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { describeMods } from '../modText';
import { ProgressBar } from '../ProgressBar';
import { RecipeLink } from './RecipeLink';

/** Großprojekte: every monument with its stages, delivery state and bonuses. */
export function ProjectsPanel() {
  // Re-render when deliveries change; the details are read from the current state below.
  useGame((s) => JSON.stringify(s.game.projects));
  const inventory = useGame((s) => s.game.inventory);
  const act = useGame((s) => s.combatAct);
  const { int } = useFmt();
  const game = useGame.getState().game;
  return (
    <div className="projects">
      <p className="small muted">
        Großprojekte sind die Wunder deiner Insel. Jeder Bauabschnitt braucht Waren aus vielen
        Skills – liefere nach und nach, was du hast. Jeder fertige Abschnitt gibt einen Dauerbonus
        und Baukunst-XP; die Bauten bleiben über jede Wiedergeburt stehen. Der Ätherium-Turm wartet,
        bis alle anderen vollendet sind.
      </p>
      {PROJECTS.map((p) => {
        const stageNo = projectStage(game, p.id);
        const done = projectDone(game, p.id);
        const open = projectUnlocked(game, p.id);
        const stage = p.stages[stageNo];
        const need = stage ? stage.cost.reduce((a, c) => a + c.qty, 0) : 1;
        const have = stage
          ? stage.cost.reduce((a, c) => a + projectDelivered(game, p.id, c.item), 0)
          : 1;
        return (
          <div
            key={p.id}
            className={`project-card glass ${done ? 'done' : ''} ${open ? '' : 'locked'}`}
          >
            <div className="project-head">
              <span className="project-icon">{open ? p.icon : '🔒'}</span>
              <div>
                <strong>{p.name}</strong>
                <small className="muted">
                  {done
                    ? 'Vollendet'
                    : open
                      ? `Abschnitt ${stageNo + 1}/${p.stages.length}: ${stage?.name}`
                      : 'Erst alle anderen Großprojekte vollenden'}
                </small>
              </div>
            </div>
            <p className="small">{p.desc}</p>
            <div className="project-stages">
              {p.stages.map((st, i) => (
                <span key={st.name} className={`project-stage ${i < stageNo ? 'on' : ''}`}>
                  {i < stageNo ? '✔' : i + 1} {st.name}
                </span>
              ))}
            </div>
            {p.stages.slice(0, stageNo).length > 0 && (
              <small className="set-on">
                ✓{' '}
                {describeMods(
                  Object.assign({}, ...p.stages.slice(0, stageNo).map((st) => st.mods)),
                )}
              </small>
            )}
            {stage && open && (
              <>
                <ProgressBar fraction={have / need} color="var(--gold)" height={8} />
                <ul className="project-cost">
                  {stage.cost.map((c) => {
                    const d = projectDelivered(game, p.id, c.item);
                    const bag = inventory[c.item] ?? 0;
                    return (
                      <li key={c.item} className={d >= c.qty ? 'ok' : ''}>
                        <RecipeLink item={c.item} /> {int(d)}/{int(c.qty)}{' '}
                        <small className="muted">(im Inventar {int(bag)})</small>
                      </li>
                    );
                  })}
                </ul>
                <small className="muted">Nach Fertigstellung: {describeMods(stage.mods)}</small>
                <button
                  className="btn btn-primary"
                  disabled={stage.cost.every(
                    (c) =>
                      (inventory[c.item] ?? 0) <= 0 ||
                      projectDelivered(game, p.id, c.item) >= c.qty,
                  )}
                  onClick={() => act((s, emit) => void deliverProject(s, p.id, emit))}
                >
                  📦 Alles Vorhandene liefern
                </button>
              </>
            )}
          </div>
        );
      })}
      <small className="muted">
        Tipp: Antippen einer Ware springt zum Rezept, das sie herstellt.
      </small>
    </div>
  );
}
