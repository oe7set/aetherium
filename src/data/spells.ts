/**
 * Combat spells for the magic style. Every cast costs its runes (plus an optional catalyst);
 * stronger spells hit harder or carry a side effect. Chosen in the combat view.
 */
import type { SpellElement } from './types';

export type { SpellElement };

export const ELEMENT_INFO: Record<SpellElement, { name: string; icon: string }> = {
  arcane: { name: 'Arkan', icon: '✨' },
  frost: { name: 'Frost', icon: '❄️' },
  fire: { name: 'Feuer', icon: '🔥' },
  shadow: { name: 'Schatten', icon: '🩸' },
  lightning: { name: 'Blitz', icon: '⚡' },
  void: { name: 'Leere', icon: '🌀' },
};

/** Damage multiplier when a spell hits a weakness / a resistance. */
export const ELEMENT_WEAK = 1.35;
export const ELEMENT_RESIST = 0.6;

/** Elemental affinities of monsters (magic only); everything else is neutral. */
export const MONSTER_ELEMENTS: Record<string, { weak?: SpellElement; resist?: SpellElement }> = {
  wolf: { weak: 'fire' },
  bandit: { weak: 'lightning' },
  spider: { weak: 'fire' },
  homunculus: { weak: 'lightning' },
  golem_proto: { weak: 'lightning', resist: 'frost' },
  flying_book: { weak: 'fire' },
  plagiarism_phantom: { weak: 'void', resist: 'shadow' },
  zombie_professor: { weak: 'fire', resist: 'shadow' },
  fire_elemental: { weak: 'frost', resist: 'fire' },
  lava_worm: { weak: 'frost', resist: 'fire' },
  dragon: { weak: 'frost', resist: 'fire' },
  particle_wraith: { weak: 'void', resist: 'lightning' },
  antimatter_golem: { weak: 'lightning', resist: 'void' },
  black_hole_imp: { weak: 'lightning', resist: 'void' },
  peer_reviewer_2: { weak: 'fire' },
  elder_dragon: { weak: 'frost', resist: 'fire' },
  standard_model: { weak: 'void', resist: 'arcane' },
  frost_troll: { weak: 'fire', resist: 'frost' },
  yeti: { weak: 'fire', resist: 'frost' },
  ice_wyrm: { weak: 'fire', resist: 'frost' },
};

export interface SpellDef {
  id: string;
  element: SpellElement;
  name: string;
  icon: string;
  /** Magic level needed. */
  level: number;
  /** Tier 0–3: Stoß, Bolzen, Explosion, Welle. */
  tier: number;
  /** Items consumed per cast (basic runes, element runes, rare catalysts). */
  cost: { item: string; qty: number }[];
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

/** Element runes (Verzauberung) – one per element; arcane spells only need basic runes. */
export const ELEMENT_RUNES: Record<SpellElement, string> = {
  arcane: 'rune_basic',
  fire: 'rune_fire',
  frost: 'rune_frost',
  lightning: 'rune_storm',
  shadow: 'rune_shadow',
  void: 'rune_void',
};

const TIER_NAMES = ['Stoß', 'Bolzen', 'Explosion', 'Welle'];
const TIER_DAMAGE = [1, 1.25, 1.5, 1.8];

interface SpellSeed {
  id: string;
  name: string;
  icon: string;
  level: number;
  /** Element runes per cast (on top of one basic rune). */
  runes: number;
  catalyst?: { item: string; qty: number };
  desc: string;
}

/** Per element: four tiers. Ids of the first spell generation stay the same (save compat). */
const SEEDS: Record<SpellElement, SpellSeed[]> = {
  arcane: [
    {
      id: 'spark',
      name: 'Funke',
      icon: '✨',
      level: 1,
      runes: 0,
      desc: 'Der Klassiker. Kitzelt mehr, als er brennt.',
    },
    {
      id: 'arcane_bolt',
      name: 'Arkanbolzen',
      icon: '💫',
      level: 15,
      runes: 1,
      desc: 'Reine Magie, kein Schnickschnack.',
    },
    {
      id: 'arcane_blast',
      name: 'Arkanexplosion',
      icon: '🌟',
      level: 35,
      runes: 2,
      desc: 'Funkelt und knallt.',
    },
    {
      id: 'arcane_wave',
      name: 'Arkanwelle',
      icon: '🌠',
      level: 60,
      runes: 3,
      desc: 'Eine Welle aus purer Theorie.',
    },
  ],
  fire: [
    {
      id: 'fire_strike',
      name: 'Feuerstoß',
      icon: '🔥',
      level: 8,
      runes: 1,
      desc: 'Wärmt Hände und verbrennt Gegner.',
    },
    {
      id: 'fireball',
      name: 'Feuerball',
      icon: '☄️',
      level: 30,
      runes: 2,
      desc: 'Kohle rein, Feuer raus.',
    },
    {
      id: 'fire_blast',
      name: 'Feuersbrunst',
      icon: '🌋',
      level: 50,
      runes: 3,
      desc: 'Der Grill ist an.',
    },
    {
      id: 'fire_wave',
      name: 'Flammenwelle',
      icon: '🔥',
      level: 72,
      runes: 4,
      catalyst: { item: 'coal', qty: 1 },
      desc: 'Eine Wand aus Feuer. Sonnencreme zwecklos.',
    },
  ],
  frost: [
    {
      id: 'frost_strike',
      name: 'Froststoß',
      icon: '❄️',
      level: 5,
      runes: 1,
      desc: 'Ein kühler Gruß.',
    },
    {
      id: 'frost_lance',
      name: 'Frostlanze',
      icon: '🧊',
      level: 15,
      runes: 2,
      desc: 'Spitz, kalt, unhöflich.',
    },
    {
      id: 'ice_blast',
      name: 'Eisexplosion',
      icon: '🌨️',
      level: 45,
      runes: 3,
      desc: 'Gefriertrocknung im Schnellverfahren.',
    },
    {
      id: 'glacier_fall',
      name: 'Gletschersturz',
      icon: '🏔️',
      level: 85,
      runes: 4,
      catalyst: { item: 'frost_shard', qty: 1 },
      desc: 'Ein Eisberg auf Bestellung.',
    },
  ],
  lightning: [
    {
      id: 'shock',
      name: 'Schock',
      icon: '⚡',
      level: 20,
      runes: 1,
      desc: 'Statisch aufgeladen und schlecht gelaunt.',
    },
    {
      id: 'chain_lightning',
      name: 'Kettenblitz',
      icon: '🌩️',
      level: 55,
      runes: 2,
      desc: 'Haare stehen inklusive.',
    },
    {
      id: 'storm_blast',
      name: 'Sturmexplosion',
      icon: '⛈️',
      level: 65,
      runes: 3,
      catalyst: { item: 'mana_crystal', qty: 1 },
      desc: 'Donner mit Ansage.',
    },
    {
      id: 'thunder_wave',
      name: 'Donnerwelle',
      icon: '🌪️',
      level: 80,
      runes: 4,
      catalyst: { item: 'mana_crystal', qty: 1 },
      desc: 'Der Himmel macht Überstunden.',
    },
  ],
  shadow: [
    {
      id: 'shadow_strike',
      name: 'Schattenstoß',
      icon: '🌑',
      level: 25,
      runes: 1,
      desc: 'Kommt aus dem Nichts, geht in die Rippen.',
    },
    {
      id: 'life_drain',
      name: 'Lebensraub',
      icon: '🩸',
      level: 40,
      runes: 2,
      catalyst: { item: 'ectoplasm', qty: 1 },
      desc: 'Moralisch fragwürdig, praktisch genial.',
    },
    {
      id: 'shadow_blast',
      name: 'Schattenexplosion',
      icon: '🖤',
      level: 60,
      runes: 3,
      catalyst: { item: 'ectoplasm', qty: 1 },
      desc: 'Dunkel. Sehr dunkel.',
    },
    {
      id: 'soul_wave',
      name: 'Seelenwelle',
      icon: '👻',
      level: 82,
      runes: 4,
      catalyst: { item: 'ectoplasm', qty: 2 },
      desc: 'Nimmt sich, was es braucht.',
    },
  ],
  void: [
    {
      id: 'void_strike',
      name: 'Leerenstoß',
      icon: '🕳️',
      level: 50,
      runes: 1,
      desc: 'Ein kleines Loch mit großer Wirkung.',
    },
    {
      id: 'void_blast',
      name: 'Leerenblitz',
      icon: '🌀',
      level: 75,
      runes: 2,
      catalyst: { item: 'void_shard', qty: 1 },
      desc: 'Das Nichts schlägt erstaunlich hart zu.',
    },
    {
      id: 'void_rift',
      name: 'Leerenriss',
      icon: '🌌',
      level: 88,
      runes: 3,
      catalyst: { item: 'void_shard', qty: 1 },
      desc: 'Ein Riss im Gefüge. Und im Gegner.',
    },
    {
      id: 'void_wave',
      name: 'Leerenwelle',
      icon: '♾️',
      level: 95,
      runes: 4,
      catalyst: { item: 'void_shard', qty: 2 },
      desc: 'Das Ende aller Dinge, kurz ausgeliehen.',
    },
  ],
};

/** What each element adds on top of the tier damage. */
const ELEMENT_TRAITS: Record<SpellElement, (tier: number) => Partial<SpellDef>> = {
  arcane: () => ({}),
  fire: () => ({ damage: 0.12 }),
  frost: (t) => ({ freeze: { chance: [0.12, 0.25, 0.3, 0.4][t] ?? 0.25, seconds: 1.2 + t * 0.1 } }),
  lightning: () => ({ accuracy: 0.3 }),
  shadow: (t) => ({ drain: [0.2, 0.4, 0.35, 0.45][t] ?? 0.3 }),
  void: () => ({ damage: 0.25, accuracy: 0.1 }),
};

function buildSpells(): SpellDef[] {
  const out: SpellDef[] = [];
  for (const [el, seeds] of Object.entries(SEEDS) as [SpellElement, SpellSeed[]][]) {
    seeds.forEach((seed, tier) => {
      const trait = ELEMENT_TRAITS[el](tier);
      // Arcane spells only use basic runes, the others one basic rune plus their element runes.
      const cost =
        el === 'arcane'
          ? [{ item: 'rune_basic', qty: 1 + seed.runes }]
          : [{ item: 'rune_basic', qty: 1 }];
      if (el !== 'arcane' && seed.runes > 0)
        cost.push({ item: ELEMENT_RUNES[el], qty: seed.runes });
      if (seed.catalyst) cost.push(seed.catalyst);
      const damage = (TIER_DAMAGE[tier] ?? 1) + (trait.damage ?? 0);
      out.push({
        id: seed.id,
        element: el,
        name: seed.name,
        icon: seed.icon,
        level: seed.level,
        tier,
        cost,
        damage: Math.round(damage * 100) / 100,
        accuracy: 1 + (trait.accuracy ?? 0),
        drain: trait.drain,
        freeze: trait.freeze,
        xp: Math.round((1 + tier * 0.15 + seed.level / 200) * 100) / 100,
        desc: `${TIER_NAMES[tier]} · ${seed.desc}`,
      });
    });
  }
  return out.sort((a, b) => a.level - b.level);
}

export const SPELLS: SpellDef[] = buildSpells();

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

/**
 * Monster heavy attacks: every n-th swing is telegraphed (wind-up). The wind-up makes that swing
 * slower, so idle damage stays about the same; a tap on „Ausweichen" avoids it completely.
 */
export function heavyEvery(level: number, boss = false): number {
  return boss ? 3 : level >= 10 ? 5 : 0;
}
export const HEAVY_DAMAGE = 1.6;
/** Extra wind-up time as a fraction of the monster's attack interval. */
export const HEAVY_WINDUP = 0.6;
/** Special energy for a dodge. */
export const DODGE_ENERGY = 25;

/** Energy needed for one special attack. */
export const SPECIAL_COST = 100;
/** Energy per hit / per miss (misses still build focus). */
export const SPECIAL_GAIN_HIT = 9;
export const SPECIAL_GAIN_MISS = 4;
/** A kill landed by a special drops this much more gold. */
export const SPECIAL_KILL_GOLD = 0.25;
/** Extra XP for hits from a special. */
export const SPECIAL_XP = 1.5;
