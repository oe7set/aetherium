import { getItem, getMonster, MONSTERS } from '../../data';
import { MilestonePanel } from '../skills/MilestonePanel';
import {
  SLAYER_BLOCK_MAX,
  SLAYER_SHOP,
  SLAYER_STREAK_EVERY,
  SLAYER_STREAK_MULT,
} from '../../data/slayer';
import {
  buySlayer,
  defaultRng,
  levelProgress,
  newSlayerTask,
  slayerCandidates,
  unblockSlayer,
} from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { ProgressBar } from '../ProgressBar';

/** Kopfgeldjagd: contract, points, shop and the Kopfgeldturm. */
export function SlayerView({ onBack }: { onBack?: () => void }) {
  const xp = useGame((s) => s.game.skills.slayer?.xp ?? 0);
  const task = useGame((s) => s.game.slayer.task);
  const points = useGame((s) => s.game.slayer.points);
  const streak = useGame((s) => s.game.slayer.streak);
  const done = useGame((s) => s.game.slayer.done);
  const blocked = useGame((s) => s.game.slayer.blocked);
  const fighting = useGame((s) => s.game.combat?.monster ?? null);
  const poolSize = useGame((s) => slayerCandidates(s.game).length);
  const act = useGame((s) => s.combatAct);
  const fight = useGame((s) => s.fight);
  const pushFeed = useGame((s) => s.pushFeed);
  const { int } = useFmt();
  const p = levelProgress(xp);
  const toBonus = SLAYER_STREAK_EVERY - (streak % SLAYER_STREAK_EVERY);

  const buy = (id: string) => {
    let res = '';
    act((s, emit) => {
      res = buySlayer(s, id, defaultRng, emit);
    });
    if (res === 'points') pushFeed('🎯 Nicht genug Kopfgeldpunkte.', 'warn');
    else if (res === 'noTask') pushFeed('🎯 Dafür brauchst du einen Auftrag.', 'warn');
    else if (res === 'full') pushFeed(`🎯 Höchstens ${SLAYER_BLOCK_MAX} Sperren.`, 'warn');
  };

  return (
    <div className="skill-view slayer-view">
      {onBack && (
        <button className="btn btn-ghost back" onClick={onBack}>
          ← Alle Skills
        </button>
      )}
      <h2>
        🎯 Kopfgeldjagd <small className="muted">Stufe {p.level}</small>
      </h2>
      <ProgressBar fraction={p.fraction} color="#e5534b" height={8} label="Kopfgeld-XP" />
      <details className="forge-details">
        <summary>🎖️ Meilensteine</summary>
        <MilestonePanel skillId="slayer" />
      </details>
      <p className="skill-desc">
        Jeder Kill an deinem Ziel gibt Kopfgeld-XP. Erfüllte Aufträge bringen Punkte, Gold und alle{' '}
        {SLAYER_STREAK_EVERY} Aufträge in Folge das {SLAYER_STREAK_MULT}-fache.
      </p>

      <div className="slayer-task">
        {task ? (
          <>
            <span className="slayer-icon">{getMonster(task.monster).icon}</span>
            <span className="slayer-body">
              <strong>
                {task.left} × {getMonster(task.monster).name}
              </strong>
              <ProgressBar
                fraction={1 - task.left / Math.max(1, task.total)}
                color="#e5534b"
                height={8}
              />
              <small className="muted">
                {task.total - task.left}/{task.total} erledigt
              </small>
            </span>
            <button
              className="btn btn-primary"
              disabled={fighting === task.monster}
              onClick={() => fight('monster', task.monster)}
            >
              {fighting === task.monster ? 'Jagt …' : '⚔️ Jagen'}
            </button>
          </>
        ) : (
          <>
            <span className="slayer-icon">📜</span>
            <span className="slayer-body">
              <strong>Kein Auftrag</strong>
              <small className="muted">{poolSize} mögliche Ziele für deine Kampfstufe</small>
            </span>
            <button
              className="btn btn-primary"
              disabled={poolSize === 0}
              onClick={() => act((s, emit) => void newSlayerTask(s, defaultRng, emit))}
            >
              Auftrag holen
            </button>
          </>
        )}
      </div>

      <div className="slayer-stats">
        <span>
          🪙 <b>{int(points)}</b> Punkte
        </span>
        <span>
          🔥 Serie <b>{streak}</b> <small className="muted">(Bonus in {toBonus})</small>
        </span>
        <span>
          ✅ <b>{int(done)}</b> Aufträge
        </span>
      </div>

      <h4 className="group-title">Kopfgeld-Laden</h4>
      <div className="shop-list">
        {SLAYER_SHOP.map((e) => (
          <div key={e.id} className="shop-row">
            <span className="item-icon">
              {e.effect.type === 'item' ? getItem(e.effect.item).icon : e.icon}
            </span>
            <span className="shop-meta">
              <strong>{e.name}</strong>
              <small className="muted">{e.desc}</small>
            </span>
            <span className="shop-buttons">
              <button className="btn" disabled={points < e.cost} onClick={() => buy(e.id)}>
                🪙 {e.cost}
              </button>
            </span>
          </div>
        ))}
      </div>

      {blocked.length > 0 && (
        <>
          <h4 className="group-title">Gesperrt</h4>
          <div className="pill-wrap">
            {blocked.map((id) => (
              <button
                key={id}
                className="item-pill link"
                onClick={() => act((s) => unblockSlayer(s, id))}
                title="Sperre aufheben"
              >
                {getMonster(id).icon} {getMonster(id).name} ✕
              </button>
            ))}
          </div>
        </>
      )}

      <h4 className="group-title">Kopfgeldturm</h4>
      <div className="pill-wrap">
        {MONSTERS.filter((m) => m.slayer).map((m) => (
          <span
            key={m.id}
            className={`item-pill ${p.level >= (m.slayer ?? 0) ? '' : 'missing'}`}
            title={m.desc}
          >
            {p.level >= (m.slayer ?? 0) ? m.icon : '🔒'} {m.name} <small>Kopfgeld {m.slayer}</small>
          </span>
        ))}
      </div>
    </div>
  );
}
