import { getItem, ITEM_MAP, type ActionDef } from '../../data';
import { ISLAND_BUILDING_MAP } from '../../data/construction';
import { SHIP_NAMES } from '../../data/sailing';
import { BALANCE } from '../../data/balance';
import {
  actionDuration,
  actionXp,
  buildingMissing,
  shipNeeded,
  shipTier,
  burnChance,
  craftableTimes,
  formatDuration,
  formatPercent,
  formatSeconds,
  MASTERY_MAX,
  masteryDouble,
  masteryProgress,
  masterySpeed,
  skillLevel,
  stealFailChance,
  toolSpeed,
  xpMultiplierFor,
} from '../../engine';
import { t } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { ItemIcon } from '../ItemIcon';
import { itemSource } from '../recipes';
import { Tip } from '../Tip';

/** An ingredient: tap jumps to the action that makes it (or the shop that sells it). */
function IngredientPill({
  item,
  ok,
  label,
  have,
}: {
  item: string;
  ok: boolean;
  label: React.ReactNode;
  have: string;
}) {
  const jump = useGame((s) => s.jumpToAction);
  const setUi = useGame((s) => s.setUi);
  const openSkill = useGame((s) => s.openSkill);
  const source = itemSource(useGame.getState().game, item);
  if (!source)
    return (
      <span className={`item-pill ${ok ? '' : 'missing'}`}>
        {label} <small>({have})</small>
      </span>
    );
  const go = () =>
    source.kind === 'action'
      ? jump(source.action.id)
      : source.kind === 'combat'
        ? openSkill('melee')
        : setUi({ tab: 'inventory', inventorySegment: 'shop' });
  return (
    <button
      className={`item-pill link ${ok ? '' : 'missing'}`}
      onClick={go}
      title={
        source.kind === 'action'
          ? `Herstellen: ${source.action.name} (Lv ${source.action.levelReq})`
          : source.kind === 'combat'
            ? 'Beute aus Kämpfen'
            : 'Beim Krämer kaufen'
      }
    >
      {label} <small>({have})</small>{' '}
      <span className="pill-go">
        {source.kind === 'shop' ? '🏪' : source.kind === 'combat' ? '⚔️' : '↪'}
      </span>
    </button>
  );
}

/** 🏅 mastery level with a thin progress ring of the next level; tooltip shows the bonus. */
function MasteryBadge({ value }: { value: string }) {
  const [level = 1, fraction = 0] = value.split('|').map(Number);
  const speed = masterySpeed(level);
  const dbl = masteryDouble(level);
  return (
    <span
      className={`mastery-badge ${level >= MASTERY_MAX ? 'max' : ''}`}
      style={{ '--m': fraction } as React.CSSProperties}
      title={`Meisterschaft ${level}/${MASTERY_MAX}: +${formatPercent(speed, 1)} Tempo, +${formatPercent(dbl, 1)} Doppelt-Chance. Steigt mit jedem Abschluss dieser Aktion.`}
    >
      🏅 {level}
    </span>
  );
}

function chanceLabel(chance: number): string {
  return chance >= 0.1
    ? formatPercent(chance, 0)
    : `1/${Math.round(1 / chance).toLocaleString('de-DE')}`;
}

export function ActionCard({ def }: { def: ActionDef }) {
  // Select primitives only, so cards re-render when something relevant changes.
  const level = useGame((s) => skillLevel(s.game, def.skill));
  const isActive = useGame((s) => s.game.active?.actionId === def.id);
  const fireLit = useGame((s) => s.game.fire > 0);
  const noBuilding = useGame((s) => buildingMissing(s.game, def));
  const shipMissing = useGame((s) => shipTier(s.game) < shipNeeded(def.id));
  const nerd = useGame((s) => s.game.settings.nerdMode);
  const haveKey = useGame((s) => def.inputs.map((i) => s.game.inventory[i.item] ?? 0).join(','));
  const derived = useGame((s) => {
    const g = s.game;
    return `${actionDuration(g, def)}|${actionXp(g, def)}|${burnChance(g, def)}|${toolSpeed(g, def.skill)}|${xpMultiplierFor(g, def.skill)}|${stealFailChance(g, def)}`;
  });
  const masteryKey = useGame((s) => {
    const m = masteryProgress(s.game, def.id);
    return `${m.level}|${m.fraction.toFixed(3)}`;
  });
  const start = useGame((s) => s.start);
  const stop = useGame((s) => s.stop);
  const { num, int } = useFmt();

  const [duration = 1, xp = 0, burn = 0, tool = 1, mult = 1, caught = 0] = derived
    .split('|')
    .map(Number);
  const have = haveKey ? haveKey.split(',').map(Number) : [];
  const locked = level < def.levelReq;
  const times = craftableTimes(useGame.getState().game, def.inputs);
  const xpPerHour = (xp * (1 - burn * 0.9) * 3600) / duration;
  const levelsAbove = Math.max(0, level - def.levelReq);
  const levelBonus = Math.min(
    BALANCE.LEVEL_SPEED_BONUS_CAP,
    levelsAbove * BALANCE.LEVEL_SPEED_BONUS,
  );

  if (locked) {
    return (
      <div className="action-card locked">
        <span className="action-icon">🔒</span>
        <div className="action-body">
          <div className="action-title">{def.name}</div>
          <small>{t('action.requiresLevel', { level: def.levelReq })}</small>
        </div>
      </div>
    );
  }

  // Smelting/mining: show the drawn ore/bar instead of a generic emoji.
  const artOutput = def.outputs.find((o) => ITEM_MAP.get(o.item)?.art)?.item;
  return (
    <div className={`action-card ${isActive ? 'active' : ''}`} data-action={def.id}>
      <span className="action-icon">{artOutput ? <ItemIcon id={artOutput} /> : def.icon}</span>
      <div className="action-body">
        <div className="action-title">
          {def.name}
          <small className="req">Lvl {def.levelReq}</small>
          <MasteryBadge value={masteryKey} />
        </div>
        {def.desc && <small className="action-desc">{def.desc}</small>}
        <div className="action-stats">
          <span>⏱️ {formatSeconds(duration)}</span>
          <span>✨ {num(xp, 1)} XP</span>
          <span>
            📈 {num(xpPerHour)} {t('action.xpPerHour')}
          </span>
          {def.burn && (
            <span>
              🔥 {t('action.burnChance')} {formatPercent(burn)}
            </span>
          )}
          {def.steal && (
            <span className={caught > 0.3 ? 'warn' : ''}>
              🚨 Erwischt {formatPercent(caught)} · 🪙 {def.steal.gold[0]}–{def.steal.gold[1]}
            </span>
          )}
          {def.fuelSeconds && (
            <span>🪵 {t('action.fuel', { seconds: formatDuration(def.fuelSeconds) })}</span>
          )}
          {shipMissing && (
            <span className="warn">
              🔒 Braucht {SHIP_NAMES[shipNeeded(def.id)]} oder größer (Werft)
            </span>
          )}
          {noBuilding && def.requiresBuilding && (
            <span className="warn">
              🔒 Braucht {ISLAND_BUILDING_MAP.get(def.requiresBuilding.id)?.name} Stufe{' '}
              {def.requiresBuilding.level} (Baukunst)
            </span>
          )}
          {def.requiresFire && !fireLit && (
            <span className="warn">⚠️ {t('action.requiresFire')}</span>
          )}
        </div>
        {def.inputs.length > 0 && (
          <div className="action-items">
            <small>{t('action.inputs')}:</small>
            {def.inputs.map((i, idx) => {
              const it = getItem(i.item);
              const ok = (have[idx] ?? 0) >= i.qty;
              return (
                <IngredientPill
                  key={i.item}
                  item={i.item}
                  ok={ok}
                  label={
                    <>
                      <ItemIcon id={i.item} /> {i.qty}× {it.name}
                    </>
                  }
                  have={int(have[idx] ?? 0)}
                />
              );
            })}
            {Number.isFinite(times) && (
              <small className="muted">{t('action.canDo', { count: int(times) })}</small>
            )}
          </div>
        )}
        <div className="action-items">
          <small>{t('action.outputs')}:</small>
          {def.outputs.map((o) => {
            const it = getItem(o.item);
            return (
              <span key={o.item} className="item-pill">
                <ItemIcon id={o.item} /> {o.qty}× {it.name}
              </span>
            );
          })}
        </div>
        {def.drops && def.drops.length > 0 && (
          <div className="action-items drops">
            <small>{t('action.drops')}:</small>
            {def.drops.map((d) => {
              const it = getItem(d.item);
              return (
                <Tip key={d.item} text={`${it.name}: ${it.desc}`}>
                  <span className={`item-pill ${d.rare ? 'rare' : ''}`}>
                    <ItemIcon id={d.item} /> <span className="pill-name">{it.name}</span>{' '}
                    <small>{chanceLabel(d.chance)}</small>
                  </span>
                </Tip>
              );
            })}
          </div>
        )}
        {nerd && (
          <code className="nerd">
            t = {def.baseTime}s ÷ (Werkzeug {tool} × (1 + {formatPercent(levelBonus)})) ={' '}
            {formatSeconds(duration)} · XP = {def.xp} × {mult.toFixed(3)}
            {def.burn
              ? ` · Brand = ${def.burn.chanceAtReq} × (1 − (Lvl − ${def.levelReq}) / ${def.burn.stopBurnLevel - def.levelReq})`
              : ''}
          </code>
        )}
      </div>
      <button
        className={`btn ${isActive ? 'btn-stop' : 'btn-primary'}`}
        onClick={() => (isActive ? stop() : start(def.id))}
      >
        {isActive ? t('action.stop') : t('action.start')}
      </button>
    </div>
  );
}
