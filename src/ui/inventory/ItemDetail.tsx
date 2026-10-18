import { getItem } from '../../data';
import { marketMult, saleRevenue, trendMult, unitPrice } from '../../engine';
import { EquipInfo } from './EquipInfo';
import { t, type MessageKey } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';

export function ItemDetail({ itemId }: { itemId: string }) {
  const def = getItem(itemId);
  const qty = useGame((s) => s.game.inventory[itemId] ?? 0);
  const sell = useGame((s) => s.sell);
  const use = useGame((s) => s.use);
  const { num, int } = useFmt();
  const price = useGame((s) => unitPrice(s.game, itemId));
  const mult = useGame((s) => marketMult(s.game, itemId) * trendMult(s.game, itemId));
  const allRevenue = useGame((s) => saleRevenue(s.game, itemId, qty).revenue);

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
      <p className="muted">
        {t('inv.value', { gold: num(price) })}{' '}
        {Math.abs(mult - 1) > 0.01 && (
          <span className={mult > 1 ? 'up' : 'down'}>
            ({mult > 1 ? '▲' : '▼'} {Math.round(mult * 100)} % vom Normalpreis)
          </span>
        )}
      </p>
      {def.heal && <p className="muted">❤️ Heilt {def.heal} LP</p>}
      {def.equip && <EquipInfo itemId={itemId} />}
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
          {t('inv.sellAll')} (+{num(allRevenue)})
        </button>
      </div>
    </div>
  );
}
