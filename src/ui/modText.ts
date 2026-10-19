import { SKILL_MAP } from '../data';
import type { ModifierSet } from '../data/types';

const LABELS: Record<string, string> = {
  xp: 'XP',
  speed: 'Tempo',
  double: 'doppelte Ausbeute',
  rare: 'Seltenheitschance',
  gold: 'Verkaufspreis',
  burn: 'weniger Anbrennen',
  fireDuration: 'Brenndauer',
  offlineHours: 'Offline-Stunden',
  research: 'Forschung',
  helperSpeed: 'Helfer-Tempo',
  'combat.accuracy': 'Treffsicherheit',
  'combat.damage': 'Schaden',
  'combat.defence': 'Verteidigung',
  'combat.hp': 'Lebenspunkte',
  'combat.loot': 'Beute',
  'combat.ammoSave': 'Munition sparen',
  'combat.runeSave': 'Runen sparen',
  'combat.energy': 'Spezial-Aufladung',
  'combat.crit': 'kritische Treffer',
  'combat.slayer': 'gegen Kopfgeld-Ziele',
  'combat.regen': 'Heilung',
  stealth: 'seltener erwischt',
  'village.defense': 'Dorfabwehr',
  'village.prod': 'Dorfproduktion',
  wisdom: 'Weisheit',
};

/** Human readable modifier list: „+5 % XP (Holzfällen), +2 % Verkaufspreis". */
export function describeMods(mods: ModifierSet): string {
  const parts = Object.entries(mods)
    .filter(([, v]) => v)
    .map(([key, v]) => {
      // 'xp.mining' → XP (Bergbau); 'combat.damage.magic' → Schaden (Magie).
      const cut = key.lastIndexOf('.');
      const [base, skill] =
        cut > 0 && !LABELS[key] ? [key.slice(0, cut), key.slice(cut + 1)] : [key, undefined];
      const label = LABELS[base] ?? base;
      const skillName = skill ? (SKILL_MAP.get(skill)?.name ?? skill) : '';
      const value = key === 'offlineHours' ? `+${v} h` : `+${Math.round((v ?? 0) * 1000) / 10} %`;
      return `${value} ${label}${skillName ? ` (${skillName})` : ''}`;
    });
  return parts.length ? parts.join(', ') : '–';
}
