import type { ModifierSet } from './types';

// Großprojekte: monumental island works built in stages. Every stage asks for goods from several
// skills (delivered bit by bit) and adds a lasting bonus; the last project, the Ätherium-Turm, needs
// all others finished first.

export interface ProjectStage {
  name: string;
  cost: { item: string; qty: number }[];
  mods: ModifierSet;
  /** Baukunst XP when the stage is finished. */
  xp: number;
}

export interface ProjectDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** Island position of the 3D model (x, z). */
  pos: [number, number];
  /** Projects that must be finished first. */
  requires?: string[];
  stages: ProjectStage[];
}

export const PROJECTS: ProjectDef[] = [
  {
    id: 'lighthouse',
    name: 'Leuchtturm',
    icon: '🗼',
    desc: 'Ein Licht für Fischer, Händler und verirrte Möwen.',
    pos: [9.0, 1.4],
    stages: [
      {
        name: 'Fundament',
        cost: [
          { item: 'stone_block', qty: 60 },
          { item: 'plank_oak', qty: 80 },
        ],
        mods: { 'speed.fishing': 0.04 },
        xp: 1_500,
      },
      {
        name: 'Turm',
        cost: [
          { item: 'bar_iron', qty: 60 },
          { item: 'nails', qty: 150 },
          { item: 'rope', qty: 30 },
        ],
        mods: { 'speed.sailing': 0.05, 'double.fishing': 0.03 },
        xp: 3_500,
      },
      {
        name: 'Laterne',
        cost: [
          { item: 'bar_gold', qty: 15 },
          { item: 'beeswax', qty: 40 },
          { item: 'moonstone', qty: 3 },
        ],
        mods: { gold: 0.04, 'village.prod': 0.04 },
        xp: 6_000,
      },
    ],
  },
  {
    id: 'aether_bridge',
    name: 'Ätherbrücke',
    icon: '🌉',
    desc: 'Eine Brücke über den Fluss – und ein Stück weit in den Riss.',
    pos: [0.9, 2.6],
    stages: [
      {
        name: 'Pfeiler',
        cost: [
          { item: 'plank_maple', qty: 100 },
          { item: 'stone_block', qty: 80 },
        ],
        mods: { 'hero.travel': 0.08 },
        xp: 2_500,
      },
      {
        name: 'Runenbogen',
        cost: [
          { item: 'bar_mithril', qty: 40 },
          { item: 'rune_basic', qty: 400 },
          { item: 'spirit_shard', qty: 200 },
        ],
        mods: { 'rift.hp': 0.05, 'rift.might': 0.03 },
        xp: 5_000,
      },
      {
        name: 'Ätherfeld',
        cost: [
          { item: 'mana_crystal', qty: 20 },
          { item: 'aether', qty: 40 },
          { item: 'part_magic', qty: 20 },
        ],
        mods: { 'rift.might': 0.05, 'rift.luck': 0.05 },
        xp: 9_000,
      },
    ],
  },
  {
    id: 'sky_observatory',
    name: 'Himmelsobservatorium',
    icon: '🔭',
    desc: 'Die größte Linse der bekannten Inseln. Der Mond fühlt sich beobachtet.',
    pos: [3.6, -3.5],
    stages: [
      {
        name: 'Kuppel',
        cost: [
          { item: 'stone_block', qty: 150 },
          { item: 'bar_steel', qty: 60 },
        ],
        mods: { research: 0.06 },
        xp: 3_000,
      },
      {
        name: 'Sternenlinse',
        cost: [
          { item: 'stardust', qty: 250 },
          { item: 'gem_diamond', qty: 3 },
          { item: 'part_precise', qty: 30 },
        ],
        mods: { 'xp.astronomy': 0.1, 'double.astronomy': 0.05 },
        xp: 6_500,
      },
      {
        name: 'Himmelsuhr',
        cost: [
          { item: 'bar_starmetal', qty: 5 },
          { item: 'meteorite', qty: 6 },
        ],
        mods: { xp: 0.03, research: 0.06 },
        xp: 11_000,
      },
    ],
  },
  {
    id: 'grand_bazaar',
    name: 'Großer Basar',
    icon: '🏛️',
    desc: 'Händler aus allen Himmelsrichtungen. Und ein Mann, der nur Löffel verkauft.',
    pos: [-9.3, -2.2],
    stages: [
      {
        name: 'Marktplatz',
        cost: [
          { item: 'plank_yew', qty: 80 },
          { item: 'furn_table', qty: 6 },
        ],
        mods: { gold: 0.03 },
        xp: 3_000,
      },
      {
        name: 'Handelsstände',
        cost: [
          { item: 'spice', qty: 50 },
          { item: 'pearl', qty: 15 },
          { item: 'wool', qty: 120 },
        ],
        mods: { gold: 0.04, 'village.prod': 0.05 },
        xp: 6_000,
      },
      {
        name: 'Schatzkammer',
        cost: [
          { item: 'bar_gold', qty: 40 },
          { item: 'furn_shelf', qty: 6 },
          { item: 'cheese', qty: 60 },
        ],
        mods: { gold: 0.05, 'combat.loot': 0.05 },
        xp: 10_000,
      },
    ],
  },
  {
    id: 'aetherium_tower',
    name: 'Ätherium-Turm',
    icon: '🗽',
    desc: 'Das Weltwunder der Insel. Wer ihn vollendet, wird in allen Chroniken stehen.',
    pos: [-0.8, -3.3],
    requires: ['lighthouse', 'aether_bridge', 'sky_observatory', 'grand_bazaar'],
    stages: [
      {
        name: 'Grundstein der Zeitalter',
        cost: [
          { item: 'bar_rune', qty: 120 },
          { item: 'plank_magic', qty: 150 },
        ],
        mods: { xp: 0.03, speed: 0.02 },
        xp: 15_000,
      },
      {
        name: 'Drachenhalle',
        cost: [
          { item: 'dragon_scale', qty: 15 },
          { item: 'kraken_tooth', qty: 2 },
          { item: 'goat_cheese', qty: 50 },
        ],
        mods: { 'combat.damage': 0.05, 'combat.hp': 0.05 },
        xp: 25_000,
      },
      {
        name: 'Sternenkrone',
        cost: [
          { item: 'bar_starmetal', qty: 20 },
          { item: 'part_ancient', qty: 15 },
          { item: 'aether_wool', qty: 30 },
        ],
        mods: { xp: 0.04, speed: 0.03, gold: 0.05 },
        xp: 40_000,
      },
      {
        name: 'Ätherherz',
        cost: [
          { item: 'gem_aether', qty: 1 },
          { item: 'aether', qty: 300 },
          { item: 'void_shard', qty: 30 },
        ],
        mods: { 'rift.might': 0.1, 'village.prod': 0.1, xp: 0.05 },
        xp: 60_000,
      },
    ],
  },
];

export const PROJECT_MAP = new Map(PROJECTS.map((p) => [p.id, p]));
