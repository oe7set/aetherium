import { useState } from 'react';
import { PETS, QUESTS, CAT_STATES } from '../../data/meta';
import {
  formatDuration,
  questProgress,
  questRewardText,
  questStatus,
  taskLabel,
  taskProgress,
  taskReward,
} from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt, useNow } from '../hooks';
import { describeMods } from '../modText';
import { ProgressBar } from '../ProgressBar';

type Segment = 'tasks' | 'quests' | 'pets';

function msUntilMidnight(now: number): number {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime() - now;
}

function Tasks() {
  const game = useGame((s) => s.game);
  const claim = useGame((s) => s.claim);
  const now = useNow(1000);
  const { num, int } = useFmt();
  const groups: ['day' | 'week', string][] = [
    ['day', `Tagesaufträge · neu in ${formatDuration(msUntilMidnight(now) / 1000)}`],
    ['week', 'Wochenaufträge · neu am Montag'],
  ];
  return (
    <div className="tasks">
      {groups.map(([period, title]) => (
        <section key={period}>
          <h4 className="group-title">{title}</h4>
          {game.tasks.list
            .filter((t) => t.period === period)
            .map((t) => {
              const progress = taskProgress(game, t);
              const reward = taskReward(game, t);
              const done = progress >= t.target;
              return (
                <div key={t.id} className={`task ${t.claimed ? 'claimed' : done ? 'done' : ''}`}>
                  <span className="task-body">
                    <strong>{taskLabel(t)}</strong>
                    <ProgressBar fraction={progress / t.target} color="var(--gold)" height={6} />
                    <small className="muted">
                      {int(progress)} / {int(t.target)} · 🎁 {num(reward.gold)} Gold,{' '}
                      {num(reward.research)} Forschung
                      {reward.chest ? ', Dungeon-Truhe' : ''}
                    </small>
                  </span>
                  <button
                    className="btn btn-gold"
                    disabled={!done || t.claimed}
                    onClick={() => claim(t.id)}
                  >
                    {t.claimed ? '✔' : 'Einlösen'}
                  </button>
                </div>
              );
            })}
        </section>
      ))}
    </div>
  );
}

function Quests() {
  const game = useGame((s) => s.game);
  const take = useGame((s) => s.takeQuest);
  const turnIn = useGame((s) => s.turnInQuest);
  const [showDone, setShowDone] = useState(false);
  const order = { active: 0, available: 1, locked: 2, done: 3 } as const;
  const list = QUESTS.map((q) => ({ q, status: questStatus(game, q.id) }))
    .filter((x) => showDone || x.status !== 'done')
    .sort((a, b) => order[a.status] - order[b.status]);

  return (
    <div className="quests">
      <p className="muted small">
        {game.quests.done.length}/{QUESTS.length} Quests abgeschlossen.
      </p>
      <label className="toggle small">
        <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
        Abgeschlossene anzeigen
      </label>
      {list.map(({ q, status }) => {
        const progress = status === 'active' ? questProgress(game, q) : [];
        const ready = progress.length > 0 && progress.every((p) => p.done);
        return (
          <div key={q.id} className={`quest ${status}`}>
            <div className="combat-row">
              <strong>
                {status === 'locked' ? '🔒' : q.icon} {q.name}
              </strong>
              <small className="muted">{q.giver}</small>
            </div>
            {status !== 'locked' && (
              <p className="quest-story">{status === 'done' ? q.outro : q.story}</p>
            )}
            {status === 'locked' && (
              <p className="muted small">Schalte zuerst vorherige Quests frei.</p>
            )}
            {status === 'active' &&
              progress.map((p) => (
                <div key={p.label} className="quest-objective">
                  <small>
                    {p.done ? '✅' : '⬜'} {p.label} ({p.current}/{p.target})
                  </small>
                  <ProgressBar fraction={p.current / p.target} color="#7ddc6a" height={4} />
                </div>
              ))}
            {status !== 'locked' && status !== 'done' && (
              <small className="reward">🎁 {questRewardText(q)}</small>
            )}
            {status === 'available' && (
              <button className="btn btn-primary" onClick={() => take(q.id)}>
                Annehmen
              </button>
            )}
            {status === 'active' && (
              <button className="btn btn-gold" disabled={!ready} onClick={() => turnIn(q.id)}>
                {ready ? 'Abgeben' : 'In Arbeit …'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Pets() {
  const pets = useGame((s) => s.game.pets);
  const catState = useGame((s) => s.game.catState);
  const peekCat = useGame((s) => s.peekCat);
  return (
    <div className="pets">
      <p>
        🐾 <b>{pets.length}</b> / {PETS.length} Haustiere gefunden
      </p>
      <p className="muted small">
        Haustiere sind extrem seltene Funde (oft 1 : 5.000). Jedes gibt einen dauerhaften Bonus.
      </p>
      <div className="pet-grid">
        {PETS.map((pet) => {
          const owned = pets.includes(pet.id);
          const cat =
            pet.id === 'pet_cat' && owned && catState !== 'unknown' ? CAT_STATES[catState] : null;
          return (
            <div key={pet.id} className={`pet ${owned ? 'owned' : ''}`}>
              <span className="pet-icon">{owned ? (cat?.icon ?? pet.icon) : '❔'}</span>
              <strong>{owned ? (cat?.name ?? pet.name) : '???'}</strong>
              <small className="muted">
                {owned
                  ? (cat?.desc ?? pet.desc)
                  : `Quelle: ${pet.source.skill ? 'ein Skill' : 'ein Boss'} · 1/${Math.round(1 / pet.chance).toLocaleString('de-DE')}`}
              </small>
              {owned && <small className="reward">🎁 {describeMods(cat?.mods ?? pet.mods)}</small>}
              {owned && pet.id === 'pet_cat' && catState === 'unknown' && (
                <button className="btn btn-primary" onClick={peekCat}>
                  📦 Kiste öffnen
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function QuestsPanel() {
  const [seg, setSeg] = useState<Segment>('tasks');
  const claimable = useGame(
    (s) =>
      s.game.tasks.list.filter((t) => !t.claimed && taskProgress(s.game, t) >= t.target).length,
  );
  return (
    <div className="panel">
      <div className="segments" role="tablist">
        {(['tasks', 'quests', 'pets'] as Segment[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={seg === k}
            className={`segment ${seg === k ? 'active' : ''}`}
            onClick={() => setSeg(k)}
          >
            {k === 'tasks'
              ? `Aufträge${claimable ? ` (${claimable})` : ''}`
              : k === 'quests'
                ? 'Quests'
                : 'Haustiere'}
          </button>
        ))}
      </div>
      {seg === 'tasks' && <Tasks />}
      {seg === 'quests' && <Quests />}
      {seg === 'pets' && <Pets />}
    </div>
  );
}
