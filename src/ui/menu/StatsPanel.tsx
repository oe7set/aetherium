import { ACTIONS, SKILLS } from '../../data';
import { formatDuration, totalLevel } from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt, useNow } from '../hooks';

const LABELS: [string, string][] = [
  ['treesFelled', '🌳 Gefällte Bäume'],
  ['oresMined', '⛏️ Abgebaute Erze'],
  ['fishCaught', '🎣 Gefangene Fische'],
  ['barsSmelted', '🧱 Geschmolzene Barren'],
  ['itemsSmithed', '🔨 Geschmiedete Gegenstände'],
  ['fuelBurned', '🔥 Verbrannter Brennstoff'],
  ['foodCooked', '🍳 Gekochte Speisen'],
  ['foodBurnt', '🪨 Verbrannte Speisen'],
  ['nestsFound', '🪺 Gefundene Vogelnester'],
  ['clicks', '👆 Klicks'],
  ['luckyEvents', '🍀 Glücksereignisse'],
  ['doubleOutputs', '✌️ Doppelte Ausbeute'],
  ['itemsSold', '💰 Verkaufte Items'],
  ['itemsBought', '🛒 Gekaufte Items'],
  ['toolsBought', '🛠️ Gekaufte Werkzeuge'],
  ['goldEarned', '🪙 Verdientes Gold'],
  ['goldSpent', '💸 Ausgegebenes Gold'],
  ['itemsLostFullInventory', '😭 Verlorene Items (Inventar voll)'],
  ['monstersKilled', '⚔️ Besiegte Monster'],
  ['bossKills', '👹 Besiegte Bosse'],
  ['dungeonsCompleted', '🗝️ Dungeon-Durchläufe'],
  ['deaths', '💀 Tode'],
  ['damageDealt', '💥 Verursachter Schaden'],
  ['damageTaken', '🩸 Erlittener Schaden'],
  ['foodEaten', '🍗 Im Kampf gegessen'],
  ['researchEarned', '🔬 Verdiente Forschungspunkte'],
  ['techsResearched', '🧠 Erforschte Technologien'],
  ['harvests', '🌾 Ernten'],
  ['mutations', '🧬 Mutationen'],
  ['helperTasks', '🧑‍🎓 Helfer-Aufgaben'],
  ['questsCompleted', '📜 Quests'],
  ['tasksCompleted', '📋 Aufträge'],
  ['petsFound', '🐾 Haustiere'],
  ['rebirths', '🌅 Wiedergeburten'],
  ['paradigmShifts', '🔄 Paradigmenwechsel'],
  ['bigBangs', '💥 Urknalle'],
];

export function StatsPanel() {
  const stats = useGame((s) => s.game.stats);
  const createdAt = useGame((s) => s.game.createdAt);
  const total = useGame((s) => totalLevel(s.game));
  const xpTotal = useGame((s) => Object.values(s.game.skills).reduce((a, b) => a + b.xp, 0));
  const now = useNow(1000);
  const { num, int } = useFmt();
  const favorite = ACTIONS.reduce<{ name: string; n: number } | null>((best, a) => {
    const n = stats[`action.${a.id}`] ?? 0;
    return n > (best?.n ?? 0) ? { name: a.name, n } : best;
  }, null);

  return (
    <div className="stats">
      <dl className="stat-list">
        <div>
          <dt>⏳ Spielzeit seit Beginn</dt>
          <dd>{formatDuration((now - createdAt) / 1000)}</dd>
        </div>
        <div>
          <dt>📊 Gesamtlevel</dt>
          <dd>
            {total} / {SKILLS.length * 99}
          </dd>
        </div>
        <div>
          <dt>✨ Gesamt-XP</dt>
          <dd>{num(xpTotal)}</dd>
        </div>
        {LABELS.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>
              {key.startsWith('gold') || key.startsWith('damage') || key === 'researchEarned'
                ? num(stats[key] ?? 0)
                : int(stats[key] ?? 0)}
            </dd>
          </div>
        ))}
        {favorite && (
          <div>
            <dt>❤️ Lieblingsbeschäftigung</dt>
            <dd>
              {favorite.name} ({int(favorite.n)}×)
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
