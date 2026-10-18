import { useMemo, useState } from 'react';
import { getItem, ITEM_MAP, type ItemCategory } from '../../data';
import { BALANCE } from '../../data/balance';
import { slotPrice, usedSlots } from '../../engine';
import { t, type MessageKey } from '../../i18n';
import { useGame, type InventorySegment } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { CollectionPanel } from './CollectionPanel';
import { GearPanel } from './GearPanel';
import { ItemDetail } from './ItemDetail';
import { MarketPanel } from './MarketPanel';
import { ShopPanel } from './ShopPanel';
import { ToolsPanel } from './ToolsPanel';

type SortKey = 'category' | 'name' | 'qty' | 'value';
const CATEGORY_ORDER: ItemCategory[] = [
  'gear',
  'log',
  'ore',
  'gem',
  'raw_food',
  'food',
  'consumable',
  'resource',
  'junk',
];

function Segments() {
  const seg = useGame((s) => s.ui.inventorySegment);
  const setUi = useGame((s) => s.setUi);
  const segs: InventorySegment[] = ['items', 'gear', 'album', 'market', 'shop', 'tools'];
  return (
    <div className="segments" role="tablist">
      {segs.map((s) => (
        <button
          key={s}
          role="tab"
          aria-selected={seg === s}
          className={`segment ${seg === s ? 'active' : ''}`}
          onClick={() => setUi({ inventorySegment: s })}
        >
          {t(`inv.segment.${s}` as MessageKey)}
        </button>
      ))}
    </div>
  );
}

function ItemsGrid() {
  const inventory = useGame((s) => s.game.inventory);
  const slots = useGame((s) => s.game.inventorySlots);
  const selected = useGame((s) => s.ui.selectedItem);
  const setUi = useGame((s) => s.setUi);
  const buySlot = useGame((s) => s.buySlot);
  const price = useGame((s) => slotPrice(s.game).toString());
  const used = useGame((s) => usedSlots(s.game));
  const { num, int } = useFmt();
  const [sort, setSort] = useState<SortKey>('category');
  const [filter, setFilter] = useState<ItemCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Object.entries(inventory)
      .filter(([id]) => ITEM_MAP.has(id))
      .map(([id, qty]) => ({ def: getItem(id), qty }))
      .filter((e) => filter === 'all' || e.def.category === filter)
      .filter(
        (e) => !q || e.def.name.toLowerCase().includes(q) || e.def.desc.toLowerCase().includes(q),
      );
    const cmp: Record<SortKey, (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
      category: (a, b) =>
        CATEGORY_ORDER.indexOf(a.def.category) - CATEGORY_ORDER.indexOf(b.def.category) ||
        a.def.sellPrice - b.def.sellPrice,
      name: (a, b) => a.def.name.localeCompare(b.def.name, 'de'),
      qty: (a, b) => b.qty - a.qty,
      value: (a, b) => b.qty * b.def.sellPrice - a.qty * a.def.sellPrice,
    };
    return list.sort(cmp[sort]);
  }, [inventory, sort, filter, query]);

  const presentCategories = useMemo(
    () =>
      CATEGORY_ORDER.filter((c) =>
        Object.keys(inventory).some((id) => ITEM_MAP.get(id)?.category === c),
      ),
    [inventory],
  );
  const totalValue = Object.entries(inventory).reduce(
    (sum, [id, qty]) => sum + (ITEM_MAP.get(id)?.sellPrice ?? 0) * qty,
    0,
  );
  const emptySlots = Math.max(0, slots - used);

  return (
    <div className="inventory">
      <div className="inv-head">
        <span className={used >= slots ? 'warn' : ''}>
          🎒 {t('inv.slots', { used, max: slots })}
        </span>
        <span className="muted">{t('inv.totalValue', { gold: num(totalValue) })}</span>
      </div>
      <div className="inv-controls">
        <input
          type="search"
          className="input"
          placeholder={t('inv.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sortierung"
        >
          {(['category', 'name', 'qty', 'value'] as SortKey[]).map((k) => (
            <option key={k} value={k}>
              ↕ {t(`inv.sort.${k}` as MessageKey)}
            </option>
          ))}
        </select>
      </div>
      {presentCategories.length > 1 && (
        <div className="chips-row">
          <button
            className={`chip-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('inv.filter.all')}
          </button>
          {presentCategories.map((c) => (
            <button
              key={c}
              className={`chip-btn ${filter === c ? 'active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {t(`cat.${c}` as MessageKey)}
            </button>
          ))}
        </div>
      )}
      {entries.length === 0 && used === 0 && <p className="muted center">{t('inv.empty')}</p>}
      {selected && inventory[selected] !== undefined && <ItemDetail itemId={selected} />}
      <div className="item-grid">
        {entries.map(({ def, qty }) => (
          <button
            key={def.id}
            className={`item-slot rarity-${def.rarity ?? 'common'} ${selected === def.id ? 'selected' : ''}`}
            onClick={() => setUi({ selectedItem: selected === def.id ? null : def.id })}
            title={def.name}
          >
            <span className="item-icon">{def.icon}</span>
            <span className="item-qty">{int(qty)}</span>
          </button>
        ))}
        {filter === 'all' &&
          !query &&
          Array.from({ length: Math.min(emptySlots, 40) }, (_, i) => (
            <span key={`e${i}`} className="item-slot empty" />
          ))}
      </div>
      <button
        className="btn btn-wide"
        onClick={buySlot}
        disabled={slots >= BALANCE.MAX_INVENTORY_SLOTS}
      >
        {slots >= BALANCE.MAX_INVENTORY_SLOTS
          ? t('inv.maxSlots')
          : `➕ ${t('inv.buySlot', { price: num(price) })}`}
      </button>
    </div>
  );
}

export function InventoryPanel() {
  const seg = useGame((s) => s.ui.inventorySegment);
  return (
    <div className="panel">
      <Segments />
      {seg === 'items' && <ItemsGrid />}
      {seg === 'gear' && <GearPanel />}
      {seg === 'market' && <MarketPanel />}
      {seg === 'shop' && <ShopPanel />}
      {seg === 'tools' && <ToolsPanel />}
      {seg === 'album' && <CollectionPanel />}
    </div>
  );
}
