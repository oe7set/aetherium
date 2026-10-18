import { getItem } from '../../data';
import { t, type MessageKey } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';

export function ItemDetail({ itemId }: { itemId: string }) {
  const def = getItem(itemId);
  const qty = useGame((s) => s.game.inventory[itemId] ?? 0);
  const sell = useGame((s) => s.sell);
  const use = useGame((s) => s.use);
  const { num, int } = useFmt();

  return (
    <div className={`item-detail rarity-${def.rarity ?? 'common'}`}>
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
          </div>
        </div>
      </div>
      <p className="item-desc">{def.desc}</p>
      <p className="muted">{t('inv.value', { gold: num(def.sellPrice) })}</p>
      <div className="btn-row">
        {def.consume && (
          <button className="btn btn-primary" onClick={() => use(itemId)}>
            {t('inv.use')}
          </button>
        )}
        <button className="btn" onClick={() => sell(itemId, 1)}>
          {t('inv.sellOne')}
        </button>
        {qty > 1 && (
          <button className="btn" onClick={() => sell(itemId, Math.floor(qty / 2))}>
            {t('inv.sellHalf')}
          </button>
        )}
        <button className="btn btn-gold" onClick={() => sell(itemId, qty)}>
          {t('inv.sellAll')} (+{num(def.sellPrice * qty)})
        </button>
      </div>
    </div>
  );
}
