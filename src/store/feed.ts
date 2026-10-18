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
import { flavor, formatNumber, type GameEvent, type NumberFormat, type Rng } from '../engine';

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
            kind: e.damage > 0 ? 'xp' : 'bad',
            text: e.damage > 0 ? `💥 ${e.damage}` : 'daneben',
          });
        else if (e.damage > 0) out.popups.push({ kind: 'bad', text: `❤️ −${e.damage}` });
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
