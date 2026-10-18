import { getAction, getItem, getSkill } from '../data';
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
}

/** Turns raw engine events into player-facing feed lines and popups. */
export function translateEvents(events: GameEvent[], rng: Rng, format: NumberFormat): Translated {
  const out: Translated = { feed: [], popups: [], levelUps: [] };
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
