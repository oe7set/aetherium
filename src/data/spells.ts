/**
 * Combat spells for the magic style. Every cast costs its runes (plus an optional catalyst);
 * stronger spells hit harder or carry a side effect. Chosen in the combat view.
 */
export interface SpellDef {
  id: string;
  name: string;
  icon: string;
  /** Magic level needed. */
  level: number;
  /** Basic runes per cast. */
  runes: number;
  /** Extra reagent consumed per cast. */
  catalyst?: { item: string; qty: number };
  /** Multiplier on max hit. */
  damage: number;
  /** Multiplier on accuracy. */
  accuracy: number;
  /** Fraction of dealt damage healed back. */
  drain?: number;
  /** Chance to freeze the monster: its next attack is delayed by this many seconds. */
  freeze?: { chance: number; seconds: number };
  /** Extra XP factor (harder spells teach more). */
  xp: number;
  desc: string;
}

export const SPELLS: SpellDef[] = [
  {
    id: 'spark',
    name: 'Funke',
    icon: '✨',
    level: 1,
    runes: 1,
    damage: 1,
    accuracy: 1,
    xp: 1,
    desc: 'Der Klassiker. Kitzelt mehr, als er brennt.',
  },
  {
    id: 'frost_lance',
    name: 'Frostlanze',
    icon: '❄️',
    level: 15,
    runes: 2,
    damage: 1.05,
    accuracy: 1.05,
    freeze: { chance: 0.25, seconds: 1.2 },
    xp: 1.1,
    desc: '25 % Chance, das Ziel kurz einzufrieren. Kühl bleiben!',
  },
  {
    id: 'fireball',
    name: 'Feuerball',
    icon: '🔥',
    level: 30,
    runes: 1,
    catalyst: { item: 'coal', qty: 1 },
    damage: 1.3,
    accuracy: 1,
    xp: 1.2,
    desc: '+30 % Schaden. Kohle rein, Feuer raus.',
  },
  {
    id: 'life_drain',
    name: 'Lebensraub',
    icon: '🩸',
    level: 40,
    runes: 2,
    catalyst: { item: 'ectoplasm', qty: 1 },
    damage: 1.1,
    accuracy: 1.05,
    drain: 0.4,
    xp: 1.25,
    desc: 'Heilt dich um 40 % des Schadens. Moralisch fragwürdig, praktisch genial.',
  },
  {
    id: 'chain_lightning',
    name: 'Kettenblitz',
    icon: '⚡',
    level: 55,
    runes: 1,
    catalyst: { item: 'mana_crystal', qty: 1 },
    damage: 1.45,
    accuracy: 1.3,
    xp: 1.35,
    desc: '+45 % Schaden, +30 % Treffsicherheit. Haare stehen inklusive.',
  },
  {
    id: 'void_blast',
    name: 'Leerenstoß',
    icon: '🌀',
    level: 75,
    runes: 2,
    catalyst: { item: 'void_shard', qty: 1 },
    damage: 1.85,
    accuracy: 1.15,
    xp: 1.5,
    desc: '+85 % Schaden. Das Nichts schlägt erstaunlich hart zu.',
  },
];

export const SPELL_MAP = new Map(SPELLS.map((sp) => [sp.id, sp]));

/** Special attack per style: fills on hits, fired by hand (active play pays a little more). */
export const SPECIALS = {
  melee: {
    name: 'Zerschmetterer',
    icon: '💥',
    desc: 'Sicherer Treffer mit 150–200 % Schaden.',
  },
  ranged: {
    name: 'Doppelschuss',
    icon: '🎯',
    desc: 'Zwei Pfeile mit +40 % Treffsicherheit.',
  },
  magic: {
    name: 'Arkanausbruch',
    icon: '🔮',
    desc: 'Sicherer Treffer mit 160 % Schaden, heilt 30 % davon.',
  },
} as const;

/** Energy needed for one special attack. */
export const SPECIAL_COST = 100;
/** Energy per hit / per miss (misses still build focus). */
export const SPECIAL_GAIN_HIT = 9;
export const SPECIAL_GAIN_MISS = 4;
/** A kill landed by a special drops this much more gold. */
export const SPECIAL_KILL_GOLD = 0.25;
/** Extra XP for hits from a special. */
export const SPECIAL_XP = 1.5;
