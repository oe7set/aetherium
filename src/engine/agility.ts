import { AGILITY_PER_LEVEL } from '../data/agility';
import type { ActionDef } from '../data/types';
import { actionXp, registerActionGate } from './actions';
import { registerModifierSource } from './modifiers';
import { addXp, skillLevel } from './skills';
import { addStat, type GameState } from './state';

/** Gewandtheit: every lap can end in a fall – a short stun, a few HP, a tenth of the XP. */

const SPAN = 30;
const MIN_FAIL = 0.03;

export function fallChance(s: GameState, def: ActionDef): number {
  if (!def.fall) return 0;
  const t = Math.min(1, Math.max(0, (skillLevel(s, def.skill) - def.levelReq) / SPAN));
  return def.fall.failAtReq * (1 - t) + MIN_FAIL;
}

registerActionGate('agility', (s, def, rng, emit) => {
  if (!def.fall || rng() >= fallChance(s, def)) return true;
  const { stun, damage } = def.fall;
  s.hp = Math.max(1, s.hp - damage);
  if (s.active?.actionId === def.id) s.active.progress = -stun;
  addStat(s, 'agilityFalls');
  addXp(s, def.skill, actionXp(s, def) * 0.1, emit);
  emit({ type: 'fell', actionId: def.id, damage });
  return false;
});

registerModifierSource('agility', (s) => {
  const lvl = skillLevel(s, 'agility') - 1;
  return lvl > 0
    ? [
        {
          speed: lvl * AGILITY_PER_LEVEL.speed,
          'hero.travel': lvl * AGILITY_PER_LEVEL.travel,
          'rift.speed': lvl * AGILITY_PER_LEVEL.rift,
        },
      ]
    : [];
});
