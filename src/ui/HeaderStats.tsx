import { useEffect, useState, type ReactNode } from 'react';
import { HERO_REGEN, heroXpForLevel } from '../data/hero';
import { V_RES_INFO, V_RESOURCES, type VRes } from '../data/village';
import {
  activeVillage,
  capFor,
  cpPerHour,
  formatDuration,
  heroStat,
  netCrop,
  population,
  production,
  totalPopulation,
  upkeep,
} from '../engine';
import { useGame } from '../store/gameStore';
import { short } from './village/vui';

/** Detail popover under the header; closes on any outside tap. */
function Popover({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const close = () => onClose();
    const id = window.setTimeout(() => window.addEventListener('pointerdown', close), 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('pointerdown', close);
    };
  }, [onClose]);
  return (
    <div className="stat-pop" onPointerDown={(e) => e.stopPropagation()} role="dialog">
      {children}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="stat-pop-row">
      <span>{label}</span>
      <b className={tone ?? ''}>{value}</b>
    </div>
  );
}

/** Village tab: the four resources and population, always in view. */
export function VillageStats() {
  // Re-render on visible changes only (floored amounts).
  useGame((s) => {
    const v = activeVillage(s.game);
    return V_RESOURCES.map((r) => Math.floor(v.res[r])).join('|') + `|${population(v)}`;
  });
  const [open, setOpen] = useState<VRes | 'pop' | null>(null);
  const game = useGame.getState().game;
  const v = activeVillage(game);
  const prod = production(game, v);
  const net = netCrop(game, v);
  const detail = (res: VRes) => {
    const cap = capFor(v, res);
    const rate = res === 'crop' ? net : prod[res];
    const left = cap - v.res[res];
    return (
      <Popover onClose={() => setOpen(null)}>
        <strong>
          {V_RES_INFO[res].icon} {V_RES_INFO[res].name} · {v.name}
        </strong>
        <Row label="Vorrat" value={`${short(v.res[res])} / ${short(cap)}`} />
        <Row label="Produktion" value={`+${short(prod[res])}/h`} tone="good" />
        {res === 'crop' && (
          <>
            <Row
              label="Verbrauch (Einwohner, Truppen)"
              value={`−${short(upkeep(game, v))}/h`}
              tone="bad"
            />
            <Row
              label="Netto"
              value={`${net < 0 ? '−' : '+'}${short(Math.abs(net))}/h`}
              tone={net < 0 ? 'bad' : 'good'}
            />
          </>
        )}
        <Row
          label={rate > 0 ? 'Voll in' : 'Leer in'}
          value={
            rate > 0
              ? left <= 0
                ? 'voll!'
                : formatDuration((left / rate) * 3600)
              : rate < 0
                ? formatDuration((v.res[res] / -rate) * 3600)
                : '–'
          }
          tone={rate > 0 && left <= 0 ? 'bad' : undefined}
        />
        <small className="muted">Antippen der Felder im Dorf baut die Produktion aus.</small>
      </Popover>
    );
  };
  return (
    <>
      {V_RESOURCES.map((r) => {
        const fill = Math.min(1, v.res[r] / capFor(v, r));
        return (
          <button
            key={r}
            className={`chip res-chip ${fill >= 0.98 ? 'full' : ''} ${r === 'crop' && net < 0 ? 'neg' : ''}`}
            style={{ '--fill': fill, '--rc': V_RES_INFO[r].color } as React.CSSProperties}
            onClick={() => setOpen(open === r ? null : r)}
            title={V_RES_INFO[r].name}
          >
            {V_RES_INFO[r].icon} <b>{short(v.res[r])}</b>
          </button>
        );
      })}
      <button
        className="chip"
        onClick={() => setOpen(open === 'pop' ? null : 'pop')}
        title="Einwohner"
      >
        👥 <b>{population(v)}</b>
      </button>
      {open && open !== 'pop' && detail(open)}
      {open === 'pop' && (
        <Popover onClose={() => setOpen(null)}>
          <strong>👥 Einwohner · {v.name}</strong>
          <Row label="Dieses Dorf" value={String(population(v))} />
          <Row label="Ganzes Reich" value={String(totalPopulation(game))} />
          <Row
            label="Kulturpunkte"
            value={`${short(game.village.cp)} (+${short(cpPerHour(game))}/h)`}
          />
          <small className="muted">Kulturpunkte schalten neue Dörfer frei.</small>
        </Popover>
      )}
    </>
  );
}

/** Hero tab: level, health and essence at a glance. */
export function HeroStats() {
  useGame(
    (s) =>
      `${s.game.hero.level}|${Math.floor(s.game.hero.health)}|${s.game.rift.essence}|${Math.floor(s.game.hero.xp)}`,
  );
  const [open, setOpen] = useState<'level' | 'hp' | 'essence' | null>(null);
  const game = useGame.getState().game;
  const h = game.hero;
  const need = heroXpForLevel(h.level);
  const regen = HERO_REGEN + heroStat(game, 'regen');
  return (
    <>
      <button className="chip" onClick={() => setOpen(open === 'level' ? null : 'level')}>
        {h.avatar} <b>{h.level}</b>
      </button>
      <button
        className={`chip ${h.health < 30 ? 'chip-danger' : ''}`}
        onClick={() => setOpen(open === 'hp' ? null : 'hp')}
      >
        ❤️ <b>{Math.floor(h.health)} %</b>
      </button>
      <button className="chip" onClick={() => setOpen(open === 'essence' ? null : 'essence')}>
        🌀 <b>{short(game.rift.essence)}</b>
      </button>
      {open === 'level' && (
        <Popover onClose={() => setOpen(null)}>
          <strong>
            {h.avatar} {h.name} · Stufe {h.level}
          </strong>
          <Row label="Erfahrung" value={`${Math.floor(h.xp)} / ${need}`} />
          <Row
            label="Freie Attributpunkte"
            value={String(h.points)}
            tone={h.points ? 'good' : undefined}
          />
          <small className="muted">XP gibt es für Abenteuer, Riss-Läufe und Invasionen.</small>
        </Popover>
      )}
      {open === 'hp' && (
        <Popover onClose={() => setOpen(null)}>
          <strong>❤️ Gesundheit</strong>
          <Row label="Aktuell" value={`${Math.floor(h.health)} %`} />
          <Row label="Erholung" value={`+${Math.round(regen)} %/h`} tone="good" />
          {h.health < 100 && (
            <Row label="Voll in" value={formatDuration(((100 - h.health) / regen) * 3600)} />
          )}
          <small className="muted">Unter 10 % zieht der Held nicht auf Abenteuer.</small>
        </Popover>
      )}
      {open === 'essence' && (
        <Popover onClose={() => setOpen(null)}>
          <strong>🌀 Riss-Essenz</strong>
          <Row label="Verfügbar" value={short(game.rift.essence)} />
          <Row label="Insgesamt gesammelt" value={short(game.rift.essenceTotal)} />
          <small className="muted">
            Für Riss-Talente – sie stärken auch die Verteidigung des Dorfs.
          </small>
        </Popover>
      )}
    </>
  );
}
