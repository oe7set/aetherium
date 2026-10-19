import { FLETCH_PER_LEVEL } from '../data/fletching';
import { registerModifierSource } from './modifiers';
import { skillLevel } from './skills';

/** Bogenbau: every level makes your shots a little more accurate and your ammo last longer. */
registerModifierSource('fletching', (s) => {
  const lvl = skillLevel(s, 'fletching') - 1;
  return lvl > 0
    ? [
        {
          'combat.accuracy.ranged': lvl * FLETCH_PER_LEVEL.accuracy,
          'combat.ammoSave': lvl * FLETCH_PER_LEVEL.ammoSave,
        },
      ]
    : [];
});
