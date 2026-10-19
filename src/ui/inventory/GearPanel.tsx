import { useState } from 'react';
import { getItem, getSkill, type EquipDef, type EquipSlot, type ModifierSet } from '../../data';
import { canWear, playerStats } from '../../engine';
import { useGame } from '../../store/gameStore';
import { ItemIcon } from '../ItemIcon';
import { describeMods } from '../modText';
import { EquipInfo } from './EquipInfo';

/** Paper doll layout: three columns, read like a character sheet. */
const SLOTS: { slot: EquipSlot; label: string; icon: string }[] = [
  { slot: 'cape', label: 'Umhang', icon: '🧣' },
  { slot: 'head', label: 'Kopf', icon: '⛑️' },
  { slot: 'amulet', label: 'Amulett', icon: '📿' },
  { slot: 'weapon', label: 'Waffe', icon: '⚔️' },
  { slot: 'body', label: 'Brust', icon: '🦺' },
  { slot: 'shield', label: 'Schild', icon: '🛡️' },
  { slot: 'hands', label: 'Hände', icon: '🧤' },
  { slot: 'legs', label: 'Beine', icon: '👖' },
  { slot: 'ring', label: 'Ring', icon: '💍' },
  { slot: 'ammo', label: 'Munition', icon: '➶' },
  { slot: 'feet', label: 'Füße', icon: '🥾' },
];
const SLOT_LABEL = new Map(SLOTS.map((s) => [s.slot, s.label]));

type Filter = 'all' | 'weapon' | 'armour' | 'jewel' | 'ammo';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Alles' },
  { id: 'weapon', label: '⚔️ Waffen' },
  { id: 'armour', label: '🛡️ Rüstung' },
  { id: 'jewel', label: '💍 Schmuck' },
  { id: 'ammo', label: '➶ Munition' },
];
function filterOf(slot: EquipSlot): Filter {
  if (slot === 'weapon') return 'weapon';
  if (slot === 'ring' || slot === 'amulet') return 'jewel';
  if (slot === 'ammo') return 'ammo';
  return 'armour';
}

const STYLE_ICON = { melee: '⚔️', ranged: '🏹', magic: '🪄' } as const;

/** ↑/↓ against the piece currently in the same slot. */
function Delta({ label, now, old }: { label: string; now: number; old: number }) {
  const d = now - old;
  if (d === 0) return null;
  return (
    <span className={`gear-delta ${d > 0 ? 'up' : 'down'}`}>
      {label} {d > 0 ? '▲' : '▼'}
      {Math.abs(d)}
    </span>
  );
}

function sumMods(ids: (string | undefined)[]): ModifierSet {
  const out: Record<string, number> = {};
  for (const id of ids) {
    if (!id) continue;
    for (const [k, v] of Object.entries(getItem(id).equip?.mods ?? {}))
      out[k] = (out[k] ?? 0) + (v ?? 0);
  }
  return out;
}

export function GearPanel() {
  const equipment = useGame((s) => s.game.equipment);
  const inventory = useGame((s) => s.game.inventory);
  const game = useGame((s) => s.game);
  const equip = useGame((s) => s.equip);
  const unequip = useGame((s) => s.unequip);
  const equipBest = useGame((s) => s.equipBest);
  const [filter, setFilter] = useState<Filter>('all');
  const st = playerStats(game);

  let atk = 0;
  let str = 0;
  let def = 0;
  for (const [slot, id] of Object.entries(equipment)) {
    if (!id || slot === 'ammo') continue;
    const eq = getItem(id).equip;
    atk += eq?.attack ?? 0;
    str += eq?.strength ?? 0;
    def += eq?.defence ?? 0;
  }
  const mods = sumMods(Object.entries(equipment).map(([slot, id]) => (slot === 'ammo' ? '' : id)));

  const wearable = Object.keys(inventory)
    .filter((id) => {
      const eq = getItem(id).equip;
      return eq && (filter === 'all' || filterOf(eq.slot) === filter);
    })
    .sort((a, b) => {
      const ea = getItem(a).equip as EquipDef;
      const eb = getItem(b).equip as EquipDef;
      const order =
        SLOTS.findIndex((s) => s.slot === ea.slot) - SLOTS.findIndex((s) => s.slot === eb.slot);
      return order || (eb.defence ?? 0) + (eb.attack ?? 0) - (ea.defence ?? 0) - (ea.attack ?? 0);
    });

  return (
    <div className="gear">
      <div className="gear-top">
        <div className="paperdoll">
          {SLOTS.map(({ slot, label, icon }) => {
            const id = equipment[slot];
            const it = id ? getItem(id) : null;
            return (
              <button
                key={slot}
                className={`gear-slot slot-${slot} rarity-${it?.rarity ?? 'common'} ${it ? '' : 'empty'}`}
                onClick={() => id && unequip(slot)}
                title={it ? `${it.name} – antippen zum Ablegen` : label}
              >
                <span className="gear-slot-label">{label}</span>
                <span className="item-icon">{id ? <ItemIcon id={id} /> : icon}</span>
                <small>{it ? it.name : '—'}</small>
                {slot === 'ammo' && id && <small className="muted">×{inventory[id] ?? 0}</small>}
              </button>
            );
          })}
        </div>
        <div className="gear-stats">
          <div className="gear-style">
            <span className="item-icon">{STYLE_ICON[st.style]}</span>
            <span>
              <strong>{getSkill(st.style).name}</strong>
              <small className="muted"> · Lvl {st.level}</small>
            </span>
          </div>
          <div className="gear-stat-grid">
            <span title="Höchster möglicher Treffer">
              💥 <b>{st.maxHit}</b> <small>Max. Treffer</small>
            </span>
            <span title="Angriffswert (gegen die Verteidigung des Monsters)">
              🎯 <b>{Math.round(st.accuracy).toLocaleString('de-DE')}</b> <small>Treffwert</small>
            </span>
            <span title="Sekunden pro Angriff">
              ⏱️ <b>{st.speed.toLocaleString('de-DE')} s</b> <small>Tempo</small>
            </span>
            <span title="Verteidigungswert">
              🛡️ <b>{Math.round(st.defenceRating).toLocaleString('de-DE')}</b> <small>Abwehr</small>
            </span>
            <span>
              ❤️ <b>{st.maxHp}</b> <small>Max. LP</small>
            </span>
            <span title="Summe aller Ausrüstungswerte">
              <small>
                ⚔️ {atk} · 💪 {str} · 🛡️ {def}
              </small>
            </span>
          </div>
          {Object.keys(mods).length > 0 && (
            <p className="gear-bonus">
              <small>✨ {describeMods(mods)}</small>
            </p>
          )}
          <button className="btn small" onClick={equipBest}>
            ✨ Beste Rüstung anlegen
          </button>
        </div>
      </div>

      <div className="chip-row gear-filter">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`chip-btn ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {wearable.length === 0 && (
        <p className="muted">
          Nichts zum Anziehen. Schmiede Rüstung, nähe Leder und Seide beim Handwerk oder erbeute
          etwas!
        </p>
      )}
      <div className="shop-list">
        {wearable.map((id) => {
          const it = getItem(id);
          const eq = it.equip as EquipDef;
          const ok = canWear(game, id);
          const worn = equipment[eq.slot];
          const old = worn ? getItem(worn).equip : undefined;
          return (
            <div key={id} className={`shop-row gear-row rarity-${it.rarity ?? 'common'}`}>
              <span className="item-icon">
                <ItemIcon id={id} />
              </span>
              <span className="shop-meta">
                <strong>
                  {it.name}
                  {eq.style && <small className="muted"> {STYLE_ICON[eq.style]}</small>}
                </strong>
                <small className="muted">
                  {SLOT_LABEL.get(eq.slot)} · ×{inventory[id] ?? 0}
                </small>
                <EquipInfo itemId={id} />
                {eq.slot !== 'ammo' && (
                  <span className="gear-deltas">
                    {!worn && <span className="gear-delta up">neuer Platz</span>}
                    {worn && (
                      <>
                        <Delta label="⚔️" now={eq.attack ?? 0} old={old?.attack ?? 0} />
                        <Delta label="💪" now={eq.strength ?? 0} old={old?.strength ?? 0} />
                        <Delta label="🛡️" now={eq.defence ?? 0} old={old?.defence ?? 0} />
                      </>
                    )}
                  </span>
                )}
              </span>
              <span className="shop-buttons">
                <button className="btn btn-primary" disabled={!ok} onClick={() => equip(id)}>
                  {eq.slot === 'ammo' && equipment.ammo === id ? 'Aktiv' : 'Anlegen'}
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
