import { useState } from 'react';
import { getItem } from '../../data';
import {
  COLONY_BUILDINGS,
  COSTS,
  DEV_INFO,
  FAME_TALENTS,
  IMPORT_RATES,
  RESOURCE_INFO,
  RESOURCES,
  WIN_POINTS,
  type DevCard,
  type Resource,
} from '../../data/colony';
import {
  abandonMatch,
  acceptOffer,
  bankTrade,
  buildBuilding,
  buildingCount,
  buildingSlots,
  buyTalent,
  canAfford,
  canPlaceCity,
  claimMatch,
  colonySummary,
  declineOffer,
  EXPORT_GOLD,
  exportResource,
  fameFor,
  handLimit,
  importResource,
  importSource,
  legalRoads,
  legalSettlementSpots,
  mod,
  placeRobber,
  playDevCard,
  playerBuildCity,
  playerBuildRoad,
  playerBuildSettlement,
  playerBuyDev,
  playerPlace,
  playerRate,
  PLAYER_INDEX,
  rollInterval,
  rollNow,
  setupAuto,
  setupPlaceRoad,
  setupPlaceSettlement,
  startMatch,
  talentCost,
  talentLevel,
  type ColonyMatch,
  type ColonyState,
} from '../../engine';
import { useGame } from '../../store/gameStore';
import { HexBoard, type BoardMode } from './HexBoard';
import { costText, persona } from './colonyUi';
import './colony.css';

/** Cheap signature of everything the colony UI shows – a primitive, so selectors stay stable. */
function colonyKey(c: ColonyState): string {
  const m = c.match;
  const base = `${c.fame}|${c.matches}|${c.wins}|${JSON.stringify(c.talents)}`;
  if (!m) return `none|${base}`;
  return [
    base,
    m.phase,
    m.rolls,
    m.robber,
    m.robberMode,
    m.freeRoads,
    m.setupVertex,
    m.setupQueue.length,
    m.offers.map((o) => o.id).join(','),
    m.players
      .map(
        (p) =>
          `${RESOURCES.map((r) => p.res[r]).join('.')}:${p.settlements.length}:${p.cities.length}:${p.roads.length}:${p.devHand.join('.')}:${p.knights}:${p.victoryCards}`,
      )
      .join('/'),
    Object.values(m.buildings).flat().join(','),
    m.longestRoad,
    m.largestArmy,
  ].join('|');
}

type Segment = 'board' | 'trade' | 'fame';

export function ColonyPanel() {
  useGame((s) => colonyKey(s.game.colony));
  const colony = useGame.getState().game.colony;
  const [seg, setSeg] = useState<Segment>('board');
  const m = colony.match;
  return (
    <div className="panel colony">
      <div className="segments" role="tablist">
        {(
          [
            ['board', '🗺️ Brett'],
            ['trade', '⚖️ Handel'],
            ['fame', '🌟 Ruhm'],
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
      {seg === 'board' && (m ? <MatchView match={m} /> : <Intro colony={colony} />)}
      {seg === 'trade' && (m && m.phase === 'running' ? <TradeView match={m} /> : <NoMatchHint />)}
      {seg === 'fame' && <FameView colony={colony} />}
    </div>
  );
}

function NoMatchHint() {
  return <p className="muted center">Handel gibt es nur während einer laufenden Partie.</p>;
}

function Intro({ colony }: { colony: ColonyState }) {
  const act = useGame((s) => s.colony);
  return (
    <div className="colony-intro glass">
      <div className="colony-intro-art" aria-hidden>
        🏝️⛵🏘️
      </div>
      <h2 className="display">Neu-Aetherium</h2>
      <p>
        Jenseits des Riffs wartet eine Insel aus 19 Feldern auf Siedler. Baue Straßen, Siedlungen
        und Städte, handle mit drei schrulligen KI-Rivalen und erreiche als Erste·r{' '}
        <strong>{WIN_POINTS} Siegpunkte</strong>.
      </p>
      <ul className="colony-intro-list">
        <li>
          🎲 Alle {Math.round(rollInterval(useGame.getState().game))} s wird gewürfelt – auch
          offline.
        </li>
        <li>🏭 Siedler-Gebäude verwandeln Rohstoffe in Waren für deine Heimatinsel.</li>
        <li>⛵ Inselwaren lassen sich als Rohstoffe verschiffen (und zurück zu Gold).</li>
        <li>🌟 Jede Partie bringt Ruhm: dauerhafte Boni und Kolonie-Talente.</li>
      </ul>
      <button
        className="btn btn-primary btn-big"
        onClick={() => act((s, emit, rng) => startMatch(s, rng, emit))}
      >
        ⛵ Neue Partie starten
      </button>
      {colony.matches > 0 && (
        <p className="muted small">
          {colony.matches} Partien · {colony.wins} Siege · {colony.fameTotal} Ruhm insgesamt
        </p>
      )}
    </div>
  );
}

// --- Match ------------------------------------------------------------------------------------

function MatchView({ match: m }: { match: ColonyMatch }) {
  const act = useGame((s) => s.colony);
  const [mode, setMode] = useState<BoardMode>('none');
  const [selected, setSelected] = useState<number | null>(null);
  const game = useGame.getState().game;
  const me = m.players[PLAYER_INDEX]!;

  let effective: BoardMode = mode;
  if (m.phase === 'setup') effective = m.setupVertex === null ? 'setupSettlement' : 'setupRoad';
  else if (m.robberMode) effective = 'robber';
  else if (m.freeRoads > 0) effective = 'road';
  else if (m.phase !== 'running') effective = 'none';

  const targets = new Set<number>(
    effective === 'setupSettlement'
      ? legalSettlementSpots(m, PLAYER_INDEX, true)
      : effective === 'setupRoad'
        ? legalRoads(m, PLAYER_INDEX, m.setupVertex)
        : effective === 'settlement'
          ? legalSettlementSpots(m, PLAYER_INDEX)
          : effective === 'road'
            ? legalRoads(m, PLAYER_INDEX)
            : effective === 'city'
              ? me.settlements.filter((v) => canPlaceCity(m, PLAYER_INDEX, v))
              : effective === 'building'
                ? [...me.settlements, ...me.cities]
                : [],
  );

  const onVertex = (v: number) => {
    if (effective === 'setupSettlement') act((s) => setupPlaceSettlement(s, v));
    else if (effective === 'settlement') {
      if (act((s, emit) => playerBuildSettlement(s, v, emit))) setMode('none');
    } else if (effective === 'city') {
      if (act((s, emit) => playerBuildCity(s, v, emit))) setMode('none');
    } else if (effective === 'building') setSelected(v);
  };
  const onEdge = (e: number) => {
    if (effective === 'setupRoad') act((s, emit) => setupPlaceRoad(s, e, emit));
    else if (act((s, emit) => playerBuildRoad(s, e, emit)) && m.freeRoads <= 1) setMode('none');
  };
  const onHex = (h: number) => act((s, emit, rng) => placeRobber(s, h, rng, emit));
  const toggle = (next: BoardMode) => {
    setSelected(null);
    setMode(mode === next ? 'none' : next);
  };

  return (
    <div className="colony-match">
      <PlayerStrip match={m} />
      <div className="board-wrap glass">
        <HexBoard
          match={m}
          mode={effective}
          targets={targets}
          selected={effective === 'setupRoad' ? m.setupVertex : selected}
          onVertex={onVertex}
          onEdge={onEdge}
          onHex={onHex}
        />
        <BoardHint match={m} mode={effective} />
        {m.phase === 'finished' && <ResultCard match={m} />}
      </div>

      {m.phase === 'setup' && (
        <div className="row gap center">
          <button className="btn" onClick={() => act((s, emit) => setupAuto(s, emit))}>
            🤖 Automatisch platzieren
          </button>
        </div>
      )}

      {m.phase === 'running' && (
        <>
          <DiceBar match={m} />
          <Hand match={m} />
          <div className="build-bar">
            {(
              [
                ['road', '🛤️ Straße', COSTS.road],
                ['settlement', '🏠 Siedlung', COSTS.settlement],
                ['city', '🏰 Stadt', COSTS.city],
              ] as [BoardMode, string, typeof COSTS.road][]
            ).map(([k, label, cost]) => (
              <button
                key={k}
                className={`btn build-btn ${mode === k ? 'active' : ''}`}
                disabled={!canAfford(me, cost) && mode !== k}
                onClick={() => toggle(k)}
              >
                <span>{label}</span>
                <small>{costText(cost)}</small>
              </button>
            ))}
            <button
              className="btn build-btn"
              disabled={!canAfford(me, COSTS.devCard) || !m.deck.length}
              onClick={() => act((s, emit) => playerBuyDev(s, emit))}
            >
              <span>🃏 Karte</span>
              <small>{costText(COSTS.devCard)}</small>
            </button>
            <button
              className={`btn build-btn ${mode === 'building' ? 'active' : ''}`}
              onClick={() => toggle('building')}
            >
              <span>🏭 Gebäude</span>
              <small>Siedler-Ketten</small>
            </button>
          </div>
          {mode === 'building' && selected !== null && (
            <BuildingPicker match={m} vertex={selected} onDone={() => setSelected(null)} />
          )}
          <DevHand match={m} />
          <p className="muted small center">
            Handkartenlimit beim Räuber: {handLimit(game)} · Bank-Tausch ab{' '}
            {Math.min(...RESOURCES.map((r) => playerRate(game, r)))}:1
          </p>
          <div className="row gap center">
            <button
              className="btn btn-ghost small"
              onClick={() => {
                if (confirm('Partie wirklich aufgeben? Es gibt keinen Ruhm.'))
                  act((s) => {
                    abandonMatch(s);
                  });
              }}
            >
              🏳️ Aufgeben
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PlayerStrip({ match: m }: { match: ColonyMatch }) {
  const summary = colonySummary(m);
  return (
    <div className="player-strip">
      {summary.map((p, i) => {
        const info = persona(p.persona);
        return (
          <div
            key={i}
            className={`player-chip ${m.turn === i && m.phase === 'running' ? 'turn' : ''} ${m.winner === i ? 'winner' : ''}`}
            style={{ '--pc': info.color } as React.CSSProperties}
            title={info.name}
          >
            <span className="player-icon">{info.icon}</span>
            <span className="player-name">{info.name}</span>
            <span className="player-vp">
              <strong>{p.vp}</strong>
              <small>/{WIN_POINTS}</small>
            </span>
            <span className="player-meta">
              ✋{p.cards} {p.dev > 0 && `🃏${p.dev}`} {p.knights > 0 && `⚔️${p.knights}`}
              {p.longestRoad && ' 🛤️'}
              {p.largestArmy && ' 🛡️'}
            </span>
            <span className="vp-bar">
              <span style={{ width: `${Math.min(100, (p.vp / WIN_POINTS) * 100)}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BoardHint({ match: m, mode }: { match: ColonyMatch; mode: BoardMode }) {
  let text = '';
  if (mode === 'setupSettlement')
    text = `Aufbau: Wähle einen Platz für deine ${m.setupQueue.length > m.players.length ? 'erste' : 'zweite'} Siedlung.`;
  else if (mode === 'setupRoad') text = 'Aufbau: Setze die Straße an deine neue Siedlung.';
  else if (mode === 'robber') text = '🥷 Ritter ausgespielt: Tippe auf ein Feld für den Räuber.';
  else if (mode === 'road')
    text =
      m.freeRoads > 0
        ? `🛤️ Noch ${m.freeRoads} Gratis-Straße(n).`
        : '🛤️ Wähle eine Kante für deine Straße.';
  else if (mode === 'settlement') text = '🏠 Wähle eine leuchtende Ecke.';
  else if (mode === 'city') text = '🏰 Wähle eine deiner Siedlungen.';
  else if (mode === 'building') text = '🏭 Tippe auf eine eigene Siedlung oder Stadt.';
  if (!text) return null;
  return <div className="board-hint">{text}</div>;
}

function DiceFace({ value }: { value: number }) {
  const dots: Record<number, [number, number][]> = {
    1: [[1, 1]],
    2: [
      [0, 0],
      [2, 2],
    ],
    3: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    4: [
      [0, 0],
      [2, 0],
      [0, 2],
      [2, 2],
    ],
    5: [
      [0, 0],
      [2, 0],
      [1, 1],
      [0, 2],
      [2, 2],
    ],
    6: [
      [0, 0],
      [2, 0],
      [0, 1],
      [2, 1],
      [0, 2],
      [2, 2],
    ],
  };
  return (
    <svg className="die" viewBox="0 0 30 30" aria-label={`Würfel ${value}`}>
      <rect x="1" y="1" width="28" height="28" rx="6" />
      {(dots[value] ?? []).map(([x, y], i) => (
        <circle key={i} cx={7 + x * 8} cy={7 + y * 8} r="2.6" />
      ))}
    </svg>
  );
}

function RollCountdown() {
  const left = useGame((s) => Math.ceil(s.game.colony.nextRoll));
  return <span className="roll-countdown">nächster Wurf in {left} s</span>;
}

function DiceBar({ match: m }: { match: ColonyMatch }) {
  const act = useGame((s) => s.colony);
  const roll = m.lastRoll;
  const sum = roll ? roll[0] + roll[1] : null;
  return (
    <div className="dice-bar glass">
      <div className={`dice ${sum === 7 ? 'seven' : ''}`} key={m.rolls}>
        {roll ? (
          <>
            <DiceFace value={roll[0]} />
            <DiceFace value={roll[1]} />
            <strong className="dice-sum">{sum}</strong>
          </>
        ) : (
          <span className="muted">Noch nicht gewürfelt</span>
        )}
      </div>
      <div className="dice-actions">
        <RollCountdown />
        <button
          className="btn btn-primary"
          onClick={() => act((s, emit, rng) => rollNow(s, rng, emit))}
        >
          🎲 Würfeln!
        </button>
      </div>
    </div>
  );
}

function Hand({ match: m }: { match: ColonyMatch }) {
  const me = m.players[PLAYER_INDEX]!;
  return (
    <div className="hand">
      {RESOURCES.map((r) => (
        <div key={r} className={`res-card res-${r} ${me.res[r] ? '' : 'empty'}`}>
          <span className="res-icon">{RESOURCE_INFO[r].icon}</span>
          <strong>{me.res[r]}</strong>
          <small>{RESOURCE_INFO[r].name}</small>
        </div>
      ))}
    </div>
  );
}

function DevHand({ match: m }: { match: ColonyMatch }) {
  const act = useGame((s) => s.colony);
  const me = m.players[PLAYER_INDEX]!;
  const [choice, setChoice] = useState<{ card: DevCard; picks: Resource[] } | null>(null);
  if (!me.devHand.length && !me.victoryCards) return null;
  const counts = new Map<string, number>();
  for (const c of me.devHand) counts.set(c, (counts.get(c) ?? 0) + 1);
  const need = choice?.card === 'plenty' ? 2 : 1;
  return (
    <div className="dev-hand">
      <h4>Entwicklungskarten</h4>
      <div className="dev-cards">
        {[...counts].map(([card, n]) => {
          const info = DEV_INFO[card as DevCard];
          return (
            <button
              key={card}
              className="dev-card"
              onClick={() => {
                if (card === 'plenty' || card === 'monopoly') setChoice({ card, picks: [] });
                else act((s, emit) => playDevCard(s, card, emit));
              }}
            >
              <span className="dev-icon">{info.icon}</span>
              <strong>
                {info.name} {n > 1 && `×${n}`}
              </strong>
              <small>{info.desc}</small>
            </button>
          );
        })}
        {me.victoryCards > 0 && (
          <div className="dev-card passive">
            <span className="dev-icon">{DEV_INFO.victory.icon}</span>
            <strong>Siegpunkte ×{me.victoryCards}</strong>
            <small>Geheim – nur du siehst sie.</small>
          </div>
        )}
      </div>
      {choice && (
        <div className="res-choice glass">
          <span>
            {DEV_INFO[choice.card].name}: wähle {need === 2 ? 'zwei Rohstoffe' : 'einen Rohstoff'}
            {choice.picks.length > 0 &&
              ` (${choice.picks.map((r) => RESOURCE_INFO[r].icon).join(' ')})`}
          </span>
          <div className="row gap">
            {RESOURCES.map((r) => (
              <button
                key={r}
                className="btn"
                onClick={() => {
                  const picks = [...choice.picks, r];
                  if (picks.length < need) setChoice({ ...choice, picks });
                  else {
                    act((s, emit) => playDevCard(s, choice.card, emit, picks));
                    setChoice(null);
                  }
                }}
              >
                {RESOURCE_INFO[r].icon}
              </button>
            ))}
            <button className="btn btn-ghost" onClick={() => setChoice(null)}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BuildingPicker({
  match: m,
  vertex,
  onDone,
}: {
  match: ColonyMatch;
  vertex: number;
  onDone: () => void;
}) {
  const act = useGame((s) => s.colony);
  const me = m.players[PLAYER_INDEX]!;
  const here = m.buildings[vertex] ?? [];
  const slots = buildingSlots(m, vertex);
  return (
    <div className="building-picker glass">
      <div className="row between">
        <strong>
          {me.cities.includes(vertex) ? '🏰 Stadt' : '🏠 Siedlung'} · {here.length}/{slots}{' '}
          Bauplätze
        </strong>
        <button className="btn btn-ghost small" onClick={onDone}>
          ✕
        </button>
      </div>
      {here.length > 0 && (
        <p className="small">
          Gebaut: {here.map((id) => COLONY_BUILDINGS.find((b) => b.id === id)?.icon).join(' ')}
        </p>
      )}
      <div className="building-list">
        {COLONY_BUILDINGS.map((b) => {
          const count = buildingCount(m, b.id);
          const ok = here.length < slots && count < b.maxCount && canAfford(me, b.cost);
          return (
            <button
              key={b.id}
              className="building-card"
              disabled={!ok}
              onClick={() => act((s, emit) => buildBuilding(s, vertex, b.id, emit))}
            >
              <span className="building-icon">{b.icon}</span>
              <span>
                <strong>{b.name}</strong>{' '}
                <small className="muted">
                  {count}/{b.maxCount}
                </small>
                <br />
                <small>{b.desc}</small>
              </span>
              <small className="building-cost">{costText(b.cost)}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultCard({ match: m }: { match: ColonyMatch }) {
  const act = useGame((s) => s.colony);
  const game = useGame.getState().game;
  const place = playerPlace(m);
  const winner = persona(m.players[m.winner ?? 0]!.persona);
  return (
    <div className="result-card glass">
      <div className="result-medal">
        {place === 1 ? '🏆' : place === 2 ? '🥈' : place === 3 ? '🥉' : '🪵'}
      </div>
      <h3 className="display">
        {place === 1 ? 'Sieg für Neu-Aetherium!' : `${winner.icon} ${winner.name} gewinnt`}
      </h3>
      <p>
        Du wirst <strong>{place}.</strong> – {fameFor(game, m)} 🌟 Ruhm
        {place === 1 && ' + Kolonie-Schatztruhe'}
      </p>
      <button
        className="btn btn-primary btn-big"
        onClick={() =>
          act((s, emit, rng) => {
            const r = claimMatch(s, emit);
            if (r.ok) startMatch(s, rng, emit);
            return r;
          })
        }
      >
        🌟 Ruhm einsammeln & neue Partie
      </button>
      <button className="btn btn-ghost" onClick={() => act((s, emit) => claimMatch(s, emit))}>
        Nur einsammeln
      </button>
    </div>
  );
}

// --- Trade ------------------------------------------------------------------------------------

function TradeView({ match: m }: { match: ColonyMatch }) {
  const act = useGame((s) => s.colony);
  // Re-render when island stock relevant for imports changes.
  useGame((s) => IMPORT_RATES.map((r) => importSource(s.game, r.resource) ?? '-').join());
  const game = useGame.getState().game;
  const me = m.players[PLAYER_INDEX]!;
  const [give, setGive] = useState<Resource>('wood');
  const [want, setWant] = useState<Resource>('ore');
  const rate = playerRate(game, give);
  return (
    <div className="colony-trade">
      <Hand match={m} />
      <section className="glass trade-box">
        <h4>🏦 Bank & Häfen</h4>
        <div className="trade-row">
          <span className="muted small">Gib</span>
          {RESOURCES.map((r) => (
            <button
              key={r}
              className={`chip ${give === r ? 'active' : ''}`}
              onClick={() => setGive(r)}
            >
              {RESOURCE_INFO[r].icon} <small>{playerRate(game, r)}:1</small>
            </button>
          ))}
        </div>
        <div className="trade-row">
          <span className="muted small">Nimm</span>
          {RESOURCES.map((r) => (
            <button
              key={r}
              className={`chip ${want === r ? 'active' : ''}`}
              onClick={() => setWant(r)}
            >
              {RESOURCE_INFO[r].icon}
            </button>
          ))}
        </div>
        <button
          className="btn btn-primary"
          disabled={give === want || me.res[give] < rate}
          onClick={() => act((s) => bankTrade(s, give, want))}
        >
          {rate}× {RESOURCE_INFO[give].icon} → 1× {RESOURCE_INFO[want].icon}
        </button>
      </section>

      <section className="glass trade-box">
        <h4>🤝 Angebote der Rivalen</h4>
        {m.offers.length === 0 && (
          <p className="muted small">
            Gerade keine Angebote. Nach jedem Wurf kann sich das ändern.
          </p>
        )}
        {m.offers.map((o) => {
          const who = persona(m.players[o.from]!.persona);
          return (
            <div key={o.id} className="offer">
              <span className="offer-who" style={{ color: who.color }}>
                {who.icon} {who.name}
              </span>
              <span className="offer-deal">
                gibt {o.giveQty}× {RESOURCE_INFO[o.give].icon} für {o.wantQty}×{' '}
                {RESOURCE_INFO[o.want].icon}
              </span>
              <span className="row gap">
                <button
                  className="btn btn-primary small"
                  disabled={me.res[o.want] < o.wantQty}
                  onClick={() => act((s) => acceptOffer(s, o.id))}
                >
                  ✔
                </button>
                <button
                  className="btn btn-ghost small"
                  onClick={() => act((s) => declineOffer(s, o.id))}
                >
                  ✕
                </button>
              </span>
            </div>
          );
        })}
      </section>

      <section className="glass trade-box">
        <h4>⛵ Schiffsverkehr mit der Heimatinsel</h4>
        <p className="muted small">Inselwaren werden zu Rohstoffen – oder Rohstoffe zu Gold.</p>
        {IMPORT_RATES.map((r) => {
          const source = importSource(game, r.resource);
          return (
            <div key={r.resource} className="ship-row">
              <span className="ship-res">{RESOURCE_INFO[r.resource].icon}</span>
              <button
                className="btn small"
                disabled={!source}
                onClick={() => act((s) => importResource(s, r.resource))}
                title={r.items.map((i) => getItem(i).name).join(', ')}
              >
                ⬅ {r.qty}× {source ? getItem(source).icon : getItem(r.items[0]!).icon}
              </button>
              <button
                className="btn small"
                disabled={me.res[r.resource] <= 0}
                onClick={() => act((s, emit) => exportResource(s, r.resource, emit))}
              >
                ➡ {EXPORT_GOLD} 🪙
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}

// --- Fame -------------------------------------------------------------------------------------

function FameView({ colony }: { colony: ColonyState }) {
  const act = useGame((s) => s.colony);
  const game = useGame.getState().game;
  const xp = Math.min(0.25, colony.fameTotal * 0.0008);
  const gold = Math.min(0.15, colony.fameTotal * 0.0005);
  return (
    <div className="colony-fame">
      <div className="fame-hero glass">
        <span className="fame-star">🌟</span>
        <div>
          <strong className="display fame-amount">{colony.fame}</strong> Ruhm
          <br />
          <small className="muted">
            Gesamt {colony.fameTotal} · {colony.wins}/{colony.matches} Siege
          </small>
        </div>
      </div>
      <p className="small">
        Dein Ruf stärkt die Heimatinsel: <strong>+{(xp * 100).toFixed(1)} % XP</strong> und{' '}
        <strong>+{(gold * 100).toFixed(1)} % Gold</strong> (wächst mit Gesamtruhm).
        {colony.match &&
          ` Gebäude der laufenden Partie geben zusätzlich Boni (z. B. Forschung +${Math.round(mod(game, 'research') * 100)} % gesamt).`}
      </p>
      <div className="talent-list">
        {FAME_TALENTS.map((tal) => {
          const level = talentLevel(game, tal.id);
          const max = level >= tal.maxLevel;
          const cost = talentCost(game, tal.id);
          return (
            <div key={tal.id} className={`talent glass ${level ? 'owned' : ''}`}>
              <span className="talent-icon">{tal.icon}</span>
              <span className="talent-body">
                <strong>
                  {tal.name}{' '}
                  <small className="muted">
                    {level}/{tal.maxLevel}
                  </small>
                </strong>
                <small>{tal.desc}</small>
              </span>
              <button
                className="btn small"
                disabled={max || colony.fame < cost}
                onClick={() => act((s, emit) => buyTalent(s, tal.id, emit))}
              >
                {max ? 'Max' : `${cost} 🌟`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
