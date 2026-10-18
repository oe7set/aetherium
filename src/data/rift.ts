// Ätherriss: survivor-style roguelike arena. All content as data; behaviour lives in src/rift/sim.ts.
import type { ModifierSet } from './types';

// --- Stats --------------------------------------------------------------------------------------

/** Multipliers/bonuses that shape a hero during a run. */
export interface RiftStats {
  maxHp: number;
  /** Move speed in px/s. */
  speed: number;
  /** Damage multiplier. */
  might: number;
  /** Area multiplier. */
  area: number;
  /** Cooldown multiplier (lower is faster). */
  cooldown: number;
  /** Extra projectiles. */
  amount: number;
  /** Duration multiplier. */
  duration: number;
  /** Flat damage reduction per hit. */
  armor: number;
  /** HP per second. */
  regen: number;
  /** Pickup radius in px. */
  magnet: number;
  /** Luck multiplier (chests, crits, 4th choice). */
  luck: number;
  /** XP multiplier. */
  growth: number;
  /** Projectile speed multiplier. */
  speedMult: number;
}

export const BASE_STATS: RiftStats = {
  maxHp: 120,
  speed: 130,
  might: 1,
  area: 1,
  cooldown: 1,
  amount: 0,
  duration: 1,
  armor: 0,
  regen: 0,
  magnet: 70,
  luck: 1,
  growth: 1,
  speedMult: 1,
};

export type StatKey = keyof RiftStats;

// --- Weapons ------------------------------------------------------------------------------------

export type WeaponBehavior =
  | 'thrown' // arcs up and falls (axe)
  | 'boomerang' // flies out to the nearest enemy and returns
  | 'aura' // permanent damage circle around the hero
  | 'orbit' // projectiles circling the hero
  | 'aimed' // shoots at the nearest enemy
  | 'chain' // lightning strikes that jump between enemies
  | 'lob' // lobbed flask leaving a damaging puddle
  | 'pulse' // expanding ring with knockback
  | 'beam' // instant line in facing direction
  | 'sweep' // whip-like slash left/right
  | 'well' // gravity zone that pulls enemies in
  | 'spin'; // rotating beam around the hero

export interface WeaponStats {
  damage: number;
  /** Seconds between activations. */
  cooldown: number;
  /** Projectiles / strikes per activation. */
  amount: number;
  /** Size in px (radius, length or projectile radius depending on behaviour). */
  area: number;
  /** Projectile speed px/s (or orbit angular speed rad/s). */
  speed: number;
  /** Lifetime in seconds for zones, orbits, beams. */
  duration: number;
  /** Enemies a projectile can hit (Infinity = all). For chain: jumps. */
  pierce: number;
  knockback: number;
}

export interface WeaponDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  behavior: WeaponBehavior;
  desc: string;
  base: WeaponStats;
  /** Increments for levels 2…max (each entry adds onto the previous level). */
  levels: Partial<WeaponStats>[];
  /** Evolved form: no level-ups, replaces `evolvesFrom` when the chest is opened. */
  evolvesFrom?: string;
  /** Passive needed for the evolution. */
  requires?: string;
  /** Main-game unlock (tech id); omitted = always available. */
  unlockTech?: string;
}

const lv = (...steps: Partial<WeaponStats>[]) => steps;

export const RIFT_WEAPONS: WeaponDef[] = [
  {
    id: 'axe',
    name: 'Axtwurf',
    icon: '🪓',
    color: '#ffb347',
    behavior: 'thrown',
    desc: 'Wirft Äxte in hohem Bogen. Trifft alles auf dem Weg nach unten.',
    base: {
      damage: 20,
      cooldown: 1.6,
      amount: 1,
      area: 14,
      speed: 420,
      duration: 3,
      pierce: 3,
      knockback: 1,
    },
    levels: lv(
      { amount: 1 },
      { damage: 10 },
      { pierce: 2 },
      { amount: 1 },
      { damage: 10 },
      { pierce: 2 },
      { damage: 15, amount: 1 },
    ),
  },
  {
    id: 'pick',
    name: 'Spitzhacken-Bumerang',
    icon: '⛏️',
    color: '#b8c4d6',
    behavior: 'boomerang',
    desc: 'Fliegt zum nächsten Gegner und kommt zurück. Bergbau-Ergonomie!',
    base: {
      damage: 14,
      cooldown: 1.4,
      amount: 1,
      area: 14,
      speed: 380,
      duration: 2,
      pierce: Infinity,
      knockback: 1,
    },
    levels: lv(
      { damage: 6 },
      { amount: 1 },
      { speed: 60, area: 3 },
      { damage: 8 },
      { amount: 1 },
      { area: 4 },
      { damage: 12 },
    ),
  },
  {
    id: 'firering',
    name: 'Feuerkreis',
    icon: '🔥',
    color: '#ff6b3d',
    behavior: 'aura',
    desc: 'Ein Lagerfeuer, das dir folgt. Gegner in der Nähe brennen dauerhaft.',
    base: {
      damage: 6,
      cooldown: 0.5,
      amount: 1,
      area: 60,
      speed: 0,
      duration: 0,
      pierce: Infinity,
      knockback: 0,
    },
    levels: lv(
      { area: 10 },
      { damage: 2 },
      { area: 10 },
      { damage: 2 },
      { cooldown: -0.05 },
      { area: 12 },
      { damage: 4 },
    ),
  },
  {
    id: 'runes',
    name: 'Runen-Orbit',
    icon: '🔷',
    color: '#5aa9ff',
    behavior: 'orbit',
    desc: 'Leuchtende Runen kreisen um dich. Magisch und erstaunlich stumpf.',
    base: {
      damage: 12,
      cooldown: 2.4,
      amount: 2,
      area: 13,
      speed: 3.2,
      duration: 3,
      pierce: Infinity,
      knockback: 2,
    },
    levels: lv(
      { amount: 1 },
      { damage: 5 },
      { duration: 0.5, speed: 0.4 },
      { amount: 1 },
      { damage: 6 },
      { duration: 0.8 },
      { amount: 1, damage: 6 },
    ),
    unlockTech: 'runes',
  },
  {
    id: 'arrows',
    name: 'Pfeilhagel',
    icon: '🏹',
    color: '#c8e66b',
    behavior: 'aimed',
    desc: 'Schießt Pfeile auf den nächsten Gegner. Durchbohrt ab Stufe 3.',
    base: {
      damage: 11,
      cooldown: 0.9,
      amount: 1,
      area: 6,
      speed: 620,
      duration: 1.4,
      pierce: 1,
      knockback: 0.5,
    },
    levels: lv(
      { amount: 1 },
      { pierce: 1 },
      { damage: 5 },
      { amount: 1 },
      { cooldown: -0.15 },
      { pierce: 2 },
      { damage: 8, amount: 1 },
    ),
  },
  {
    id: 'lightning',
    name: 'Blitzkette',
    icon: '⚡',
    color: '#ffe45e',
    behavior: 'chain',
    desc: 'Blitze schlagen in zufällige Gegner und springen weiter. Elektrizität!',
    base: {
      damage: 18,
      cooldown: 2.4,
      amount: 1,
      area: 140,
      speed: 0,
      duration: 0,
      pierce: 2,
      knockback: 0,
    },
    levels: lv(
      { amount: 1 },
      { damage: 8 },
      { pierce: 1 },
      { amount: 1 },
      { damage: 10 },
      { pierce: 2 },
      { amount: 1, damage: 10 },
    ),
    unlockTech: 'electricity',
  },
  {
    id: 'acid',
    name: 'Säureflasche',
    icon: '🧪',
    color: '#7dff6b',
    behavior: 'lob',
    desc: 'Wirft Flaschen, die blubbernde Pfützen hinterlassen. Nicht trinken.',
    base: {
      damage: 8,
      cooldown: 2.6,
      amount: 1,
      area: 46,
      speed: 1.1,
      duration: 2.5,
      pierce: Infinity,
      knockback: 0,
    },
    levels: lv(
      { area: 8 },
      { amount: 1 },
      { damage: 4 },
      { duration: 1 },
      { amount: 1 },
      { area: 10 },
      { damage: 6 },
    ),
    unlockTech: 'proto_alchemy',
  },
  {
    id: 'forcefield',
    name: 'Kraftfeld',
    icon: '🛡️',
    color: '#9be7ff',
    behavior: 'pulse',
    desc: 'Eine Schockwelle stößt alles von dir weg. Persönlicher Freiraum!',
    base: {
      damage: 10,
      cooldown: 3.2,
      amount: 1,
      area: 150,
      speed: 420,
      duration: 0,
      pierce: Infinity,
      knockback: 9,
    },
    levels: lv(
      { damage: 5 },
      { area: 25 },
      { cooldown: -0.4 },
      { damage: 6 },
      { area: 25 },
      { knockback: 3 },
      { damage: 10, cooldown: -0.4 },
    ),
    unlockTech: 'chainmail',
  },
  {
    id: 'laser',
    name: 'Mana-Laser',
    icon: '🔦',
    color: '#ff5df0',
    behavior: 'beam',
    desc: 'Ein gebündelter Strahl in Blickrichtung. Optik war doch zu etwas gut.',
    base: {
      damage: 22,
      cooldown: 1.8,
      amount: 1,
      area: 340,
      speed: 0,
      duration: 0.25,
      pierce: Infinity,
      knockback: 0,
    },
    levels: lv(
      { damage: 8 },
      { area: 60 },
      { amount: 1 },
      { damage: 10 },
      { cooldown: -0.3 },
      { area: 80 },
      { damage: 15 },
    ),
    unlockTech: 'optics',
  },
  {
    id: 'pendulum',
    name: 'Pendelklinge',
    icon: '🗡️',
    color: '#e8e8f0',
    behavior: 'sweep',
    desc: 'Schwingt links, schwingt rechts. Präzise wie eine Standuhr.',
    base: {
      damage: 16,
      cooldown: 1.2,
      amount: 1,
      area: 110,
      speed: 0,
      duration: 0.2,
      pierce: Infinity,
      knockback: 2,
    },
    levels: lv(
      { amount: 1 },
      { damage: 6 },
      { area: 20 },
      { damage: 6 },
      { cooldown: -0.15 },
      { area: 25 },
      { damage: 12 },
    ),
  },
  {
    id: 'gravity',
    name: 'Gravitationsbrunnen',
    icon: '🌀',
    color: '#a080ff',
    behavior: 'well',
    desc: 'Ein Strudel zieht Gegner zusammen und zermalmt sie. Relativ gemein.',
    base: {
      damage: 7,
      cooldown: 5,
      amount: 1,
      area: 90,
      speed: 150,
      duration: 3,
      pierce: Infinity,
      knockback: 0,
    },
    levels: lv(
      { area: 15 },
      { damage: 3 },
      { duration: 1 },
      { amount: 1 },
      { damage: 4 },
      { area: 20 },
      { duration: 1, damage: 5 },
    ),
    unlockTech: 'relativity',
  },
  {
    id: 'particle',
    name: 'Teilchenstrahl',
    icon: '☢️',
    color: '#5ef2ff',
    behavior: 'spin',
    desc: 'Ein rotierender Strahl aus dem Teilchenbeschleuniger. Endlich benutzt ihn jemand.',
    base: {
      damage: 9,
      cooldown: 4.5,
      amount: 1,
      area: 200,
      speed: 2.4,
      duration: 2.5,
      pierce: Infinity,
      knockback: 0.5,
    },
    levels: lv(
      { damage: 4 },
      { duration: 0.6 },
      { area: 40 },
      { amount: 1 },
      { damage: 5 },
      { cooldown: -0.6 },
      { amount: 1, damage: 6 },
    ),
    unlockTech: 'accelerator',
  },
  // --- Weitere Waffen (Phase 12) ---
  {
    id: 'sickle',
    name: 'Erntesichel',
    icon: '🌾',
    color: '#e6c34a',
    behavior: 'sweep',
    desc: 'Mäht links und rechts. Die Gegner sind diese Saison besonders reif.',
    base: {
      damage: 13,
      cooldown: 1.0,
      amount: 1,
      area: 95,
      speed: 0,
      duration: 0.2,
      pierce: Infinity,
      knockback: 1.5,
    },
    levels: lv(
      { damage: 5 },
      { amount: 1 },
      { area: 15 },
      { damage: 6 },
      { cooldown: -0.12 },
      { area: 20 },
      { damage: 10, amount: 1 },
    ),
    unlockTech: 'agriculture',
  },
  {
    id: 'stew',
    name: 'Eintopf-Katapult',
    icon: '🥘',
    color: '#d98a3d',
    behavior: 'lob',
    desc: 'Schleudert heißen Eintopf. Hinterlässt Pfützen voller Bohnen und Reue.',
    base: {
      damage: 6,
      cooldown: 2.2,
      amount: 1,
      area: 40,
      speed: 1.0,
      duration: 3,
      pierce: Infinity,
      knockback: 0,
    },
    levels: lv(
      { amount: 1 },
      { damage: 3 },
      { area: 8 },
      { duration: 1 },
      { amount: 1 },
      { damage: 4 },
      { area: 12, damage: 4 },
    ),
    unlockTech: 'fire_control',
  },
  {
    id: 'hook',
    name: 'Angelhaken',
    icon: '🪝',
    color: '#9ad0e6',
    behavior: 'boomerang',
    desc: 'Auswerfen, einholen, wiederholen. Der Fang des Tages: Goblins.',
    base: {
      damage: 12,
      cooldown: 1.3,
      amount: 1,
      area: 12,
      speed: 420,
      duration: 2,
      pierce: Infinity,
      knockback: 0.5,
    },
    levels: lv(
      { damage: 5 },
      { speed: 60 },
      { amount: 1 },
      { area: 4 },
      { damage: 7 },
      { amount: 1 },
      { damage: 10 },
    ),
    unlockTech: 'traps',
  },
  {
    id: 'coins',
    name: 'Münzschleuder',
    icon: '🪙',
    color: '#ffd34d',
    behavior: 'aimed',
    desc: 'Bezahlt Gegner in bar – mit hoher Geschwindigkeit. Kein Wechselgeld.',
    base: {
      damage: 7,
      cooldown: 0.6,
      amount: 2,
      area: 5,
      speed: 680,
      duration: 1.2,
      pierce: 1,
      knockback: 0.3,
    },
    levels: lv(
      { amount: 1 },
      { damage: 3 },
      { pierce: 1 },
      { cooldown: -0.1 },
      { amount: 1 },
      { damage: 4 },
      { amount: 1, pierce: 1 },
    ),
    unlockTech: 'banking',
  },
  {
    id: 'bell',
    name: 'Glockenschlag',
    icon: '🔔',
    color: '#f2d27a',
    behavior: 'pulse',
    desc: 'DONG. Eine Schallwelle, die alles umwirft. Auch die Stimmung.',
    base: {
      damage: 14,
      cooldown: 4,
      amount: 1,
      area: 120,
      speed: 360,
      duration: 0,
      pierce: Infinity,
      knockback: 6,
    },
    levels: lv(
      { damage: 6 },
      { area: 20 },
      { cooldown: -0.5 },
      { damage: 8 },
      { area: 25 },
      { knockback: 3 },
      { damage: 12, cooldown: -0.5 },
    ),
    unlockTech: 'clockwork',
  },
  {
    id: 'dice',
    name: 'Quantenwürfel',
    icon: '🎲',
    color: '#c58bff',
    behavior: 'chain',
    desc: 'Würfelt, wen es trifft. Gott würfelt nicht – du schon.',
    base: {
      damage: 26,
      cooldown: 2.8,
      amount: 1,
      area: 170,
      speed: 0,
      duration: 0,
      pierce: 3,
      knockback: 0,
    },
    levels: lv(
      { damage: 10 },
      { pierce: 1 },
      { amount: 1 },
      { damage: 12 },
      { cooldown: -0.4 },
      { pierce: 2 },
      { amount: 1, damage: 14 },
    ),
    unlockTech: 'superposition',
  },
  // --- Evolutions (single level, much stronger) ---
  {
    id: 'fusion',
    name: 'Kontrollierte Kernfusion',
    icon: '☀️',
    color: '#fff07a',
    behavior: 'aura',
    desc: 'Feuerkreis + Dauer: eine kleine Sonne an der Leine. Heilt dich bei Treffern.',
    base: {
      damage: 26,
      cooldown: 0.35,
      amount: 1,
      area: 150,
      speed: 0,
      duration: 0,
      pierce: Infinity,
      knockback: 1,
    },
    levels: [],
    evolvesFrom: 'firering',
    requires: 'duration',
  },
  {
    id: 'eternal_ring',
    name: 'Runen-Ring der Ewigkeit',
    icon: '💠',
    color: '#7cc4ff',
    behavior: 'orbit',
    desc: 'Runen-Orbit + Abklingzeit: die Runen hören nie mehr auf zu kreisen.',
    base: {
      damage: 34,
      cooldown: 0.1,
      amount: 6,
      area: 16,
      speed: 4.2,
      duration: 999,
      pierce: Infinity,
      knockback: 3,
    },
    levels: [],
    evolvesFrom: 'runes',
    requires: 'cooldown',
  },
  {
    id: 'tesla',
    name: 'Teslaspule',
    icon: '🌩️',
    color: '#fff36b',
    behavior: 'chain',
    desc: 'Blitzkette + Bereich: Nikola wäre stolz. Und leicht angesengt.',
    base: {
      damage: 46,
      cooldown: 0.9,
      amount: 4,
      area: 220,
      speed: 0,
      duration: 0,
      pierce: 6,
      knockback: 0,
    },
    levels: [],
    evolvesFrom: 'lightning',
    requires: 'area',
  },
  {
    id: 'feather_storm',
    name: 'Federsturm',
    icon: '🪶',
    color: '#e6ff9a',
    behavior: 'aimed',
    desc: 'Pfeilhagel + Projektile: der Himmel verdunkelt sich. Vor lauter Federn.',
    base: {
      damage: 22,
      cooldown: 0.25,
      amount: 3,
      area: 7,
      speed: 760,
      duration: 1.4,
      pierce: 5,
      knockback: 0.5,
    },
    levels: [],
    evolvesFrom: 'arrows',
    requires: 'amount',
  },
  {
    id: 'axe_tornado',
    name: 'Axt-Tornado',
    icon: '🌪️',
    color: '#ffcf70',
    behavior: 'thrown',
    desc: 'Axtwurf + Kraft: so viele Äxte, dass sie eigenes Wetter erzeugen.',
    base: {
      damage: 60,
      cooldown: 0.8,
      amount: 6,
      area: 18,
      speed: 480,
      duration: 3,
      pierce: Infinity,
      knockback: 2,
    },
    levels: [],
    evolvesFrom: 'axe',
    requires: 'might',
  },
  {
    id: 'diamond_rang',
    name: 'Diamant-Bumerang',
    icon: '💎',
    color: '#9ff3ff',
    behavior: 'boomerang',
    desc: 'Spitzhacke + Rüstung: unzerbrechlich, unaufhaltsam, unbezahlbar.',
    base: {
      damage: 48,
      cooldown: 0.9,
      amount: 4,
      area: 22,
      speed: 480,
      duration: 2,
      pierce: Infinity,
      knockback: 3,
    },
    levels: [],
    evolvesFrom: 'pick',
    requires: 'armor',
  },
  {
    id: 'philosophers_flood',
    name: 'Flut der Weisen',
    icon: '⚗️',
    color: '#b0ff8a',
    behavior: 'lob',
    desc: 'Säure + Regeneration: Gold für dich, Säure für alle anderen.',
    base: {
      damage: 22,
      cooldown: 1.2,
      amount: 4,
      area: 80,
      speed: 0.9,
      duration: 4,
      pierce: Infinity,
      knockback: 0,
    },
    levels: [],
    evolvesFrom: 'acid',
    requires: 'regen',
  },
  {
    id: 'prism',
    name: 'Prismen-Laser',
    icon: '🌈',
    color: '#ff9cf5',
    behavior: 'beam',
    desc: 'Mana-Laser + Tempo: bricht sich in alle Richtungen. Pink Floyd approves.',
    base: {
      damage: 55,
      cooldown: 0.8,
      amount: 5,
      area: 520,
      speed: 0,
      duration: 0.3,
      pierce: Infinity,
      knockback: 0,
    },
    levels: [],
    evolvesFrom: 'laser',
    requires: 'swift',
  },
  {
    id: 'harvest_moon',
    name: 'Erntemond',
    icon: '🌕',
    color: '#fff1a8',
    behavior: 'spin',
    desc: 'Erntesichel + Eintopf: ein riesiger Mond-Schnitt im Kreis. Heilt bei jeder Ernte.',
    base: {
      damage: 30,
      cooldown: 2.2,
      amount: 2,
      area: 190,
      speed: 3.2,
      duration: 2.2,
      pierce: Infinity,
      knockback: 1.5,
    },
    levels: [],
    evolvesFrom: 'sickle',
    requires: 'vitality',
  },
  {
    id: 'grand_feast',
    name: 'Festbankett',
    icon: '🍖',
    color: '#ff9a4d',
    behavior: 'lob',
    desc: 'Eintopf-Katapult + Wissbegier: ein ganzes Buffet regnet vom Himmel.',
    base: {
      damage: 20,
      cooldown: 1.2,
      amount: 3,
      area: 70,
      speed: 1.0,
      duration: 4,
      pierce: Infinity,
      knockback: 0,
    },
    levels: [],
    evolvesFrom: 'stew',
    requires: 'growth',
  },
  {
    id: 'kraken_hook',
    name: 'Krakenhaken',
    icon: '🦑',
    color: '#5fd0ff',
    behavior: 'boomerang',
    desc: 'Angelhaken + Magnet: acht Haken, die alles zurückholen.',
    base: {
      damage: 30,
      cooldown: 0.9,
      amount: 4,
      area: 18,
      speed: 520,
      duration: 2.2,
      pierce: Infinity,
      knockback: 1,
    },
    levels: [],
    evolvesFrom: 'hook',
    requires: 'magnet',
  },
  {
    id: 'midas',
    name: 'Midas-Regen',
    icon: '💰',
    color: '#ffe066',
    behavior: 'aimed',
    desc: 'Münzschleuder + Glück: es regnet Gold. Leider sehr schnell.',
    base: {
      damage: 20,
      cooldown: 0.18,
      amount: 4,
      area: 7,
      speed: 760,
      duration: 1.3,
      pierce: 4,
      knockback: 0.4,
    },
    levels: [],
    evolvesFrom: 'coins',
    requires: 'luck',
  },
  {
    id: 'cathedral',
    name: 'Domglocke',
    icon: '⛪',
    color: '#ffe9b0',
    behavior: 'pulse',
    desc: 'Glockenschlag + Rüstung: der ganze Dom läutet. Tinnitus inklusive.',
    base: {
      damage: 46,
      cooldown: 1.8,
      amount: 1,
      area: 240,
      speed: 460,
      duration: 0,
      pierce: Infinity,
      knockback: 11,
    },
    levels: [],
    evolvesFrom: 'bell',
    requires: 'armor',
  },
  {
    id: 'schrodinger',
    name: 'Schrödingers Würfel',
    icon: '📦',
    color: '#d6a8ff',
    behavior: 'chain',
    desc: 'Quantenwürfel + Projektile: trifft alle Gegner gleichzeitig. Oder keinen.',
    base: {
      damage: 70,
      cooldown: 1.4,
      amount: 3,
      area: 220,
      speed: 0,
      duration: 0,
      pierce: 7,
      knockback: 0,
    },
    levels: [],
    evolvesFrom: 'dice',
    requires: 'amount',
  },
];

export const WEAPON_MAX_LEVEL = 8;
export const MAX_WEAPONS = 6;
export const MAX_PASSIVES = 6;

// --- Passives ------------------------------------------------------------------------------------

export interface PassiveDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  stat: StatKey;
  /** Added per level (multipliers additive, e.g. 0.1 = +10 %). */
  perLevel: number;
  maxLevel: number;
}

export const RIFT_PASSIVES: PassiveDef[] = [
  {
    id: 'might',
    name: 'Muskelkater',
    icon: '💪',
    desc: '+10 % Schaden',
    stat: 'might',
    perLevel: 0.1,
    maxLevel: 5,
  },
  {
    id: 'swift',
    name: 'Flinke Sohlen',
    icon: '👟',
    desc: '+8 % Lauftempo',
    stat: 'speed',
    perLevel: 0.08,
    maxLevel: 5,
  },
  {
    id: 'area',
    name: 'Weitblick',
    icon: '🔭',
    desc: '+10 % Bereich',
    stat: 'area',
    perLevel: 0.1,
    maxLevel: 5,
  },
  {
    id: 'duration',
    name: 'Sanduhr',
    icon: '⏳',
    desc: '+10 % Dauer',
    stat: 'duration',
    perLevel: 0.1,
    maxLevel: 5,
  },
  {
    id: 'cooldown',
    name: 'Taschenuhr',
    icon: '⏱️',
    desc: '−7 % Abklingzeit',
    stat: 'cooldown',
    perLevel: -0.07,
    maxLevel: 5,
  },
  {
    id: 'amount',
    name: 'Kopierer',
    icon: '🖨️',
    desc: '+1 Projektil',
    stat: 'amount',
    perLevel: 1,
    maxLevel: 2,
  },
  {
    id: 'magnet',
    name: 'Hufeisenmagnet',
    icon: '🧲',
    desc: '+30 % Sammelradius',
    stat: 'magnet',
    perLevel: 0.3,
    maxLevel: 5,
  },
  {
    id: 'armor',
    name: 'Kettenhemd',
    icon: '🦺',
    desc: '+1 Rüstung (weniger Schaden pro Treffer)',
    stat: 'armor',
    perLevel: 1,
    maxLevel: 5,
  },
  {
    id: 'regen',
    name: 'Kräutertee',
    icon: '🍵',
    desc: '+0,4 LP pro Sekunde',
    stat: 'regen',
    perLevel: 0.4,
    maxLevel: 5,
  },
  {
    id: 'luck',
    name: 'Hasenpfote',
    icon: '🐇',
    desc: '+10 % Glück',
    stat: 'luck',
    perLevel: 0.1,
    maxLevel: 5,
  },
  {
    id: 'growth',
    name: 'Wissbegier',
    icon: '📚',
    desc: '+8 % Erfahrung',
    stat: 'growth',
    perLevel: 0.08,
    maxLevel: 5,
  },
  {
    id: 'vitality',
    name: 'Eintopf',
    icon: '🍲',
    desc: '+20 % max. LP',
    stat: 'maxHp',
    perLevel: 0.2,
    maxLevel: 5,
  },
];

/** Stats where a passive's perLevel multiplies the base instead of adding flat. */
export const MULTIPLICATIVE_STATS: StatKey[] = ['speed', 'magnet', 'maxHp'];

// --- Enemies ------------------------------------------------------------------------------------

export type EnemyBehavior =
  | 'chase'
  | 'swarm'
  | 'shooter'
  | 'splitter'
  | 'tank'
  | 'teleporter'
  /** Weekly boss: charges, fires rings of shots, calls reinforcements. */
  | 'warlord';

export interface EnemyDef {
  id: string;
  name: string;
  icon: string;
  behavior: EnemyBehavior;
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  xp: number;
  /** First minute this enemy spawns in its biome. */
  from: number;
  /** For splitters: what they split into. */
  splitInto?: string;
}

export interface BossDef extends EnemyDef {
  /** Minute of arrival. */
  at: number;
}

export interface BiomeDef {
  id: string;
  name: string;
  icon: string;
  /** Ground colours for the arena (base, accent). */
  ground: [string, string];
  /** Decorative emoji scattered on the ground. */
  decor: string[];
  enemies: EnemyDef[];
  bosses: BossDef[];
  /** Global HP/damage multiplier. */
  difficulty: number;
  /** Combat area that also unlocks the biome. */
  area: string;
  desc: string;
}

const e = (
  id: string,
  name: string,
  icon: string,
  behavior: EnemyBehavior,
  hp: number,
  speed: number,
  damage: number,
  radius: number,
  xp: number,
  from: number,
  splitInto?: string,
): EnemyDef => ({ id, name, icon, behavior, hp, speed, damage, radius, xp, from, splitInto });

const boss = (
  id: string,
  name: string,
  icon: string,
  hp: number,
  speed: number,
  damage: number,
  at: number,
): BossDef => ({
  ...e(id, name, icon, 'tank', hp, speed, damage, 34, 60, at),
  at,
});

export const BIOMES: BiomeDef[] = [
  {
    id: 'meadow',
    name: 'Hühnerwiese',
    icon: '🌼',
    ground: ['#3d6b35', '#4f8a3f'],
    decor: ['🌼', '🌱', '🍄', '🪨'],
    enemies: [
      e('r_chicken', 'Wildhuhn', '🐔', 'chase', 8, 80, 5, 13, 1, 0),
      e('r_goblin', 'Goblin', '👺', 'chase', 18, 70, 8, 14, 2, 1),
      e('r_bee', 'Killerbiene', '🐝', 'swarm', 6, 140, 4, 10, 1, 3),
      e('r_cow', 'Kampfkuh', '🐄', 'tank', 90, 45, 14, 20, 6, 5),
      e('r_slime', 'Schleimer', '🟢', 'splitter', 40, 55, 8, 16, 3, 7, 'r_slimelet'),
      e('r_slimelet', 'Schleimchen', '🟩', 'chase', 10, 85, 4, 10, 1, 99),
      e('r_pigeon', 'Taubenschwarm', '🕊️', 'swarm', 9, 155, 5, 10, 1, 9),
      e('r_scarecrow', 'Vogelscheuche', '🎃', 'shooter', 60, 50, 10, 16, 5, 11),
    ],
    bosses: [
      boss('rb_hen', 'Riesenhuhn Gertrud', '🐓', 900, 65, 20, 5),
      boss('rb_cowking', 'Kuhkönig', '🐮', 2600, 55, 28, 10),
    ],
    difficulty: 0.85,
    area: 'meadow',
    desc: 'Grüne Wiesen, glückliche Hühner. Zu glücklich.',
  },
  {
    id: 'darkwood',
    name: 'Finsterwald',
    icon: '🌲',
    ground: ['#1f3326', '#29432f'],
    decor: ['🌲', '🍂', '🪵', '🕸️'],
    enemies: [
      e('r_bat', 'Fledermaus', '🦇', 'swarm', 12, 150, 6, 11, 1, 0),
      e('r_wolf', 'Wolf', '🐺', 'chase', 30, 105, 10, 15, 3, 1),
      e('r_spider', 'Brutspinne', '🕷️', 'splitter', 45, 75, 9, 15, 3, 3, 'r_spiderling'),
      e('r_spiderling', 'Spinnchen', '🐜', 'chase', 10, 120, 4, 9, 1, 99),
      e('r_bandit', 'Wegelagerer', '🥷', 'shooter', 40, 70, 10, 15, 4, 4),
      e('r_bear', 'Bär', '🐻', 'tank', 160, 55, 18, 22, 8, 7),
      e('r_owl', 'Nachteule', '🦉', 'teleporter', 50, 95, 12, 14, 4, 9),
      e('r_troll', 'Waldtroll', '🧌', 'tank', 260, 50, 22, 24, 11, 11),
    ],
    bosses: [
      boss('rb_alpha', 'Alphawolf Fenris', '🐺', 2200, 90, 26, 5),
      boss('rb_ent', 'Zorniger Ent', '🌳', 5200, 40, 34, 10),
    ],
    difficulty: 1.6,
    area: 'darkwood',
    desc: 'Hier knackt es im Unterholz. Meistens Knochen.',
  },
  {
    id: 'gnome_lab',
    name: 'Gnomenlabor',
    icon: '⚗️',
    ground: ['#2b2d3d', '#363a52'],
    decor: ['⚙️', '🧪', '🔩', '📐'],
    enemies: [
      e('r_rat', 'Laborratte', '🐀', 'swarm', 16, 150, 7, 11, 1, 0),
      e('r_homunculus', 'Homunkulus', '👾', 'teleporter', 45, 80, 12, 14, 4, 1),
      e('r_robot', 'Kaputter Roboter', '🤖', 'shooter', 70, 60, 12, 16, 5, 3),
      e('r_ooze', 'Versuchsschleim', '🫧', 'splitter', 80, 60, 10, 17, 4, 5, 'r_bubble'),
      e('r_bubble', 'Bläschen', '🔵', 'chase', 16, 110, 6, 10, 1, 99),
      e('r_golem', 'Proto-Golem', '🗿', 'tank', 320, 45, 24, 24, 12, 7),
      e('r_drone', 'Spähdrohne', '🛸', 'swarm', 26, 170, 9, 11, 2, 9),
      e('r_turret', 'Wandelndes Geschütz', '📡', 'shooter', 140, 45, 16, 17, 7, 11),
    ],
    bosses: [
      boss('rb_gnomeboss', 'Chefgnom Quirin', '🧙', 4200, 70, 30, 5),
      boss('rb_megagolem', 'Mega-Golem v2.0', '🦾', 9000, 45, 40, 10),
    ],
    difficulty: 2.6,
    area: 'gnome_lab',
    desc: 'Explosive Experimente. Die Gnome nennen es „Fortschritt".',
  },
  {
    id: 'library',
    name: 'Verbotene Bibliothek',
    icon: '📚',
    ground: ['#3a2a22', '#4a352a'],
    decor: ['📜', '🕯️', '📖', '🪶'],
    enemies: [
      e('r_book', 'Fliegendes Buch', '📕', 'swarm', 22, 145, 8, 12, 2, 0),
      e('r_phantom', 'Plagiats-Phantom', '👻', 'teleporter', 60, 85, 14, 15, 5, 1),
      e('r_inkblot', 'Tintenklecks', '⚫', 'splitter', 90, 65, 12, 16, 4, 3, 'r_inkdrop'),
      e('r_inkdrop', 'Tintentropfen', '💧', 'chase', 20, 120, 6, 9, 1, 99),
      e('r_quill', 'Rotstift', '🖍️', 'shooter', 80, 70, 14, 14, 6, 4),
      e('r_zombie', 'Zombie-Professor', '🧟', 'tank', 480, 45, 28, 22, 14, 7),
      e('r_scroll', 'Fluchrolle', '📜', 'chase', 70, 115, 14, 13, 4, 9),
      e('r_censor', 'Der Zensor', '✂️', 'shooter', 130, 65, 18, 15, 7, 11),
    ],
    bosses: [
      boss('rb_reviewer', 'Gutachter Nr. 1', '🧐', 7500, 65, 36, 5),
      boss('rb_archivist', 'Der Erzarchivar', '📚', 15000, 45, 46, 10),
    ],
    difficulty: 4,
    area: 'library',
    desc: 'Psst! Ruhe in der Bibliothek. Auch beim Sterben.',
  },
  {
    id: 'volcano',
    name: 'Vulkanherz',
    icon: '🌋',
    ground: ['#3a1612', '#52211a'],
    decor: ['🔥', '🪨', '💀', '🌋'],
    enemies: [
      e('r_ember', 'Glutfunke', '✨', 'swarm', 30, 165, 10, 10, 2, 0),
      e('r_fire', 'Feuerelementar', '🔥', 'shooter', 110, 70, 16, 16, 6, 1),
      e('r_imp', 'Lava-Imp', '😈', 'chase', 90, 110, 16, 14, 5, 2),
      e('r_lavaworm', 'Lavawurm', '🐛', 'splitter', 160, 60, 18, 18, 6, 4, 'r_lavalet'),
      e('r_lavalet', 'Lavawürmchen', '🪱', 'chase', 30, 120, 8, 10, 2, 99),
      e('r_drake', 'Jungdrache', '🐲', 'tank', 900, 55, 34, 24, 20, 7),
      e('r_salamander', 'Feuersalamander', '🦎', 'teleporter', 140, 100, 20, 14, 7, 9),
      e('r_phoenix', 'Phönixküken', '🐤', 'swarm', 50, 180, 14, 11, 3, 11),
    ],
    bosses: [
      boss('rb_dragon', 'Drache Ignatius', '🐉', 14000, 70, 44, 5),
      boss('rb_titan', 'Magmatitan', '🌋', 26000, 45, 56, 10),
    ],
    difficulty: 6,
    area: 'volcano',
    desc: 'Heiß. Sehr heiß. Sonnencreme hilft nicht.',
  },
  {
    id: 'quantum_rift',
    name: 'Quantenriss',
    icon: '🌌',
    ground: ['#120f2a', '#1d1840'],
    decor: ['✴️', '🌀', '⚛️', '🔮'],
    enemies: [
      e('r_quark', 'Wildes Quark', '🔴', 'swarm', 45, 175, 12, 10, 2, 0),
      e('r_wraith', 'Teilchengeist', '🌫️', 'teleporter', 180, 95, 20, 15, 7, 1),
      e('r_antimatter', 'Antimaterie-Golem', '⬛', 'splitter', 300, 60, 24, 20, 8, 3, 'r_antibit'),
      e('r_antibit', 'Antibit', '▪️', 'chase', 50, 130, 10, 9, 2, 99),
      e('r_blackhole', 'Schwarzloch-Wichtel', '🕳️', 'shooter', 220, 75, 22, 16, 9, 4),
      e('r_boson', 'Higgs-Brocken', '🟣', 'tank', 1600, 50, 44, 26, 26, 7),
      e('r_photon', 'Wildes Photon', '💫', 'swarm', 60, 200, 14, 9, 3, 9),
      e('r_paradox', 'Zeitparadoxon', '⏳', 'teleporter', 420, 90, 32, 18, 12, 11),
    ],
    bosses: [
      boss('rb_standard', 'Das Standardmodell', '⚛️', 28000, 70, 60, 5),
      boss('rb_singularity', 'Die Singularität', '🌑', 52000, 55, 76, 10),
    ],
    difficulty: 9,
    area: 'quantum_rift',
    desc: 'Alles ist gleichzeitig hier und nicht hier. Vor allem die Gegner.',
  },
];

/** Final boss at 15:00 in every biome. Beat it to win the run. */
export const EXAMINER: BossDef = {
  ...e('rb_examiner', 'Der Prüfer (Gutachter Nr. 2)', '🧑‍⚖️', 'tank', 16000, 85, 42, 40, 500, 15),
  at: 15,
};

/** Wochenboss: guards the end of every weekly trial. */
export const WEEKLY_BOSS: BossDef = {
  ...e('rb_warlord', 'Der Montagsfürst', '🦹', 'warlord', 20000, 80, 38, 44, 800, 99),
  at: 99,
};

export const RUN_MINUTES = 15;

// --- Heroes -------------------------------------------------------------------------------------

export interface HeroDef {
  id: string;
  name: string;
  icon: string;
  weapon: string;
  desc: string;
  /** Bonus to the hero's stats (additive like passives). */
  bonus: Partial<RiftStats>;
  /** Unlock via main game: a skill level or a tech. */
  unlock?: { skill: string; level: number } | { tech: string };
}

export const HEROES: HeroDef[] = [
  {
    id: 'farmer',
    name: 'Bauernkraft',
    icon: '🧑‍🌾',
    weapon: 'axe',
    desc: 'Robust und bodenständig: +20 LP.',
    bonus: { maxHp: 20 },
  },
  {
    id: 'smith',
    name: 'Schmiedekunst',
    icon: '👩‍🏭',
    weapon: 'pick',
    desc: 'Hart im Nehmen: +2 Rüstung.',
    bonus: { armor: 2 },
    unlock: { skill: 'smithing', level: 15 },
  },
  {
    id: 'alchemist',
    name: 'Alchemie',
    icon: '🧙‍♂️',
    weapon: 'acid',
    desc: 'Großzügige Dosierung: +15 % Bereich.',
    bonus: { area: 0.15 },
    unlock: { skill: 'alchemy', level: 10 },
  },
  {
    id: 'ranger',
    name: 'Waldläuferei',
    icon: '🧝‍♀️',
    weapon: 'arrows',
    desc: 'Leichtfüßig: +12 % Tempo.',
    bonus: { speed: 16 },
    unlock: { skill: 'ranged', level: 15 },
  },
  {
    id: 'mage',
    name: 'Runenmagie',
    icon: '🧙',
    weapon: 'runes',
    desc: 'Schnelle Formeln: −10 % Abklingzeit.',
    bonus: { cooldown: -0.1 },
    unlock: { skill: 'magic', level: 15 },
  },
  {
    id: 'physicist',
    name: 'Teilchenphysik',
    icon: '👩‍🔬',
    weapon: 'particle',
    desc: 'Anziehend: +50 % Sammelradius, +1 Projektil.',
    bonus: { magnet: 35, amount: 1 },
    unlock: { tech: 'accelerator' },
  },
];

// --- Meta progression ---------------------------------------------------------------------------

export interface RiftTalentDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** Essence cost for level n (1-based). */
  cost: (n: number) => number;
  maxLevel: number;
  /** Per-level stat bonus inside runs. */
  stat?: StatKey;
  perLevel?: number;
}

const tCost = (base: number) => (n: number) => Math.round(base * n * (1 + (n - 1) * 0.5));

export const RIFT_TALENTS: RiftTalentDef[] = [
  {
    id: 't_might',
    name: 'Macht',
    icon: '💪',
    desc: '+5 % Schaden',
    cost: tCost(20),
    maxLevel: 5,
    stat: 'might',
    perLevel: 0.05,
  },
  {
    id: 't_armor',
    name: 'Panzerung',
    icon: '🦺',
    desc: '+1 Rüstung',
    cost: tCost(40),
    maxLevel: 3,
    stat: 'armor',
    perLevel: 1,
  },
  {
    id: 't_hp',
    name: 'Zähigkeit',
    icon: '❤️',
    desc: '+10 % max. LP',
    cost: tCost(20),
    maxLevel: 3,
    stat: 'maxHp',
    perLevel: 0.1,
  },
  {
    id: 't_regen',
    name: 'Erholung',
    icon: '🌿',
    desc: '+0,2 LP/s',
    cost: tCost(30),
    maxLevel: 3,
    stat: 'regen',
    perLevel: 0.2,
  },
  {
    id: 't_cooldown',
    name: 'Taktung',
    icon: '⏱️',
    desc: '−2,5 % Abklingzeit',
    cost: tCost(60),
    maxLevel: 2,
    stat: 'cooldown',
    perLevel: -0.025,
  },
  {
    id: 't_area',
    name: 'Reichweite',
    icon: '🔭',
    desc: '+5 % Bereich',
    cost: tCost(50),
    maxLevel: 2,
    stat: 'area',
    perLevel: 0.05,
  },
  {
    id: 't_speed',
    name: 'Eile',
    icon: '👟',
    desc: '+5 % Tempo',
    cost: tCost(30),
    maxLevel: 2,
    stat: 'speed',
    perLevel: 0.05,
  },
  {
    id: 't_duration',
    name: 'Ausdauer',
    icon: '⏳',
    desc: '+10 % Dauer',
    cost: tCost(40),
    maxLevel: 2,
    stat: 'duration',
    perLevel: 0.1,
  },
  {
    id: 't_amount',
    name: 'Vervielfältigung',
    icon: '🖨️',
    desc: '+1 Projektil',
    cost: tCost(300),
    maxLevel: 1,
    stat: 'amount',
    perLevel: 1,
  },
  {
    id: 't_magnet',
    name: 'Anziehung',
    icon: '🧲',
    desc: '+20 % Sammelradius',
    cost: tCost(15),
    maxLevel: 2,
    stat: 'magnet',
    perLevel: 0.2,
  },
  {
    id: 't_luck',
    name: 'Glückspilz',
    icon: '🍀',
    desc: '+10 % Glück',
    cost: tCost(30),
    maxLevel: 3,
    stat: 'luck',
    perLevel: 0.1,
  },
  {
    id: 't_growth',
    name: 'Lerneifer',
    icon: '📚',
    desc: '+5 % Erfahrung',
    cost: tCost(45),
    maxLevel: 5,
    stat: 'growth',
    perLevel: 0.05,
  },
  {
    id: 't_greed',
    name: 'Gier',
    icon: '💰',
    desc: '+10 % Riss-Essenz',
    cost: tCost(35),
    maxLevel: 5,
  },
  {
    id: 't_revival',
    name: 'Zweite Chance',
    icon: '✝️',
    desc: 'Einmal pro Lauf wiederbeleben',
    cost: tCost(400),
    maxLevel: 1,
  },
  {
    id: 't_reroll',
    name: 'Neu würfeln',
    icon: '🔄',
    desc: '+2 Neuauswahlen pro Lauf',
    cost: tCost(25),
    maxLevel: 5,
  },
  {
    id: 't_skip',
    name: 'Überspringen',
    icon: '⏭️',
    desc: '+1 Überspringen (gibt XP-Heilung)',
    cost: tCost(20),
    maxLevel: 3,
  },
  {
    id: 't_banish',
    name: 'Verbannen',
    icon: '🚫',
    desc: '+1 Verbannung (Option für den Lauf entfernen)',
    cost: tCost(30),
    maxLevel: 3,
  },
  {
    id: 't_provisions',
    name: 'Proviantbeutel',
    icon: '🎒',
    desc: '+1 Proviant-Platz für Inselessen',
    cost: tCost(40),
    maxLevel: 3,
  },
  {
    id: 't_echo',
    name: 'Echo-Läufe',
    icon: '👥',
    desc: 'Echos laufen im Hintergrund: Essenz auch im Idle',
    cost: tCost(80),
    maxLevel: 3,
  },
];

/** Island bonus from lifetime Riss-Essenz (combat, capped). */
export function riftIslandBonus(essenceTotal: number): ModifierSet {
  return {
    'combat.damage': Math.min(0.2, essenceTotal * 0.0002),
    'combat.accuracy': Math.min(0.15, essenceTotal * 0.00015),
  };
}

/** Seconds between echo runs and essence per echo level. */
export const ECHO_INTERVAL = 600;
export const ECHO_ESSENCE = 4;
/** Base food slots (more with t_provisions). */
export const BASE_PROVISIONS = 1;
