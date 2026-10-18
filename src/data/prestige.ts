import type { ModifierSet } from './types';

// Three prestige layers, each with its own new mechanic:
// 1. Wiedergeburt → Weisheit + Ahnen-Talente (spendable perks, level cap 120)
// 2. Paradigmenwechsel → Naturgesetze (rule changes with up- and downsides) + Paradigmenpunkte
// 3. Urknall → Multiversum-Splitter for meta upgrades (multiple laws, wisdom inflation …)

export const PRESTIGE = {
  /** Total level needed for the first rebirth. */
  REBIRTH_TOTAL_LEVEL: 250,
  /** Wisdom = floor(sqrt(run XP / this)). */
  WISDOM_XP_DIVISOR: 20_000,
  /** Bonus per lifetime wisdom point. */
  WISDOM_XP: 0.04,
  WISDOM_RESEARCH: 0.02,
  WISDOM_GOLD: 0.02,
  /** Paradigm shift needs this many researched techs. */
  PARADIGM_TECHS: 20,
  /** Research bonus per paradigm point. */
  PARADIGM_RESEARCH: 0.25,
  /** Big bang needs this many paradigm shifts. */
  BIG_BANG_PARADIGMS: 3,
};

export interface UpgradeDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** Cost of level n (1-based). */
  cost: (level: number) => number;
  maxLevel: number;
  /** Modifiers per level. */
  mods?: ModifierSet;
}

/** Ahnen-Talente: bought with wisdom, kept across rebirths and paradigm shifts. */
export const WISDOM_UPGRADES: UpgradeDef[] = [
  {
    id: 'head_start',
    name: 'Vorwissen',
    icon: '📚',
    desc: 'Starte jede Wiedergeburt mit allen Skills auf Level 5 × Stufe.',
    cost: (n) => 3 * n * n,
    maxLevel: 6,
  },
  {
    id: 'heirlooms',
    name: 'Erbstücke',
    icon: '🪓',
    desc: 'Werkzeuge bleiben bei der Wiedergeburt erhalten.',
    cost: () => 10,
    maxLevel: 1,
  },
  {
    id: 'starting_gold',
    name: 'Startkapital',
    icon: '💰',
    desc: 'Starte mit 1.000 × 10^(Stufe−1) Gold.',
    cost: (n) => 4 * 2 ** n,
    maxLevel: 6,
  },
  {
    id: 'pockets',
    name: 'Tascheninflation',
    icon: '🎒',
    desc: '+8 Inventarplätze pro Stufe.',
    cost: (n) => 2 + 3 * n,
    maxLevel: 5,
  },
  {
    id: 'loyal_helpers',
    name: 'Treue Helfer',
    icon: '🤝',
    desc: 'Helfer bleiben bei der Wiedergeburt.',
    cost: () => 25,
    maxLevel: 1,
  },
  {
    id: 'deep_sleep',
    name: 'Tiefschlaf',
    icon: '😴',
    desc: '+12 Stunden Offline-Fortschritt pro Stufe.',
    cost: (n) => 5 * n,
    maxLevel: 4,
    mods: { offlineHours: 12 },
  },
  {
    id: 'fast_hands',
    name: 'Flinke Finger',
    icon: '🖐️',
    desc: '+5 % Tempo auf alles pro Stufe.',
    cost: (n) => 6 * n,
    maxLevel: 10,
    mods: { speed: 0.05 },
  },
  {
    id: 'lucky_star',
    name: 'Glücksstern',
    icon: '⭐',
    desc: '+10 % Seltenheitschance pro Stufe.',
    cost: (n) => 5 * n,
    maxLevel: 10,
    mods: { rare: 0.1 },
  },
  {
    id: 'transcendence',
    name: 'Transzendenz',
    icon: '🌠',
    desc: 'Hebt das Level-Maximum aller Skills von 99 auf 120.',
    cost: () => 150,
    maxLevel: 1,
  },
];

export interface LawDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  mods: ModifierSet;
}

/** Naturgesetze for the next paradigm (Thomas Kuhn would approve). Each has a trade-off. */
export const LAWS: LawDef[] = [
  {
    id: 'weak_gravity',
    name: 'Schwache Gravitation',
    icon: '🪶',
    desc: 'Bergbau +50 %, aber Fernkampf-Pfeile fliegen davon: Treffsicherheit −20 %. Im Riss +15 % Laufgeschwindigkeit.',
    mods: { 'speed.mining': 0.5, 'combat.accuracy': -0.2, 'rift.speed': 0.15 },
  },
  {
    id: 'fast_light',
    name: 'Schnelles Licht',
    icon: '💡',
    desc: 'Tempo +20 % auf alles, aber Forschung −20 %. Dorf: +10 % Produktion.',
    mods: { speed: 0.2, research: -0.2, 'village.prod': 0.1 },
  },
  {
    id: 'exothermic',
    name: 'Exotherme Welt',
    icon: '🔥',
    desc: 'Feuer brennt 3× so lange, fast nichts brennt an. Angeln −25 % (warmes Wasser, faule Fische). Riss: +20 % Wirkungsfläche.',
    mods: { fireDuration: 2, burn: 0.8, 'speed.fishing': -0.25, 'rift.area': 0.2 },
  },
  {
    id: 'generous_entropy',
    name: 'Großzügige Entropie',
    icon: '🎲',
    desc: '+25 % doppelte Ausbeute auf alles, aber −15 % XP. Dorf: −10 % Produktion, Riss: +30 % Glück.',
    mods: { double: 0.25, xp: -0.15, 'village.prod': -0.1, 'rift.luck': 0.3 },
  },
  {
    id: 'generous_planck',
    name: 'Planck ist großzügig',
    icon: '🍀',
    desc: 'Seltenheit +100 %, Verkaufspreise −25 %. Riss: +50 % Glück.',
    mods: { rare: 1, gold: -0.25, 'rift.luck': 0.5 },
  },
  {
    id: 'mana_flood',
    name: 'Mana-Überfluss',
    icon: '🔮',
    desc: 'Kampfschaden +25 %, Holzfällen −25 % (Bäume sind jetzt magisch beleidigt). Riss: +20 % Schaden.',
    mods: { 'combat.damage': 0.25, 'speed.woodcutting': -0.25, 'rift.might': 0.2 },
  },
  {
    id: 'tunneling',
    name: 'Quanten-Tunneleffekt',
    icon: '🌀',
    desc: 'Helfer +50 % schneller, du selbst −10 %. Dorf: +15 % Produktion (die Dörfler tunneln mit).',
    mods: { helperSpeed: 0.5, speed: -0.1, 'village.prod': 0.15 },
  },
  {
    id: 'scholarly',
    name: 'Akademischer Kosmos',
    icon: '🎓',
    desc: 'XP +30 %, aber Kampf-Verteidigung −20 %. Nerds gewinnen keine Prügeleien. Dorf: −10 % Verteidigung, Riss: −15 % Leben.',
    mods: { xp: 0.3, 'combat.defence': -0.2, 'village.defense': -0.1, 'rift.hp': -0.15 },
  },
];

/** Multiversum-Upgrades: bought with shards from the big bang, kept forever. */
export const MULTIVERSE_UPGRADES: UpgradeDef[] = [
  {
    id: 'second_law',
    name: 'Zweites Naturgesetz',
    icon: '⚖️',
    desc: 'Wähle bei jedem Paradigmenwechsel ein zusätzliches Naturgesetz.',
    cost: (n) => 2 * n,
    maxLevel: 2,
  },
  {
    id: 'inflation',
    name: 'Kosmische Inflation',
    icon: '🎈',
    desc: 'Weisheitsgewinn ×1,5 pro Stufe.',
    cost: (n) => n,
    maxLevel: 5,
    mods: { wisdom: 0.5 },
  },
  {
    id: 'cosmic_memory',
    name: 'Kosmisches Gedächtnis',
    icon: '🧠',
    desc: 'Behalte 25 % der Weisheit pro Stufe beim Urknall.',
    cost: (n) => 2 * n,
    maxLevel: 4,
  },
  {
    id: 'dark_energy',
    name: 'Dunkle Energie',
    icon: '🌑',
    desc: '+25 % Tempo, +25 % Forschung pro Stufe.',
    cost: (n) => 2 * n,
    maxLevel: 5,
    mods: { speed: 0.25, research: 0.25 },
  },
  {
    id: 'eternal_codex',
    name: 'Ewiger Codex',
    icon: '⚛️',
    desc: 'Das Periodensystem bleibt beim Urknall erhalten.',
    cost: () => 3,
    maxLevel: 1,
  },
];
