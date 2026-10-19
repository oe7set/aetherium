import { useState } from 'react';
import {
  AREAS,
  DUNGEONS,
  getItem,
  getMonster,
  SPECIAL_COST,
  SPECIALS,
  SPELLS,
  type MonsterDef,
} from '../../data';
import {
  castSpell,
  combatLevel,
  estimateKillTime,
  formatDuration,
  formatPercent,
  maxHp,
  nextFood,
  playerHitChance,
  playerStats,
  monsterHitChance,
  skillLevel,
} from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { ProgressBar } from '../ProgressBar';

const STYLE_LABEL = { melee: '⚔️ Nahkampf', ranged: '🏹 Fernkampf', magic: '🪄 Magie' } as const;

/** Spell book for the magic style: pick what the staff casts; locked/empty spells are greyed. */
function SpellPicker() {
  const chosen = useGame((s) => s.game.combatSettings.spell);
  const magic = useGame((s) => skillLevel(s.game, 'magic'));
  const casting = useGame((s) => castSpell(s.game)?.id ?? '');
  const runes = useGame((s) => s.game.inventory.rune_basic ?? 0);
  const reagentKey = useGame((s) =>
    SPELLS.map((sp) => (sp.catalyst ? (s.game.inventory[sp.catalyst.item] ?? 0) : 0)).join(','),
  );
  const setCombatSetting = useGame((s) => s.setCombatSetting);
  const { int } = useFmt();
  const reagents = reagentKey.split(',').map(Number);
  return (
    <div className="spell-book">
      <small className="muted">
        📖 Zauberbuch · 🔣 {int(runes)} Runen
        {casting && casting !== chosen && ' · Zutaten fehlen, es wird ein Funke gewirkt'}
      </small>
      <div className="spell-list">
        {SPELLS.map((sp, i) => {
          const locked = magic < sp.level;
          const have = reagents[i] ?? 0;
          return (
            <button
              key={sp.id}
              className={`spell ${chosen === sp.id ? 'active' : ''} ${locked ? 'locked' : ''}`}
              disabled={locked}
              onClick={() => setCombatSetting('spell', sp.id)}
              title={sp.desc}
            >
              <span className="spell-icon">{locked ? '🔒' : sp.icon}</span>
              <strong>{sp.name}</strong>
              <small>
                {locked
                  ? `Magie ${sp.level}`
                  : `🔣${sp.runes}${sp.catalyst ? ` + ${getItem(sp.catalyst.item).icon}${sp.catalyst.qty} (${int(have)})` : ''}`}
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Optional active play: the bar fills while fighting, a tap fires a style special. */
function SpecialBar() {
  const energy = useGame((s) => Math.floor(s.game.combat?.energy ?? 0));
  const alive = useGame((s) => (s.game.combat?.monsterHp ?? 0) > 0);
  const style = useGame((s) => playerStats(s.game).style);
  const special = useGame((s) => s.special);
  const sp = SPECIALS[style];
  const ready = energy >= SPECIAL_COST;
  return (
    <div className={`special-bar ${ready ? 'ready' : ''}`}>
      <ProgressBar
        fraction={energy / SPECIAL_COST}
        color={ready ? 'var(--gold)' : 'var(--purple)'}
        height={8}
        label="Spezialenergie"
      />
      <button
        className={`btn ${ready ? 'btn-gold' : ''}`}
        disabled={!ready || !alive}
        onClick={special}
        title={`${sp.desc} Besiegst du so ein Monster, gibt es +25 % Gold. Lädt sich beim Kämpfen auf.`}
      >
        {sp.icon} {ready ? `${sp.name}!` : `${energy} %`}
      </button>
    </div>
  );
}

function AmmoLine() {
  const ammo = useGame((s) => s.game.equipment.ammo);
  const count = useGame((s) => (ammo ? (s.game.inventory[ammo] ?? 0) : 0));
  const setUi = useGame((s) => s.setUi);
  const { int } = useFmt();
  return (
    <div className="combat-row small">
      <span className={count > 0 ? '' : 'warn'}>
        {ammo
          ? `➶ ${getItem(ammo).name} ×${int(count)}`
          : '➶ Keine Munition angelegt – ohne Pfeile kein Schuss!'}
      </span>
      <button
        className="btn small"
        onClick={() => setUi({ tab: 'inventory', inventorySegment: 'gear' })}
      >
        Ausrüstung
      </button>
    </div>
  );
}

function PlayerPanel() {
  const hp = useGame((s) => Math.ceil(s.game.hp));
  const max = useGame((s) => maxHp(s.game));
  const statsKey = useGame((s) => {
    const st = playerStats(s.game);
    return `${st.style}|${st.maxHit}|${Math.round(st.accuracy)}|${Math.round(st.defenceRating)}|${st.speed}|${combatLevel(s.game)}`;
  });
  const food = useGame((s) => nextFood(s.game));
  const foodCount = useGame((s) => (food ? (s.game.inventory[food] ?? 0) : 0));
  const settings = useGame((s) => s.game.combatSettings);
  const setCombatSetting = useGame((s) => s.setCombatSetting);
  const eatNow = useGame((s) => s.eatNow);
  const { int } = useFmt();
  const [style = 'melee', maxHit, acc, def, speed, level] = statsKey.split('|');

  return (
    <div className="combat-player">
      <div className="combat-row">
        <strong>🧑‍🌾 Du · Kampflevel {level}</strong>
        <span className="muted">{STYLE_LABEL[style as keyof typeof STYLE_LABEL]}</span>
      </div>
      <ProgressBar fraction={hp / max} color="var(--red)" height={10} label="Lebenspunkte" />
      <div className="combat-row small">
        <span>
          ❤️ {hp}/{max}
        </span>
        <span>💥 Max. {maxHit}</span>
        <span>🎯 {acc}</span>
        <span>🛡️ {def}</span>
        <span>⏱️ {Number(speed).toLocaleString('de-DE')} s</span>
      </div>
      {style === 'magic' && <SpellPicker />}
      {style === 'ranged' && <AmmoLine />}
      <div className="combat-row small">
        <span>
          🍖{' '}
          {food
            ? `${getItem(food).icon} ${getItem(food).name} ×${int(foodCount)}`
            : 'Kein Essen dabei!'}
        </span>
        <button className="btn" disabled={!food || hp >= max} onClick={eatNow}>
          Essen
        </button>
      </div>
      <div className="combat-row small">
        <label className="field-inline">
          Auto-Essen bei
          <select
            className="input"
            value={settings.autoEat}
            onChange={(e) => setCombatSetting('autoEat', Number(e.target.value))}
          >
            {[0, 0.3, 0.5, 0.7].map((v) => (
              <option key={v} value={v}>
                {v === 0 ? 'aus' : `${v * 100} %`}
              </option>
            ))}
          </select>
        </label>
        <label className="field-inline">
          XP für
          <select
            className="input"
            value={settings.training}
            onChange={(e) => setCombatSetting('training', e.target.value as 'style' | 'defence')}
          >
            <option value="style">Waffenstil</option>
            <option value="defence">Verteidigung</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function CurrentFight() {
  const combat = useGame((s) => s.game.combat);
  const flee = useGame((s) => s.flee);
  if (!combat) return null;
  const m = getMonster(combat.monster);
  const phase = m.phases?.[combat.phase];
  return (
    <div className={`combat-fight ${m.boss ? 'boss' : ''}`}>
      <div className="combat-row">
        <strong>
          {m.icon} {m.name} <small className="muted">Lvl {m.level}</small>
        </strong>
        <button className="btn btn-stop" onClick={flee}>
          Fliehen
        </button>
      </div>
      <ProgressBar fraction={Math.max(0, combat.monsterHp) / m.hp} color="#e5534b" height={10} />
      <SpecialBar />
      <small className="muted">
        {combat.monsterHp > 0
          ? `${Math.ceil(combat.monsterHp)}/${m.hp} LP`
          : 'Nächster Gegner erscheint …'}
        {phase && ` · Phase: ${phase.name}`}
        {combat.kind === 'dungeon' &&
          ` · Dungeon-Fortschritt ${combat.index + 1}/${DUNGEONS.find((d) => d.id === combat.target)?.monsters.length}`}
      </small>
    </div>
  );
}

function MonsterCard({ m }: { m: MonsterDef }) {
  const fight = useGame((s) => s.fight);
  const active = useGame((s) => s.game.combat?.kind === 'monster' && s.game.combat.target === m.id);
  const kills = useGame((s) => s.game.stats[`kills.${m.id}`] ?? 0);
  const info = useGame((s) => {
    const g = s.game;
    return `${playerHitChance(g, m)}|${monsterHitChance(g, m)}|${estimateKillTime(g, m)}|${playerStats(g).style}`;
  });
  const { int } = useFmt();
  const [hit = 0, theirHit = 0, kill = 0, style] = info
    .split('|')
    .map((v, i) => (i < 3 ? Number(v) : v)) as [number, number, number, string];
  const danger = (theirHit * (1 + m.maxHit)) / 2 / m.speed;
  return (
    <div className={`monster-card ${active ? 'active' : ''}`}>
      <span className="monster-icon">{m.icon}</span>
      <span className="monster-body">
        <strong>
          {m.name} <small className="muted">Lvl {m.level}</small>
        </strong>
        <small className="muted">{m.desc}</small>
        <span className="action-stats">
          <span>❤️ {m.hp}</span>
          <span>💥 {m.maxHit}</span>
          <span>🎯 Du triffst {formatPercent(hit, 0)}</span>
          <span className={danger > 1 ? 'warn' : ''}>
            ☠️ {danger.toFixed(1).replace('.', ',')} Schaden/s
          </span>
          <span>⏱️ ~{Number.isFinite(kill) ? formatDuration(kill) : '∞'}/Kill</span>
          {m.weakness && (
            <span className={m.weakness === style ? 'up' : ''}>
              Schwäche: {STYLE_LABEL[m.weakness]}
            </span>
          )}
          {kills > 0 && <span>🏅 {int(kills)} besiegt</span>}
        </span>
        <span className="pill-wrap">
          {m.loot.slice(0, 5).map((l) => (
            <span key={l.item} className={`item-pill ${l.rare ? 'rare' : ''}`}>
              {getItem(l.item).icon} {getItem(l.item).name}
              {l.chance < 1 && <small> 1/{Math.round(1 / l.chance)}</small>}
            </span>
          ))}
        </span>
      </span>
      <button
        className={`btn ${active ? 'btn-stop' : 'btn-primary'}`}
        onClick={() => fight('monster', m.id)}
        disabled={active}
      >
        {active ? 'Kämpft' : 'Kämpfen'}
      </button>
    </div>
  );
}

export function CombatView({ onBack }: { onBack?: () => void }) {
  const level = useGame((s) => combatLevel(s.game));
  const fight = useGame((s) => s.fight);
  const activeDungeon = useGame((s) =>
    s.game.combat?.kind === 'dungeon' ? s.game.combat.target : null,
  );
  const [open, setOpen] = useState<string>(
    () => [...AREAS].reverse().find((a) => a.level <= level + 5)?.id ?? 'meadow',
  );

  return (
    <div className="combat-view">
      {onBack && (
        <button className="btn btn-ghost back" onClick={onBack}>
          ← Alle Skills
        </button>
      )}
      <h2>⚔️ Kampf</h2>
      <PlayerPanel />
      <CurrentFight />
      <h4 className="group-title">Gebiete</h4>
      {AREAS.map((a) => (
        <section key={a.id} className="area">
          <button
            className={`area-head ${open === a.id ? 'open' : ''}`}
            onClick={() => setOpen(open === a.id ? '' : a.id)}
          >
            <span>
              {a.icon} {a.name} <small className="muted">ab Kampflevel ~{a.level}</small>
            </span>
            <span>{open === a.id ? '▾' : '▸'}</span>
          </button>
          {open === a.id && (
            <div className="area-body">
              <p className="muted small">{a.desc}</p>
              {a.monsters.map((id) => (
                <MonsterCard key={id} m={getMonster(id)} />
              ))}
            </div>
          )}
        </section>
      ))}
      <h4 className="group-title">Dungeons</h4>
      {DUNGEONS.map((d) => {
        const boss = getMonster(d.monsters[d.monsters.length - 1]!);
        return (
          <div
            key={d.id}
            className={`monster-card dungeon ${activeDungeon === d.id ? 'active' : ''}`}
          >
            <span className="monster-icon">{d.icon}</span>
            <span className="monster-body">
              <strong>
                {d.name} <small className="muted">empfohlen ab ~{d.level}</small>
              </strong>
              <small className="muted">{d.desc}</small>
              <small>
                Gegner: {d.monsters.map((id) => getMonster(id).icon).join(' → ')} · Boss:{' '}
                <b>{boss.name}</b>
              </small>
            </span>
            <button
              className="btn btn-primary"
              onClick={() => fight('dungeon', d.id)}
              disabled={activeDungeon === d.id}
            >
              {activeDungeon === d.id ? 'Läuft' : 'Betreten'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
