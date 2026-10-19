import { HUSBANDRY_PER_LEVEL } from '../data/husbandry';
import { registerModifierSource } from './modifiers';
import { skillLevel } from './skills';

/** Viehzucht: eggs, milk and cheese on the table – the village works harder with every level. */
registerModifierSource('husbandry', (s) => {
  const lvl = skillLevel(s, 'husbandry') - 1;
  return lvl > 0 ? [{ 'village.prod': lvl * HUSBANDRY_PER_LEVEL.villageProd }] : [];
});
