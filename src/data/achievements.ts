import type { AchievementDef, ModifierSet } from './types';
import { SKILLS } from './skills';

// Hundreds of achievements, mostly generated from milestone tables plus hand-written meme ones.
// Each grants a small permanent bonus so collecting them is always worth it.

const LEVEL_MILESTONES: { level: number; title: string; bonus: number }[] = [
  { level: 5, title: 'Anfänger', bonus: 0.005 },
  { level: 10, title: 'Lehrling', bonus: 0.01 },
  { level: 25, title: 'Geselle', bonus: 0.01 },
  { level: 50, title: 'Meister', bonus: 0.02 },
  { level: 75, title: 'Großmeister', bonus: 0.02 },
  { level: 92, title: 'Halbzeit (wirklich!)', bonus: 0.03 },
  { level: 99, title: 'Legende', bonus: 0.05 },
];

/** Skills that will exist in later phases are included here once they are added to SKILLS. */
function levelAchievements(): AchievementDef[] {
  return SKILLS.flatMap((skill) =>
    LEVEL_MILESTONES.map((m) => ({
      id: `lvl_${skill.id}_${m.level}`,
      name: `${skill.name}: ${m.title}`,
      desc:
        m.level === 92
          ? `${skill.name} Level 92 – die Hälfte der XP bis 99. Kein Witz.`
          : `Erreiche Level ${m.level} in ${skill.name}.`,
      icon: skill.icon,
      condition: { type: 'level', key: skill.id, gte: m.level },
      reward: { [`xp.${skill.id}`]: m.bonus } as ModifierSet,
    })),
  );
}

interface StatSeries {
  key: string;
  icon: string;
  steps: [number, string][];
  reward: (i: number) => ModifierSet;
  desc: (n: string) => string;
}

const fmt = (n: number) => n.toLocaleString('de-DE');

const STAT_SERIES: StatSeries[] = [
  {
    key: 'treesFelled',
    icon: '🌳',
    desc: (n) => `Fälle ${n} Bäume.`,
    steps: [
      [1, 'Erster Schlag'],
      [100, 'Holzweg'],
      [1000, 'Mehr Holz benötigt'],
      [10000, 'Kahlschlag-Kommission'],
      [100000, 'Der Lorax ist enttäuscht'],
    ],
    reward: (i) => ({ 'speed.woodcutting': 0.01 * (i + 1) }),
  },
  {
    key: 'oresMined',
    icon: '⛏️',
    desc: (n) => `Baue ${n} Erze ab.`,
    steps: [
      [1, 'Glück auf!'],
      [100, 'Steinreich'],
      [1000, 'Zu tief gegraben'],
      [10000, 'Balrog-Alarm'],
      [100000, 'Erdkruste: optional'],
    ],
    reward: (i) => ({ 'speed.mining': 0.01 * (i + 1) }),
  },
  {
    key: 'fishCaught',
    icon: '🎣',
    desc: (n) => `Fange ${n} Fische.`,
    steps: [
      [1, 'Petri Heil'],
      [100, 'Fischers Fritz'],
      [1000, 'Ozean-Entleerer'],
      [10000, 'Nemo wird vermisst'],
      [100000, 'Das Meer hat Angst'],
    ],
    reward: (i) => ({ 'speed.fishing': 0.01 * (i + 1) }),
  },
  {
    key: 'fuelBurned',
    icon: '🔥',
    desc: (n) => `Lege ${n}× Brennstoff nach.`,
    steps: [
      [1, 'Prometheus-Praktikum'],
      [100, 'Pyromane in Ausbildung'],
      [1000, 'Exotherm'],
      [10000, 'Klimaforscher besorgt'],
    ],
    reward: (i) => ({ fireDuration: 0.05 * (i + 1) }),
  },
  {
    key: 'foodCooked',
    icon: '🍳',
    desc: (n) => `Koche ${n} Gerichte erfolgreich.`,
    steps: [
      [1, 'Erste Mahlzeit'],
      [100, 'Hobbykoch'],
      [1000, 'Sterneküche'],
      [10000, 'Gordon ist sprachlos'],
    ],
    reward: (i) => ({ burn: 0.03 * (i + 1) }),
  },
  {
    key: 'foodBurnt',
    icon: '🪨',
    desc: (n) => `Verbrenne ${n} Gerichte.`,
    steps: [
      [1, 'Upps'],
      [50, 'Rauchmelder-Flüsterer'],
      [500, 'Kohlenstoff-Künstler'],
      [5000, 'Verkohlungs-Virtuose'],
    ],
    reward: (i) => ({ 'xp.cooking': 0.01 * (i + 1) }),
  },
  {
    key: 'barsSmelted',
    icon: '🧱',
    desc: (n) => `Schmelze ${n} Barren.`,
    steps: [
      [1, 'Heiß und flüssig'],
      [100, 'Hochofen-Held'],
      [1000, 'Industrielle Revolution'],
      [10000, 'Stahlbaron'],
    ],
    reward: (i) => ({ 'speed.smithing': 0.01 * (i + 1) }),
  },
  {
    key: 'itemsSmithed',
    icon: '🔨',
    desc: (n) => `Schmiede ${n} Gegenstände.`,
    steps: [
      [1, 'Hammerzeit'],
      [100, 'Amboss-Akrobat'],
      [1000, 'Schmied von Welt'],
      [10000, 'Sauron fragt nach Tipps'],
    ],
    reward: (i) => ({ 'xp.smithing': 0.01 * (i + 1) }),
  },
  {
    key: 'clicks',
    icon: '👆',
    desc: (n) => `Tippe ${n}× auf eine Aktion.`,
    steps: [
      [100, 'Fingerübung'],
      [1000, 'Klick-Kultur'],
      [10000, 'Karpaltunnel-Kandidat'],
      [100000, 'Ich bin ein Cookie-Clicker'],
    ],
    reward: () => ({ xp: 0.005 }),
  },
  {
    key: 'goldEarned',
    icon: '🪙',
    desc: (n) => `Verdiene insgesamt ${n} Gold.`,
    steps: [
      [100, 'Taschengeld'],
      [10000, 'Kleinunternehmer'],
      [1000000, 'Millionär'],
      [1000000000, 'Dagobert-Niveau'],
    ],
    reward: (i) => ({ gold: 0.01 * (i + 1) }),
  },
  {
    key: 'itemsSold',
    icon: '💰',
    desc: (n) => `Verkaufe ${n} Items.`,
    steps: [
      [10, 'Flohmarkt'],
      [1000, 'Großhändler'],
      [100000, 'Unsichtbare Hand'],
    ],
    reward: () => ({ gold: 0.01 }),
  },
  {
    key: 'nestsFound',
    icon: '🪺',
    desc: (n) => `Finde ${n} Vogelnester.`,
    steps: [
      [1, 'Kopfnuss'],
      [25, 'Vogelfreund'],
      [250, 'Ornithologe'],
    ],
    reward: () => ({ rare: 0.02 }),
  },
  {
    key: 'itemsLostFullInventory',
    icon: '😭',
    desc: (n) => `Verliere ${n} Items wegen vollem Inventar.`,
    steps: [
      [1, 'Taschen-Tetris verloren'],
      [100, 'Messie'],
      [1000, 'Marie Kondo weint'],
    ],
    reward: () => ({ xp: 0.002 }),
  },
  {
    key: 'doubleOutputs',
    icon: '✌️',
    desc: (n) => `Erhalte ${n}× doppelte Ausbeute.`,
    steps: [
      [1, 'Doppelt hält besser'],
      [100, 'Kopiermaschine'],
      [10000, 'Replikator'],
    ],
    reward: () => ({ double: 0.005 }),
  },
];

function statAchievements(): AchievementDef[] {
  return STAT_SERIES.flatMap((series) =>
    series.steps.map(([n, title], i) => ({
      id: `stat_${series.key}_${n}`,
      name: title,
      desc: series.desc(fmt(n)),
      icon: series.icon,
      condition: { type: 'stat', key: series.key, gte: n },
      reward: series.reward(i),
    })),
  );
}

const TOTAL_LEVELS = [25, 50, 100, 150, 250, 400, 600, 800, 1000, 1200, 1500];
const totalLevelAchievements: AchievementDef[] = TOTAL_LEVELS.map((n) => ({
  id: `total_${n}`,
  name: `Gesamtlevel ${n}`,
  desc: `Erreiche ein Gesamtlevel von ${n}.`,
  icon: '📊',
  condition: { type: 'totalLevel', gte: n },
  reward: { xp: 0.01 },
}));

const GOLD = [1000, 100000, 10000000, 1e12, 1e30, 1e100];
const goldAchievements: AchievementDef[] = GOLD.map((n, i) => ({
  id: `gold_${i}`,
  name:
    [
      'Sparschwein',
      'Tresor',
      'Geldspeicher',
      'Volkswirtschaft',
      'Inflation? Nie gehört',
      'Googol-Gold',
    ][i] ?? `Gold ${i}`,
  desc: `Besitze ${n >= 1e12 ? n.toExponential(0) : fmt(n)} Gold gleichzeitig.`,
  icon: '💰',
  condition: { type: 'gold', gte: n },
  reward: { gold: 0.01 },
}));

const SPECIAL: AchievementDef[] = [
  {
    id: 'newton',
    name: 'Schwerkraft verstanden',
    desc: 'Iss einen Newton-Apfel.',
    icon: '🍏',
    condition: { type: 'stat', key: 'used.newton_apple', gte: 1 },
    reward: { xp: 0.01 },
  },
  {
    id: 'newton10',
    name: 'Principia Mathematica',
    desc: 'Iss 10 Newton-Äpfel.',
    icon: '📜',
    condition: { type: 'stat', key: 'used.newton_apple', gte: 10 },
    reward: { xp: 0.02 },
  },
  {
    id: 'schrodinger',
    name: 'Wellenfunktion kollabiert',
    desc: 'Öffne Schrödingers Fisch.',
    icon: '📦',
    condition: { type: 'stat', key: 'used.schrodinger_fish', gte: 1 },
    reward: { rare: 0.03 },
    secret: true,
  },
  {
    id: 'mitochondrion',
    name: 'Das Kraftwerk der Zelle',
    desc: 'Finde ein versteinertes Mitochondrium.',
    icon: '🦠',
    condition: { type: 'item', key: 'mitochondrion', gte: 1 },
    reward: { xp: 0.03 },
    secret: true,
  },
  {
    id: 'cold_fusion',
    name: 'Nicht reproduzierbar',
    desc: 'Finde ein Kaltfusions-Paper.',
    icon: '📄',
    condition: { type: 'item', key: 'cold_fusion_paper', gte: 1 },
    reward: { research: 0.05 },
    secret: true,
  },
  {
    id: 'boot',
    name: 'Größe 43, links',
    desc: 'Angle einen alten Stiefel.',
    icon: '🥾',
    condition: { type: 'item', key: 'old_boot', gte: 1 },
    reward: { 'xp.fishing': 0.01 },
  },
  {
    id: 'boots100',
    name: 'Schuhgeschäft eröffnet',
    desc: 'Angle 100 alte Stiefel.',
    icon: '👢',
    condition: { type: 'item', key: 'old_boot', gte: 100 },
    reward: { 'xp.fishing': 0.02 },
    secret: true,
  },
  {
    id: 'diamond',
    name: 'Unter Druck geformt',
    desc: 'Finde einen Diamanten.',
    icon: '💠',
    condition: { type: 'item', key: 'gem_diamond', gte: 1 },
    reward: { rare: 0.02 },
  },
  {
    id: 'dark_matter',
    name: '27 % des Universums',
    desc: 'Schürfe Dunkle Materie.',
    icon: '🌑',
    condition: { type: 'item', key: 'dark_matter', gte: 1 },
    reward: { xp: 0.05 },
  },
  {
    id: 'yggdrasil',
    name: 'Weltenbaum-Frevler',
    desc: 'Ernte einen Yggdrasil-Splitter.',
    icon: '🌳',
    condition: { type: 'item', key: 'log_yggdrasil', gte: 1 },
    reward: { 'xp.woodcutting': 0.03 },
  },
  {
    id: 'feast',
    name: 'Doktoranden-Glück',
    desc: 'Koche ein Festmahl der Gelehrten.',
    icon: '🍱',
    condition: { type: 'item', key: 'feast', gte: 1 },
    reward: { 'xp.cooking': 0.03 },
  },
  {
    id: 'rune_axe',
    name: 'Bedienungsanleitung gelesen',
    desc: 'Schmiede eine Runitaxt.',
    icon: '🪓',
    condition: { type: 'item', key: 'rune_axe', gte: 1 },
    reward: { 'speed.woodcutting': 0.03 },
  },
  {
    id: 'achievements10',
    name: 'Sammler',
    desc: 'Schalte 10 Erfolge frei.',
    icon: '🏅',
    condition: { type: 'achievements', gte: 10 },
    reward: { xp: 0.01 },
  },
  {
    id: 'achievements50',
    name: 'Trophäenschrank',
    desc: 'Schalte 50 Erfolge frei.',
    icon: '🏆',
    condition: { type: 'achievements', gte: 50 },
    reward: { xp: 0.02 },
  },
  {
    id: 'achievements100',
    name: 'Achievement-Jäger',
    desc: 'Schalte 100 Erfolge frei.',
    icon: '👑',
    condition: { type: 'achievements', gte: 100 },
    reward: { xp: 0.03 },
  },
  {
    id: 'achievements200',
    name: 'Ich habe ein Problem',
    desc: 'Schalte 200 Erfolge frei.',
    icon: '🫠',
    condition: { type: 'achievements', gte: 200 },
    reward: { xp: 0.05 },
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  ...levelAchievements(),
  ...statAchievements(),
  ...totalLevelAchievements,
  ...goldAchievements,
  ...SPECIAL,
];
