import { useState } from 'react';
import { TROOPS, V_RES_INFO, V_RESOURCES, type TroopDef } from '../../data/village';
import {
  annexOasis,
  HERO_CARRY,
  heroAtHome,
  heroOffenseBonus,
  heroStrength,
  attackValue,
  buildingLevel,
  canAnnex,
  canResearch,
  carryOf,
  defenseValue,
  distance,
  maxTrainable,
  sendRaid,
  startResearch,
  trainTime,
  trainTroops,
  travelTime,
  troopUnlocked,
  type RaidTarget,
  type Village,
} from '../../engine';
import { t, type MessageKey } from '../../i18n';
import { useGame } from '../../store/gameStore';
import { CostView } from './CostView';
import { duration, short } from './vui';

export function MilitaryView({ village: v }: { village: Village }) {
  const game = useGame.getState().game;
  const home = TROOPS.filter((tr) => (v.troops[tr.id] ?? 0) > 0);
  const moves = game.village.movements.filter((m) => m.from === v.id || m.target === String(v.id));
  return (
    <div className="v-military">
      <section className="glass v-box">
        <h4>🛡️ Truppen in {v.name}</h4>
        {home.length ? (
          <div className="v-troops">
            {home.map((tr) => (
              <span key={tr.id} className="v-troop-chip" title={tr.name}>
                {tr.icon} <b>{v.troops[tr.id]}</b>
              </span>
            ))}
          </div>
        ) : (
          <p className="small muted">Keine Truppen daheim. Die Kaserne wartet.</p>
        )}
        <p className="small muted">
          Verteidigung gegen den Riss: <b>{Math.round(defenseValue(v, v.troops))}</b> · Angriff:{' '}
          <b>{Math.round(attackValue(v, v.troops))}</b> · Tragkraft {short(carryOf(v.troops))}
        </p>
        <InvasionInfo />
      </section>

      {v.training.length > 0 && (
        <section className="glass v-box">
          <h4>⏳ Ausbildung</h4>
          {v.training.map((tr, i) => {
            const def = TROOPS.find((x) => x.id === tr.troop)!;
            return (
              <div key={i} className="v-list-row">
                <span>
                  {def.icon} {tr.count}× {def.name}
                </span>
                <span className="muted small">
                  {i === 0 ? `nächste in ${duration(tr.each - tr.progress)}` : 'wartet'} · gesamt{' '}
                  {duration(tr.each * tr.count - (i === 0 ? tr.progress : 0))}
                </span>
              </div>
            );
          })}
        </section>
      )}

      {buildingLevel(v, 'barracks') > 0 && (
        <section className="glass v-box">
          <h4>⚔️ Kaserne</h4>
          <TrainPanel village={v} building="barracks" />
        </section>
      )}
      {buildingLevel(v, 'stable') > 0 && (
        <section className="glass v-box">
          <h4>🐎 Stall</h4>
          <TrainPanel village={v} building="stable" />
        </section>
      )}
      {buildingLevel(v, 'barracks') === 0 && (
        <p className="small muted center">
          Baue eine Kaserne (Hauptgebäude 3 + Versammlungsplatz 1), um Truppen auszubilden.
        </p>
      )}

      {moves.length > 0 && (
        <section className="glass v-box">
          <h4>🧭 Truppenbewegungen</h4>
          {moves.map((m) => {
            const target = game.village.targets.find((x) => x.id === m.target);
            const label =
              m.kind === 'raid'
                ? `⚔️ Raubzug → ${target?.icon} ${target?.name}`
                : m.kind === 'return'
                  ? `↩️ Rückkehr von ${target?.name ?? '…'}`
                  : m.kind === 'settle'
                    ? '🧳 Siedler unterwegs'
                    : '🐫 Händler unterwegs';
            return (
              <div key={m.id} className="v-list-row">
                <span>{label}</span>
                <span className="v-queue-bar">
                  <i style={{ width: `${(1 - m.remaining / m.total) * 100}%` }} />
                </span>
                <span className="small">{duration(m.remaining)}</span>
              </div>
            );
          })}
        </section>
      )}

      <section className="glass v-box">
        <h4>🗺️ Umgebung</h4>
        {buildingLevel(v, 'rally') < 1 && (
          <p className="small v-req">Für Raubzüge brauchst du einen Versammlungsplatz.</p>
        )}
        <TargetList village={v} />
      </section>
    </div>
  );
}

function InvasionInfo() {
  const vs = useGame.getState().game.village;
  if (vs.protection > 0)
    return (
      <p className="small">
        🕊️ Anfängerschutz: noch {duration(vs.protection)} keine Riss-Invasionen.
      </p>
    );
  return (
    <p className="small">
      🌀 Nächste Riss-Invasion in etwa {duration(vs.invasionIn)} · abgewehrt {vs.invasionsWon} ·
      verloren {vs.invasionsLost}
    </p>
  );
}

export function TrainPanel({
  village: v,
  building,
}: {
  village: Village;
  building: TroopDef['building'];
}) {
  const act = useGame((s) => s.village);
  const game = useGame.getState().game;
  const [counts, setCounts] = useState<Record<string, number>>({});
  const list = TROOPS.filter((tr) => tr.building === building);
  return (
    <div className="v-train">
      {list.map((tr) => {
        const unlocked = troopUnlocked(game, tr);
        const levelOk = buildingLevel(v, tr.building) >= tr.buildingLevel;
        const max = maxTrainable(v, tr);
        const n = Math.min(counts[tr.id] ?? 1, Math.max(1, max));
        return (
          <div key={tr.id} className={`v-train-row ${unlocked && levelOk ? '' : 'locked'}`}>
            <span className="v-train-icon">{tr.icon}</span>
            <div className="v-train-body">
              <strong>{tr.name}</strong>
              <small className="muted">
                ⚔️{tr.attack} 🛡️{tr.defInf}/{tr.defCav} 👟{tr.speed} 🎒{tr.carry} 🌾{tr.upkeep} · ⏱{' '}
                {duration(trainTime(v, tr))}
              </small>
              <CostView cost={tr.cost} village={v} times={n} />
              {!unlocked && <small className="v-req">In der Akademie erforschen</small>}
              {unlocked && !levelOk && (
                <small className="v-req">Gebäudestufe {tr.buildingLevel} nötig</small>
              )}
            </div>
            {unlocked && levelOk && (
              <div className="v-train-form">
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, max)}
                  value={n}
                  onChange={(e) =>
                    setCounts({ ...counts, [tr.id]: Math.max(1, Number(e.target.value) || 1) })
                  }
                  aria-label={`Anzahl ${tr.name}`}
                />
                <button
                  className="btn btn-ghost small"
                  onClick={() => setCounts({ ...counts, [tr.id]: Math.max(1, max) })}
                >
                  max {max}
                </button>
                <button
                  className="btn btn-primary small"
                  disabled={max < 1}
                  onClick={() => act((s) => trainTroops(s, v.id, tr.id, n))}
                >
                  Ausbilden
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ResearchPanel({ village: v }: { village: Village }) {
  const act = useGame((s) => s.village);
  const game = useGame.getState().game;
  return (
    <div className="v-list">
      {v.research && (
        <p className="small">
          🔬 Forschung läuft: {TROOPS.find((x) => x.id === v.research!.troop)?.name} – noch{' '}
          {duration(v.research.remaining)}
        </p>
      )}
      {TROOPS.filter((tr) => tr.research).map((tr) => {
        const done = game.village.researched.includes(tr.id);
        const check = canResearch(game, v, tr.id);
        return (
          <div key={tr.id} className="v-list-row">
            <span>
              {tr.icon} {tr.name}{' '}
              <small className="muted">
                Akademie {tr.research!.academy}
                {tr.research!.smithy ? `, Schmiede ${tr.research!.smithy}` : ''}
              </small>
            </span>
            {done ? (
              <span className="small">✅ erforscht</span>
            ) : (
              <>
                <CostView cost={tr.research!.cost} village={v} />
                <button
                  className="btn small"
                  disabled={!check.ok}
                  onClick={() => act((s) => startResearch(s, v.id, tr.id))}
                >
                  {check.ok ? 'Erforschen' : t(`villageFail.${check.reason}` as MessageKey)}
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TargetList({ village: v }: { village: Village }) {
  const game = useGame.getState().game;
  const [open, setOpen] = useState<string | null>(null);
  const targets = [...game.village.targets].sort(
    (a, b) => distance(v.x, v.y, a.x, a.y) - distance(v.x, v.y, b.x, b.y),
  );
  return (
    <div className="v-targets">
      {targets.map((tg) => {
        const d = distance(v.x, v.y, tg.x, tg.y);
        const stock = V_RESOURCES.reduce((a, r) => a + tg.stock[r], 0);
        const owned = tg.owner !== null;
        return (
          <div key={tg.id} className={`v-target kind-${tg.kind} ${owned ? 'owned' : ''}`}>
            <button
              className="v-target-head"
              onClick={() => setOpen(open === tg.id ? null : tg.id)}
            >
              <span className="v-target-icon">{tg.icon}</span>
              <span className="v-target-body">
                <strong>
                  {tg.name} <small className="muted">Stufe {tg.level}</small>
                </strong>
                <small>
                  {owned
                    ? `🏳️ annektiert von ${game.village.villages.find((x) => x.id === tg.owner)?.name ?? '?'} · +25 % ${V_RES_INFO[tg.bonus!].name}`
                    : `🛡️ ${Math.round(tg.defense)}/${tg.maxDefense} · 💰 ${short(stock)} · 📏 ${d.toFixed(1)}`}
                </small>
              </span>
              <span className="v-def-bar">
                <i style={{ width: `${(tg.defense / tg.maxDefense) * 100}%` }} />
              </span>
            </button>
            {open === tg.id && !owned && <RaidForm village={v} target={tg} />}
          </div>
        );
      })}
    </div>
  );
}

export function RaidForm({ village: v, target }: { village: Village; target: RaidTarget }) {
  const act = useGame((s) => s.village);
  const game = useGame.getState().game;
  const [sel, setSel] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      TROOPS.filter((tr) => tr.id !== 'settler').map((tr) => [tr.id, v.troops[tr.id] ?? 0]),
    ),
  );
  const heroHere = heroAtHome(game, v.id);
  const [withHero, setWithHero] = useState(heroHere);
  const hero = withHero && heroHere;
  const available = TROOPS.filter((tr) => tr.id !== 'settler' && (v.troops[tr.id] ?? 0) > 0);
  const attack =
    attackValue(v, sel, target.kind === 'ruin') * (hero ? 1 + heroOffenseBonus(game) : 1) +
    (hero ? heroStrength(game) : 0);
  const tpl = {
    camp: 'Räuber bewachen die Beute.',
    oasis:
      'Wilde Tiere verteidigen die Oase. Geräumt annektiert sie dein Held (Residenz 10/15/20).',
    ruin: 'Ätherwesen – Kampfmagier zählen doppelt.',
  };
  const annex = target.kind === 'oasis' ? canAnnex(game, v, target) : null;
  const travelSet = Object.values(sel).some((n) => n > 0) ? sel : { militia: 1 };
  return (
    <div className="v-raid">
      <p className="small muted">{tpl[target.kind]}</p>
      {available.length === 0 && !heroHere && <p className="small">Keine Truppen verfügbar.</p>}
      {available.map((tr) => (
        <label key={tr.id} className="v-raid-row">
          <span>
            {tr.icon} {tr.name} <small className="muted">({v.troops[tr.id]})</small>
          </span>
          <input
            type="range"
            min={0}
            max={v.troops[tr.id] ?? 0}
            value={Math.min(sel[tr.id] ?? 0, v.troops[tr.id] ?? 0)}
            onChange={(e) => setSel({ ...sel, [tr.id]: Number(e.target.value) })}
          />
          <b>{Math.min(sel[tr.id] ?? 0, v.troops[tr.id] ?? 0)}</b>
        </label>
      ))}
      {heroHere && (
        <label className="v-hero-toggle">
          <input
            type="checkbox"
            checked={withHero}
            onChange={(e) => setWithHero(e.target.checked)}
          />
          {game.hero.avatar} Held begleitet (+{Math.round(heroStrength(game))} Kampfkraft, sammelt
          XP, riskiert Gesundheit {Math.round(game.hero.health)} %)
        </label>
      )}
      {(available.length > 0 || heroHere) && (
        <>
          <p className="small">
            Angriff <b className={attack > target.defense ? 'good' : 'bad'}>{Math.round(attack)}</b>{' '}
            gegen {Math.round(target.defense)} · Tragkraft{' '}
            {short(carryOf(sel) + (hero ? HERO_CARRY : 0))} · Weg{' '}
            {duration(travelTime(v, travelSet, distance(v.x, v.y, target.x, target.y)))}
          </p>
          <button
            className="btn btn-primary"
            disabled={attack <= 0}
            onClick={() => act((s) => sendRaid(s, v.id, target.id, sel, hero))}
          >
            ⚔️ Raubzug starten
          </button>
        </>
      )}
      {annex && (
        <button
          className="btn"
          disabled={!annex.ok}
          onClick={() => act((s) => annexOasis(s, v.id, target.id))}
        >
          {annex.ok
            ? '🏳️ Oase annektieren (+25 %)'
            : t(`villageFail.${annex.reason}` as MessageKey)}
        </button>
      )}
    </div>
  );
}
