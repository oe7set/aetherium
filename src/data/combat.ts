import type { CombatStyle, ItemDef, LootEntry } from './types';

export interface BossPhase {
  /** Phase starts when monster HP fraction drops to or below this. */
  below: number;
  name: string;
  message: string;
  /** Extra chance to evade the player's hits (the reviewer "rejects" your attacks). */
  evade?: number;
  speedMult?: number;
  maxHitBonus?: number;
}

export interface MonsterDef {
  id: string;
  name: string;
  icon: string;
  /** Displayed combat level. */
  level: number;
  hp: number;
  attack: number;
  defence: number;
  maxHit: number;
  /** Seconds between attacks. */
  speed: number;
  gold: [number, number];
  loot: LootEntry[];
  /** Takes +25 % accuracy from this style. */
  weakness?: CombatStyle;
  boss?: boolean;
  phases?: BossPhase[];
  /** 3D body colour and size. */
  color: string;
  size: number;
  desc: string;
}

export interface AreaDef {
  id: string;
  name: string;
  icon: string;
  /** Recommended combat level (only informational). */
  level: number;
  monsters: string[];
  desc: string;
}

export interface DungeonDef {
  id: string;
  name: string;
  icon: string;
  level: number;
  /** Fought in order; the last one is the boss. */
  monsters: string[];
  reward: LootEntry[];
  desc: string;
}

const bones: LootEntry = { item: 'bones', chance: 1 };
const bigBones: LootEntry = { item: 'big_bones', chance: 1 };

export const MONSTERS: MonsterDef[] = [
  // Hühnerwiese
  {
    id: 'chicken',
    name: 'Huhn',
    icon: '🐔',
    level: 1,
    hp: 3,
    attack: 1,
    defence: 1,
    maxHit: 1,
    speed: 3,
    gold: [0, 1],
    color: '#f4f1e8',
    size: 0.5,
    loot: [
      bones,
      { item: 'feather', chance: 1, min: 3, max: 8 },
      { item: 'raw_chicken', chance: 1 },
      { item: 'egg', chance: 0.2 },
    ],
    desc: 'Hat die Straße überquert. Bereut es jetzt.',
  },
  {
    id: 'cow',
    name: 'Kuh',
    icon: '🐄',
    level: 2,
    hp: 8,
    attack: 1,
    defence: 2,
    maxHit: 1,
    speed: 3.2,
    gold: [0, 2],
    color: '#e8e2d6',
    size: 0.9,
    loot: [bones, { item: 'raw_beef', chance: 1 }, { item: 'cowhide', chance: 1 }],
    desc: 'Muuuh. Sphärisch im Vakuum, laut Physikern.',
  },
  {
    id: 'goblin',
    name: 'Goblin',
    icon: '👺',
    level: 3,
    hp: 6,
    attack: 3,
    defence: 2,
    maxHit: 1,
    speed: 2.6,
    gold: [2, 12],
    color: '#6aa84f',
    size: 0.6,
    loot: [
      bones,
      { item: 'bronze_dagger', chance: 1 / 25 },
      { item: 'coin_pouch', chance: 1 / 15 },
    ],
    desc: 'Klein, grün, hat Ansprüche auf deine Schuhe.',
  },
  // Finsterwald
  {
    id: 'wolf',
    name: 'Wolf',
    icon: '🐺',
    level: 14,
    hp: 20,
    attack: 14,
    defence: 10,
    maxHit: 3,
    speed: 2.4,
    gold: [0, 0],
    color: '#7d7d85',
    size: 0.8,
    weakness: 'ranged',
    loot: [bones, { item: 'fur', chance: 1 }],
    desc: 'Heult den Mond an. Der Mond reagiert nicht.',
  },
  {
    id: 'bandit',
    name: 'Wegelagerer',
    icon: '🥷',
    level: 18,
    hp: 26,
    attack: 17,
    defence: 13,
    maxHit: 4,
    speed: 2.4,
    gold: [10, 45],
    color: '#4a3b6b',
    size: 0.8,
    weakness: 'magic',
    loot: [bones, { item: 'iron_sword', chance: 1 / 40 }, { item: 'coin_pouch', chance: 1 / 6 }],
    desc: 'Geld oder Leben! Du wählst … Kampf.',
  },
  {
    id: 'spider',
    name: 'Riesenspinne',
    icon: '🕷️',
    level: 24,
    hp: 32,
    attack: 22,
    defence: 18,
    maxHit: 5,
    speed: 2.2,
    gold: [0, 0],
    color: '#2b2b2b',
    size: 0.9,
    weakness: 'melee',
    loot: [{ item: 'spider_silk', chance: 1, min: 1, max: 3 }],
    desc: 'Acht Beine, null Hemmungen.',
  },
  // Gnomen-Labor
  {
    id: 'lab_rat',
    name: 'Laborratte',
    icon: '🐀',
    level: 30,
    hp: 36,
    attack: 28,
    defence: 24,
    maxHit: 6,
    speed: 2.0,
    gold: [5, 25],
    color: '#b0a8a0',
    size: 0.6,
    loot: [bones, { item: 'research_notes', chance: 1 / 12 }],
    desc: 'Hat schon 400 Labyrinthe gelöst. Du bist das nächste.',
  },
  {
    id: 'homunculus',
    name: 'Entlaufener Homunkulus',
    icon: '🧌',
    level: 36,
    hp: 46,
    attack: 34,
    defence: 30,
    maxHit: 7,
    speed: 2.4,
    gold: [15, 50],
    color: '#c97b7b',
    size: 0.8,
    weakness: 'ranged',
    loot: [
      bones,
      { item: 'research_notes', chance: 1 / 8 },
      { item: 'mitochondrion', chance: 1 / 800, rare: true },
    ],
    desc: 'Ein Experiment, das gelungen ist. Leider.',
  },
  {
    id: 'golem_proto',
    name: 'Golem-Prototyp v0.1',
    icon: '🗿',
    level: 42,
    hp: 70,
    attack: 38,
    defence: 50,
    maxHit: 8,
    speed: 3.0,
    gold: [20, 60],
    color: '#8a7f72',
    size: 1.3,
    weakness: 'magic',
    loot: [
      { item: 'ore_iron', chance: 1, min: 2, max: 6 },
      { item: 'coal', chance: 0.6, min: 2, max: 5 },
    ],
    desc: 'Beta-Version. Bekannte Bugs: alle.',
  },
  // Bibliothek des Chaos
  {
    id: 'flying_book',
    name: 'Fliegendes Buch',
    icon: '📕',
    level: 50,
    hp: 60,
    attack: 50,
    defence: 40,
    maxHit: 9,
    speed: 2.2,
    gold: [20, 70],
    color: '#a33a3a',
    size: 0.6,
    weakness: 'magic',
    loot: [
      { item: 'research_notes', chance: 1 / 3 },
      { item: 'feather', chance: 0.5, min: 5, max: 15 },
    ],
    desc: 'Kapitel 3 beißt. Wortwörtlich.',
  },
  {
    id: 'plagiarism_phantom',
    name: 'Plagiats-Phantom',
    icon: '👻',
    level: 56,
    hp: 80,
    attack: 60,
    defence: 55,
    maxHit: 11,
    speed: 2.4,
    gold: [30, 90],
    color: '#d6e4ff',
    size: 1,
    weakness: 'melee',
    loot: [
      { item: 'research_notes', chance: 1 / 4 },
      { item: 'ectoplasm', chance: 1 },
    ],
    desc: 'Sieht aus wie ein anderes Gespenst. Verdächtig ähnlich.',
  },
  {
    id: 'zombie_professor',
    name: 'Zombie-Professor',
    icon: '🧟',
    level: 62,
    hp: 110,
    attack: 70,
    defence: 60,
    maxHit: 13,
    speed: 2.6,
    gold: [40, 120],
    color: '#6f8f5f',
    size: 1.1,
    weakness: 'ranged',
    loot: [
      bigBones,
      { item: 'research_notes', chance: 1 / 2 },
      { item: 'cold_fusion_paper', chance: 1 / 150, rare: true },
    ],
    desc: 'Seit 40 Jahren emeritiert. Hält trotzdem Vorlesungen.',
  },
  // Vulkanhöhlen
  {
    id: 'fire_elemental',
    name: 'Feuerelementar',
    icon: '🔥',
    level: 70,
    hp: 120,
    attack: 85,
    defence: 75,
    maxHit: 15,
    speed: 2.2,
    gold: [40, 130],
    color: '#ff7a1a',
    size: 1.1,
    weakness: 'magic',
    loot: [
      { item: 'coal', chance: 1, min: 3, max: 8 },
      { item: 'ash', chance: 1, min: 2, max: 6 },
    ],
    desc: 'Exotherm und stolz darauf.',
  },
  {
    id: 'lava_worm',
    name: 'Lavawurm',
    icon: '🪱',
    level: 76,
    hp: 150,
    attack: 95,
    defence: 90,
    maxHit: 17,
    speed: 2.6,
    gold: [50, 160],
    color: '#c8401e',
    size: 1.2,
    weakness: 'ranged',
    loot: [
      { item: 'ore_adamant', chance: 0.4, min: 1, max: 3 },
      { item: 'gem_ruby', chance: 1 / 30, rare: true },
    ],
    desc: 'Sein Lieblingsessen: Asbest.',
  },
  {
    id: 'dragon',
    name: 'Drache',
    icon: '🐉',
    level: 84,
    hp: 220,
    attack: 110,
    defence: 110,
    maxHit: 22,
    speed: 2.8,
    gold: [100, 400],
    color: '#2f7a3a',
    size: 1.8,
    weakness: 'melee',
    loot: [
      { item: 'dragon_bones', chance: 1 },
      { item: 'dragon_scale', chance: 1 / 3 },
      { item: 'rune_sword', chance: 1 / 64, rare: true },
      { item: 'gem_diamond', chance: 1 / 50, rare: true },
    ],
    desc: 'Hortet Gold. Ein Drache mit Sparkonto.',
  },
  // Quantenrisse
  {
    id: 'particle_wraith',
    name: 'Teilchen-Wraith',
    icon: '⚛️',
    level: 90,
    hp: 250,
    attack: 130,
    defence: 120,
    maxHit: 24,
    speed: 2.2,
    gold: [120, 450],
    color: '#7d5fd6',
    size: 1.2,
    weakness: 'magic',
    loot: [
      { item: 'quark', chance: 1, min: 1, max: 3 },
      { item: 'research_notes', chance: 1 },
    ],
    desc: 'Befindet sich nirgends und überall. Meistens hinter dir.',
  },
  {
    id: 'antimatter_golem',
    name: 'Antimaterie-Golem',
    icon: '🌀',
    level: 96,
    hp: 320,
    attack: 145,
    defence: 150,
    maxHit: 27,
    speed: 3.0,
    gold: [150, 600],
    color: '#1a1a2e',
    size: 1.6,
    weakness: 'ranged',
    loot: [
      { item: 'quark', chance: 1, min: 2, max: 5 },
      { item: 'dark_matter', chance: 1 / 8 },
    ],
    desc: 'Bitte nicht berühren. Wirklich nicht.',
  },
  {
    id: 'black_hole_imp',
    name: 'Schwarzes-Loch-Imp',
    icon: '🕳️',
    level: 102,
    hp: 280,
    attack: 160,
    defence: 130,
    maxHit: 30,
    speed: 2.0,
    gold: [200, 800],
    color: '#000000',
    size: 1,
    weakness: 'melee',
    loot: [
      { item: 'dark_matter', chance: 1 / 3 },
      { item: 'quark', chance: 1, min: 2, max: 6 },
    ],
    desc: 'Klein, aber unglaublich dicht. Wie ein Steuerberater.',
  },
  // Bosse
  {
    id: 'peer_reviewer_2',
    name: 'Der Peer Reviewer #2',
    icon: '🧐',
    level: 72,
    hp: 420,
    attack: 80,
    defence: 80,
    maxHit: 14,
    speed: 2.4,
    gold: [300, 900],
    color: '#8a1c1c',
    size: 1.7,
    boss: true,
    phases: [
      {
        below: 1,
        name: 'Erste Durchsicht',
        message: 'Der Reviewer rückt seine Brille zurecht und seufzt hörbar.',
      },
      {
        below: 0.6,
        name: 'Major Revisions',
        message: '„Major Revisions!“ – der Reviewer lehnt 40 % deiner Angriffe ab.',
        evade: 0.4,
      },
      {
        below: 0.25,
        name: 'Reject!',
        message: '„REJECT!“ – rote Tinte spritzt. Er schlägt schneller und härter zu.',
        speedMult: 0.65,
        maxHitBonus: 5,
      },
    ],
    loot: [
      { item: 'reviewer_comments', chance: 1, min: 1, max: 3 },
      { item: 'red_ink_quill', chance: 1 / 12, rare: true },
      { item: 'peer_review_crown', chance: 1 / 30, rare: true },
    ],
    desc: '„Die Methodik ist fragwürdig, die Ergebnisse trivial, und die Schriftart ist Comic Sans.“',
  },
  {
    id: 'elder_dragon',
    name: 'Ältester Drache Thermodynamos',
    icon: '🐲',
    level: 92,
    hp: 700,
    attack: 120,
    defence: 125,
    maxHit: 26,
    speed: 2.8,
    gold: [800, 2500],
    color: '#b8860b',
    size: 2.4,
    boss: true,
    phases: [
      {
        below: 1,
        name: 'Erwachen',
        message: 'Thermodynamos öffnet ein Auge. Die Temperatur steigt um 300 Kelvin.',
      },
      {
        below: 0.5,
        name: 'Entropie-Atem',
        message: 'Thermodynamos erhöht die Entropie. Alles wird chaotischer – und schneller.',
        speedMult: 0.75,
        maxHitBonus: 6,
      },
    ],
    loot: [
      { item: 'dragon_bones', chance: 1, min: 3, max: 6 },
      { item: 'dragon_scale', chance: 1, min: 2, max: 4 },
      { item: 'dragon_heart', chance: 1 / 25, rare: true },
    ],
    desc: 'Der zweite Hauptsatz in Drachenform.',
  },
  {
    id: 'standard_model',
    name: 'Das Standardmodell',
    icon: '🌌',
    level: 110,
    hp: 1200,
    attack: 170,
    defence: 170,
    maxHit: 34,
    speed: 2.4,
    gold: [3000, 9000],
    color: '#e0c35a',
    size: 2.6,
    boss: true,
    phases: [
      { below: 1, name: 'Symmetrie', message: 'Alles ist im Gleichgewicht. Noch.' },
      {
        below: 0.66,
        name: 'Symmetriebruch',
        message: 'Das Higgs-Feld bricht die Symmetrie. Deine Treffer verlieren Masse.',
        evade: 0.3,
      },
      {
        below: 0.33,
        name: 'Neue Physik',
        message:
          'Unerklärliche Anomalien! Das Modell schlägt mit Kräften zu, die es offiziell nicht gibt.',
        speedMult: 0.6,
        maxHitBonus: 10,
      },
    ],
    loot: [
      { item: 'quark', chance: 1, min: 10, max: 20 },
      { item: 'dark_matter', chance: 1, min: 1, max: 3 },
      { item: 'theory_of_everything', chance: 1 / 40, rare: true },
    ],
    desc: 'Erklärt fast alles. Außer Gravitation. Und warum du hier bist.',
  },
];

export const AREAS: AreaDef[] = [
  {
    id: 'meadow',
    name: 'Hühnerwiese',
    icon: '🌼',
    level: 1,
    monsters: ['chicken', 'cow', 'goblin'],
    desc: 'Idyllisch. Bis die Hühner sich wehren.',
  },
  {
    id: 'darkwood',
    name: 'Finsterwald',
    icon: '🌲',
    level: 15,
    monsters: ['wolf', 'bandit', 'spider'],
    desc: 'Hier ist es dunkel, nass und voller Zähne.',
  },
  {
    id: 'gnome_lab',
    name: 'Gnomen-Labor',
    icon: '🧪',
    level: 30,
    monsters: ['lab_rat', 'homunculus', 'golem_proto'],
    desc: 'Ethikkommission? Nie gehört.',
  },
  {
    id: 'library',
    name: 'Bibliothek des Chaos',
    icon: '📚',
    level: 50,
    monsters: ['flying_book', 'plagiarism_phantom', 'zombie_professor'],
    desc: 'Die Mahngebühren sind tödlich.',
  },
  {
    id: 'volcano',
    name: 'Vulkanhöhlen',
    icon: '🌋',
    level: 70,
    monsters: ['fire_elemental', 'lava_worm', 'dragon'],
    desc: 'Bring Sonnencreme mit. LSF 9000.',
  },
  {
    id: 'quantum_rift',
    name: 'Quantenrisse',
    icon: '🌀',
    level: 90,
    monsters: ['particle_wraith', 'antimatter_golem', 'black_hole_imp'],
    desc: 'Hier gelten die Naturgesetze nur auf Vorschlag.',
  },
];

export const DUNGEONS: DungeonDef[] = [
  {
    id: 'rejection_archive',
    name: 'Archiv der Ablehnung',
    icon: '🗄️',
    level: 55,
    monsters: ['flying_book', 'plagiarism_phantom', 'zombie_professor', 'peer_reviewer_2'],
    reward: [{ item: 'dungeon_chest', chance: 1 }],
    desc: 'Tief unten lauert Reviewer #2. Er hat dein Paper gelesen. Er hat Anmerkungen.',
  },
  {
    id: 'dragon_hoard',
    name: 'Hort des Thermodynamos',
    icon: '🏔️',
    level: 80,
    monsters: ['fire_elemental', 'lava_worm', 'dragon', 'elder_dragon'],
    reward: [{ item: 'dungeon_chest', chance: 1, min: 2, max: 3 }],
    desc: 'Ein Drache, ein Hort, ein Hauptsatz.',
  },
  {
    id: 'event_horizon',
    name: 'Ereignishorizont',
    icon: '🕳️',
    level: 100,
    monsters: ['particle_wraith', 'antimatter_golem', 'black_hole_imp', 'standard_model'],
    reward: [{ item: 'dungeon_chest', chance: 1, min: 4, max: 6 }],
    desc: 'Was hier hineingeht, kommt nicht heraus. Außer Loot. Loot kommt immer heraus.',
  },
];

export const COMBAT_ITEMS: ItemDef[] = [
  {
    id: 'bones',
    name: 'Knochen',
    icon: '🦴',
    category: 'resource',
    sellPrice: 2,
    desc: 'Ein Skelett im Schrank, aber in Einzelteilen.',
  },
  {
    id: 'big_bones',
    name: 'Große Knochen',
    icon: '🦴',
    category: 'resource',
    sellPrice: 10,
    desc: 'Von jemandem mit großen Knochen. Nicht dick, große Knochen!',
  },
  {
    id: 'dragon_bones',
    name: 'Drachenknochen',
    icon: '🦴',
    category: 'resource',
    sellPrice: 120,
    rarity: 'uncommon',
    desc: 'Leicht warm. Immer noch.',
  },
  {
    id: 'cowhide',
    name: 'Kuhhaut',
    icon: '🟫',
    category: 'resource',
    sellPrice: 4,
    desc: 'Wird Leder, wenn es groß ist.',
  },
  {
    id: 'fur',
    name: 'Wolfsfell',
    icon: '🐾',
    category: 'resource',
    sellPrice: 12,
    desc: 'Flauschig. Zu flauschig für einen Wolf.',
  },
  {
    id: 'spider_silk',
    name: 'Spinnenseide',
    icon: '🕸️',
    category: 'resource',
    sellPrice: 15,
    desc: 'Stärker als Stahl, pro Gewicht. Die Spinne prahlt damit.',
  },
  {
    id: 'ectoplasm',
    name: 'Ektoplasma',
    icon: '🫧',
    category: 'resource',
    sellPrice: 25,
    desc: 'Schleimig. Spukig. Erstaunlich gut für Tränke.',
  },
  {
    id: 'dragon_scale',
    name: 'Drachenschuppe',
    icon: '🛡️',
    category: 'resource',
    sellPrice: 180,
    rarity: 'rare',
    desc: 'Feuerfest. Wasserfest. Kritikfest.',
  },
  {
    id: 'quark',
    name: 'Quark',
    icon: '🟡',
    category: 'resource',
    sellPrice: 90,
    rarity: 'uncommon',
    desc: 'Up, down, strange, charm … und dieser hier ist „lecker“. Nicht verwechseln mit dem Milchprodukt.',
  },
  {
    id: 'research_notes',
    name: 'Forschungsnotizen',
    icon: '📝',
    category: 'resource',
    sellPrice: 20,
    desc: 'Unleserlich, aber voller Ideen. Bringt Forschungspunkte (Phase 5).',
  },
  {
    id: 'reviewer_comments',
    name: 'Gutachter-Kommentare',
    icon: '🧾',
    category: 'junk',
    sellPrice: 5,
    desc: '„Der Autor sollte zusätzlich die gesamte Physik neu herleiten.“',
  },
  {
    id: 'red_ink_quill',
    name: 'Feder der roten Tinte',
    icon: '🖋️',
    category: 'gear',
    sellPrice: 2500,
    rarity: 'legendary',
    desc: 'Die Waffe von Reviewer #2. Jeder Treffer ein vernichtendes Gutachten.',
    equip: {
      slot: 'weapon',
      style: 'magic',
      speed: 2.0,
      attack: 60,
      strength: 45,
      req: { skill: 'magic', level: 60 },
      mods: { 'combat.accuracy': 0.1 },
    },
  },
  {
    id: 'peer_review_crown',
    name: 'Krone der Begutachtung',
    icon: '👑',
    category: 'gear',
    sellPrice: 9000,
    rarity: 'peer_reviewed',
    desc: 'Peer-Reviewed. Endlich. Nach nur 14 Revisionen.',
    equip: {
      slot: 'head',
      defence: 45,
      req: { skill: 'defence', level: 60 },
      mods: { xp: 0.05, rare: 0.1 },
    },
  },
  {
    id: 'dragon_heart',
    name: 'Drachenherz',
    icon: '❤️‍🔥',
    category: 'gear',
    sellPrice: 15000,
    rarity: 'legendary',
    desc: 'Schlägt noch. +10 % Schaden, +10 % Lebenspunkte.',
    equip: { slot: 'amulet', mods: { 'combat.damage': 0.1, 'combat.hp': 0.1 } },
  },
  {
    id: 'theory_of_everything',
    name: 'Weltformel',
    icon: '📐',
    category: 'gear',
    sellPrice: 1e6,
    rarity: 'peer_reviewed',
    desc: 'E = alles. Passt auf einen Ring. Erstaunlich.',
    equip: { slot: 'ring', mods: { xp: 0.15, speed: 0.1, 'combat.damage': 0.15 } },
  },
  {
    id: 'dungeon_chest',
    name: 'Dungeon-Truhe',
    icon: '🧰',
    category: 'consumable',
    sellPrice: 100,
    rarity: 'rare',
    desc: 'Öffnen! Der Lohn für Mut und Snacks.',
    consume: {
      type: 'loot',
      rolls: 2,
      table: [
        { item: 'coin_pouch', chance: 0.3, min: 3, max: 10 },
        { item: 'gem_ruby', chance: 0.2 },
        { item: 'gem_diamond', chance: 0.1, rare: true },
        { item: 'research_notes', chance: 0.25, min: 3, max: 8 },
        { item: 'newton_apple', chance: 0.1, rare: true },
        { item: 'mitochondrion', chance: 0.05, rare: true },
      ],
    },
  },
  {
    id: 'rune_basic',
    name: 'Runen',
    icon: '🔣',
    category: 'resource',
    sellPrice: 2,
    desc: 'Ein Zauberspruch zum Mitnehmen. Wird pro Zauber verbraucht.',
  },
];
