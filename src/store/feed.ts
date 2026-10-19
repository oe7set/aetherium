import {
  ELEMENT_MAP,
  getAchievement,
  getAction,
  getBuff,
  getItem,
  getMonster,
  getSkill,
  getTech,
  getTool,
} from '../data';
import {
  BURNT_LINES,
  FIRE_LIT_LINES,
  FIRE_OUT_LINES,
  INTELLIGENCE_LINES,
  INVENTORY_FULL_LINES,
  LEVEL_UP_LINES,
  NEWTON_LINES,
  NO_FIRE_LINES,
  NO_INPUT_LINES,
  RARE_DROP_LINES,
  ACTION_START_LINES,
  ACHIEVEMENT_LINES,
  BOSS_KILL_LINES,
  DEATH_LINES,
  ELEMENT_LINES,
  MUTATION_LINES,
  TECH_LINES,
  FIGHT_LINES,
  KILL_LINES,
  LUCKY_LINES,
  TOOL_UNLOCK_LINES,
  TREND_DOWN_LINES,
  TREND_UP_LINES,
} from '../data/flavor';
import { SPECIALS } from '../data/spells';
import { FAMILIAR_MAP } from '../data/summoning';
import { UTILITY_MAP } from '../data/magic';
import { RELIC_MAP } from '../data/riftwalker';
import { GUILD_MAP, GUILD_RANKS } from '../data/guilds';
import { INVENTION_MAP } from '../data/invention';
import { ISLAND_BUILDING_MAP } from '../data/construction';
import { COLLECTION_MAP } from '../data/collections';
import { TROOPS } from '../data/village';
import { HERO_ITEMS, TIER_NAMES } from '../data/hero';
import {
  flavor,
  formatNumber,
  PET_MAP,
  QUEST_MAP,
  type GameEvent,
  type NumberFormat,
  type Rng,
} from '../engine';

const HERO_ITEM_NAMES = new Map(HERO_ITEMS.map((i) => [i.id, `${i.icon} ${i.name}`]));
const TROOP_NAMES = new Map(TROOPS.map((tr) => [tr.id, `${tr.icon} ${tr.name}`]));

export type FeedKind = 'info' | 'level' | 'rare' | 'warn' | 'chatter' | 'gold';

export interface FeedEntry {
  id: number;
  text: string;
  kind: FeedKind;
  at: number;
}

export interface Popup {
  id: number;
  text: string;
  kind: 'xp' | 'item' | 'rare' | 'gold' | 'bad';
  at: number;
}

export interface Translated {
  feed: Omit<FeedEntry, 'id' | 'at'>[];
  popups: Omit<Popup, 'id' | 'at'>[];
  levelUps: { skill: string; level: number }[];
  achievements: string[];
}

/** Turns raw engine events into player-facing feed lines and popups. */
export function translateEvents(events: GameEvent[], rng: Rng, format: NumberFormat): Translated {
  const out: Translated = { feed: [], popups: [], levelUps: [], achievements: [] };
  const xpBySkill = new Map<string, number>();
  const gained = new Map<string, number>();

  for (const e of events) {
    switch (e.type) {
      case 'xp':
        xpBySkill.set(e.skill, (xpBySkill.get(e.skill) ?? 0) + e.amount);
        break;
      case 'itemGained':
        gained.set(e.item, (gained.get(e.item) ?? 0) + e.qty);
        break;
      case 'levelUp': {
        const skill = getSkill(e.skill);
        out.levelUps.push({ skill: e.skill, level: e.level });
        out.feed.push({
          kind: 'level',
          text: `${skill.icon} ${flavor(rng, LEVEL_UP_LINES, { skill: skill.name, level: e.level })}`,
        });
        break;
      }
      case 'rareDrop': {
        const item = getItem(e.item);
        const pool = e.item === 'newton_apple' ? NEWTON_LINES : RARE_DROP_LINES;
        out.feed.push({
          kind: 'rare',
          text: `${item.icon} ${flavor(rng, pool, { item: item.name })}`,
        });
        out.popups.push({ kind: 'rare', text: `✨ ${item.icon} ${item.name}` });
        break;
      }
      case 'mastery': {
        const action = getAction(e.actionId);
        out.feed.push({
          kind: 'level',
          text: `🏅 Meisterschaft ${action.icon} ${action.name}: Stufe ${e.level} – schneller und öfter doppelt.`,
        });
        if (e.level % 10 === 0 || e.level === 99)
          out.popups.push({ kind: 'rare', text: `🏅 ${action.icon} Meisterschaft ${e.level}` });
        break;
      }
      case 'albumFound': {
        const item = getItem(e.item);
        const set = COLLECTION_MAP.get(e.set);
        const full = e.have >= e.total;
        out.feed.push({
          kind: 'rare',
          text: full
            ? `📗 Set „${set?.name}“ vollständig! Im Sammelbuch abschließen für einen Dauerbonus.`
            : `📗 Neu im Sammelbuch: ${item.icon} ${item.name} (${set?.name} ${e.have}/${e.total})`,
        });
        out.popups.push({
          kind: 'rare',
          text: full ? `📗 ${set?.icon} Set komplett!` : `📗 ${item.icon} ${e.have}/${e.total}`,
        });
        break;
      }
      case 'itemLost': {
        const item = getItem(e.item);
        out.popups.push({ kind: 'bad', text: `✖ ${item.icon} ${item.name}` });
        break;
      }
      case 'burnt': {
        const item = getItem(e.item);
        if (rng() < 0.35)
          out.feed.push({
            kind: 'warn',
            text: `🔥 ${flavor(rng, BURNT_LINES, { item: item.name })}`,
          });
        out.popups.push({ kind: 'bad', text: `🪨 angebrannt` });
        break;
      }
      case 'actionStarted': {
        const def = getAction(e.actionId);
        const pool = ACTION_START_LINES[def.skill];
        if (pool) out.feed.push({ kind: 'info', text: flavor(rng, pool) });
        break;
      }
      case 'actionStopped': {
        if (e.reason === 'manual') break;
        const def = getAction(e.actionId);
        const missing = e.missingItem ? getItem(e.missingItem).name : '';
        const text =
          e.reason === 'inventoryFull'
            ? flavor(rng, INVENTORY_FULL_LINES)
            : e.reason === 'noFire'
              ? flavor(rng, NO_FIRE_LINES)
              : e.reason === 'noInputs'
                ? flavor(rng, NO_INPUT_LINES, { item: missing })
                : `Level zu niedrig für ${def.name}.`;
        out.feed.push({ kind: 'warn', text: `⚠️ ${text}` });
        break;
      }
      case 'fireLit':
        out.feed.push({ kind: 'info', text: `🔥 ${flavor(rng, FIRE_LIT_LINES)}` });
        break;
      case 'fireOut':
        out.feed.push({ kind: 'warn', text: `🌫️ ${flavor(rng, FIRE_OUT_LINES)}` });
        break;
      case 'gold':
        out.popups.push({ kind: 'gold', text: `+${formatNumber(e.amount, format)} 🪙` });
        break;
      case 'achievement': {
        const a = getAchievement(e.id);
        out.feed.push({
          kind: 'rare',
          text: `${a.icon} ${flavor(rng, ACHIEVEMENT_LINES, { item: a.name })}`,
        });
        out.popups.push({ kind: 'rare', text: `🏆 ${a.name}` });
        out.achievements.push(e.id);
        break;
      }
      case 'buffStarted': {
        const b = getBuff(e.id);
        out.feed.push({
          kind: 'rare',
          text: `${b.icon} ${flavor(rng, LUCKY_LINES, { item: `${b.name} – ${b.desc}` })}`,
        });
        break;
      }
      case 'marketTrend': {
        const it = getItem(e.item);
        const pool = e.mult >= 1 ? TREND_UP_LINES : TREND_DOWN_LINES;
        out.feed.push({
          kind: 'gold',
          text: `📈 ${flavor(rng, pool, { item: `${it.icon} ${it.name}`, qty: e.mult.toFixed(1).replace('.', ',') })}`,
        });
        break;
      }
      case 'toolUnlocked': {
        const tool = getTool(e.tool);
        out.feed.push({
          kind: 'gold',
          text: `🛠️ ${flavor(rng, TOOL_UNLOCK_LINES, { item: tool.name })}`,
        });
        break;
      }
      case 'hit':
        if (e.target === 'monster')
          out.popups.push({
            kind: e.damage > 0 ? (e.special ? 'rare' : 'xp') : 'bad',
            text: e.damage > 0 ? `${e.special ? '🌟' : '💥'} ${e.damage}` : 'daneben',
          });
        else if (e.blocked) out.popups.push({ kind: 'item', text: '🛡️ geblockt' });
        else if (e.damage > 0)
          out.popups.push({ kind: 'bad', text: `${e.heavy ? '💢' : '❤️'} −${e.damage}` });
        break;
      case 'monsterKilled': {
        const m = getMonster(e.monster);
        if (m.boss)
          out.feed.push({
            kind: 'rare',
            text: `👑 ${flavor(rng, BOSS_KILL_LINES, { item: m.name })}`,
          });
        else if (rng() < 0.08)
          out.feed.push({
            kind: 'info',
            text: `${m.icon} ${flavor(rng, KILL_LINES, { item: m.name })}`,
          });
        break;
      }
      case 'bossPhase': {
        const m = getMonster(e.monster);
        const phase = m.phases?.[e.phase];
        if (phase)
          out.feed.push({ kind: 'warn', text: `${m.icon} ${phase.name}: ${phase.message}` });
        break;
      }
      case 'dungeonCompleted':
        out.feed.push({ kind: 'rare', text: `🗝️ Dungeon abgeschlossen! Die Truhe gehört dir.` });
        break;
      case 'playerDied':
        out.feed.push({
          kind: 'warn',
          text: `💀 ${flavor(rng, DEATH_LINES, { item: getMonster(e.monster).name })}`,
        });
        break;
      case 'combatStarted': {
        const m = getMonster(e.monster);
        out.feed.push({
          kind: 'info',
          text: `${m.icon} ${flavor(rng, FIGHT_LINES, { item: m.name })}`,
        });
        break;
      }
      case 'combatStopped':
        if (e.reason === 'noAmmo' || e.reason === 'noRunes') {
          out.feed.push({
            kind: 'warn',
            text: `⚠️ ${e.reason === 'noAmmo' ? 'Keine Pfeile mehr! Der Bogen ist jetzt ein sehr teurer Stock.' : 'Keine Runen mehr! Ohne Runen ist ein Zauberstab nur ein Stock.'}`,
          });
        }
        break;
      case 'slayerTask':
        out.feed.push({
          kind: 'info',
          text: `🎯 Neuer Kopfgeld-Auftrag: ${e.count}× ${getMonster(e.monster).icon} ${getMonster(e.monster).name}`,
        });
        break;
      case 'slayerTaskDone':
        out.feed.push({
          kind: 'rare',
          text: `🎯 Kopfgeld kassiert: +${e.points} Punkte (Serie ${e.streak})${e.points > 20 ? ' – Serienbonus!' : ''}`,
        });
        out.popups.push({ kind: 'rare', text: `🎯 +${e.points}` });
        break;
      case 'familiarSummoned': {
        const f = FAMILIAR_MAP.get(e.familiar);
        if (f)
          out.feed.push({
            kind: 'rare',
            text: `🐾 ${f.icon} ${f.name} begleitet dich jetzt (${f.minutes} Min).`,
          });
        break;
      }
      case 'familiarLeft': {
        const f = FAMILIAR_MAP.get(e.familiar);
        if (f)
          out.feed.push({
            kind: 'warn',
            text: `🐾 ${f.icon} ${f.name} ist in die Geisterwelt zurückgekehrt.`,
          });
        break;
      }
      case 'forged':
        out.popups.push(
          e.result === 'ok'
            ? { kind: 'rare', text: `🔨 Verstärkt auf +${e.level}!` }
            : {
                kind: 'bad',
                text:
                  e.result === 'dropped'
                    ? `💥 Fehlschlag – zurück auf +${e.level}`
                    : '💥 Fehlschlag',
              },
        );
        break;
      case 'invented': {
        const d = INVENTION_MAP.get(e.invention);
        out.feed.push({
          kind: 'rare',
          text: `⚙️ ${d?.icon ?? ''} ${d?.name ?? e.invention} ${e.level === 1 ? 'erfunden' : `auf Stufe ${e.level} verbessert`}!`,
        });
        break;
      }
      case 'fell':
        out.popups.push({ kind: 'bad', text: `🤕 Ausgerutscht! −${e.damage} LP` });
        break;
      case 'caught':
        out.popups.push({ kind: 'bad', text: `🚨 Erwischt! −${e.damage} LP` });
        break;
      case 'guildOrder': {
        const g = GUILD_MAP.get(e.guild);
        out.feed.push({
          kind: e.rank ? 'rare' : 'info',
          text: `${g?.icon ?? '📜'} Auftrag für die ${g?.name ?? 'Zunft'} erledigt: +${e.gold} Gold.${e.rank ? ` Neuer Rang: ${GUILD_RANKS[e.rank]}!` : ''}`,
        });
        break;
      }
      case 'islandBuilt': {
        const b = ISLAND_BUILDING_MAP.get(e.building);
        if (b)
          out.feed.push({
            kind: 'rare',
            text: `🔨 ${b.icon} ${b.name} ${e.level === 1 ? 'errichtet' : `auf Stufe ${e.level} ausgebaut`}!`,
          });
        break;
      }
      case 'utilityCast': {
        const u = UTILITY_MAP.get(e.spell);
        if (u) out.popups.push({ kind: 'rare', text: `${u.icon} ${u.name}!` });
        break;
      }
      case 'prayerEmpty':
        out.feed.push({
          kind: 'warn',
          text: '🙏 Gebetspunkte leer – die Gebete verstummen. Weihtrunk oder Schrein hilft.',
        });
        break;
      case 'dodged':
        out.popups.push({ kind: 'rare', text: '💨 Ausgewichen!' });
        break;
      case 'special':
        out.popups.push({
          kind: 'rare',
          text: `${SPECIALS[e.style].icon} ${SPECIALS[e.style].name}!`,
        });
        break;
      case 'ate':
        out.popups.push({ kind: 'item', text: `🍖 +${e.heal} LP` });
        break;
      case 'techResearched': {
        const tech = getTech(e.tech);
        out.feed.push({
          kind: 'rare',
          text: `${tech.icon} ${flavor(rng, TECH_LINES, { item: tech.name })}`,
        });
        out.popups.push({ kind: 'rare', text: `🔬 ${tech.name}` });
        break;
      }
      case 'elementDiscovered': {
        const el = ELEMENT_MAP.get(e.symbol);
        out.feed.push({
          kind: 'rare',
          text: `⚗️ ${flavor(rng, ELEMENT_LINES, { item: el ? `${el.name} (${el.symbol})` : e.symbol })}`,
        });
        out.popups.push({ kind: 'rare', text: `⚛️ ${e.symbol}` });
        break;
      }
      case 'harvested':
        if (e.mutated)
          out.feed.push({
            kind: 'rare',
            text: `🧬 ${flavor(rng, MUTATION_LINES, { item: getItem(e.mutated).name })}`,
          });
        break;
      case 'helperStopped':
        out.feed.push({
          kind: 'warn',
          text: `🧑‍🎓 Ein Helfer hat aufgehört: ${getAction(e.actionId).name} – ${e.reason === 'noInputs' ? 'Material fehlt' : e.reason === 'inventoryFull' ? 'Inventar voll' : e.reason === 'noFire' ? 'kein Feuer' : 'geht nicht'}.`,
        });
        break;
      case 'prestige': {
        const text =
          e.layer === 'rebirth'
            ? `🌅 Wiedergeburt! +${e.gain} Weisheit. Du beginnst von vorn – aber klüger. Viel klüger.`
            : e.layer === 'paradigm'
              ? `🔄 Paradigmenwechsel Nr. ${e.gain}! Thomas Kuhn nickt. Die Naturgesetze sind jetzt … anders.`
              : `💥 URKNALL! +${e.gain} Multiversum-Splitter. Ein neues Universum entsteht. Diesmal mit besserem Design.`;
        out.feed.push({ kind: 'rare', text });
        break;
      }
      case 'petFound': {
        const pet = PET_MAP.get(e.pet);
        if (pet) {
          out.feed.push({
            kind: 'rare',
            text: `${pet.icon} UNGLAUBLICH! Ein Haustier: ${pet.name}! ${pet.desc}`,
          });
          out.popups.push({ kind: 'rare', text: `🐾 ${pet.name}` });
        }
        break;
      }
      case 'questCompleted': {
        const q = QUEST_MAP.get(e.quest);
        if (q)
          out.feed.push({
            kind: 'rare',
            text: `${q.icon} Quest abgeschlossen: ${q.name}! ${q.giver}: ${q.outro}`,
          });
        break;
      }
      case 'taskCompleted':
        out.feed.push({ kind: 'gold', text: `📋 Auftrag erledigt! Belohnung eingesackt.` });
        break;
      case 'villageBuilt':
        out.feed.push({
          kind: e.field ? 'info' : 'gold',
          text: `🏗️ ${e.village}: ${e.name} auf Stufe ${e.level} ausgebaut.`,
        });
        break;
      case 'villageTrained':
        out.feed.push({
          kind: 'info',
          text: `⚔️ ${e.village}: Ausbildung fertig – ${TROOP_NAMES.get(e.troop) ?? e.troop} bereit.`,
        });
        break;
      case 'villageResearched':
        out.feed.push({
          kind: 'rare',
          text: `🎓 Akademie: ${TROOP_NAMES.get(e.troop) ?? e.troop} erforscht!`,
        });
        break;
      case 'villageReport':
        out.feed.push({ kind: e.won ? 'gold' : 'warn', text: `📜 ${e.title}` });
        break;
      case 'villageFounded':
        out.feed.push({ kind: 'rare', text: `🏡 Neues Dorf gegründet: ${e.name}!` });
        break;
      case 'villageCelebration':
        out.feed.push({
          kind: 'gold',
          text: `🎉 Das Fest in ${e.village} war ein Erfolg: +${e.cp} Kulturpunkte.`,
        });
        break;
      case 'riftFinished':
        out.feed.push({
          kind: e.won ? 'rare' : 'gold',
          text: `🌀 ${e.won ? 'Riss bezwungen!' : 'Zurück aus dem Riss.'} ${Math.floor(e.time / 60)}:${String(Math.floor(e.time % 60)).padStart(2, '0')} überlebt, ${e.kills} Gegner – +${e.essence} Essenz${e.record ? ' (Rekord!)' : ''}.`,
        });
        break;
      case 'heroLevel':
        out.feed.push({
          kind: 'level',
          text: `⭐ Dein Held erreicht Stufe ${e.level}! +4 Attributpunkte zu verteilen.`,
        });
        break;
      case 'heroDied':
        out.feed.push({
          kind: 'warn',
          text: '💀 Dein Held ist gefallen. Wiederbelebung im Heimatdorf – oder in 4 Stunden von selbst.',
        });
        break;
      case 'heroRevived':
        out.feed.push({
          kind: 'rare',
          text: '✨ Dein Held steht wieder auf. Etwas blass, aber motiviert.',
        });
        break;
      case 'heroArrived':
        out.feed.push({
          kind: 'info',
          text: '🗺️ Dein Held ist am Abenteuer angekommen: live spielen oder automatisch erkunden!',
        });
        break;
      case 'heroAdventure': {
        const item = e.item ? HERO_ITEM_NAMES.get(e.item) : null;
        out.feed.push({
          kind: e.success ? 'gold' : 'warn',
          text: `${e.success ? '🏆' : '🩹'} Abenteuer „${e.name}" ${e.success ? 'gemeistert' : 'abgebrochen'}: +${e.xp} Helden-XP${item ? ` und ${item} (${TIER_NAMES[e.tier]})` : ''}.`,
        });
        break;
      }
      case 'relicFound': {
        const r = RELIC_MAP.get(e.relic);
        out.feed.push({
          kind: 'rare',
          text: `${r?.icon ?? '🏺'} Relikt gefunden: ${r?.name ?? e.relic}! ${r?.desc ?? ''}`,
        });
        out.popups.push({ kind: 'rare', text: `🏺 ${r?.icon ?? ''} ${r?.name ?? e.relic}` });
        break;
      }
      case 'riftEcho':
        out.feed.push({
          kind: 'chatter',
          text: `👥 Ein Echo kehrt aus dem Riss zurück: +${e.essence} Essenz.`,
        });
        break;
      case 'intelligence':
        out.feed.push({
          kind: 'rare',
          text: `🧠 ${flavor(rng, INTELLIGENCE_LINES, { qty: e.amount })}`,
        });
        break;
      default:
        break;
    }
  }

  for (const [item, qty] of gained) {
    const def = getItem(item);
    out.popups.push({ kind: 'item', text: `+${qty} ${def.icon} ${def.name}` });
  }
  for (const [, amount] of xpBySkill) {
    out.popups.push({ kind: 'xp', text: `+${formatNumber(amount, format)} XP` });
  }
  return out;
}
