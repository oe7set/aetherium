import { getItem, getSkill, type ActionDef } from '../../data';
import { MADE_BY, USED_IN } from '../recipes';
import { canUseAll, marketMult, saleRevenue, skillLevel, trendMult, unitPrice } from '../../engine';
import { EquipInfo } from './EquipInfo';
import { t, type MessageKey } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { TouchCard } from '../TouchCard';

function RecipeChips({ label, list }: { label: string; list: ActionDef[] }) {
  const jump = useGame((s) => s.jumpToAction);
  const game = useGame.getState().game;
  if (!list.length) return null;
  const shown = [...list].sort((a, b) => a.levelReq - b.levelReq).slice(0, 6);
  return (
    <div className="item-recipes">
      <small className="muted">{label}</small>
      <div className="item-recipe-list">
        {shown.map((a) => {
          const ok = skillLevel(game, a.skill) >= a.levelReq;
          return (
            <button
              key={a.id}
              className={`chip-btn ${ok ? '' : 'locked'}`}
              onClick={() => jump(a.id)}
              title={`${getSkill(a.skill).name} Level ${a.levelReq}`}
            >
              {getSkill(a.skill).icon} {a.name}
              {!ok && <small> · Lv {a.levelReq}</small>}
            </button>
          );
        })}
        {list.length > shown.length && (
          <small className="muted">+{list.length - shown.length}</small>
        )}
      </div>
    </div>
  );
}

/** Tap card for an inventory item: info, recipes and every action (use, use all, sell, equip). */
export function ItemDetail({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const def = getItem(itemId);
  const qty = useGame((s) => s.game.inventory[itemId] ?? 0);
  const sell = useGame((s) => s.sell);
  const use = useGame((s) => s.use);
  const consumeStack = useGame((s) => s.consumeStack);
  const equip = useGame((s) => s.equip);
  const setCombat = useGame((s) => s.setCombatSetting);
  const isFood = useGame((s) => s.game.combatSettings.food === itemId);
  const { num, int } = useFmt();
  const price = useGame((s) => unitPrice(s.game, itemId));
  const mult = useGame((s) => marketMult(s.game, itemId) * trendMult(s.game, itemId));
  const allRevenue = useGame((s) => saleRevenue(s.game, itemId, qty).revenue);
  if (qty <= 0) return null;

  return (
    <TouchCard onClose={onClose} className={`item-detail rarity-${def.rarity ?? 'common'}`}>
      <div className="item-detail-head">
        <span className="item-icon big">{def.icon}</span>
        <div>
          <strong>{def.name}</strong> <span className="muted">×{int(qty)}</span>
          <div className="item-tags">
            <span className="tag">{t(`cat.${def.category}` as MessageKey)}</span>
            {def.rarity && (
              <span className={`tag rarity-text-${def.rarity}`}>
                {t(`rarity.${def.rarity}` as MessageKey)}
              </span>
            )}
            <span className="tag">
              🪙 {num(price)}
              {Math.abs(mult - 1) > 0.01 && (
                <span className={mult > 1 ? 'up' : 'down'}> {mult > 1 ? '▲' : '▼'}</span>
              )}
            </span>
          </div>
        </div>
      </div>
      <p className="item-desc">{def.desc}</p>
      {def.heal && <p className="muted small">❤️ Heilt {def.heal} LP im Kampf</p>}
      {def.equip && <EquipInfo itemId={itemId} />}
      <RecipeChips label="Verwendet für" list={USED_IN.get(itemId) ?? []} />
      <RecipeChips label="Entsteht durch" list={MADE_BY.get(itemId) ?? []} />
      <div className="btn-row item-actions">
        {def.equip && (
          <button className="btn btn-primary" onClick={() => equip(itemId)}>
            🛡️ Anlegen
          </button>
        )}
        {def.consume && (
          <button className="btn btn-primary" onClick={() => use(itemId)}>
            ✨ {t('inv.use')}
          </button>
        )}
        {def.consume && qty > 1 && canUseAll(itemId) && (
          <button className="btn btn-primary" onClick={() => consumeStack(itemId)}>
            ✨ Alle benutzen (×{int(Math.min(qty, 1000))})
          </button>
        )}
        {def.heal && (
          <button
            className={`btn ${isFood ? 'btn-gold' : ''}`}
            onClick={() => setCombat('food', isFood ? null : itemId)}
          >
            {isFood ? '✔ Kampfproviant' : '🍖 Als Kampfproviant'}
          </button>
        )}
      </div>
      <div className="btn-row item-actions">
        <button className="btn" onClick={() => sell(itemId, 1)}>
          {t('inv.sellOne')}
        </button>
        {qty > 2 && (
          <button className="btn" onClick={() => sell(itemId, Math.floor(qty / 2))}>
            {t('inv.sellHalf')}
          </button>
        )}
        <button className="btn btn-gold" onClick={() => sell(itemId, qty)}>
          {t('inv.sellAll')} (+{num(allRevenue)})
        </button>
      </div>
    </TouchCard>
  );
}
