import type { RiftStats } from './rift';
import type { RewardDef } from './progress';

// Riss 2.0: curses chosen before a run (harder, but more essence and relics), shrines inside a run
// (a choice between risk and reward) and the daily rift (fixed seed per day).

export interface CurseDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** Extra essence (0.25 = +25 %). */
  essence: number;
  mult?: Partial<Record<keyof RiftStats, number>>;
  add?: Partial<Record<keyof RiftStats, number>>;
  /** Enemy HP/damage multiplier. */
  difficulty?: number;
  /** Enemy count multiplier. */
  spawn?: number;
  /** Enemy move speed multiplier. */
  enemySpeed?: number;
  /** No provisions from the island. */
  hunger?: boolean;
}

export const CURSES: CurseDef[] = [
  {
    id: 'horde',
    name: 'Horde',
    icon: '👹',
    desc: '50 % mehr Gegner.',
    essence: 0.25,
    spawn: 1.5,
  },
  {
    id: 'haste',
    name: 'Hast',
    icon: '💨',
    desc: 'Gegner laufen 25 % schneller.',
    essence: 0.2,
    enemySpeed: 1.25,
  },
  {
    id: 'fury',
    name: 'Raserei',
    icon: '😡',
    desc: 'Gegner haben 30 % mehr Leben und Schaden.',
    essence: 0.3,
    difficulty: 1.3,
  },
  {
    id: 'fragile',
    name: 'Zerbrechlich',
    icon: '🥀',
    desc: '30 % weniger Lebenspunkte.',
    essence: 0.25,
    mult: { maxHp: 0.7 },
  },
  {
    id: 'hunger',
    name: 'Hungersnot',
    icon: '🍂',
    desc: 'Kein Proviant von der Insel.',
    essence: 0.15,
    hunger: true,
  },
  {
    id: 'darkness',
    name: 'Dunkelheit',
    icon: '🌑',
    desc: 'Halber Sammelradius, −20 % Glück.',
    essence: 0.15,
    mult: { magnet: 0.5 },
    add: { luck: -0.2 },
  },
];

export const CURSE_MAP = new Map(CURSES.map((c) => [c.id, c]));

/** Runs needed before curses can be chosen. */
export const CURSE_UNLOCK_RUNS = 3;
/** Each active curse adds this much to the relic chance (0.5 = +50 %). */
export const CURSE_RELIC_BONUS = 0.5;

export type ShrineKind =
  'might' | 'heal' | 'gamble' | 'elites' | 'greed' | 'swift' | 'fortune' | 'armor';

export interface ShrineOption {
  kind: ShrineKind;
  icon: string;
  name: string;
  desc: string;
}

export const SHRINE_OPTIONS: ShrineOption[] = [
  {
    kind: 'might',
    icon: '⚔️',
    name: 'Schrein der Stärke',
    desc: '+15 % Schaden – aber Gegner +10 % Leben.',
  },
  { kind: 'heal', icon: '💚', name: 'Quelle des Lebens', desc: 'Volle Heilung.' },
  {
    kind: 'gamble',
    icon: '🎲',
    name: 'Würfel des Schicksals',
    desc: '50 %: zwei Stufen geschenkt. 50 %: ein Viertel deiner Lebenspunkte weg.',
  },
  {
    kind: 'elites',
    icon: '💀',
    name: 'Herausforderung',
    desc: 'Drei Elite-Gegner erscheinen sofort (Truhen!), +15 Essenz.',
  },
  {
    kind: 'greed',
    icon: '💰',
    name: 'Altar der Gier',
    desc: '+30 Essenz – aber Gegner +12 % Leben.',
  },
  { kind: 'swift', icon: '👟', name: 'Windschrein', desc: '+15 % Tempo für den Rest des Laufs.' },
  {
    kind: 'fortune',
    icon: '🍀',
    name: 'Glücksbrunnen',
    desc: '+2 Neu würfeln, +1 Verbannen, +10 % Glück.',
  },
  {
    kind: 'armor',
    icon: '🛡️',
    name: 'Steinwächter',
    desc: '+2 Rüstung, aber Waffen 5 % langsamer.',
  },
];

/** Seconds between shrines in a run. */
export const SHRINE_EVERY = 150;

/** Tagesriss: minutes and rewards. */
export const DAILY_MINUTES = 10;
export const DAILY_REWARD: RewardDef = { essence: 80, heroXp: 120, gold: 800 };
