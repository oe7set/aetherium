import type { CombatStyle, ModifierSet } from './types';

/**
 * Gebete (Kampf 2.0): the faith skill unlocks prayers that cost prayer points per minute while
 * fighting. Up to three at once, at most one protection prayer.
 */
export interface PrayerDef {
  id: string;
  name: string;
  icon: string;
  /** Faith level needed. */
  level: number;
  /** Prayer points per minute while in combat. */
  drain: number;
  mods?: ModifierSet;
  /** Halves the damage of monsters with this attack style. */
  protect?: CombatStyle;
  desc: string;
}

export const PRAYERS: PrayerDef[] = [
  {
    id: 'thick_skin',
    name: 'Dicke Haut',
    icon: '🪨',
    level: 1,
    drain: 3,
    mods: { 'combat.defence': 0.05 },
    desc: '+5 % Verteidigung. Wie Elefantenhaut, nur frommer.',
  },
  {
    id: 'burst_strength',
    name: 'Kraftschub',
    icon: '💪',
    level: 4,
    drain: 3,
    mods: { 'combat.damage': 0.05 },
    desc: '+5 % Schaden.',
  },
  {
    id: 'clear_sight',
    name: 'Klarer Blick',
    icon: '👁️',
    level: 7,
    drain: 3,
    mods: { 'combat.accuracy': 0.05 },
    desc: '+5 % Treffsicherheit.',
  },
  {
    id: 'rapid_heal',
    name: 'Schnelle Heilung',
    icon: '💗',
    level: 12,
    drain: 2,
    mods: { 'combat.regen': 1 },
    desc: 'Doppelte natürliche Heilung.',
  },
  {
    id: 'steel_skin',
    name: 'Stahlhaut',
    icon: '🛡️',
    level: 22,
    drain: 6,
    mods: { 'combat.defence': 0.12 },
    desc: '+12 % Verteidigung.',
  },
  {
    id: 'eagle_eye',
    name: 'Adlerauge',
    icon: '🦅',
    level: 26,
    drain: 6,
    mods: { 'combat.accuracy.ranged': 0.12, 'combat.damage.ranged': 0.06 },
    desc: '+12 % Treffsicherheit und +6 % Schaden im Fernkampf.',
  },
  {
    id: 'mystic_might',
    name: 'Mystische Macht',
    icon: '🔮',
    level: 28,
    drain: 6,
    mods: { 'combat.accuracy.magic': 0.1, 'combat.damage.magic': 0.08 },
    desc: '+10 % Treffsicherheit und +8 % Schaden mit Magie.',
  },
  {
    id: 'ultimate_strength',
    name: 'Urgewalt',
    icon: '🦍',
    level: 31,
    drain: 6,
    mods: { 'combat.accuracy.melee': 0.08, 'combat.damage.melee': 0.1 },
    desc: '+8 % Treffsicherheit und +10 % Schaden im Nahkampf.',
  },
  {
    id: 'protect_melee',
    name: 'Schutz vor Nahkampf',
    icon: '⚔️',
    level: 35,
    drain: 10,
    protect: 'melee',
    desc: 'Halbiert Schaden von Nahkämpfern.',
  },
  {
    id: 'protect_ranged',
    name: 'Schutz vor Geschossen',
    icon: '🏹',
    level: 40,
    drain: 10,
    protect: 'ranged',
    desc: 'Halbiert Schaden von Schützen.',
  },
  {
    id: 'protect_magic',
    name: 'Schutz vor Magie',
    icon: '✨',
    level: 45,
    drain: 10,
    protect: 'magic',
    desc: 'Halbiert Schaden von Magiern.',
  },
  {
    id: 'holy_fury',
    name: 'Heiliger Zorn',
    icon: '🔥',
    level: 60,
    drain: 14,
    mods: { 'combat.damage': 0.15, 'combat.accuracy': 0.1 },
    desc: '+15 % Schaden, +10 % Treffsicherheit. Halleluja mit Wucht.',
  },
  {
    id: 'divine_aegis',
    name: 'Göttliche Ägide',
    icon: '😇',
    level: 80,
    drain: 18,
    mods: { 'combat.defence': 0.25, 'combat.regen': 2 },
    desc: '+25 % Verteidigung, dreifache Heilung. Unverwundbar-ish.',
  },
];

export const PRAYER_MAP = new Map(PRAYERS.map((p) => [p.id, p]));

/** Active prayers at once. */
export const PRAYER_SLOTS = 3;
/** Prayer points regained per minute outside of combat. */
export const PRAYER_REGEN = 2;
/** Prayer points per completed faith action. */
export const PRAYER_PER_RITE = 2;

export function maxPrayerPoints(faithLevel: number): number {
  return 10 + faithLevel * 2;
}

/** How monsters attack (default: melee). Protection prayers halve the matching damage. */
export const MONSTER_STYLES: Record<string, CombatStyle> = {
  bandit: 'ranged',
  homunculus: 'magic',
  flying_book: 'magic',
  plagiarism_phantom: 'magic',
  fire_elemental: 'magic',
  dragon: 'magic',
  particle_wraith: 'magic',
  black_hole_imp: 'magic',
  peer_reviewer_2: 'ranged',
  elder_dragon: 'magic',
  standard_model: 'magic',
  ice_wyrm: 'magic',
  goblin: 'ranged',
  lava_worm: 'ranged',
};

export function monsterStyle(id: string): CombatStyle {
  return MONSTER_STYLES[id] ?? 'melee';
}
