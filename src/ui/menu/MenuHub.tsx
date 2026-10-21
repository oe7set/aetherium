import { ACHIEVEMENTS } from '../../data';
import { PROJECTS } from '../../data/projects';
import {
  affordableTechs,
  canDeliver,
  canFinishStage,
  projectDone,
  passClaimable,
  QUEST_MAP,
  questProgress,
  taskProgress,
  wisdomGain,
} from '../../engine';
import { useGame, type MenuSection, type QuestSegment } from '../../store/gameStore';
import { AgendaList } from '../Agenda';
import { EmpireRankCard } from './EmpireRankCard';
import { useFmt } from '../hooks';

interface Tile {
  section: MenuSection;
  icon: string;
  label: string;
  info: string;
  /** Something is waiting here (gold glow). */
  hot?: boolean;
  questSegment?: QuestSegment;
}

/** „Mehr" as a hub: the next steps on top, every area as a tile in a few logical groups. */
export function MenuHub() {
  // The hub only shows while the menu tab is open, so one game subscription is fine.
  const game = useGame((s) => s.game);
  const setUi = useGame((s) => s.setUi);
  const { int } = useFmt();
  const pass = passClaimable(game).length;
  const tasks = game.tasks.list.filter(
    (t) => !t.claimed && taskProgress(game, t) >= t.target,
  ).length;
  const quests = Object.keys(game.quests.active).filter((id) => {
    const q = QUEST_MAP.get(id);
    return q && questProgress(game, q).every((p) => p.done);
  }).length;
  const orders = game.guilds.orders.filter((o) => canDeliver(game, o)).length;
  const techs = affordableTechs(game).length;
  const wisdom = wisdomGain(game);
  const projects = PROJECTS.filter((p) => projectDone(game, p.id)).length;
  const projectReady = PROJECTS.some((p) => canFinishStage(game, p.id));
  const groups: { title: string; tiles: Tile[] }[] = [
    {
      title: 'Fortschritt',
      tiles: [
        {
          section: 'projects',
          icon: '🏗️',
          label: 'Großprojekte',
          info: `${projects}/${PROJECTS.length} vollendet${projectReady ? ' · lieferbar!' : ''}`,
          hot: projectReady,
        },
        {
          section: 'pass',
          icon: '🏅',
          label: 'Ruhmesleiter',
          info: pass ? `${pass} Stufen abholen` : 'Belohnungen für alles',
          hot: pass > 0,
        },
        {
          section: 'achievements',
          icon: '🏆',
          label: 'Erfolge',
          info: `${game.achievements.length}/${ACHIEVEMENTS.length}`,
        },
        { section: 'empire', icon: '📚', label: 'Reichsbuch', info: 'Alles auf einen Blick' },
        { section: 'stats', icon: '📊', label: 'Statistik', info: 'Zahlen & Rekorde' },
      ],
    },
    {
      title: 'Aufgaben',
      tiles: [
        {
          section: 'quests',
          questSegment: 'quests',
          icon: '📜',
          label: 'Quests',
          info: quests ? `${quests} abgeben` : `${Object.keys(game.quests.active).length} aktiv`,
          hot: quests > 0,
        },
        {
          section: 'quests',
          questSegment: 'guilds',
          icon: '⚒️',
          label: 'Zünfte',
          info: orders ? `${orders} lieferbar` : `${game.guilds.orders.length} Aufträge`,
          hot: orders > 0,
        },
        {
          section: 'quests',
          questSegment: 'tasks',
          icon: '📋',
          label: 'Tagesaufträge',
          info: tasks ? `${tasks} abholen` : 'Täglich & wöchentlich',
          hot: tasks > 0,
        },
        {
          section: 'quests',
          questSegment: 'pets',
          icon: '🐾',
          label: 'Haustiere',
          info: `${game.pets.length} gefunden`,
        },
      ],
    },
    {
      title: 'Wissen & Wiedergeburt',
      tiles: [
        {
          section: 'research',
          icon: '🔬',
          label: 'Forschung',
          info: techs ? `${techs} erforschbar` : `${int(game.research)} Forschungspunkte`,
          hot: techs > 0,
        },
        {
          section: 'prestige',
          icon: '🌅',
          label: 'Wiedergeburt',
          info: wisdom > 0 ? `+${int(wisdom)} Weisheit möglich` : 'Neu anfangen, stärker werden',
        },
      ],
    },
    {
      title: 'System',
      tiles: [
        { section: 'settings', icon: '⚙️', label: 'Einstellungen', info: 'Grafik, Ton, Bedienung' },
        { section: 'save', icon: '💾', label: 'Spielstand', info: 'Speichern & übertragen' },
        { section: 'log', icon: '🗒️', label: 'Ereignisse', info: 'Was zuletzt geschah' },
        ...(import.meta.env.DEV
          ? [
              {
                section: 'debug' as MenuSection,
                icon: '🐞',
                label: 'Debug',
                info: 'Nur Entwicklung',
              },
            ]
          : []),
      ],
    },
  ];
  return (
    <div className="menu-hub">
      <EmpireRankCard />
      <h4 className="group-title">📌 Als Nächstes</h4>
      <AgendaList limit={3} />
      {groups.map((g) => (
        <section key={g.title}>
          <h4 className="group-title">{g.title}</h4>
          <div className="hub-grid">
            {g.tiles.map((tile) => (
              <button
                key={tile.label}
                className={`hub-tile ${tile.hot ? 'hot' : ''}`}
                onClick={(e) => {
                  setUi({
                    menuSection: tile.section,
                    ...(tile.questSegment ? { questSegment: tile.questSegment } : {}),
                  });
                  e.currentTarget.closest('.sheet-body, .center-panel')?.scrollTo({ top: 0 });
                }}
              >
                <span className="hub-icon">{tile.icon}</span>
                <span className="hub-text">
                  <strong>{tile.label}</strong>
                  <small>{tile.info}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
