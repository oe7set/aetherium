import { getItem, SHOP_OFFERS } from '../../data';
import { t } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';

export function ShopPanel() {
  const buy = useGame((s) => s.buy);
  const gold = useGame((s) => s.game.gold.toNumber());
  const { num } = useFmt();
  return (
    <div className="shop">
      <h3 className="panel-title">{t('shop.title')}</h3>
      <p className="muted">{t('shop.intro')}</p>
      <h4 className="group-title">{t('shop.ingredients')}</h4>
      <div className="shop-list">
        {SHOP_OFFERS.map((o) => {
          const it = getItem(o.item);
          return (
            <div key={o.item} className="shop-row">
              <span className="item-icon">{it.icon}</span>
              <span className="shop-meta">
                <strong>{it.name}</strong>
                <small className="muted">{it.desc}</small>
              </span>
              <span className="shop-buttons">
                <button className="btn" disabled={gold < o.price} onClick={() => buy(o.item, 1)}>
                  1× · {num(o.price)}🪙
                </button>
                <button
                  className="btn"
                  disabled={gold < o.price * 10}
                  onClick={() => buy(o.item, 10)}
                >
                  10× · {num(o.price * 10)}🪙
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
