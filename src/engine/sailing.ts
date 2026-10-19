import {
  CARTO_SAILING_SPEED,
  SAILING_PER_LEVEL,
  SHIP_TIER,
  TRADE_PAY,
  VOYAGE_SHIP,
} from '../data/sailing';
import { registerAvailabilityCheck, registerCompletionHook } from './actions';
import { mod, registerModifierSource } from './modifiers';
import { earnGold } from './shop';
import { skillLevel } from './skills';
import { addStat, type GameState } from './state';
import { villageTribute } from './village';

/** Seefahrt: the ship in use is the sailing tool; far islands need a big enough one. */
export function shipTier(s: GameState): number {
  const id = s.equippedTools.sailing;
  return (id && SHIP_TIER.get(id)) || 0;
}

/** Ship tier an action needs (0 for everything but voyages and trade runs). */
export function shipNeeded(actionId: string): number {
  return VOYAGE_SHIP.get(actionId) ?? 0;
}

registerAvailabilityCheck((s, def) => def.skill !== 'sailing' || shipTier(s) >= shipNeeded(def.id));

// Trade voyages pay gold and ship resources to the village.
registerCompletionHook('sailing', (s, def, _rng, emit) => {
  const t = TRADE_PAY.get(def.id);
  if (!t) return;
  earnGold(s, Math.round(t.gold * (1 + mod(s, 'gold'))), emit);
  villageTribute(s, t.village);
  addStat(s, 'tradeVoyages');
});

// Better deals with every level; maps from cartography shorten every voyage.
registerModifierSource('sailing', (s) => {
  const lvl = skillLevel(s, 'sailing') - 1;
  const carto = skillLevel(s, 'cartography') - 1;
  return [
    {
      gold: Math.max(0, lvl) * SAILING_PER_LEVEL.gold,
      'speed.sailing': Math.max(0, carto) * CARTO_SAILING_SPEED,
    },
  ];
});
