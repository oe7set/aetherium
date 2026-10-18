import { POTION_BUFF_DEFS } from './science';
import type { BuffDef } from './types';

/** Lucky events fire randomly while playing (see engine/events-luck.ts). Potions add more buffs in Phase 5. */
export const LUCKY_EVENTS: BuffDef[] = [
  {
    id: 'meteor_shower',
    name: 'Meteoritenschauer',
    icon: '☄️',
    duration: 60,
    mods: { 'speed.mining': 2, rare: 1 },
    desc: 'Bergbau ×3 und doppelte Seltenheitschance für 60 s. Sternschnuppen-Wünsche inklusive.',
  },
  {
    id: 'golden_hour',
    name: 'Goldene Stunde',
    icon: '🌅',
    duration: 90,
    mods: { gold: 0.5 },
    desc: '+50 % Verkaufspreis für 90 s. Die Händler sind sentimental.',
  },
  {
    id: 'eureka',
    name: 'Heureka!',
    icon: '💡',
    duration: 60,
    mods: { xp: 1 },
    desc: 'Doppelte XP für 60 s. Archimedes lässt grüßen (bitte anziehen).',
  },
  {
    id: 'fish_frenzy',
    name: 'Fischschwarm',
    icon: '🐟',
    duration: 75,
    mods: { 'speed.fishing': 1.5, 'double.fishing': 0.5 },
    desc: 'Die Fische sind heute sehr kooperativ. Angeln ×2,5.',
  },
  {
    id: 'lumberjack_song',
    name: 'Holzfällerlied',
    icon: '🎵',
    duration: 75,
    mods: { 'speed.woodcutting': 1.5, 'double.woodcutting': 0.25 },
    desc: 'Ein Barde singt. Die Bäume fallen freiwillig.',
  },
  {
    id: 'steady_hands',
    name: 'Ruhige Hände',
    icon: '🧘',
    duration: 90,
    mods: { burn: 0.9, 'speed.cooking': 0.5, 'speed.smithing': 0.5 },
    desc: 'Fast nichts brennt an, alles geht flotter von der Hand.',
  },
];

export const POTION_BUFFS: BuffDef[] = POTION_BUFF_DEFS;
