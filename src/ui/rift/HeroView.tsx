import { useState } from 'react';
import {
  HERO_ATTRS,
  HERO_AVATARS,
  HERO_BAG_SIZE,
  HERO_SLOTS,
  heroXpForLevel,
  MAX_ATTR,
  PERCENT_STATS,
  STAT_LABELS,
  TIER_COLORS,
  TIER_NAMES,
  DISMANTLE_ESSENCE,
} from '../../data/hero';
import { BIOMES } from '../../data/rift';
import { ACHIEVEMENTS } from '../../data';
import {
  adventureDistance,
  assignPoints,
  autoAdventure,
  autoChance,
  canStartAdventure,
  currentAdventure,
  dismantleItem,
  equipHeroItem,
  HERO_ITEM_MAP,
  HERO_STATUS_TEXT,
  currentTitle,
  setTitle,
  heroDefense,
  heroStrength,
  heroTravelTime,
  isEquipped,
  itemStats,
  resetPoints,
  reviveCost,
  reviveHero,
  reviveTime,
  setHeroLook,
  startAdventure,
  unequipSlot,
  FREE_REVIVE,
  type HeroItem,
} from '../../engine';
import { t, type MessageKey } from '../../i18n';
import { createRun } from '../../rift/sim';
import { EmptyState } from '../EmptyState';
import { useGame } from '../../store/gameStore';
import { duration } from '../village/vui';
import { useRiftRun } from './runStore';

function heroKey(): string {
  const h = useGame.getState().game.hero;
  return [
    h.name,
    h.avatar,
    h.level,
    Math.floor(h.xp),
    h.points,
    JSON.stringify(h.attrs),
    Math.floor(h.health),
    h.status,
    h.trip ? Math.ceil(h.trip.remaining) : '',
    h.at ?? '',
    Math.ceil(h.autoIn),
    h.bag.length,
    JSON.stringify(h.equipped),
    h.adventures.map((a) => `${a.id}:${Math.floor(a.expires / 60)}`).join(),
    Math.ceil(h.revive),
    useGame.getState().game.rift.essence,
  ].join('|');
}

function statLine(stats: Record<string, number>): string {
  return Object.entries(stats)
    .map(([k, v]) => {
      const label = STAT_LABELS[k] ?? k;
      return PERCENT_STATS.has(k)
        ? `+${Math.round(v * 100)}${label}`
        : `+${Math.round(v * 10) / 10}${label}`;
    })
    .join(' · ');
}

export function HeroView() {
  useGame(() => heroKey());
  const game = useGame.getState().game;
  const act = useGame((s) => s.hero);
  const h = game.hero;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(h.name);
  const xpNeed = heroXpForLevel(h.level);
  const adv = currentAdventure(game);
  return (
    <div className="hero-view">
      <div className={`hero-card-big glass status-${h.status}`}>
        <div className="hero-portrait" aria-hidden>
          <span>{h.status === 'dead' ? '🪦' : h.avatar}</span>
          <i className="hero-level">{h.level}</i>
        </div>
        <div className="hero-main">
          {editing ? (
            <div className="hero-edit">
              <input
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                aria-label="Name des Helden"
              />
              <div className="hero-avatars">
                {HERO_AVATARS.map((a) => (
                  <button
                    key={a}
                    className={a === h.avatar ? 'active' : ''}
                    onClick={() => act((s) => void setHeroLook(s, name, a))}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <button
                className="btn small"
                onClick={() => {
                  act((s) => void setHeroLook(s, name, s.hero.avatar));
                  setEditing(false);
                }}
              >
                Fertig
              </button>
            </div>
          ) : (
            <h2
              className="rift-heading hero-name"
              onClick={() => setEditing(true)}
              title="Antippen zum Umbenennen"
            >
              {h.name} ✏️
            </h2>
          )}
          <TitlePicker />
          <small className="muted">
            Stufe {h.level} · {HERO_STATUS_TEXT[h.status]} · Heimat:{' '}
            {game.village.villages.find((v) => v.id === h.home)?.name ?? '–'}
          </small>
          <div className="hero-bar xp" title="Erfahrung">
            <i style={{ width: `${Math.min(100, (h.xp / xpNeed) * 100)}%` }} />
            <span>
              XP {Math.floor(h.xp)} / {xpNeed}
            </span>
          </div>
          <div className={`hero-bar hp ${h.health < 30 ? 'low' : ''}`} title="Gesundheit">
            <i style={{ width: `${h.health}%` }} />
            <span>❤️ {Math.floor(h.health)} %</span>
          </div>
          <small className="muted">
            ⚔️ Kampfkraft {Math.round(heroStrength(game))} · 🛡️ Verteidigung{' '}
            {Math.round(heroDefense(game))}
          </small>
        </div>
      </div>

      {h.status === 'dead' && (
        <section className="glass hero-box">
          <p className="small">
            💀 Dein Held ist gefallen.{' '}
            {h.revive > 0
              ? `Wiederbelebung läuft: noch ${duration(h.revive)}.`
              : `Er steht in ${duration(FREE_REVIVE + h.revive)} von selbst wieder auf – oder du hilfst nach.`}
          </p>
          {h.revive <= 0 && (
            <button className="btn btn-primary" onClick={() => act((s) => reviveHero(s))}>
              ✨ Wiederbeleben ({reviveCost(game)} je Rohstoff, {duration(reviveTime(game))})
            </button>
          )}
        </section>
      )}

      {adv && <AdventureHere />}
      {h.trip && (
        <section className="glass hero-box">
          <p className="small">
            {h.trip.kind === 'adventure' ? '🧭 Unterwegs zum Abenteuer' : '🏠 Auf dem Heimweg'} –
            noch {duration(h.trip.remaining)}
          </p>
          <div className="hero-bar">
            <i style={{ width: `${(1 - h.trip.remaining / h.trip.total) * 100}%` }} />
          </div>
        </section>
      )}

      <section className="glass hero-box">
        <h4 className="rift-h4">
          Attribute <small className="muted">· {h.points} Punkte frei</small>
        </h4>
        {HERO_ATTRS.map((a) => (
          <div key={a.id} className="hero-attr">
            <span className="hero-attr-icon">{a.icon}</span>
            <span className="hero-attr-body">
              <strong>
                {a.name} <b>{h.attrs[a.id]}</b>
              </strong>
              <small className="muted">{a.desc}</small>
              <span className="hero-bar thin">
                <i style={{ width: `${(h.attrs[a.id] / MAX_ATTR) * 100}%` }} />
              </span>
            </span>
            <span className="hero-attr-btns">
              <button
                className="btn small"
                disabled={h.points <= 0}
                onClick={() => act((s) => assignPoints(s, a.id, 1))}
              >
                +1
              </button>
              <button
                className="btn small"
                disabled={h.points < 2}
                onClick={() => act((s) => assignPoints(s, a.id, h.points))}
              >
                +{h.points}
              </button>
            </span>
          </div>
        ))}
        <button className="btn btn-ghost small" onClick={() => act((s) => resetPoints(s))}>
          🔄 Punkte zurücksetzen ({50 * h.level} 🌀)
        </button>
      </section>

      <section className="glass hero-box">
        <h4 className="rift-h4">Ausrüstung</h4>
        <div className="hero-slots">
          {HERO_SLOTS.map((slot) => {
            const uid = h.equipped[slot.id];
            const item = h.bag.find((i) => i.uid === uid);
            return (
              <button
                key={slot.id}
                className={`hero-slot ${item ? 'filled' : ''}`}
                style={
                  item ? ({ '--tier': TIER_COLORS[item.tier] } as React.CSSProperties) : undefined
                }
                onClick={() => item && act((s) => void unequipSlot(s, slot.id))}
                title={item ? 'Antippen zum Ablegen' : slot.name}
              >
                <span className="hero-slot-icon">
                  {item ? HERO_ITEM_MAP.get(item.base)?.icon : slot.icon}
                </span>
                <small>{item ? HERO_ITEM_MAP.get(item.base)?.name : slot.name}</small>
              </button>
            );
          })}
        </div>
        <h4 className="rift-h4">
          Taschen{' '}
          <small className="muted">
            {h.bag.length}/{HERO_BAG_SIZE}
          </small>
        </h4>
        {h.bag.length === 0 && <p className="small muted">Leer. Abenteuer bringen Ausrüstung.</p>}
        <div className="hero-bag">
          {h.bag.map((item) => (
            <BagItem key={item.uid} item={item} equipped={isEquipped(game, item.uid)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function BagItem({ item, equipped }: { item: HeroItem; equipped: boolean }) {
  const act = useGame((s) => s.hero);
  const def = HERO_ITEM_MAP.get(item.base)!;
  return (
    <div
      className={`hero-item ${equipped ? 'equipped' : ''}`}
      style={{ '--tier': TIER_COLORS[item.tier] } as React.CSSProperties}
    >
      <span className="hero-item-icon">{def.icon}</span>
      <span className="hero-item-body">
        <strong>{def.name}</strong>
        <small className="tier">{TIER_NAMES[item.tier]}</small>
        <small>{statLine(itemStats(item))}</small>
      </span>
      <span className="hero-item-btns">
        {equipped ? (
          <small className="muted">angelegt</small>
        ) : (
          <>
            <button className="btn small" onClick={() => act((s) => equipHeroItem(s, item.uid))}>
              Anlegen
            </button>
            <button
              className="btn btn-ghost small"
              onClick={() => act((s) => dismantleItem(s, item.uid))}
            >
              ♻️ {DISMANTLE_ESSENCE[item.tier]} 🌀
            </button>
          </>
        )}
      </span>
    </div>
  );
}

function AdventureHere() {
  const game = useGame.getState().game;
  const act = useGame((s) => s.hero);
  const prepare = useGame((s) => s.dungeonPrepare);
  const adv = currentAdventure(game)!;
  const biome = BIOMES.find((b) => b.id === adv.biome)!;
  return (
    <section className="glass hero-box adventure-here">
      <h4 className="rift-h4">
        {adv.hard ? '💀' : '❗'} {adv.name}
      </h4>
      <p className="small">
        {biome.icon} {biome.name} · Stufe {adv.level}
        {adv.hard ? ' · schwer' : ''}. Dein Held steht am Eingang. Spiel den Dungeon live (bessere
        Beute) oder lass ihn automatisch erkunden ({Math.round(autoChance(game, adv) * 100)} %
        Erfolg). Ohne Entscheidung erkundet er in {duration(game.hero.autoIn)} selbst.
      </p>
      <div className="row gap">
        <button
          className="btn btn-primary rift-go"
          onClick={() => {
            const cfg = prepare();
            if (cfg) useRiftRun.getState().setRun(createRun(cfg));
          }}
        >
          ⚔️ Dungeon live spielen
        </button>
        <button
          className="btn"
          onClick={() => act((s, emit, rng) => void autoAdventure(s, rng, emit))}
        >
          🎲 Automatisch erkunden
        </button>
      </div>
    </section>
  );
}

/** Title next to the hero's name: any unlocked achievement. */
function TitlePicker() {
  const title = useGame((s) => currentTitle(s.game));
  const count = useGame((s) => s.game.achievements.length);
  const act = useGame((s) => s.hero);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  if (!open)
    return (
      <button className="hero-title" onClick={() => setOpen(true)}>
        {title ? `„${title}“` : count ? '🏷️ Titel wählen' : '🏷️ Titel: schalte Erfolge frei'}
      </button>
    );
  const game = useGame.getState().game;
  const q = query.trim().toLowerCase();
  // Funny milestone names first, plain skill-level titles last.
  const list = ACHIEVEMENTS.filter(
    (a) => game.achievements.includes(a.id) && (!q || a.name.toLowerCase().includes(q)),
  )
    .sort((a, b) => Number(a.id.startsWith('lvl_')) - Number(b.id.startsWith('lvl_')))
    .slice(0, 80);
  const pick = (id: string) => {
    act((s) => void setTitle(s, id));
    setOpen(false);
  };
  return (
    <div className="title-picker">
      <input
        className="input"
        placeholder={`${count} Titel durchsuchen …`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="title-list">
        <button className="title-opt" onClick={() => pick('')}>
          — kein Titel —
        </button>
        {list.map((a) => (
          <button key={a.id} className="title-opt" onClick={() => pick(a.id)} title={a.desc}>
            {a.icon} {a.name}
          </button>
        ))}
      </div>
      <button className="btn" onClick={() => setOpen(false)}>
        Schließen
      </button>
    </div>
  );
}

export function AdventuresView() {
  useGame(() => heroKey());
  const game = useGame.getState().game;
  const act = useGame((s) => s.hero);
  const h = game.hero;
  return (
    <div className="hero-view">
      {currentAdventure(game) && <AdventureHere />}
      <p className="small muted">
        Abenteuer tauchen alle 40 Minuten rund um das Heimatdorf auf (max. 5). Auf der 🗺️ Karte im
        Dorf siehst du sie als ❗.
      </p>
      {h.adventures.length === 0 && (
        <EmptyState
          icon="⏳"
          title={`Nächstes Abenteuer in ${duration(h.adventureIn)}`}
          actions={[
            {
              label: '🌀 Riss-Lauf',
              onClick: () => useGame.getState().setUi({ heroSegment: 'start' }),
            },
            {
              label: '🦸 Held ausrüsten',
              onClick: () => useGame.getState().setUi({ heroSegment: 'hero' }),
            },
            {
              label: '🗺️ Weltkarte',
              onClick: () => useGame.getState().setUi({ tab: 'village', villageSegment: 'map' }),
            },
          ]}
        >
          Bis dahin wartet genug Arbeit auf deinen Helden:
        </EmptyState>
      )}
      {h.adventures
        .slice()
        .sort((a, b) => adventureDistance(game, a) - adventureDistance(game, b))
        .map((a) => {
          const biome = BIOMES.find((b) => b.id === a.biome)!;
          const check = canStartAdventure(game, a.id);
          const here = h.at === a.id;
          return (
            <div key={a.id} className={`adventure-card glass ${a.hard ? 'hard' : ''}`}>
              <span className="adventure-icon">{a.hard ? '💀' : biome.icon}</span>
              <span className="adventure-body">
                <strong>
                  {a.name} <small className="muted">Stufe {a.level}</small>
                </strong>
                <small>
                  {biome.name} · 🧭 {duration(heroTravelTime(game, adventureDistance(game, a)))} ·
                  🎲 {Math.round(autoChance(game, a) * 100)} % · ⌛ {duration(a.expires)}
                </small>
              </span>
              {here ? (
                <small className="muted">Held ist hier</small>
              ) : (
                <button
                  className="btn small"
                  disabled={!check.ok}
                  onClick={() => act((s) => startAdventure(s, a.id))}
                >
                  {check.ok ? 'Los!' : t(`heroFail.${check.reason}` as MessageKey)}
                </button>
              )}
            </div>
          );
        })}
    </div>
  );
}
