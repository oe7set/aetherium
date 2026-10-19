import { useEffect, useRef, useState } from 'react';
import { RELIC_MAP } from '../../data/riftwalker';
import { getItem } from '../../data';
import { HERO_ITEMS, TIER_NAMES } from '../../data/hero';
import { BIOMES, RIFT_PASSIVES } from '../../data/rift';
import type { AdventureReward, RiftReward, WeeklyReward } from '../../engine';
import {
  banishChoice,
  chooseUpgrade,
  chooseShrine,
  closeChest,
  maxLevelOf,
  PASSIVE_MAP,
  rerollChoices,
  runMinutes,
  runResult,
  skipLevelUp,
  stepRun,
  togglePause,
  WEAPON_MAP,
  weaponStats,
  type Choice,
  type RiftInput,
  type RunState,
} from '../../rift/sim';
import { useGame } from '../../store/gameStore';
import { SOUNDS } from '../audio';
import { render, viewFor } from './render';
import { useRiftRun } from './runStore';
import './rift.css';

const JOY_RADIUS = 52;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Full-screen arena: canvas loop + React HUD. Lazy loaded. */
export default function RiftOverlay() {
  const run = useRiftRun((s) => s.run);
  const version = useRiftRun((s) => s.version);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const joyRef = useRef<{ id: number; ox: number; oy: number; x: number; y: number } | null>(null);
  const keys = useRef(new Set<string>());
  const [joy, setJoy] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const [reward, setReward] = useState<RiftReward | null>(null);
  const [advReward, setAdvReward] = useState<AdventureReward | null>(null);
  const [weekly, setWeekly] = useState<WeeklyReward | null>(null);
  const finished = useRef(false);

  // Game loop.
  useEffect(() => {
    if (!run) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    let raf = 0;
    let last = performance.now();
    let lastHud = 0;
    let lastPhase = run.phase;
    let lastLevel = run.hero.level;
    let lastKills = 0;
    // Adaptive quality: if frames get slow, lower the resolution first, then the detail level.
    const quality = {
      dpr: Math.min(2, window.devicePixelRatio || 1),
      low: false,
      ema: 1 / 60,
      frames: 0,
    };
    const resize = () => {
      const dpr = quality.dpr;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    const eco = document.documentElement.classList.contains('perf-eco');
    const frame = (now: number) => {
      // Eco caps the arena at ~40 fps (high-refresh phones would otherwise render 90–120).
      if (eco && now - last < 24) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const input: RiftInput = { x: 0, y: 0 };
      const k = keys.current;
      if (k.has('a') || k.has('arrowleft')) input.x -= 1;
      if (k.has('d') || k.has('arrowright')) input.x += 1;
      if (k.has('w') || k.has('arrowup')) input.y -= 1;
      if (k.has('s') || k.has('arrowdown')) input.y += 1;
      const j = joyRef.current;
      if (j) {
        input.x += (j.x - j.ox) / JOY_RADIUS;
        input.y += (j.y - j.oy) / JOY_RADIUS;
      }
      stepRun(run, dt, input);
      quality.ema = quality.ema * 0.95 + dt * 0.05;
      if (++quality.frames % 90 === 0 && quality.ema > 1 / 38) {
        if (quality.dpr > 1) {
          quality.dpr = Math.max(1, quality.dpr - 0.5);
          resize();
        } else quality.low = true;
      }
      render(
        ctx,
        run,
        { ...viewFor(window.innerWidth, window.innerHeight, quality.dpr), low: quality.low },
        now / 1000,
      );
      // HUD refresh: on phase changes immediately, otherwise ~8×/s.
      if (run.phase !== lastPhase || run.hero.level !== lastLevel || now - lastHud > 125) {
        if (useGame.getState().game.settings.sound) {
          if (run.hero.level > lastLevel) SOUNDS.levelUp();
          else if (run.phase === 'chest' && lastPhase !== 'chest') SOUNDS.rare();
          else if (run.phase === 'shrine' && lastPhase !== 'shrine') SOUNDS.rare();
          else if (run.phase === 'dead' && lastPhase !== 'dead') SOUNDS.hurt();
          else if (run.phase === 'won' && lastPhase !== 'won') SOUNDS.prestige();
          else if (run.kills - lastKills > 0 && now - lastHud > 120) SOUNDS.hit();
        }
        lastPhase = run.phase;
        lastLevel = run.hero.level;
        lastKills = run.kills;
        lastHud = now;
        useRiftRun.getState().bump();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.type === 'keydown') {
        if (key === 'escape' || key === 'p') {
          togglePause(run);
          useRiftRun.getState().bump();
        }
        if (run.phase === 'levelup' && ['1', '2', '3', '4'].includes(key)) {
          chooseUpgrade(run, Number(key) - 1);
          useRiftRun.getState().bump();
        }
        keys.current.add(key);
      } else keys.current.delete(key);
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key))
        e.preventDefault();
    };
    const onHide = () => {
      if (document.hidden && run.phase === 'playing') {
        togglePause(run);
        useRiftRun.getState().bump();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [run]);

  // Book rewards once the run is over.
  useEffect(() => {
    if (!run || finished.current) return;
    if (run.phase === 'dead' || run.phase === 'won') {
      finished.current = true;
      if (run.config.daily) {
        const d = useGame.getState().dailyFinish(runResult(run));
        setReward(d?.run ?? null);
      } else if (run.config.trial) {
        const w = useGame.getState().weeklyFinish(runResult(run));
        setWeekly(w);
        setReward(w?.run ?? null);
      } else if (run.config.mode === 'dungeon')
        setAdvReward(useGame.getState().dungeonFinish(runResult(run)));
      else setReward(useGame.getState().riftFinish(runResult(run)));
    }
  }, [run, version]);

  if (!run) return null;
  const bump = () => useRiftRun.getState().bump();
  const over = run.phase === 'dead' || run.phase === 'won';

  const onPointerDown = (e: React.PointerEvent) => {
    if (run.phase !== 'playing' || joyRef.current) return;
    joyRef.current = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
    setJoy({ ...joyRef.current });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const j = joyRef.current;
    if (!j || j.id !== e.pointerId) return;
    let dx = e.clientX - j.ox;
    let dy = e.clientY - j.oy;
    const d = Math.hypot(dx, dy);
    if (d > JOY_RADIUS) {
      // Floating stick: the base follows the finger.
      j.ox += (dx * (d - JOY_RADIUS)) / d;
      j.oy += (dy * (d - JOY_RADIUS)) / d;
      dx = e.clientX - j.ox;
      dy = e.clientY - j.oy;
    }
    j.x = e.clientX;
    j.y = e.clientY;
    setJoy({ ox: j.ox, oy: j.oy, x: j.x, y: j.y });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (joyRef.current?.id !== e.pointerId) return;
    joyRef.current = null;
    setJoy(null);
  };

  const leave = () => useRiftRun.getState().setRun(null);

  return (
    <div className="rift-overlay" role="application" aria-label="Ätherriss">
      <canvas
        ref={canvasRef}
        className="rift-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {joy && (
        <div className="joystick" style={{ left: joy.ox, top: joy.oy }}>
          <div
            className="joystick-knob"
            style={{ transform: `translate(${joy.x - joy.ox}px, ${joy.y - joy.oy}px)` }}
          />
        </div>
      )}
      <Hud run={run} onPause={() => (togglePause(run), bump())} />
      {run.phase === 'levelup' && <LevelUp run={run} onChange={bump} />}
      {run.phase === 'chest' && run.chest && (
        <ChestView run={run} onClose={() => (closeChest(run), bump())} />
      )}
      {run.phase === 'shrine' && run.shrine && (
        <ShrineView run={run} onPick={(i) => (chooseShrine(run, i), bump())} />
      )}
      {run.phase === 'paused' && (
        <div className="rift-modal">
          <div className="rift-card">
            <h2 className="rift-title">Pause</h2>
            <Loadout run={run} />
            <button className="btn btn-primary" onClick={() => (togglePause(run), bump())}>
              ▶ Weiter
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (!confirm('Lauf beenden? Die Belohnung wird trotzdem gutgeschrieben.')) return;
                run.phase = 'dead';
                bump();
              }}
            >
              🏳️ Lauf beenden
            </button>
          </div>
        </div>
      )}
      {over && (
        <Results run={run} reward={reward} advReward={advReward} weekly={weekly} onLeave={leave} />
      )}
    </div>
  );
}

function Hud({ run, onPause }: { run: RunState; onPause: () => void }) {
  const h = run.hero;
  const left = runMinutes(run.config) * 60 - run.time;
  return (
    <div className="rift-hud">
      <div className="rift-xp">
        <div
          className="rift-xp-fill"
          style={{ width: `${Math.min(100, (h.xp / h.xpNext) * 100)}%` }}
        />
        <span>Lv {h.level}</span>
      </div>
      <div className="rift-top">
        <div className="rift-icons">
          {run.weapons.map((w) => (
            <span
              key={w.id}
              className={`rift-icon ${WEAPON_MAP.get(w.id)?.evolvesFrom ? 'evolved' : ''}`}
            >
              {WEAPON_MAP.get(w.id)?.icon}
              <small>{WEAPON_MAP.get(w.id)?.evolvesFrom ? '★' : w.level}</small>
            </span>
          ))}
        </div>
        <div
          className={`rift-timer ${!run.config.endless && left < 60 && left > 0 ? 'urgent' : ''}`}
        >
          {formatTime(run.time)}
          <small>💀 {run.kills}</small>
        </div>
        <button className="rift-pause" onClick={onPause} aria-label="Pause">
          ⏸
        </button>
      </div>
      {run.config.endless && (
        <div className="rift-trial endless">
          ♾️ Endlos-Riss · Welle {run.endlessWave} · nächster Boss in{' '}
          {formatTime(300 - (run.time % 300))}
        </div>
      )}
      {run.config.trial && (
        <div className="rift-trial">
          🦹 Wochenboss · {run.config.trialLabel} · Boss bei {runMinutes(run.config) / 2}:00 und{' '}
          {runMinutes(run.config)}:00
        </div>
      )}
      <div className="rift-icons passives">
        {run.passives.map((p) => (
          <span key={p.id} className="rift-icon small">
            {PASSIVE_MAP.get(p.id)?.icon}
            <small>{p.level}</small>
          </span>
        ))}
        {run.provisions.length > 0 && (
          <span className="rift-icon small">
            🍖<small>{run.provisions.length}</small>
          </span>
        )}
      </div>
    </div>
  );
}

function choiceInfo(
  run: RunState,
  c: Choice,
): { icon: string; name: string; tag: string; desc: string; evo?: string } {
  if (c.kind === 'heal')
    return { icon: '🍗', name: 'Brathähnchen', tag: '', desc: '+25 LP. Klassiker.' };
  if (c.kind === 'gold')
    return { icon: '💰', name: 'Essenzbeutel', tag: '', desc: '+5 Riss-Essenz am Ende des Laufs.' };
  if (c.kind === 'passive') {
    const def = PASSIVE_MAP.get(c.id)!;
    const evo = [...WEAPON_MAP.values()].find(
      (w) => w.requires === c.id && run.weapons.some((o) => o.id === w.evolvesFrom),
    );
    return {
      icon: def.icon,
      name: def.name,
      tag: c.level === 1 ? 'Neu!' : `Stufe ${c.level}`,
      desc: def.desc,
      evo: evo ? `Ermöglicht ${evo.icon} ${evo.name}` : undefined,
    };
  }
  const def = WEAPON_MAP.get(c.id)!;
  if (c.level === 1) return { icon: def.icon, name: def.name, tag: 'Neue Waffe!', desc: def.desc };
  const diff = def.levels[c.level - 2] ?? {};
  const labels: Record<string, string> = {
    damage: 'Schaden',
    cooldown: 'Abklingzeit',
    amount: 'Anzahl',
    area: 'Bereich',
    speed: 'Tempo',
    duration: 'Dauer',
    pierce: 'Durchschlag',
    knockback: 'Rückstoß',
  };
  const desc = Object.entries(diff)
    .map(
      ([k, v]) => `${labels[k] ?? k} ${v > 0 ? '+' : ''}${Number.isInteger(v) ? v : v.toFixed(2)}`,
    )
    .join(', ');
  const max = c.level >= maxLevelOf(def);
  const evo = max ? [...WEAPON_MAP.values()].find((w) => w.evolvesFrom === def.id) : undefined;
  return {
    icon: def.icon,
    name: def.name,
    tag: `Stufe ${c.level}${max ? ' (Max)' : ''}`,
    desc,
    evo: evo
      ? `Max! Mit ${PASSIVE_MAP.get(evo.requires ?? '')?.icon ?? ''} + Truhe → ${evo.icon} ${evo.name}`
      : undefined,
  };
}

function LevelUp({ run, onChange }: { run: RunState; onChange: () => void }) {
  const [banishMode, setBanishMode] = useState(false);
  return (
    <div className="rift-modal">
      <div className="rift-card rift-levelup">
        <h2 className="rift-title">Level {run.hero.level}!</h2>
        <p className="rift-sub">
          {banishMode ? 'Welche Option verbannen?' : 'Wähle eine Verbesserung'}
        </p>
        <div className="choice-list">
          {run.choices.map((c, i) => {
            const info = choiceInfo(run, c);
            return (
              <button
                key={i}
                className={`choice ${banishMode ? 'banish' : ''}`}
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => {
                  if (banishMode) {
                    banishChoice(run, i);
                    setBanishMode(false);
                  } else chooseUpgrade(run, i);
                  onChange();
                }}
              >
                <span className="choice-icon">{info.icon}</span>
                <span className="choice-body">
                  <strong>
                    {info.name} <em>{info.tag}</em>
                  </strong>
                  <small>{info.desc}</small>
                  {info.evo && <small className="choice-evo">{info.evo}</small>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="choice-actions">
          <button
            className="btn small"
            disabled={run.rerolls <= 0}
            onClick={() => (rerollChoices(run), onChange())}
          >
            🔄 Neu ({run.rerolls})
          </button>
          <button
            className="btn small"
            disabled={run.skips <= 0}
            onClick={() => (skipLevelUp(run), onChange())}
          >
            ⏭️ Skip ({run.skips})
          </button>
          <button
            className={`btn small ${banishMode ? 'active' : ''}`}
            disabled={run.banishes <= 0}
            onClick={() => setBanishMode(!banishMode)}
          >
            🚫 Bann ({run.banishes})
          </button>
        </div>
      </div>
    </div>
  );
}

function ChestView({ run, onClose }: { run: RunState; onClose: () => void }) {
  const chest = run.chest!;
  const evo = chest.evolved ? WEAPON_MAP.get(chest.evolved) : null;
  return (
    <div className="rift-modal">
      <div className={`rift-card chest ${evo ? 'evolution' : ''}`}>
        <div className="chest-icon">{evo ? evo.icon : '🎁'}</div>
        {evo ? (
          <>
            <h2 className="rift-title">Evolution!</h2>
            <p className="chest-evo-name">{evo.name}</p>
            <p className="rift-sub">{evo.desc}</p>
          </>
        ) : (
          <>
            <h2 className="rift-title">Schatztruhe</h2>
            {chest.upgrades.map((c, i) => {
              const info = choiceInfo(run, c);
              return (
                <p key={i} className="rift-sub">
                  {info.icon} {info.name} {info.tag && `· ${info.tag}`}
                </p>
              );
            })}
          </>
        )}
        <button className="btn btn-primary" onClick={onClose}>
          Weiter
        </button>
      </div>
    </div>
  );
}

function ShrineView({ run, onPick }: { run: RunState; onPick: (index: number) => void }) {
  return (
    <div className="rift-modal">
      <div className="rift-card rift-levelup">
        <div className="chest-icon">⛩️</div>
        <h2 className="rift-title">Schrein</h2>
        <p className="rift-sub">
          Ein uralter Schrein flüstert. Nimm ein Angebot an – oder geh weiter.
        </p>
        <div className="choice-list">
          {run.shrine!.map((o, i) => (
            <button key={o.kind} className="choice" onClick={() => onPick(i)}>
              <span className="choice-icon">{o.icon}</span>
              <span className="choice-body">
                <strong>{o.name}</strong>
                <small>{o.desc}</small>
              </span>
            </button>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={() => onPick(-1)}>
          Weitergehen
        </button>
      </div>
    </div>
  );
}

function Loadout({ run }: { run: RunState }) {
  return (
    <div className="loadout">
      {run.weapons.map((w) => {
        const def = WEAPON_MAP.get(w.id)!;
        const st = weaponStats(run, def, w.level);
        return (
          <div key={w.id} className="loadout-row">
            <span>{def.icon}</span>
            <span>
              {def.name}{' '}
              <small className="muted">{def.evolvesFrom ? '★' : `Stufe ${w.level}`}</small>
            </span>
            <small className="muted">
              {Math.round(st.damage)} Schaden · {st.cooldown.toFixed(2)} s
            </small>
          </div>
        );
      })}
      <div className="loadout-passives">
        {run.passives.map((p) => (
          <span key={p.id}>
            {RIFT_PASSIVES.find((x) => x.id === p.id)?.icon} {p.level}
          </span>
        ))}
      </div>
    </div>
  );
}

function Results({
  run,
  reward,
  advReward,
  weekly,
  onLeave,
}: {
  run: RunState;
  reward: RiftReward | null;
  advReward: AdventureReward | null;
  weekly: WeeklyReward | null;
  onLeave: () => void;
}) {
  const won = run.phase === 'won';
  const trial = run.config.trial === true;
  const dungeon = run.config.mode === 'dungeon' && !trial;
  const biome = BIOMES.find((b) => b.id === run.config.biome);
  return (
    <div className="rift-modal results">
      <div className={`rift-card ${won ? 'won' : ''}`}>
        <div className="chest-icon">{won ? '🏆' : '💀'}</div>
        <h2 className="rift-title">
          {run.config.endless
            ? `Endlos-Lauf: ${formatTime(run.time)}`
            : trial
              ? won
                ? 'Wochenboss besiegt!'
                : 'Der Boss lacht noch'
              : dungeon
                ? won
                  ? 'Dungeon gemeistert!'
                  : 'Rückzug!'
                : won
                  ? 'Prüfung bestanden!'
                  : 'Durchgefallen'}
        </h2>
        <p className="rift-sub">
          {run.config.endless
            ? 'Der Riss hat dich am Ende doch erwischt. Er brauchte allerdings ziemlich lange dafür.'
            : trial
              ? won
                ? weekly?.firstWin
                  ? 'Die Belohnung der Woche gehört dir. Nächste Woche wartet ein neuer Boss – etwas stärker.'
                  : 'Schon wieder? Der Boss beantragt Urlaub. Die Wochenbelohnung gab es bereits.'
                : 'Diesmal nicht. Versuche sind unbegrenzt – die Wochenbelohnung wartet.'
              : dungeon
                ? won
                  ? 'Der Wächter liegt am Boden, die Schatzkammer steht offen.'
                  : 'Dein Held schleppt sich verwundet zurück. Ein Teil der Beute bleibt trotzdem.'
                : won
                  ? 'Der Prüfer nickt anerkennend. Mit Note 1,0 – mehr oder weniger.'
                  : 'Der Riss hat dich wieder ausgespuckt. Die Wissenschaft lernt aus Fehlschlägen.'}
        </p>
        <div className="result-grid">
          <div>
            <strong>{formatTime(run.time)}</strong>
            <small>{biome?.icon} überlebt</small>
          </div>
          <div>
            <strong>{run.kills}</strong>
            <small>Gegner</small>
          </div>
          <div>
            <strong>{run.hero.level}</strong>
            <small>Level</small>
          </div>
          <div>
            <strong>{run.bossKills}</strong>
            <small>Bosse</small>
          </div>
        </div>
        {reward && (
          <div className="reward">
            <p className="reward-essence">
              +{reward.essence} 🌀 Riss-Essenz {reward.record && <em>Neuer Rekord!</em>}
            </p>
            {reward.items.length > 0 && (
              <p className="rift-sub">
                Beute für die Insel:{' '}
                {reward.items
                  .map((i) => `${i.qty}× ${getItem(i.item).icon} ${getItem(i.item).name}`)
                  .join(', ')}
              </p>
            )}
            <p className="rift-sub">+{reward.walkerXp} ✨ Rissläufer-XP</p>
            {reward.relic && (
              <p className="reward-essence">
                🏺 Relikt: {RELIC_MAP.get(reward.relic)?.icon} {RELIC_MAP.get(reward.relic)?.name}
              </p>
            )}
            {reward.village > 0 && (
              <p className="rift-sub">
                🏘️ Tribut ans Dorf: je {reward.village} Holz, Lehm, Eisen und Getreide
              </p>
            )}
          </div>
        )}
        {advReward && (
          <div className="reward">
            <p className="reward-essence">
              +{advReward.xp} ⭐ Helden-XP · +{advReward.essence} 🌀
            </p>
            {advReward.item && (
              <p className="reward-item">
                🎁 {HERO_ITEMS.find((i) => i.id === advReward.item!.base)?.icon}{' '}
                {HERO_ITEMS.find((i) => i.id === advReward.item!.base)?.name} (
                {TIER_NAMES[advReward.item.tier]})
              </p>
            )}
            <p className="rift-sub">
              🏘️ je {advReward.resources} Rohstoffe fürs Heimatdorf
              {advReward.islandItem &&
                ` · ${getItem(advReward.islandItem).icon} ${getItem(advReward.islandItem).name}`}
              {advReward.health > 0 && ` · −${advReward.health} % Gesundheit`}
            </p>
          </div>
        )}
        <Loadout run={run} />
        <button className="btn btn-primary btn-big" onClick={onLeave}>
          {dungeon ? 'Zurück ins Dorf' : 'Zurück zur Insel'}
        </button>
      </div>
    </div>
  );
}
