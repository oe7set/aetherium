import { getItem, type EquipSlot } from '../../data';
import { canWear } from '../../engine';
import { useGame } from '../../store/gameStore';
import { EquipInfo } from './EquipInfo';

const SLOTS: { slot: EquipSlot; label: string; icon: string }[] = [
  { slot: 'head', label: 'Kopf', icon: '⛑️' },
  { slot: 'amulet', label: 'Amulett', icon: '📿' },
  { slot: 'weapon', label: 'Waffe', icon: '⚔️' },
  { slot: 'body', label: 'Brust', icon: '🦺' },
  { slot: 'shield', label: 'Schild', icon: '🛡️' },
  { slot: 'legs', label: 'Beine', icon: '👖' },
  { slot: 'ring', label: 'Ring', icon: '💍' },
  { slot: 'ammo', label: 'Munition', icon: '➶' },
];

export function GearPanel() {
  const equipment = useGame((s) => s.game.equipment);
  const inventory = useGame((s) => s.game.inventory);
  const game = useGame((s) => s.game);
  const equip = useGame((s) => s.equip);
  const unequip = useGame((s) => s.unequip);
  const wearable = Object.keys(inventory).filter((id) => getItem(id).equip);

  return (
    <div className="gear">
      <div className="gear-grid">
        {SLOTS.map(({ slot, label, icon }) => {
          const id = equipment[slot];
          const def = id ? getItem(id) : null;
          return (
            <button
              key={slot}
              className={`gear-slot rarity-${def?.rarity ?? 'common'} ${def ? '' : 'empty'}`}
              onClick={() => id && unequip(slot)}
              title={def ? `${def.name} – antippen zum Ablegen` : label}
            >
              <span className="item-icon">{def ? def.icon : icon}</span>
              <small>{def ? def.name : label}</small>
              {slot === 'ammo' && id && <small className="muted">×{inventory[id] ?? 0}</small>}
            </button>
          );
        })}
      </div>
      <h4 className="group-title">Anlegbar im Inventar</h4>
      {wearable.length === 0 && (
        <p className="muted">Nichts zum Anziehen. Schmiede oder erbeute etwas!</p>
      )}
      <div className="shop-list">
        {wearable.map((id) => {
          const def = getItem(id);
          const ok = canWear(game, id);
          return (
            <div key={id} className="shop-row">
              <span className="item-icon">{def.icon}</span>
              <span className="shop-meta">
                <strong>{def.name}</strong>
                <EquipInfo itemId={id} />
              </span>
              <span className="shop-buttons">
                <button className="btn btn-primary" disabled={!ok} onClick={() => equip(id)}>
                  Anlegen
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
