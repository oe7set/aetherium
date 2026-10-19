import { FAITH_PER_LEVEL } from '../data/devotion';
import { registerModifierSource } from './modifiers';
import { skillLevel } from './skills';
import type { GameState } from './state';

/** Glaube: every level above 1 steadies the fighter, the rift hero and the village. */
export function faithBonus(s: GameState): {
  defence: number;
  riftHp: number;
  villageDefense: number;
} {
  const l = Math.max(0, skillLevel(s, 'faith') - 1);
  return {
    defence: l * FAITH_PER_LEVEL.defence,
    riftHp: l * FAITH_PER_LEVEL.riftHp,
    villageDefense: l * FAITH_PER_LEVEL.villageDefense,
  };
}

registerModifierSource('faith', (s) => {
  const b = faithBonus(s);
  if (!b.defence) return [];
  return [
    { 'combat.defence': b.defence, 'rift.hp': b.riftHp, 'village.defense': b.villageDefense },
  ];
});
