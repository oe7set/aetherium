import { CARTO_PER_LEVEL } from '../data/cartography';
import { registerModifierSource } from './modifiers';
import { skillLevel } from './skills';

/** Kartografie: better maps, shorter paths – the hero travels faster with every level. */
registerModifierSource('cartography', (s) => {
  const lvl = skillLevel(s, 'cartography') - 1;
  return lvl > 0
    ? [
        {
          'hero.travel': lvl * CARTO_PER_LEVEL.travel,
          'xp.archaeology': lvl * CARTO_PER_LEVEL.archaeologyXp,
        },
      ]
    : [];
});
