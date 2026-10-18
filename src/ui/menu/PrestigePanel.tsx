import { useState } from 'react';
import {
  LAWS,
  MULTIVERSE_UPGRADES,
  PRESTIGE,
  WISDOM_UPGRADES,
  type UpgradeDef,
} from '../../data/prestige';
import {
  canBigBang,
  canParadigmShift,
  canRebirth,
  formatDuration,
  lawSlots,
  multiverseLevel,
  runXp,
  shardGain,
  totalLevel,
  upgradeCost,
  upgradeLevel,
  wisdomGain,
} from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt, useNow } from '../hooks';

function UpgradeRow({
  def,
  level,
  currency,
  icon,
  onBuy,
}: {
  def: UpgradeDef;
  level: number;
  currency: number;
  icon: string;
  onBuy: () => void;
}) {
  const maxed = level >= def.maxLevel;
  const cost = maxed ? 0 : upgradeCost(def, level);
  return (
    <div className="shop-row">
      <span className="item-icon">{def.icon}</span>
      <span className="shop-meta">
        <strong>
          {def.name}{' '}
          <small className="muted">
            {level}/{def.maxLevel}
          </small>
        </strong>
        <small className="muted">{def.desc}</small>
      </span>
      <span className="shop-buttons">
        <button className="btn btn-gold" disabled={maxed || currency < cost} onClick={onBuy}>
          {maxed ? 'Max' : `${cost} ${icon}`}
        </button>
      </span>
    </div>
  );
}

/** Two-tap confirmation button for destructive prestige resets. */
function ConfirmButton({
  label,
  disabled,
  onConfirm,
}: {
  label: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      className={`btn btn-wide ${armed ? 'btn-danger' : 'btn-primary'}`}
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
      onBlur={() => setArmed(false)}
    >
      {armed ? 'Wirklich? Nochmal tippen zum Bestätigen' : label}
    </button>
  );
}

export function PrestigePanel() {
  const game = useGame((s) => s.game);
  const doRebirth = useGame((s) => s.doRebirth);
  const doParadigmShift = useGame((s) => s.doParadigmShift);
  const doBigBang = useGame((s) => s.doBigBang);
  const buyTalent = useGame((s) => s.buyTalent);
  const buyMultiverse = useGame((s) => s.buyMultiverse);
  const now = useNow(1000);
  const { num, int } = useFmt();
  const p = game.prestige;
  const [laws, setLaws] = useState<string[]>(p.laws);
  const rebirthCheck = canRebirth(game);
  const shiftCheck = canParadigmShift(game);
  const bangCheck = canBigBang(game);
  const slots = lawSlots(game);

  return (
    <div className="prestige">
      <section className="prestige-card">
        <h3>🌅 Wiedergeburt</h3>
        <p className="muted small">
          Setzt Skills, Inventar, Gold und Ausrüstung zurück. Du behältst Forschung, Erfolge,
          Periodensystem und Statistiken – und bekommst <b>Weisheit</b>: jeder Punkt gibt dauerhaft
          +{PRESTIGE.WISDOM_XP * 100} % XP, +{PRESTIGE.WISDOM_RESEARCH * 100} % Forschung und +
          {PRESTIGE.WISDOM_GOLD * 100} % Gold.
        </p>
        <div className="combat-row small">
          <span>
            🦉 Weisheit: <b>{int(p.wisdom)}</b> (gesamt {int(p.wisdomTotal)})
          </span>
          <span>🔁 Wiedergeburten: {p.rebirths}</span>
          <span>⏳ Lauf: {formatDuration((now - p.runStartedAt) / 1000)}</span>
        </div>
        <p>
          Bei Wiedergeburt jetzt: <b>+{wisdomGain(game)} Weisheit</b>{' '}
          <small className="muted">
            (aus {num(runXp(game))} XP dieses Laufs · Gesamtlevel {totalLevel(game)}/
            {PRESTIGE.REBIRTH_TOTAL_LEVEL})
          </small>
        </p>
        {!rebirthCheck.ok && <p className="warn small">{rebirthCheck.reason}</p>}
        <ConfirmButton
          label="🌅 Wiedergeboren werden"
          disabled={!rebirthCheck.ok}
          onConfirm={doRebirth}
        />
      </section>

      <section>
        <h4 className="group-title">Ahnen-Talente (kosten Weisheit)</h4>
        <div className="shop-list">
          {WISDOM_UPGRADES.map((def) => (
            <UpgradeRow
              key={def.id}
              def={def}
              level={upgradeLevel(game, def.id)}
              currency={p.wisdom}
              icon="🦉"
              onBuy={() => buyTalent(def.id)}
            />
          ))}
        </div>
      </section>

      <section className="prestige-card">
        <h3>🔄 Paradigmenwechsel</h3>
        <p className="muted small">
          Thomas Kuhn lässt grüßen: Setzt zusätzlich den <b>Tech-Baum</b> und die Forschungspunkte
          zurück. Dafür gibt es dauerhaft +{PRESTIGE.PARADIGM_RESEARCH * 100} % Forschung pro
          Wechsel – und du wählst neue <b>Naturgesetze</b> mit Vor- und Nachteilen.
        </p>
        <p className="small">
          Wechsel bisher: {p.paradigms} · Aktive Gesetze:{' '}
          {p.laws.length
            ? p.laws.map((id) => LAWS.find((l) => l.id === id)?.name).join(', ')
            : 'keine'}
        </p>
        <p className="small">
          Wähle bis zu {slots} Gesetz{slots > 1 ? 'e' : ''} für das nächste Paradigma:
        </p>
        <div className="law-list">
          {LAWS.map((law) => {
            const on = laws.includes(law.id);
            return (
              <button
                key={law.id}
                className={`law ${on ? 'on' : ''}`}
                onClick={() =>
                  setLaws(on ? laws.filter((l) => l !== law.id) : [...laws, law.id].slice(-slots))
                }
              >
                <span className="item-icon">{law.icon}</span>
                <span>
                  <strong>{law.name}</strong>
                  <small className="muted">{law.desc}</small>
                </span>
              </button>
            );
          })}
        </div>
        {!shiftCheck.ok && <p className="warn small">{shiftCheck.reason}</p>}
        <ConfirmButton
          label="🔄 Paradigmenwechsel einleiten"
          disabled={!shiftCheck.ok}
          onConfirm={() => doParadigmShift(laws)}
        />
      </section>

      <section className="prestige-card cosmic">
        <h3>💥 Urknall</h3>
        <p className="muted small">
          Das Universum neu starten. Setzt Weisheit, Talente, Paradigmen und Periodensystem zurück.
          Erfolge und Multiversum-Upgrades bleiben. Gibt <b>Multiversum-Splitter</b>.
        </p>
        <p className="small">
          💠 Splitter: <b>{p.shards}</b> · Urknalle: {p.bigBangs} · Beim Urknall jetzt: +
          {shardGain(game)}
        </p>
        {!bangCheck.ok && <p className="warn small">{bangCheck.reason}</p>}
        <ConfirmButton label="💥 Urknall auslösen" disabled={!bangCheck.ok} onConfirm={doBigBang} />
        {(p.shards > 0 || p.bigBangs > 0) && (
          <div className="shop-list">
            {MULTIVERSE_UPGRADES.map((def) => (
              <UpgradeRow
                key={def.id}
                def={def}
                level={multiverseLevel(game, def.id)}
                currency={p.shards}
                icon="💠"
                onBuy={() => buyMultiverse(def.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
