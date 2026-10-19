import { getItem } from '../../data';
import { WORLD_BOSS, WORLD_BOSS_MAP, WORLD_BOSSES } from '../../data/worldboss';
import { combatLevel, defaultRng, formatDuration, strikeWorldBoss } from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { ProgressBar } from '../ProgressBar';

/** Weltboss: the current fight with its damage sources, the strike button and the last results. */
export function WorldBossView() {
  // Rounded so the view does not re-render on every tick.
  useGame((s) => {
    const wb = s.game.worldBoss;
    const f = wb.fight;
    return JSON.stringify([
      f ? [f.boss, Math.ceil(f.hp / 50), Math.ceil(f.left / 10), Math.ceil(f.strikeCd)] : null,
      Math.ceil(wb.next / 60),
      wb.kills,
      wb.history.length,
    ]);
  });
  const game = useGame.getState().game;
  const act = useGame((s) => s.combatAct);
  const { int } = useFmt();
  const wb = game.worldBoss;
  const f = wb.fight;
  const def = f ? WORLD_BOSS_MAP.get(f.boss) : WORLD_BOSSES[wb.kills % WORLD_BOSSES.length];
  const ready = combatLevel(game) >= 10;
  return (
    <div className="worldboss">
      <div className={`weekly-card ${f ? 'live' : ''}`}>
        <div className="weekly-head">
          <span className="weekly-icon">{def?.icon}</span>
          <div>
            <strong>{f ? def?.name : `Nächster Weltboss: ${def?.name}`}</strong>
            <small className="muted">
              {f
                ? `noch ${formatDuration(f.left)} · Phase ${f.hp / f.maxHp > 2 / 3 ? 1 : f.hp / f.maxHp > 1 / 3 ? 2 : 3}/3`
                : ready
                  ? `erscheint in ${formatDuration(wb.next)}`
                  : 'erscheint ab Kampfstufe 10'}
            </small>
          </div>
        </div>
        <p className="small">{def?.desc}</p>
        {f && (
          <>
            <ProgressBar fraction={f.hp / f.maxHp} color="#ff5d73" height={12} />
            <p className="small">
              ❤️ {int(f.hp)} / {int(f.maxHp)}
            </p>
            <div className="stat-chips">
              <span>
                🏝️ Insel {int(f.dmg.island)} ({f.rates.island.toFixed(1)}/s)
              </span>
              <span>
                🏘️ Dorf {int(f.dmg.village)} ({f.rates.village.toFixed(1)}/s)
              </span>
              <span>
                🦸 Held {int(f.dmg.hero)} ({f.rates.hero.toFixed(1)}/s)
              </span>
              <span>💥 Schläge {int(f.dmg.strike)}</span>
            </div>
            <button
              className="btn btn-primary btn-big"
              disabled={f.strikeCd > 0}
              onClick={() => act((s, emit) => void strikeWorldBoss(s, defaultRng, emit))}
            >
              {f.strikeCd > 0 ? `Nächster Schlag in ${Math.ceil(f.strikeCd)} s` : '💥 Mitschlagen!'}
            </button>
          </>
        )}
        <p className="small muted">
          Alle {WORLD_BOSS.interval / 3600} Stunden taucht ein Weltboss auf und bleibt{' '}
          {WORLD_BOSS.duration / 60} Minuten – auch offline. Die Inselwehr (deine Kampfwerte), die
          Truppen aller Dörfer (Angriff) und der Held (wenn er zu Hause ist) kämpfen von selbst; ein
          Schlag pro Minute bringt viel extra. Sieg: Gold, Essenz, Helden-XP, Prägestein, Schutzrune
          und mit etwas Glück das legendäre Stück des Bosses. Jeder Sieg macht den nächsten stärker.
        </p>
      </div>
      <h4 className="rift-h4">
        Bilanz · {wb.kills} Siege
        {wb.bestTime > 0 && ` · schnellster Sieg ${formatDuration(wb.bestTime)}`}
      </h4>
      {wb.history.length === 0 ? (
        <p className="small muted">Noch kein Kampf.</p>
      ) : (
        <ul className="milestones">
          {wb.history.map((h, i) => {
            const b = WORLD_BOSS_MAP.get(h.boss);
            return (
              <li key={i} className={h.won ? 'done' : ''}>
                {h.won ? '🏆' : '💨'} {b?.icon} {b?.name}: {int(h.damage)} Schaden
                {h.won ? ` in ${formatDuration(h.time)}` : ' – entkommen'}
              </li>
            );
          })}
        </ul>
      )}
      <h4 className="rift-h4">Legendäre Beute</h4>
      <ul className="milestones">
        {WORLD_BOSSES.map((b) => (
          <li key={b.id} className={(game.progress.found ?? []).includes(b.unique) ? 'done' : ''}>
            {b.icon} {b.name} → {getItem(b.unique).icon} {getItem(b.unique).name}{' '}
            <small className="muted">({Math.round(WORLD_BOSS.uniqueChance * 100)} % je Sieg)</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
