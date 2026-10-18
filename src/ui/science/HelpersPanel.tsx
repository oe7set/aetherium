import { ACTIONS, getAction, getSkill, HELPERS, HELPER_MAP } from '../../data';
import { canPerform, helperSlots, helperSpeed } from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';

export function HelpersPanel() {
  const helpers = useGame((s) => s.game.helpers);
  const techs = useGame((s) => s.game.techs);
  const game = useGame((s) => s.game);
  const gold = useGame((s) => s.game.gold);
  const hire = useGame((s) => s.hire);
  const assign = useGame((s) => s.assign);
  const dismiss = useGame((s) => s.dismissHelperAt);
  const { num, int } = useFmt();
  const slots = helperSlots(game);
  const doable = ACTIONS.filter((a) => canPerform(game, a).ok);

  if (!techs.includes('interns')) {
    return (
      <p className="muted">
        🔒 Erforsche „Praktikumsprogramm“, um Helfer einzustellen. Dann arbeiten andere für dich –
        auch offline.
      </p>
    );
  }

  return (
    <div className="helpers">
      <p>
        🧑‍🎓 {helpers.length}/{slots} Helferplätze belegt
      </p>
      <p className="muted small">
        Helfer arbeiten parallel zu dir an einer eigenen Aufgabe und teilen dein Inventar. Sie
        bekommen nur einen Teil der XP.
      </p>
      {helpers.map((h, i) => {
        const def = HELPER_MAP.get(h.type)!;
        return (
          <div key={i} className="shop-row">
            <span className="item-icon">{def.icon}</span>
            <span className="shop-meta">
              <strong>
                {def.name} #{i + 1}{' '}
                <small className="muted">
                  Tempo ×{helperSpeed(game, h).toFixed(2).replace('.', ',')} · {int(h.done)}{' '}
                  erledigt
                </small>
              </strong>
              <select
                className="input"
                value={h.actionId ?? ''}
                onChange={(e) => assign(i, e.target.value || null)}
              >
                <option value="">— Pause —</option>
                {h.actionId && !doable.some((a) => a.id === h.actionId) && (
                  <option value={h.actionId}>{getAction(h.actionId).name}</option>
                )}
                {doable.map((a) => (
                  <option key={a.id} value={a.id}>
                    {getSkill(a.skill).icon} {a.name}
                  </option>
                ))}
              </select>
            </span>
            <span className="shop-buttons">
              <button className="btn" onClick={() => dismiss(i)} title="Entlassen">
                ✖
              </button>
            </span>
          </div>
        );
      })}
      <h4 className="group-title">Einstellen</h4>
      {HELPERS.map((def) => {
        const unlocked = techs.includes(def.requiresTech);
        return (
          <div key={def.id} className={`shop-row ${unlocked ? '' : 'locked'}`}>
            <span className="item-icon">{unlocked ? def.icon : '🔒'}</span>
            <span className="shop-meta">
              <strong>
                {def.name}{' '}
                <small className="muted">
                  Tempo ×{def.efficiency.toLocaleString('de-DE')} · {Math.round(def.xpShare * 100)}{' '}
                  % XP
                </small>
              </strong>
              <small className="muted">{def.desc}</small>
            </span>
            <span className="shop-buttons">
              <button
                className="btn btn-gold"
                disabled={!unlocked || helpers.length >= slots || gold.lt(def.cost)}
                onClick={() => hire(def.id)}
              >
                {num(def.cost)}🪙
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
