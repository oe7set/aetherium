import { getItem } from '../data';
import { THIEVING_PER_LEVEL } from '../data/thieving';
import type { ActionDef } from '../data/types';
import { actionXp, registerActionGate, registerCompletionHook } from './actions';
import { mod, registerModifierSource } from './modifiers';
import { randInt } from './rng';
import { earnGold } from './shop';
import { addXp, skillLevel } from './skills';
import { addStat, type GameState } from './state';

/** Diebeskunst: every theft can fail – caught means stunned, a few HP lost, no loot. */

const SPAN = 30;
const MIN_FAIL = 0.04;

export function stealFailChance(s: GameState, def: ActionDef): number {
  if (!def.steal) return 0;
  const t = Math.min(1, Math.max(0, (skillLevel(s, def.skill) - def.levelReq) / SPAN));
  const base = def.steal.failAtReq * (1 - t) + MIN_FAIL;
  return Math.max(0.01, base * (1 - Math.min(0.8, mod(s, 'stealth'))));
}

registerActionGate('thieving', (s, def, rng, emit) => {
  if (!def.steal || rng() >= stealFailChance(s, def)) return true;
  const { stun, damage } = def.steal;
  s.hp = Math.max(1, s.hp - damage);
  if (s.active?.actionId === def.id) s.active.progress = -stun;
  addStat(s, 'timesCaught');
  // Getting caught teaches a little, too.
  addXp(s, def.skill, actionXp(s, def) * 0.1, emit);
  emit({ type: 'caught', actionId: def.id, damage, stun });
  return false;
});

// Hochalchemie (Magie-Werkstatt): the consumed item turns into gold.
registerCompletionHook('alchemy-gold', (s, def, _rng, emit) => {
  if (!def.alchemy) return;
  earnGold(s, Math.round(getItem(def.alchemy.item).sellPrice * def.alchemy.mult), emit);
});

registerCompletionHook('thieving', (s, def, rng, emit) => {
  if (!def.steal) return;
  const [min, max] = def.steal.gold;
  earnGold(s, randInt(rng, min, max), emit);
});

// Sharp eyes: critical hits in combat and spies that warn the village.
registerModifierSource('thieving', (s) => {
  const lvl = skillLevel(s, 'thieving') - 1;
  return lvl > 0
    ? [
        {
          'combat.crit': lvl * THIEVING_PER_LEVEL.crit,
          'village.defense': lvl * THIEVING_PER_LEVEL.villageDefense,
        },
      ]
    : [];
});
