import { BIOMES } from '../../data/rift';
import { MilestonePanel } from '../skills/MilestonePanel';
import {
  RELIC_MAP,
  RELIC_SETS,
  RELICS,
  RIFTWALKER_MILESTONES,
  RIFTWALKER_PER_LEVEL,
  RIFTWALKER_XP,
} from '../../data/riftwalker';
import { levelProgress } from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { ProgressBar } from '../ProgressBar';

/** Rissläufer level with milestones and the relic collection (rift hub and skill view). */
export function RelicsView() {
  const xp = useGame((s) => s.game.skills.riftwalker?.xp ?? 0);
  const owned = useGame((s) => s.game.rift.relics.join(','));
  const { int } = useFmt();
  const p = levelProgress(xp);
  const have = new Set(owned ? owned.split(',') : []);
  const lvl = p.level - 1;
  return (
    <div className="rift-relics">
      <div className="fame-hero glass">
        <span className="essence-orb">🌀</span>
        <div>
          <strong className="rift-heading">Rissläufer Stufe {p.level}</strong>
          <ProgressBar fraction={p.fraction} color="#b38cff" height={8} />
          <small className="muted">
            {int(p.current)} / {int(p.needed)} XP · jetzt +
            {(lvl * RIFTWALKER_PER_LEVEL.might * 100).toFixed(1)} % Schaden, +
            {Math.floor(lvl * RIFTWALKER_PER_LEVEL.maxHp)} Leben im Riss
          </small>
        </div>
      </div>
      <p className="small muted">
        XP gibt es für jeden Lauf: Überleben, Kills, Stufen, Bosse (je {RIFTWALKER_XP.perBoss}) und
        Siege (+{RIFTWALKER_XP.win}); tiefere Biome geben mehr. Live-Abenteuer zählen zur Hälfte.
      </p>
      <h4 className="rift-h4">Meilensteine</h4>
      <ul className="milestones">
        {RIFTWALKER_MILESTONES.map((m) => (
          <li key={m.level} className={p.level >= m.level ? 'done' : ''}>
            <span>{p.level >= m.level ? '✅' : m.icon}</span> Stufe {m.level}: {m.label}
          </li>
        ))}
      </ul>
      <h4 className="rift-h4">
        Relikte {have.size}/{RELICS.length}
      </h4>
      <p className="small muted">
        Relikte lassen Riss-Bosse fallen (jeder Boss und jeder Sieg ist eine Chance). Sie wirken in
        jedem Lauf – manche auch auf der Insel.
      </p>
      <h4 className="rift-h4">Relikt-Sets</h4>
      <ul className="milestones">
        {RELIC_SETS.map((set) => {
          const n = set.relics.filter((id) => have.has(id)).length;
          return (
            <li key={set.id} className={n === set.relics.length ? 'done' : ''}>
              {n === set.relics.length ? '✅' : set.icon} {set.name} ({n}/{set.relics.length}):{' '}
              {set.desc} –{' '}
              {set.relics.map((id) => (have.has(id) ? RELIC_MAP.get(id)?.icon : '❔')).join(' ')}
            </li>
          );
        })}
      </ul>
      <div className="talent-grid">
        {RELICS.map((r) => {
          const got = have.has(r.id);
          const where = [
            r.biome ? BIOMES.find((b) => b.id === r.biome)?.name : 'jedes Biom',
            r.winOnly ? 'nur Siege' : '',
          ]
            .filter(Boolean)
            .join(', ');
          return (
            <div key={r.id} className={`rift-talent ${got ? 'owned' : 'missing'}`}>
              <span className="talent-icon">{got ? r.icon : '❔'}</span>
              <strong>{got ? r.name : '???'}</strong>
              <small>{got ? r.desc : `Fundort: ${where}`}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Skill view for Rissläufer: progress, relics and the way into the rift. */
export function RiftwalkerSkillView({ onBack }: { onBack?: () => void }) {
  const setUi = useGame((s) => s.setUi);
  return (
    <div className="skill-view">
      {onBack && (
        <button className="btn btn-ghost back" onClick={onBack}>
          ← Alle Skills
        </button>
      )}
      <h2>🌀 Rissläufer</h2>
      <button
        className="btn btn-primary"
        onClick={() => setUi({ tab: 'rift', heroSegment: 'start' })}
      >
        Zum Ätherriss
      </button>
      <details className="forge-details">
        <summary>🎖️ Meilensteine</summary>
        <MilestonePanel skillId="riftwalker" />
      </details>
      <RelicsView />
    </div>
  );
}
