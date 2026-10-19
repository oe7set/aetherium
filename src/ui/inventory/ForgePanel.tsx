import { useState } from 'react';
import { getItem, type EquipSlot } from '../../data';
import {
  FORGE_MAX,
  FORGE_SAFE_LEVEL,
  FORGE_SLOTS,
  FORGE_STAT_PER_LEVEL,
  forgeChance,
  forgeCost,
} from '../../data/forge';
import { affixText, canForge, defaultRng, forgeSlot, imprintSlot } from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';

const LABEL: Record<string, string> = {
  weapon: '⚔️ Waffe',
  shield: '🛡️ Schild',
  head: '⛑️ Kopf',
  body: '🦺 Brust',
  legs: '👖 Beine',
  hands: '🧤 Hände',
  feet: '👢 Füße',
  cape: '🧣 Umhang',
  ring: '💍 Ring',
  amulet: '📿 Amulett',
};

/** Schmiede-Verstärkung: +1..+10 per slot (kept when swapping gear) and one imprint per slot. */
export function ForgePanel() {
  const sig = useGame((s) => JSON.stringify(s.game.forge));
  const inventory = useGame((s) => s.game.inventory);
  const equipment = useGame((s) => s.game.equipment);
  const checks = useGame((s) => FORGE_SLOTS.map((sl) => canForge(s.game, sl)).join(','));
  const act = useGame((s) => s.combatAct);
  const [protect, setProtect] = useState(true);
  const { int } = useFmt();
  const forge = JSON.parse(sig) as {
    levels: Record<string, number>;
    affixes: Record<string, { key: string; value: number }>;
  };
  const ok = checks.split(',');
  const runes = inventory.protect_rune ?? 0;
  const stones = inventory.imprint_stone ?? 0;
  return (
    <section className="buildings forge-panel">
      <h4 className="group-title">🔨 Schmiede-Verstärkung</h4>
      <p className="small muted">
        Jeder Platz lässt sich bis +{FORGE_MAX} verstärken: +{FORGE_STAT_PER_LEVEL * 100} % auf
        Angriff, Stärke und Verteidigung des Teils, das dort sitzt – die Verstärkung bleibt beim
        Wechsel der Ausrüstung. Ab +{FORGE_SAFE_LEVEL + 1} kann ein Fehlschlag eine Stufe kosten;
        eine Schutzrune (Magie) verhindert das. Prägesteine (Erfinden) geben einem Platz einen
        zufälligen Zusatzwert.
      </p>
      <label className="toggle">
        <input type="checkbox" checked={protect} onChange={(e) => setProtect(e.target.checked)} />
        <span>
          🛡️ Schutzrune verwenden <small className="muted">({runes} vorhanden)</small> · 🔷 {stones}{' '}
          Prägesteine
        </span>
      </label>
      {FORGE_SLOTS.map((slot: EquipSlot, i) => {
        const level = forge.levels[slot] ?? 0;
        const affix = forge.affixes[slot];
        const cost = level < FORGE_MAX ? forgeCost(level) : null;
        const worn = equipment[slot];
        return (
          <div key={slot} className={`building-row ${level ? 'built' : ''}`}>
            <span className="item-icon">{LABEL[slot]?.split(' ')[0]}</span>
            <span className="shop-meta">
              <strong>
                {LABEL[slot]?.split(' ')[1]} <b className="forge-level">+{level}</b>{' '}
                <small className="muted">{worn ? getItem(worn).name : 'leer'}</small>
              </strong>
              <small className={affix && worn ? 'set-on' : 'muted'}>
                {affix
                  ? `🔷 ${affixText(affix)}${worn ? '' : ' (wirkt, sobald etwas angelegt ist)'}`
                  : 'Keine Prägung'}
              </small>
              {cost && (
                <span className="pill-wrap">
                  <span className={`item-pill ${ok[i] === 'gold' ? 'missing' : ''}`}>
                    🪙 {int(cost.gold)}
                  </span>
                  {cost.items.map((c) => {
                    const have = inventory[c.item] ?? 0;
                    return (
                      <span key={c.item} className={`item-pill ${have >= c.qty ? '' : 'missing'}`}>
                        {getItem(c.item).icon} {c.qty}× {getItem(c.item).name}{' '}
                        <small>({have})</small>
                      </span>
                    );
                  })}
                  <span className="item-pill">🎲 {Math.round(forgeChance(level) * 100)} %</span>
                </span>
              )}
            </span>
            <span className="shop-buttons">
              <button
                className="btn btn-primary"
                disabled={ok[i] !== 'ok'}
                onClick={() => act((s, emit) => void forgeSlot(s, slot, protect, defaultRng, emit))}
              >
                {level >= FORGE_MAX ? 'Max' : 'Verstärken'}
              </button>
              <button
                className="btn btn-ghost"
                disabled={stones <= 0}
                onClick={() => act((s) => void imprintSlot(s, slot, defaultRng))}
              >
                Prägen
              </button>
            </span>
          </div>
        );
      })}
    </section>
  );
}
