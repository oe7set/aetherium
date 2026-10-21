import { ACHIEVEMENTS, ELEMENTS, getAction, getMonster, SKILLS, TECHS } from '../../data';
import {
  affordableTechs,
  totalPopulation,
  villageAttention,
  combatLevel,
  conditionValue,
  levelCap,
  levelProgress,
  QUEST_MAP,
  questProgress,
  taskProgress,
  totalLevel,
  wisdomGain,
} from '../../engine';
import { useGame, type MenuSection, type TabId } from '../../store/gameStore';
import { AgendaList } from '../Agenda';
import { EmpireRankCard } from './EmpireRankCard';
import { useFmt } from '../hooks';
import { ProgressBar } from '../ProgressBar';

interface Goal {
  icon: string;
  label: string;
  fraction: number;
  tab: TabId;
  section?: MenuSection;
}

/** „Reichsbuch": one screen with every loop's status and the closest next goals. */
export function EmpirePanel() {
  const game = useGame((s) => s.game);
  const setUi = useGame((s) => s.setUi);
  const { num, int } = useFmt();
  const cap = levelCap(game);

  const goals: Goal[] = [];
  // Closest level-up among unlocked skills.
  const skillGoals = SKILLS.map((sk) => ({
    sk,
    p: levelProgress(game.skills[sk.id]?.xp ?? 0, cap),
  }))
    .filter((x) => x.p.needed > 0)
    .sort((a, b) => b.p.fraction - a.p.fraction);
  for (const { sk, p } of skillGoals.slice(0, 2)) {
    goals.push({
      icon: sk.icon,
      label: `${sk.name} Level ${p.level + 1}`,
      fraction: p.fraction,
      tab: 'skills',
    });
  }
  // Closest achievement.
  const unlocked = new Set(game.achievements);
  const ach = ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && !a.secret)
    .map((a) => ({ a, f: Math.min(0.999, conditionValue(game, a.condition) / a.condition.gte) }))
    .sort((x, y) => y.f - x.f)[0];
  if (ach) goals.push({ icon: '🏆', label: ach.a.name, fraction: ach.f, tab: 'menu' });
  // Cheapest available tech.
  const nextTech = TECHS.filter(
    (t) => !game.techs.includes(t.id) && t.requires.every((r) => game.techs.includes(r)),
  ).sort((a, b) => a.cost - b.cost)[0];
  if (nextTech) {
    goals.push({
      icon: nextTech.icon,
      label: `Forschung: ${nextTech.name}`,
      fraction: Math.min(1, game.research / nextTech.cost),
      tab: 'menu',
      section: 'research',
    });
  }

  const claimableTasks = game.tasks.list.filter(
    (t) => !t.claimed && taskProgress(game, t) >= t.target,
  ).length;
  const readyQuests = Object.keys(game.quests.active).filter((id) => {
    const q = QUEST_MAP.get(id);
    return q && questProgress(game, q).every((p) => p.done);
  }).length;
  const activity = game.combat
    ? `⚔️ Kampf gegen ${getMonster(game.combat.monster).name}`
    : game.active
      ? `${getAction(game.active.actionId).icon} ${getAction(game.active.actionId).name}`
      : '🧍 Untätig';

  return (
    <div className="empire">
      <div className="empire-hero">
        <span className="empire-crest">Æ</span>
        <div>
          <h3>Reichsbuch</h3>
          <small className="muted">Alle Bereiche deines Reichs auf einen Blick</small>
        </div>
      </div>

      <EmpireRankCard details />

      <section className="empire-next">
        <h4 className="group-title">📌 Als Nächstes</h4>
        <AgendaList limit={4} />
      </section>

      <div className="empire-grid">
        <button className="empire-card" onClick={() => setUi({ tab: 'skills' })}>
          <span className="empire-card-icon">🏝️</span>
          <strong>Insel</strong>
          <small>{activity}</small>
          <small className="muted">
            📊 Gesamtlevel {total(game)} · ⚔️ Kampf {combatLevel(game)}
          </small>
        </button>
        <button className="empire-card" onClick={() => setUi({ tab: 'village' })}>
          <span className="empire-card-icon">🏘️</span>
          <strong>Dörfer</strong>
          <small>
            {game.village.villages.length} Dorf{game.village.villages.length === 1 ? '' : 'er'} ·{' '}
            {int(totalPopulation(game))} Einwohner
          </small>
          <small className="muted">
            🎭 {int(game.village.cp)} Kulturpunkte · 🛡️ {game.village.invasionsWon} Invasionen
            abgewehrt
          </small>
          {villageAttention(game) > 0 && (
            <span className="empire-badge">{villageAttention(game)} neue Berichte</span>
          )}
        </button>
        <button
          className="empire-card"
          onClick={() => setUi({ tab: 'menu', menuSection: 'research' })}
        >
          <span className="empire-card-icon">🔬</span>
          <strong>Forschung</strong>
          <small>
            {game.techs.length}/{TECHS.length} Techs · {num(game.research)} Punkte
          </small>
          <small className="muted">
            ⚛️ {game.codex.length}/{ELEMENTS.length} Elemente · 🧑‍🎓 {game.helpers.length} Helfer
          </small>
          {affordableTechs(game).length > 0 && (
            <span className="empire-badge">{affordableTechs(game).length} bezahlbar</span>
          )}
        </button>
        <button
          className="empire-card"
          onClick={() => setUi({ tab: 'menu', menuSection: 'quests' })}
        >
          <span className="empire-card-icon">📜</span>
          <strong>Aufträge & Quests</strong>
          <small>
            {game.quests.done.length} Quests erledigt · 🐾 {game.pets.length} Haustiere
          </small>
          {claimableTasks + readyQuests > 0 && (
            <span className="empire-badge">{claimableTasks + readyQuests} abholbereit</span>
          )}
        </button>
        <button
          className="empire-card"
          onClick={() => setUi({ tab: 'menu', menuSection: 'prestige' })}
        >
          <span className="empire-card-icon">🌅</span>
          <strong>Prestige</strong>
          <small>
            🦉 {int(game.prestige.wisdomTotal)} Weisheit · {game.prestige.rebirths} Wiedergeburten
          </small>
          <small className="muted">Nächste Wiedergeburt: +{wisdomGain(game)} Weisheit</small>
        </button>
      </div>

      <h4 className="group-title">Nächste Ziele</h4>
      <div className="goal-list">
        {goals.map((g) => (
          <button
            key={g.label}
            className="goal"
            onClick={() => setUi({ tab: g.tab, ...(g.section ? { menuSection: g.section } : {}) })}
          >
            <span className="goal-icon">{g.icon}</span>
            <span className="goal-body">
              <span>{g.label}</span>
              <ProgressBar fraction={g.fraction} height={6} />
            </span>
            <small className="muted">{Math.floor(g.fraction * 100)} %</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function total(g: Parameters<typeof totalLevel>[0]): number {
  return totalLevel(g);
}
