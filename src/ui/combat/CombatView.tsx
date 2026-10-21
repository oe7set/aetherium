import { useState } from 'react';
import { MilestonePanel } from '../skills/MilestonePanel';
import {
  actionsForSkill,
  getSkill,
  AREAS,
  DUNGEONS,
  getItem,
  getMonster,
  SPECIAL_COST,
  SPECIALS,
  SPELLS,
  SPELL_MAP,
  ELEMENT_INFO,
  MONSTER_ELEMENTS,
  heavyEvery,
  type MonsterDef,
  type SpellElement,
} from '../../data';
import {
  activePrayers,
  applyLoadout,
  castSpell,
  castUtility,
  elementAffinity,
  equipStyle,
  styleReadiness,
  suppliedRune,
  type ReadyCheck,
  maxPrayer,
  protectsFrom,
  saveLoadout,
  spellAffinity,
  togglePrayer,
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
import { PRAYER_SLOTS, PRAYERS, monsterStyle } from '../../data/prayers';
import { ELEMENT_RUNES } from '../../data/spells';

const COST_ITEMS = [...new Set(SPELLS.flatMap((sp) => sp.cost.map((c) => c.item)))];
import { UTILITY_SPELLS } from '../../data/magic';
import { ActionCard } from '../skills/ActionCard';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { ProgressBar } from '../ProgressBar';

const STYLE_LABEL = { melee: '⚔️ Nahkampf', ranged: '🏹 Fernkampf', magic: '🪄 Magie' } as const;

const ELEMENT_ORDER: SpellElement[] = ['arcane', 'fire', 'frost', 'lightning', 'shadow', 'void'];

/** Spell book for the magic style: four tiers per element; costs and weaknesses at a glance. */
function SpellPicker() {
  const chosen = useGame((s) => s.game.combatSettings.spell);
  const magic = useGame((s) => skillLevel(s.game, 'magic'));
  const casting = useGame((s) => castSpell(s.game)?.id ?? '');
  // Counts of every item any spell needs, as one primitive string.
  const haveKey = useGame((s) => COST_ITEMS.map((id) => s.game.inventory[id] ?? 0).join(','));
  const setCombatSetting = useGame((s) => s.setCombatSetting);
  const target = useGame((s) => s.game.combat?.monster ?? null);
  const [el, setEl] = useState<SpellElement>(() => SPELL_MAP.get(chosen)?.element ?? 'arcane');
  const { int } = useFmt();
  const have = new Map(COST_ITEMS.map((id, i) => [id, Number(haveKey.split(',')[i] ?? 0)]));
  return (
    <div className="spell-book">
      <small className="muted">
        📖 Zauberbuch
        {casting && casting !== chosen && ' · Zutaten fehlen, es wird ein Funke gewirkt'}
      </small>
      <div className="rune-pouch">
        {ELEMENT_ORDER.map((e) => {
          const rune = ELEMENT_RUNES[e];
          const aff = target ? elementAffinity(e, target) : null;
          return (
            <button
              key={e}
              className={`chip-btn ${el === e ? 'active' : ''} ${aff ?? ''}`}
              onClick={() => setEl(e)}
              title={`${ELEMENT_INFO[e].name}${aff === 'weak' ? ' – Gegner ist anfällig!' : aff === 'resist' ? ' – Gegner ist resistent' : ''}`}
            >
              {ELEMENT_INFO[e].icon} {int(have.get(rune) ?? 0)}
            </button>
          );
        })}
      </div>
      <div className="spell-list">
        {SPELLS.filter((sp) => sp.element === el).map((sp) => {
          const locked = magic < sp.level;
          const aff = target && !locked ? spellAffinity(sp, target) : null;
          return (
            <button
              key={sp.id}
              className={`spell ${chosen === sp.id ? 'active' : ''} ${locked ? 'locked' : ''}`}
              disabled={locked}
              onClick={() => setCombatSetting('spell', sp.id)}
              title={`${sp.desc} · Schaden ×${sp.damage.toLocaleString('de-DE')}`}
            >
              <span className="spell-icon">{locked ? '🔒' : sp.icon}</span>
              {aff && (
                <span className={`spell-aff ${aff}`}>
                  {aff === 'weak' ? 'effektiv' : 'schwach'}
                </span>
              )}
              <strong>{sp.name}</strong>
              <small>
                {locked
                  ? `Magie ${sp.level}`
                  : sp.cost.map((c) => (
                      <span key={c.item} className={(have.get(c.item) ?? 0) < c.qty ? 'warn' : ''}>
                        {getItem(c.item).icon}
                        {c.qty}{' '}
                      </span>
                    ))}
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

/** Gebete: faith in combat. Toggle up to three, the bar drains while fighting. */
function PrayerPanel() {
  const points = useGame((s) => Math.ceil(s.game.prayer.points));
  const max = useGame((s) => maxPrayer(s.game));
  const faith = useGame((s) => skillLevel(s.game, 'faith'));
  const active = useGame((s) => s.game.prayer.active.join(','));
  const drain = useGame((s) => activePrayers(s.game).reduce((a, p) => a + p.drain, 0));
  const draughts = useGame((s) => s.game.inventory.prayer_draught ?? 0);
  const act = useGame((s) => s.combatAct);
  const on = active ? active.split(',') : [];
  // Unlocked prayers plus the next two as a goal.
  const firstLocked = PRAYERS.some((p) => faith < p.level)
    ? PRAYERS.findIndex((p) => faith < p.level)
    : PRAYERS.length;
  return (
    <details className="combat-box prayer-box" open={on.length > 0}>
      <summary>
        🙏 Gebete{' '}
        <small className="muted">
          · {on.length}/{PRAYER_SLOTS} aktiv
        </small>
        <span className="prayer-points">
          {points}/{max}
        </span>
      </summary>
      <ProgressBar
        fraction={points / Math.max(1, max)}
        color="#f3e3a1"
        height={6}
        label="Gebetspunkte"
      />
      <small className="muted">
        {drain > 0
          ? `−${drain}/Min im Kampf`
          : 'Füllt sich außerhalb des Kampfes und mit jedem Ritual am Schrein'}
        {' · '}🫗 Weihtrunk ×{draughts} (automatisch bei &lt; 25 %)
      </small>
      <div className="prayer-grid">
        {PRAYERS.filter((p, i) => faith >= p.level || i < firstLocked + 2).map((p) => {
          const locked = faith < p.level;
          const isOn = on.includes(p.id);
          return (
            <button
              key={p.id}
              className={`prayer ${isOn ? 'on' : ''} ${locked ? 'locked' : ''}`}
              disabled={locked}
              title={`${p.name}: ${p.desc} (${p.drain}/Min)`}
              onClick={() => act((s) => void togglePrayer(s, p.id))}
            >
              <span>{locked ? '🔒' : p.icon}</span>
              <small>{locked ? `Glaube ${p.level}` : p.name}</small>
            </button>
          );
        })}
      </div>
    </details>
  );
}

/** Three gear sets: tap to switch, 💾 to store the current gear. */
function LoadoutBar() {
  const names = useGame((s) =>
    s.game.loadouts.map((l) => `${l.name}:${Object.keys(l.gear).length}`).join('|'),
  );
  const act = useGame((s) => s.combatAct);
  const pushFeed = useGame((s) => s.pushFeed);
  return (
    <div className="loadout-bar">
      {names.split('|').map((entry, i) => {
        const [name = '', count = '0'] = entry.split(':');
        return (
          <span key={i} className="loadout">
            <button
              className="btn small"
              disabled={count === '0'}
              title={count === '0' ? 'Noch leer – erst mit 💾 speichern' : `${name} anlegen`}
              onClick={() => {
                let missing = 0;
                act((s) => {
                  missing = applyLoadout(s, i);
                });
                pushFeed(
                  missing > 0
                    ? `🎒 ${name}: ${missing} Teil${missing === 1 ? '' : 'e'} fehlen im Inventar.`
                    : `🎒 ${name} angelegt.`,
                  missing > 0 ? 'warn' : 'info',
                );
              }}
            >
              {name}
            </button>
            <button
              className="btn small btn-ghost"
              title="Aktuelle Ausrüstung hier speichern"
              onClick={() => {
                act((s) => void saveLoadout(s, i));
                pushFeed(`💾 Ausrüstung als ${name} gespeichert.`, 'info');
              }}
            >
              💾
            </button>
          </span>
        );
      })}
    </div>
  );
}

/** Auto-Trank: a buff potion that is drunk again whenever its effect runs out in combat. */
function PotionPicker() {
  const potion = useGame((s) => s.game.combatSettings.potion);
  const key = useGame((s) =>
    Object.keys(s.game.inventory)
      .filter((id) => getItem(id).consume?.type === 'buff')
      .join(','),
  );
  const setCombatSetting = useGame((s) => s.setCombatSetting);
  const options = key ? key.split(',') : [];
  if (potion && !options.includes(potion)) options.unshift(potion);
  return (
    <label className="field-inline">
      🧪 Auto-Trank
      <select
        className="input"
        value={potion ?? ''}
        onChange={(e) => setCombatSetting('potion', e.target.value || null)}
      >
        <option value="">aus</option>
        {options.map((id) => (
          <option key={id} value={id}>
            {getItem(id).icon} {getItem(id).name}
          </option>
        ))}
      </select>
    </label>
  );
}

const STYLE_TABS: { style: 'melee' | 'ranged' | 'magic'; icon: string; name: string }[] = [
  { style: 'melee', icon: '⚔️', name: 'Nahkampf' },
  { style: 'ranged', icon: '🏹', name: 'Fernkampf' },
  { style: 'magic', icon: '🪄', name: 'Magie' },
];

/** Kampf-Assistent: per style a checklist of what is missing, with one-tap fixes. */
function StyleAssistant({ focus }: { focus?: 'melee' | 'ranged' | 'magic' }) {
  const current = useGame((s) => playerStats(s.game).style);
  const [open, setOpen] = useState<'melee' | 'ranged' | 'magic' | null>(focus ?? null);
  // Primitive key: readiness of all three styles.
  const key = useGame((s) =>
    STYLE_TABS.map((t) =>
      styleReadiness(s.game, t.style)
        .map((c) => (c.ok ? '1' : '0'))
        .join(''),
    ).join('|'),
  );
  const act = useGame((s) => s.combatAct);
  const setUi = useGame((s) => s.setUi);
  const jump = useGame((s) => s.jumpToAction);
  const tab = open ?? current;
  const checks = styleReadiness(useGame.getState().game, tab);
  const states = key.split('|');
  const fix = (c: ReadyCheck) => {
    if (!c.fix) return;
    if (c.fix.kind === 'equip') act((s) => void equipStyle(s, tab));
    else if (c.fix.kind === 'shop') setUi({ tab: 'inventory', inventorySegment: 'shop' });
    else jump(c.fix.action);
  };
  return (
    <div className="style-assistant">
      <div className="style-tabs">
        {STYLE_TABS.map((t, i) => {
          const ready = !states[i]?.includes('0');
          return (
            <button
              key={t.style}
              className={`chip-btn ${tab === t.style ? 'active' : ''}`}
              onClick={() => setOpen(t.style)}
            >
              {t.icon} {t.name} {ready ? '✅' : '⚠️'}
              {current === t.style && <small> (aktiv)</small>}
            </button>
          );
        })}
      </div>
      <ul className="ready-list">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? 'ok' : 'missing'}>
            <span>{c.ok ? '✅' : '❌'}</span>
            <span>{c.label}</span>
            {c.fix && (
              <button className="btn small" onClick={() => fix(c)}>
                {c.fix.kind === 'equip'
                  ? 'Anlegen'
                  : c.fix.kind === 'shop'
                    ? '🏪 Krämer'
                    : '↪ Herstellen'}
              </button>
            )}
          </li>
        ))}
      </ul>
      <small className="muted">
        Der Stil richtet sich nach der Waffe in der Hand: Schwert = Nahkampf, Bogen = Fernkampf,
        Stab = Magie.
      </small>
      {tab === 'magic' && <RuneGuide />}
    </div>
  );
}

/** Runenkunde: how runes work, where they come from. */
function RuneGuide() {
  const free = useGame((s) => suppliedRune(s.game) ?? '');
  return (
    <details className="rune-guide">
      <summary>📖 Runenkunde – wie funktionieren Runen?</summary>
      <ul>
        <li>
          Jeder Zauber kostet <b>1 Grundrune 🔣</b>. Arkanzauber brauchen nur Grundrunen – mehr
          davon, je stärker.
        </li>
        <li>
          Elementzauber brauchen zusätzlich <b>Element-Runen</b>: 🔥 Feuer, ❄️ Frost, ⚡ Sturm, 🌑
          Schatten, 🌀 Leere. Starke Zauber verlangen außerdem einen Katalysator (Kohle, Ektoplasma,
          Manakristall …).
        </li>
        <li>
          <b>Herkunft:</b> Grund-, Feuer- und Frostrunen beim Krämer; alle Runen über Verzauberung
          (Runenessenz aus dem Arkanen + Zutat); Kopfgeld-Beutel und Diebstahl bei Zauberern.
        </li>
        <li>
          <b>Element-Stäbe</b> (Verzauberung) liefern ihre Rune <b>unbegrenzt</b> und verstärken ihr
          Element.
          {free && ` Dein Stab liefert gerade: ${getItem(free).icon} ${getItem(free).name}.`}
        </li>
        <li>
          Fehlen Runen für den gewählten Zauber, wird automatisch ein Funke gewirkt. Ohne jede
          Grundrune endet der Kampf.
        </li>
        <li>Anfällige Gegner (grün markiert) nehmen +35 % Schaden, resistente nur 60 %.</li>
        <li>
          <b>Hohe Runen</b> (Verzauberung): 🌪️ Chaos (aus Goldtalismanen), 💀 Tod (große Knochen),
          🩸 Blut (Basiliskenschuppen), 👻 Seele (Seelensplitter). Sie treiben die{' '}
          <b>Hilfszauber</b> im Kampf an – Schwächen, Fluch, Blutpakt, Seelenschild – und verzaubern
          Schmuck in der Magie-Werkstatt.
        </li>
        <li>
          <b>Magie-Werkstatt</b> (Skill Magie antippen): Hochalchemie macht aus Barren und Möbeln
          Gold und gibt Magie-XP ohne Kampf.
        </li>
      </ul>
    </details>
  );
}

/** Hilfszauber: optional, cast by hand during a fight (cost high runes, have a cooldown). */
function UtilityBar() {
  const magic = useGame((s) => skillLevel(s.game, 'magic'));
  const key = useGame((s) => {
    const c = s.game.combat;
    return UTILITY_SPELLS.map((u) => {
      const cd = Math.ceil(c?.cooldowns[u.id] ?? 0);
      const afford = u.cost.every((x) => (s.game.inventory[x.item] ?? 0) >= x.qty);
      return `${cd}:${afford ? 1 : 0}`;
    }).join('|');
  });
  const effects = useGame((s) => {
    const c = s.game.combat;
    return c ? `${Math.ceil(c.weaken)}|${Math.ceil(c.curse)}|${c.shield}` : '0|0|0';
  });
  const act = useGame((s) => s.combatAct);
  const unlocked = UTILITY_SPELLS.filter((u) => magic >= u.level);
  if (!unlocked.length) return null;
  const states = key.split('|');
  const [weaken = '0', curse = '0', shield = '0'] = effects.split('|');
  return (
    <div className="utility-bar">
      {UTILITY_SPELLS.map((u, i) => {
        if (magic < u.level) return null;
        const [cd = '0', afford = '0'] = (states[i] ?? '').split(':');
        const cooling = Number(cd) > 0;
        return (
          <button
            key={u.id}
            className="btn small"
            disabled={cooling || afford === '0'}
            title={`${u.name}: ${u.desc} Kosten: ${u.cost.map((x) => `${x.qty}× ${getItem(x.item).name}`).join(', ')}`}
            onClick={() => act((s, emit) => void castUtility(s, u.id, emit))}
          >
            {u.icon} {cooling ? `${cd}s` : u.name}
          </button>
        );
      })}
      <small className="muted">
        {Number(weaken) > 0 && `🌪️ geschwächt ${weaken}s `}
        {Number(curse) > 0 && `💀 verflucht ${curse}s `}
        {Number(shield) > 0 && `🛡️ Schild ×${shield}`}
      </small>
    </div>
  );
}

/** Magie-Werkstatt: magic XP away from the arena (Hochalchemie, enchanted jewellery). */
function MagicWorkshop() {
  const level = useGame((s) => skillLevel(s.game, 'magic'));
  const list = actionsForSkill('magic');
  const groups = new Map<string, typeof list>();
  for (const a of list) groups.set(a.category ?? '', [...(groups.get(a.category ?? '') ?? []), a]);
  return (
    <section className="magic-workshop">
      <h4 className="group-title">🪄 Magie-Werkstatt (XP ohne Kampf)</h4>
      {[...groups].map(([cat, acts]) => (
        <div key={cat}>
          <small className="muted">{cat}</small>
          <div className="action-list">
            {acts
              .filter(
                (a, i) => a.levelReq <= level || acts.findIndex((x) => x.levelReq > level) + 1 > i,
              )
              .map((a) => (
                <ActionCard key={a.id} def={a} />
              ))}
          </div>
        </div>
      ))}
    </section>
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
        <PotionPicker />
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

/** Telegraphed heavy attack: an optional tap avoids it completely and charges the special bar. */
function DodgeAlert({ dodged, name }: { dodged: boolean; name: string }) {
  const dodge = useGame((s) => s.dodge);
  return (
    <div className={`dodge-alert ${dodged ? 'done' : ''}`}>
      <span>{dodged ? `💨 Bereit zum Ausweichen …` : `⚠️ ${name} holt zum Wuchtschlag aus!`}</span>
      <button className="btn btn-gold" disabled={dodged} onClick={dodge}>
        {dodged ? 'Ausgewichen' : '💨 Ausweichen'}
      </button>
    </div>
  );
}

function CurrentFight() {
  const combat = useGame((s) => s.game.combat);
  const flee = useGame((s) => s.flee);
  if (!combat) return null;
  const m = getMonster(combat.monster);
  const phase = m.phases?.[combat.phase];
  const protectedNow = protectsFrom(useGame.getState().game, monsterStyle(m.id));
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
      {combat.windup && combat.monsterHp > 0 && <DodgeAlert dodged={combat.dodged} name={m.name} />}
      <SpecialBar />
      <UtilityBar />
      <small className="muted">
        {combat.monsterHp > 0
          ? `${Math.ceil(combat.monsterHp)}/${m.hp} LP`
          : 'Nächster Gegner erscheint …'}
        {phase && ` · Phase: ${phase.name}`}
        {` · greift an mit ${STYLE_LABEL[monsterStyle(m.id)]}`}
        {protectedNow && ' · 🙏 geschützt'}
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
          {MONSTER_ELEMENTS[m.id]?.weak && (
            <span className="up" title="Zauber dieses Elements machen +35 % Schaden">
              Anfällig: {ELEMENT_INFO[MONSTER_ELEMENTS[m.id]!.weak!].icon}{' '}
              {ELEMENT_INFO[MONSTER_ELEMENTS[m.id]!.weak!].name}
            </span>
          )}
          {MONSTER_ELEMENTS[m.id]?.resist && (
            <span className="warn" title="Zauber dieses Elements machen 40 % weniger Schaden">
              Resistent: {ELEMENT_INFO[MONSTER_ELEMENTS[m.id]!.resist!].icon}{' '}
              {ELEMENT_INFO[MONSTER_ELEMENTS[m.id]!.resist!].name}
            </span>
          )}
          <span title="Angriffsstil – Schutzgebete halbieren diesen Schaden">
            Greift an: {STYLE_LABEL[monsterStyle(m.id)]}
          </span>
          {heavyEvery(m.level, m.boss) > 0 && (
            <span title="Holt regelmäßig zu einem Wuchtschlag aus – im Kampf kannst du ausweichen">
              💢 Wuchtschlag
            </span>
          )}
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

export function CombatView({ onBack, skillId }: { onBack?: () => void; skillId?: string }) {
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
      {skillId && (
        <details className="forge-details">
          <summary>🎖️ Meilensteine: {getSkill(skillId).name}</summary>
          <MilestonePanel skillId={skillId} />
        </details>
      )}
      <StyleAssistant
        focus={
          skillId === 'ranged' || skillId === 'magic' || skillId === 'melee' ? skillId : undefined
        }
      />
      <PlayerPanel />
      <LoadoutBar />
      <PrayerPanel />
      <CurrentFight />
      {skillId === 'magic' && <MagicWorkshop />}
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
