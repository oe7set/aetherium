import { useState } from 'react';
import { getItem, TECH_MAP } from '../../data';
import {
  BIOMES,
  HEROES,
  RIFT_PASSIVES,
  RIFT_TALENTS,
  RIFT_WEAPONS,
  RUN_MINUTES,
  riftIslandBonus,
} from '../../data/rift';
import {
  autoProvisions,
  biomeUnlocked,
  echoEssence,
  heroUnlocked,
  heroUnlockText,
  riftHeal,
  riftTalentCost,
  riftTalentLevel,
  runStats,
  weaponUnlocked,
} from '../../engine';
import { createRun } from '../../rift/sim';
import { useGame } from '../../store/gameStore';
import { useRiftRun } from './runStore';
import './rift.css';

type Segment = 'start' | 'talents' | 'codex';

export function RiftPanel() {
  // Re-render on meta changes only (a primitive signature keeps the selector stable).
  useGame((s) =>
    JSON.stringify([
      s.game.rift.essence,
      s.game.rift.talents,
      s.game.rift.runs,
      s.game.techs.length,
      s.game.equipment.weapon ?? '',
      Object.keys(s.game.inventory).length,
    ]),
  );
  const [seg, setSeg] = useState<Segment>('start');
  return (
    <div className="panel rift-panel">
      <div className="segments" role="tablist">
        {(
          [
            ['start', '🌀 Riss'],
            ['talents', '✨ Talente'],
            ['codex', '📖 Kodex'],
          ] as [Segment, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={seg === k}
            className={`segment ${seg === k ? 'active' : ''}`}
            onClick={() => setSeg(k)}
          >
            {label}
          </button>
        ))}
      </div>
      {seg === 'start' && <StartView />}
      {seg === 'talents' && <TalentView />}
      {seg === 'codex' && <CodexView />}
    </div>
  );
}

function fmt(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function StartView() {
  const game = useGame.getState().game;
  const prepare = useGame((s) => s.riftPrepare);
  const [hero, setHero] = useState(game.rift.hero);
  const [biome, setBiome] = useState(game.rift.biome);
  const stats = runStats(game, hero);
  const provisions = autoProvisions(game);
  const canStart = heroUnlocked(game, hero) && biomeUnlocked(game, biome);
  const start = () => {
    const cfg = prepare(hero, biome);
    if (cfg) useRiftRun.getState().setRun(createRun(cfg));
  };
  return (
    <div className="rift-start">
      <div className="rift-hero-banner">
        <div className="rift-portal" aria-hidden>
          <span>{HEROES.find((h) => h.id === hero)?.icon}</span>
        </div>
        <div>
          <h2 className="rift-heading">Ätherriss</h2>
          <p className="small">
            Überlebe {RUN_MINUTES} Minuten gegen endlose Horden. Deine Waffen feuern von selbst – du
            bestimmst nur, wohin du läufst. Bei {RUN_MINUTES}:00 wartet der Prüfer.
          </p>
          <p className="small muted">
            🌀 {game.rift.essence} Essenz · {game.rift.runs} Läufe · {game.rift.wins} bestanden
          </p>
        </div>
      </div>

      <h4 className="rift-h4">Held</h4>
      <div className="hero-grid">
        {HEROES.map((h) => {
          const unlocked = heroUnlocked(game, h.id);
          const weapon = RIFT_WEAPONS.find((w) => w.id === h.weapon);
          return (
            <button
              key={h.id}
              className={`hero-card ${hero === h.id ? 'active' : ''} ${unlocked ? '' : 'locked'}`}
              onClick={() => setHero(h.id)}
              disabled={!unlocked}
            >
              <span className="hero-icon">{unlocked ? h.icon : '🔒'}</span>
              <strong>{h.name}</strong>
              <small>
                {weapon?.icon} {weapon?.name}
              </small>
              <small className="muted">{unlocked ? h.desc : heroUnlockText(h.id)}</small>
            </button>
          );
        })}
      </div>

      <h4 className="rift-h4">Biom</h4>
      <div className="biome-list">
        {BIOMES.map((b, i) => {
          const unlocked = biomeUnlocked(game, b.id);
          const best = game.rift.best[b.id];
          return (
            <button
              key={b.id}
              className={`biome-card ${biome === b.id ? 'active' : ''} ${unlocked ? '' : 'locked'}`}
              style={{ '--g1': b.ground[0], '--g2': b.ground[1] } as React.CSSProperties}
              onClick={() => setBiome(b.id)}
              disabled={!unlocked}
            >
              <span className="biome-icon">{unlocked ? b.icon : '🔒'}</span>
              <span className="biome-body">
                <strong>{b.name}</strong>
                <small>
                  {unlocked
                    ? b.desc
                    : `Überlebe 10:00 in ${BIOMES[i - 1]?.name} – oder Kampfstufe ${15 + i * 15}`}
                </small>
              </span>
              <span className="biome-best">
                {best ? (
                  <>
                    ⏱ {fmt(best.time)}
                    <br />
                    💀 {best.kills}
                  </>
                ) : (
                  <small className="muted">×{(1 + 0.6 * i).toFixed(1)} Essenz</small>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rift-loadout glass">
        <div>
          <strong>Startwerte</strong>
          <small className="muted"> (Talente + Insel-Kampfskills)</small>
        </div>
        <div className="stat-chips">
          <span>❤️ {Math.round(stats.maxHp)}</span>
          <span>💪 {Math.round(stats.might * 100)} %</span>
          <span>🦺 {stats.armor}</span>
          <span>🔭 {Math.round(stats.area * 100)} %</span>
          <span>⏱️ {Math.round(stats.cooldown * 100)} %</span>
          <span>👟 {Math.round(stats.speed)}</span>
          {stats.regen > 0 && <span>🌿 {stats.regen.toFixed(1)}/s</span>}
          {stats.amount > 0 && <span>🖨️ +{stats.amount}</span>}
        </div>
        <div className="small">
          🎒 Proviant:{' '}
          {provisions.length
            ? provisions.map((id, i) => (
                <span key={i} title={`${getItem(id).name}: heilt ${riftHeal(id)} LP im Riss`}>
                  {getItem(id).icon}
                </span>
              ))
            : 'kein Essen im Inventar (wird bei niedrigen LP automatisch gegessen)'}
        </div>
        {game.equipment.weapon && (
          <div className="small">⚔️ Ausgerüstete Waffe: Startwaffe beginnt auf Stufe 2</div>
        )}
      </div>

      <button className="btn btn-primary btn-big rift-go" disabled={!canStart} onClick={start}>
        🌀 Riss betreten
      </button>
      <p className="small muted center">
        Steuerung: Finger irgendwo auf den Bildschirm legen und ziehen · WASD/Pfeiltasten · P =
        Pause
      </p>
    </div>
  );
}

function TalentView() {
  const game = useGame.getState().game;
  const buy = useGame((s) => s.riftTalent);
  const bonus = riftIslandBonus(game.rift.essenceTotal);
  return (
    <div className="rift-talents">
      <div className="fame-hero glass">
        <span className="essence-orb">🌀</span>
        <div>
          <strong className="rift-heading">{game.rift.essence}</strong> Riss-Essenz
          <br />
          <small className="muted">
            Gesamt {game.rift.essenceTotal} · Insel: +
            {((bonus['combat.damage'] ?? 0) * 100).toFixed(1)} % Kampfschaden, +
            {((bonus['combat.accuracy'] ?? 0) * 100).toFixed(1)} % Treffsicherheit
          </small>
        </div>
      </div>
      {riftTalentLevel(game, 't_echo') > 0 && (
        <p className="small">
          👥 Echo-Läufe bringen alle 10 Minuten {echoEssence(game)} Essenz – auch offline.
        </p>
      )}
      <div className="talent-grid">
        {RIFT_TALENTS.map((t) => {
          const level = riftTalentLevel(game, t.id);
          const max = level >= t.maxLevel;
          const cost = riftTalentCost(game, t.id);
          return (
            <button
              key={t.id}
              className={`rift-talent ${level ? 'owned' : ''}`}
              disabled={max || game.rift.essence < cost}
              onClick={() => buy(t.id)}
            >
              <span className="talent-icon">{t.icon}</span>
              <strong>{t.name}</strong>
              <small>{t.desc}</small>
              <span className="talent-pips">
                {Array.from({ length: t.maxLevel }, (_, i) => (
                  <i key={i} className={i < level ? 'on' : ''} />
                ))}
              </span>
              <small className="talent-cost">{max ? 'Max' : `${cost} 🌀`}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CodexView() {
  const game = useGame.getState().game;
  const base = RIFT_WEAPONS.filter((w) => !w.evolvesFrom);
  const evolutions = RIFT_WEAPONS.filter((w) => w.evolvesFrom);
  return (
    <div className="rift-codex">
      <h4 className="rift-h4">Waffen</h4>
      <div className="codex-grid">
        {base.map((w) => {
          const ok =
            weaponUnlocked(game, w.id) ||
            HEROES.some((h) => h.weapon === w.id && heroUnlocked(game, h.id));
          return (
            <div
              key={w.id}
              className={`codex-card ${ok ? '' : 'locked'}`}
              style={{ '--wc': w.color } as React.CSSProperties}
            >
              <span className="codex-icon">{ok ? w.icon : '🔒'}</span>
              <strong>{w.name}</strong>
              <small>
                {ok
                  ? w.desc
                  : `Forschung „${TECH_MAP.get(w.unlockTech ?? '')?.name ?? w.unlockTech}" nötig`}
              </small>
            </div>
          );
        })}
      </div>
      <h4 className="rift-h4">Evolutionen</h4>
      <div className="codex-grid">
        {evolutions.map((w) => {
          const from = RIFT_WEAPONS.find((x) => x.id === w.evolvesFrom);
          const passive = RIFT_PASSIVES.find((p) => p.id === w.requires);
          const found = game.rift.evolutions.includes(w.id);
          return (
            <div
              key={w.id}
              className={`codex-card evo ${found ? 'found' : ''}`}
              style={{ '--wc': w.color } as React.CSSProperties}
            >
              <span className="codex-icon">{found ? w.icon : '❔'}</span>
              <strong>{found ? w.name : '???'}</strong>
              <small>
                {from?.icon} {from?.name} (Max) + {passive?.icon} {passive?.name} + 🎁
              </small>
            </div>
          );
        })}
      </div>
      <h4 className="rift-h4">Passive</h4>
      <div className="passive-row">
        {RIFT_PASSIVES.map((p) => (
          <span key={p.id} className="chip" title={p.desc}>
            {p.icon} {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
