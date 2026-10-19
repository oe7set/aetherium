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
  canStartRun,
  curseEssence,
  cursesUnlocked,
  dailyChallenge,
  toggleCurse,
  biomeUnlocked,
  echoEssence,
  endlessUnlocked,
  myRecord,
  parseRecordCode,
  rankRivals,
  recordCode,
  type RivalRecord,
  heroUnlocked,
  heroUnlockText,
  riftHeal,
  riftTalentCost,
  riftTalentLevel,
  runStats,
  weaponUnlocked,
  weeklyChallenge,
} from '../../engine';
import { WEEKLY_MINUTES } from '../../data/weekly';
import {
  CURSE_MAP,
  CURSE_RELIC_BONUS,
  CURSE_UNLOCK_RUNS,
  CURSES,
  DAILY_MINUTES,
  DAILY_REWARD,
  SHRINE_EVERY,
} from '../../data/riftCurses';
import { createRun } from '../../rift/sim';
import { useGame } from '../../store/gameStore';
import { AdventuresView, HeroView } from './HeroView';
import { RelicsView } from './RelicsView';
import { WorldBossView } from './WorldBossView';
import { useRiftRun } from './runStore';
import './rift.css';

type Segment = 'hero' | 'adventures' | 'start' | 'boss' | 'talents' | 'relics' | 'codex';

export function RiftPanel() {
  // Re-render on meta changes only (a primitive signature keeps the selector stable).
  useGame((s) =>
    JSON.stringify([
      s.game.rift.essence,
      s.game.rift.talents,
      s.game.rift.runs,
      s.game.rift.relics.length,
      s.game.hero.status,
      Math.floor(s.game.hero.health),
      s.game.hero.level,
      s.game.hero.avatar,
      s.game.techs.length,
      s.game.equipment.weapon ?? '',
      Object.keys(s.game.inventory).length,
    ]),
  );
  const seg = useGame((s) => s.ui.heroSegment);
  const setUi = useGame((s) => s.setUi);
  const setSeg = (heroSegment: Segment) => setUi({ heroSegment });
  return (
    <div className="panel rift-panel">
      <div className="segments" role="tablist">
        {(
          [
            ['hero', '🦸 Held'],
            ['adventures', '❗ Abenteuer'],
            ['start', '🌀 Riss'],
            ['boss', '👹 Weltboss'],
            ['talents', '✨ Talente'],
            ['relics', '🏺 Relikte'],
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
      {seg === 'hero' && <HeroView />}
      {seg === 'adventures' && <AdventuresView />}
      {seg === 'start' && <StartView />}
      {seg === 'boss' && <WorldBossView />}
      {seg === 'talents' && <TalentView />}
      {seg === 'relics' && <RelicsView />}
      {seg === 'codex' && <CodexView />}
    </div>
  );
}

function fmt(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function WeeklyCard({ hero }: { hero: string }) {
  useGame(
    (s) => `${s.game.rift.weekly.week}|${s.game.rift.weekly.attempts}|${s.game.rift.weekly.won}`,
  );
  const prepare = useGame((s) => s.weeklyPrepare);
  const game = useGame.getState().game;
  const now = Date.now();
  const c = weeklyChallenge(game, now);
  const w = game.rift.weekly.week === c.week ? game.rift.weekly : null;
  const biome = BIOMES.find((b) => b.id === c.biome)!;
  const check = canStartRun(game, hero, c.biome);
  const start = () => {
    const cfg = prepare(hero);
    if (cfg) useRiftRun.getState().setRun(createRun(cfg));
  };
  return (
    <div className={`weekly-card${w?.won ? ' done' : ''}`}>
      <div className="weekly-head">
        <span className="weekly-icon">{w?.won ? '🏆' : '🦹'}</span>
        <div>
          <strong>Wochenboss</strong>
          <small className="muted">
            {biome.icon} {biome.name} · noch {weekLeft(now)} · Sieg Nr. {game.rift.weekly.wins + 1}
          </small>
        </div>
      </div>
      <p className="weekly-mut">
        <b>
          {c.mutator.icon} {c.mutator.name}:
        </b>{' '}
        {c.mutator.desc}
      </p>
      <p className="small muted">
        {WEEKLY_MINUTES} Minuten, Zwischenboss zur Halbzeit, am Ende der Montagsfürst 🦹
        (Sturmangriffe, Geschossringe, Verstärkung). Gegnerstärke ×{c.difficulty.toFixed(2)}.{' '}
        {w?.won
          ? 'Diese Woche bezwungen – Wiederholen bringt normale Riss-Beute.'
          : 'Erster Sieg der Woche: legendäre Heldenausrüstung, Essenz, Gold & ein besonderer Avatar.'}
      </p>
      {w && w.attempts > 0 && (
        <p className="small">
          Versuche: {w.attempts} · Bestzeit {fmt(w.bestTime)} · 💀 {w.bestKills}
        </p>
      )}
      <button className="btn btn-primary" disabled={!check.ok} onClick={start}>
        {check.ok
          ? w?.won
            ? 'Nochmal antreten'
            : 'Zum Wochenboss'
          : check.reason === 'dead'
            ? 'Held erholt sich noch'
            : check.reason === 'busy'
              ? 'Held ist unterwegs'
              : 'Kampfstil gesperrt'}
      </button>
    </div>
  );
}

function DailyCard({ hero }: { hero: string }) {
  useGame(
    (s) => `${s.game.rift.daily.day}|${s.game.rift.daily.attempts}|${s.game.rift.daily.claimed}`,
  );
  const prepare = useGame((s) => s.dailyPrepare);
  const game = useGame.getState().game;
  const c = dailyChallenge(game, Date.now());
  const d = game.rift.daily.day === c.day ? game.rift.daily : null;
  const biome = BIOMES.find((b) => b.id === c.biome)!;
  const curse = CURSE_MAP.get(c.curse)!;
  const check = canStartRun(game, hero, c.biome);
  const start = () => {
    const cfg = prepare(hero);
    if (cfg) useRiftRun.getState().setRun(createRun(cfg));
  };
  return (
    <div className={`weekly-card daily-card${d?.claimed ? ' done' : ''}`}>
      <div className="weekly-head">
        <span className="weekly-icon">{d?.claimed ? '✅' : '📅'}</span>
        <div>
          <strong>Tagesriss</strong>
          <small className="muted">
            {biome.icon} {biome.name} · {DAILY_MINUTES} Minuten · gleicher Seed für alle heute
          </small>
        </div>
      </div>
      <p className="weekly-mut">
        <b>
          {curse.icon} Fluch des Tages – {curse.name}:
        </b>{' '}
        {curse.desc}
      </p>
      <p className="small muted">
        {d?.claimed
          ? 'Heute schon belohnt – weitere Läufe zählen für die Bestzeit.'
          : `Erster Lauf des Tages: +${DAILY_REWARD.essence} Essenz, Helden-XP und Gold.`}
        {d && d.attempts > 0 && ` · Bestzeit ${fmt(d.bestTime)} · 💀 ${d.bestKills}`}
        {game.rift.daily.days > 0 && ` · ${game.rift.daily.days} Tage gemeistert`}
      </p>
      <button className="btn btn-primary" disabled={!check.ok} onClick={start}>
        {check.ok ? '📅 Tagesriss starten' : 'Held nicht bereit'}
      </button>
    </div>
  );
}

function CursePicker() {
  const sig = useGame((s) => s.game.rift.curses.join(','));
  const act = useGame((s) => s.combatAct);
  const game = useGame.getState().game;
  const active = sig ? sig.split(',') : [];
  if (!cursesUnlocked(game))
    return (
      <p className="small muted">
        🕯️ Flüche schalten sich nach {CURSE_UNLOCK_RUNS} Läufen frei ({game.rift.runs}/
        {CURSE_UNLOCK_RUNS}): schwerer, aber mehr Essenz und Relikte.
      </p>
    );
  return (
    <div className="curse-picker">
      <h4 className="rift-h4">
        🕯️ Flüche{' '}
        <small className="muted">
          {active.length
            ? `+${Math.round(curseEssence(active) * 100)} % Essenz · +${Math.round(active.length * CURSE_RELIC_BONUS * 100)} % Relikt-Chance`
            : 'freiwillig: schwerer, dafür mehr Essenz und Relikte'}
        </small>
      </h4>
      <div className="curse-list">
        {CURSES.map((c) => (
          <button
            key={c.id}
            className={`curse ${active.includes(c.id) ? 'on' : ''}`}
            aria-pressed={active.includes(c.id)}
            onClick={() => act((s) => void toggleCurse(s, c.id))}
          >
            <span>{c.icon}</span>
            <strong>{c.name}</strong>
            <small>{c.desc}</small>
            <small className="muted">+{Math.round(c.essence * 100)} %</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function weekLeft(now: number): string {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7;
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + 7).getTime();
  const hours = Math.max(0, Math.floor((end - now) / 3600000));
  return hours >= 24 ? `${Math.floor(hours / 24)} T ${hours % 24} h` : `${hours} h`;
}

function StartView() {
  const game = useGame.getState().game;
  const prepare = useGame((s) => s.riftPrepare);
  const [hero, setHero] = useState(game.rift.hero);
  const [biome, setBiome] = useState(game.rift.biome);
  const stats = runStats(game, hero);
  const provisions = autoProvisions(game);
  const check = canStartRun(game, hero, biome);
  const canStart = check.ok;
  const [endless, setEndless] = useState(false);
  const endlessOpen = endlessUnlocked(game);
  const start = () => {
    const cfg = prepare(hero, biome, endless && endlessOpen);
    if (cfg) useRiftRun.getState().setRun(createRun(cfg));
  };
  return (
    <div className="rift-start">
      <div className="rift-hero-banner">
        <div className="rift-portal" aria-hidden>
          <span>{game.hero.avatar}</span>
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

      <WeeklyCard hero={hero} />
      <DailyCard hero={hero} />

      <h4 className="rift-h4">Kampfstil von {game.hero.name}</h4>
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

      <CursePicker />
      <p className="small muted">
        ⛩️ Alle {(SHRINE_EVERY / 60).toLocaleString('de-DE')} Minuten erscheint ein Schrein: Segen,
        Heilung, Glücksspiel oder eine Elite-Herausforderung.
      </p>

      <label className={`toggle endless-toggle ${endlessOpen ? '' : 'locked'}`}>
        <input
          type="checkbox"
          checked={endless && endlessOpen}
          disabled={!endlessOpen}
          onChange={(e) => setEndless(e.target.checked)}
        />
        <span>
          ♾️ <b>Endlos-Riss</b>{' '}
          {endlessOpen ? (
            <small className="muted">
              kein Prüfer, alle 5 Minuten ein Boss, immer härter · Bestzeit{' '}
              {fmt(game.stats.riftEndlessBest ?? 0)}
            </small>
          ) : (
            <small className="muted">– schalte ihn frei, indem du den Prüfer einmal besiegst</small>
          )}
        </span>
      </label>
      <button className="btn btn-primary btn-big rift-go" disabled={!canStart} onClick={start}>
        {canStart
          ? endless && endlessOpen
            ? '♾️ Endlos-Riss betreten'
            : '🌀 Riss betreten'
          : check.reason === 'dead'
            ? '💀 Dein Held ist gefallen'
            : check.reason === 'busy'
              ? `${game.hero.avatar} Held ist unterwegs`
              : '🔒 Gesperrt'}
      </button>
      <p className="small muted center">
        Steuerung: Finger irgendwo auf den Bildschirm legen und ziehen · WASD/Pfeiltasten · P =
        Pause
      </p>
      {endlessOpen && <Leaderboard />}
    </div>
  );
}

const RIVALS_KEY = 'aetherium.rivals';

function loadRivals(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RIVALS_KEY) ?? '[]') as unknown;
    return Array.isArray(raw) ? raw.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

function saveRivals(codes: string[]): void {
  try {
    localStorage.setItem(RIVALS_KEY, JSON.stringify(codes));
  } catch {
    // Private mode: the list just lives for this session.
  }
}

/** Endless-rift ranking via shareable record codes – no server, friends swap codes. */
function Leaderboard() {
  const game = useGame((s) => s.game);
  const [codes, setCodes] = useState<string[]>(loadRivals);
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState('');
  const mine = myRecord(game);
  const myCode = recordCode(mine);
  const rivals = codes
    .map((c) => ({ code: c, rec: parseRecordCode(c) }))
    .filter((r): r is { code: string; rec: RivalRecord } => r.rec !== null);
  const ranked = rankRivals([mine, ...rivals.map((r) => r.rec)]);
  const add = () => {
    const rec = parseRecordCode(input);
    if (!rec) return setMsg('❌ Ungültiger Code – bitte vollständig einfügen.');
    // Same name = newer code replaces the old entry.
    const next = [
      ...codes.filter((c) => parseRecordCode(c)?.name !== rec.name),
      input.trim(),
    ].slice(-30);
    setCodes(next);
    saveRivals(next);
    setInput('');
    setMsg(`✅ ${rec.name} ist in der Rangliste.`);
  };
  const remove = (code: string) => {
    const next = codes.filter((c) => c !== code);
    setCodes(next);
    saveRivals(next);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      setMsg('📋 Dein Rekord-Code ist kopiert – schick ihn deinen Freunden!');
    } catch {
      setMsg('Kopieren ging nicht – markiere den Code und kopiere ihn von Hand.');
    }
  };
  return (
    <div className="leaderboard">
      <h3 className="rift-heading">🏆 Endlos-Rangliste</h3>
      <ol className="leader-list">
        {ranked.map((r, i) => {
          const me = r === mine;
          const entry = rivals.find((x) => x.rec === r);
          return (
            <li key={me ? 'me' : entry?.code} className={me ? 'me' : ''}>
              <span className="leader-rank">{['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`}</span>
              <span className="leader-name">
                {r.name}
                {me && <small className="muted"> (du)</small>}
                <small className="muted">
                  {' '}
                  · {r.wins} Siege · Gesamtlevel {r.total}
                </small>
              </span>
              <b>♾️ {fmt(r.endless)}</b>
              {entry && (
                <button
                  className="btn small"
                  onClick={() => remove(entry.code)}
                  aria-label="Entfernen"
                >
                  ✕
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <div className="leader-code">
        <input className="input" readOnly value={myCode} onFocus={(e) => e.target.select()} />
        <button className="btn small" onClick={copy}>
          📋 Kopieren
        </button>
      </div>
      <div className="leader-code">
        <input
          className="input"
          placeholder="Code eines Freundes einfügen …"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn small btn-primary" disabled={!input.trim()} onClick={add}>
          Hinzufügen
        </button>
      </div>
      {msg && <small>{msg}</small>}
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
