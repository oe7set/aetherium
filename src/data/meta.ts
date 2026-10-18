import type { ItemStack, ModifierSet } from './types';

// Phase 7: pets, quests and daily/weekly tasks.

// --- Pets ------------------------------------------------------------------------------------------

export interface PetDef {
  id: string;
  name: string;
  icon: string;
  /** Drop source: a skill (per completed action) or a monster id (per kill). */
  source: { skill?: string; monster?: string };
  /** Chance per action/kill. */
  chance: number;
  mods: ModifierSet;
  desc: string;
}

export const PETS: PetDef[] = [
  {
    id: 'pet_beaver',
    name: 'Biber Bernd',
    icon: '🦫',
    source: { skill: 'woodcutting' },
    chance: 1 / 5000,
    mods: { 'speed.woodcutting': 0.05 },
    desc: 'Fällt Bäume aus Solidarität mit. +5 % Holzfällen.',
  },
  {
    id: 'pet_mole',
    name: 'Maulwurf Moritz',
    icon: '🐹',
    source: { skill: 'mining' },
    chance: 1 / 5000,
    mods: { 'speed.mining': 0.05 },
    desc: 'Gräbt mit. Sieht nichts. Findet trotzdem alles. +5 % Bergbau.',
  },
  {
    id: 'pet_penguin',
    name: 'Pinguin Pascal',
    icon: '🐧',
    source: { skill: 'fishing' },
    chance: 1 / 5000,
    mods: { 'speed.fishing': 0.05 },
    desc: 'Fachmann für Fisch. +5 % Angeln.',
  },
  {
    id: 'pet_salamander',
    name: 'Feuersalamander Sal',
    icon: '🦎',
    source: { skill: 'firemaking' },
    chance: 1 / 4000,
    mods: { fireDuration: 0.2 },
    desc: 'Liebt Wärme. +20 % Brenndauer.',
  },
  {
    id: 'pet_rat',
    name: 'Chefkoch-Ratte',
    icon: '🐀',
    source: { skill: 'cooking' },
    chance: 1 / 4000,
    mods: { burn: 0.15, 'xp.cooking': 0.05 },
    desc: 'Hat ein Restaurant in Paris. −15 % Anbrennen.',
  },
  {
    id: 'pet_golemling',
    name: 'Mini-Golem',
    icon: '🗿',
    source: { skill: 'smithing' },
    chance: 1 / 5000,
    mods: { 'speed.smithing': 0.05 },
    desc: 'Hält den Amboss fest. +5 % Schmieden.',
  },
  {
    id: 'pet_squirrel',
    name: 'Eichhörnchen Emil',
    icon: '🐿️',
    source: { skill: 'crafting' },
    chance: 1 / 4000,
    mods: { 'double.crafting': 0.05 },
    desc: 'Hortet Pfeilschäfte. 5 % doppelte Ausbeute im Handwerk.',
  },
  {
    id: 'pet_pea',
    name: 'Mendels Erbse',
    icon: '🫛',
    source: { skill: 'farming' },
    chance: 1 / 600,
    mods: { 'speed.farming': 0.1 },
    desc: 'Grün, rund, dominant vererbt. +10 % Wachstum.',
  },
  {
    id: 'pet_cat',
    name: 'Schrödingers Katze',
    icon: '📦',
    source: { skill: 'alchemy' },
    chance: 1 / 3000,
    mods: { rare: 0.05 },
    desc: 'Status: unbekannt. Öffne ihre Kiste im Haustier-Menü, um es herauszufinden.',
  },
  {
    id: 'pet_owl',
    name: 'Eule Minerva',
    icon: '🦉',
    source: { skill: 'enchanting' },
    chance: 1 / 4000,
    mods: { research: 0.05 },
    desc: 'Weise. Sehr weise. +5 % Forschung.',
  },
  {
    id: 'pet_fawn',
    name: 'Rehkitz Rudi',
    icon: '🦌',
    source: { skill: 'hunting' },
    chance: 1 / 4000,
    mods: { 'speed.hunting': 0.05 },
    desc: 'Hat beschlossen, dich zu adoptieren. +5 % Jagen.',
  },
  {
    id: 'pet_wisp',
    name: 'Irrlicht',
    icon: '✨',
    source: { skill: 'arcane' },
    chance: 1 / 4000,
    mods: { 'xp.arcane': 0.05, 'xp.enchanting': 0.05 },
    desc: 'Leuchtet den Weg. Meistens falsch.',
  },
  {
    id: 'pet_parrot',
    name: 'Peer-Review-Papagei',
    icon: '🦜',
    source: { monster: 'peer_reviewer_2' },
    chance: 1 / 200,
    mods: { 'combat.accuracy': 0.05 },
    desc: 'Sagt nur „Reject!“. Ermutigend ist anders. +5 % Treffsicherheit.',
  },
  {
    id: 'pet_dragon',
    name: 'Babydrache Thermi',
    icon: '🐲',
    source: { monster: 'elder_dragon' },
    chance: 1 / 300,
    mods: { 'combat.damage': 0.05, fireDuration: 0.25 },
    desc: 'Niest gelegentlich Feuer. +5 % Schaden.',
  },
  {
    id: 'pet_quark',
    name: 'Quark-Wolke',
    icon: '☁️',
    source: { monster: 'standard_model' },
    chance: 1 / 300,
    mods: { xp: 0.05 },
    desc: 'Ein Gluon-Haustier. Klebt an dir. +5 % XP.',
  },
];

/** Schrödinger's cat collapses into one of these when first observed. */
export const CAT_STATES = {
  alive: {
    name: 'Lebendige Katze',
    icon: '🐈',
    mods: { rare: 0.1, xp: 0.03 } as ModifierSet,
    desc: 'Lebt! Schnurrt. +10 % Seltenheit, +3 % XP.',
  },
  ghost: {
    name: 'Geisterkatze',
    icon: '👻',
    mods: { 'combat.defence': 0.08, research: 0.08 } as ModifierSet,
    desc: 'Ein bisschen tot, ein bisschen lebendig, sehr flauschig. +8 % Verteidigung, +8 % Forschung.',
  },
};

// --- Quests -------------------------------------------------------------------------------------------

export type QuestObjective =
  | { type: 'stat'; key: string; amount: number; label: string }
  | { type: 'deliver'; item: string; qty: number; label: string }
  | { type: 'level'; skill: string; level: number; label: string };

export interface QuestDef {
  id: string;
  name: string;
  icon: string;
  giver: string;
  story: string;
  objectives: QuestObjective[];
  rewards: {
    gold?: number;
    research?: number;
    items?: ItemStack[];
    xp?: { skill: string; amount: number }[];
  };
  requires?: string[];
  outro: string;
}

export const QUESTS: QuestDef[] = [
  {
    id: 'q_first_steps',
    name: 'Mehr Holz benötigt',
    icon: '🪵',
    giver: 'Bauer Gerold',
    story:
      '„Der Winter naht, und mein Rücken ist so steif wie ein Eichenbalken. Bringst du mir 25 Eichenholz?“',
    objectives: [{ type: 'deliver', item: 'log_oak', qty: 25, label: 'Bringe 25 Eichenholz' }],
    rewards: {
      gold: 80,
      items: [{ item: 'apple', qty: 5 }],
      xp: [{ skill: 'woodcutting', amount: 150 }],
    },
    outro:
      '„Wunderbar! Jetzt muss ich nur noch herausfinden, wie man Feuer macht. War das nicht irgendwas mit Reiben?“',
  },
  {
    id: 'q_fire',
    name: 'Prometheus’ Praktikant',
    icon: '🔥',
    giver: 'Bauer Gerold',
    requires: ['q_first_steps'],
    story: '„Zeig mir, wie man Feuer macht! Leg zehnmal Holz nach, und koch mir was Warmes.“',
    objectives: [
      { type: 'stat', key: 'fuelBurned', amount: 10, label: 'Lege 10× Brennstoff nach' },
      { type: 'stat', key: 'foodCooked', amount: 5, label: 'Koche 5 Gerichte' },
    ],
    rewards: { gold: 150, research: 20, xp: [{ skill: 'firemaking', amount: 300 }] },
    outro: '„Mmh, Bratapfel! Die Zivilisation ist gerettet. Zumindest meine.“',
  },
  {
    id: 'q_miner',
    name: 'Glück auf!',
    icon: '⛏️',
    giver: 'Zwergin Brunhild',
    story:
      '„Ein Mensch mit Spitzhacke? Beweis mir, dass du kein Tourist bist: 30 Kupfer- und 30 Zinnerze!“',
    objectives: [
      { type: 'deliver', item: 'ore_copper', qty: 30, label: 'Bringe 30 Kupfererz' },
      { type: 'deliver', item: 'ore_tin', qty: 30, label: 'Bringe 30 Zinnerz' },
    ],
    rewards: {
      gold: 300,
      items: [{ item: 'bronze_pick', qty: 1 }],
      xp: [{ skill: 'mining', amount: 500 }],
    },
    outro:
      '„Nicht schlecht für einen Langbeinigen. Hier, eine Spitzhacke. Benutze sie, bevor ich es mir anders überlege.“',
  },
  {
    id: 'q_smith',
    name: 'Bronzezeit',
    icon: '🔨',
    giver: 'Zwergin Brunhild',
    requires: ['q_miner'],
    story:
      '„Erz ist gut, Barren sind besser. Schmelze 20 Bronzebarren und schmiede mir ein Schwert.“',
    objectives: [
      { type: 'stat', key: 'barsSmelted', amount: 20, label: 'Schmelze 20 Barren' },
      { type: 'deliver', item: 'bronze_sword', qty: 1, label: 'Bringe ein Bronzeschwert' },
    ],
    rewards: { gold: 600, research: 40, xp: [{ skill: 'smithing', amount: 800 }] },
    outro: '„Ein ordentliches Schwert. Etwas schief. Wie mein Großvater.“',
  },
  {
    id: 'q_chickens',
    name: 'Die Hühner-Rebellion',
    icon: '🐔',
    giver: 'Bäuerin Hilde',
    story:
      '„Die Hühner haben sich organisiert! Sie haben einen Anführer. Und Forderungen. Bitte … regle das.“',
    objectives: [{ type: 'stat', key: 'kills.chicken', amount: 20, label: 'Besiege 20 Hühner' }],
    rewards: {
      gold: 200,
      items: [{ item: 'cooked_shrimp', qty: 10 }],
      xp: [{ skill: 'melee', amount: 400 }],
    },
    outro: '„Ruhe im Stall! Die Eier sind jetzt allerdings … verschlüsselt.“',
  },
  {
    id: 'q_fisher',
    name: 'Petri Heil',
    icon: '🎣',
    giver: 'Fischer Fiete',
    story:
      '„Die Fische beißen nicht, sagen sie. Die Fische lügen. Fang mir 50 Fische, dann reden wir.“',
    objectives: [{ type: 'stat', key: 'fishCaught', amount: 50, label: 'Fange 50 Fische' }],
    rewards: {
      gold: 400,
      items: [{ item: 'bait', qty: 100 }],
      xp: [{ skill: 'fishing', amount: 700 }],
    },
    outro:
      '„Siehste! Und jetzt erzähl mir nix von Schrödinger. Der Fisch ist da oder nicht. Basta.“',
  },
  {
    id: 'q_research',
    name: 'Die wissenschaftliche Methode',
    icon: '🔬',
    giver: 'Professorin Dr. Kuhn',
    requires: ['q_fire'],
    story:
      '„Ah, ein neugieriger Geist! Erforsche drei Technologien. Und bitte: Hypothese zuerst, Explosion danach.“',
    objectives: [
      { type: 'stat', key: 'techsResearched', amount: 3, label: 'Erforsche 3 Technologien' },
    ],
    rewards: { research: 150, items: [{ item: 'research_notes', qty: 5 }] },
    outro: '„Hervorragend! Ihr Paper wurde an Reviewer #2 geschickt. Viel Glück.“',
  },
  {
    id: 'q_elements',
    name: 'Mendelejews Albtraum',
    icon: '⚛️',
    giver: 'Professorin Dr. Kuhn',
    requires: ['q_research'],
    story: '„Das Periodensystem hat Lücken! Lücken, sage ich! Entdecke 10 Elemente.“',
    objectives: [{ type: 'stat', key: 'codexSize', amount: 10, label: 'Entdecke 10 Elemente' }],
    rewards: { research: 500, gold: 2000 },
    outro: '„Zehn! Jetzt fehlen nur noch 108. Kein Druck.“',
  },
  {
    id: 'q_reviewer',
    name: 'Major Revisions',
    icon: '🧐',
    giver: 'Professorin Dr. Kuhn',
    requires: ['q_research'],
    story:
      '„Reviewer #2 hat mein Lebenswerk abgelehnt. Wegen der Schriftart. Bitte. Geh ins Archiv der Ablehnung und … diskutiere mit ihm.“',
    objectives: [
      {
        type: 'stat',
        key: 'kills.peer_reviewer_2',
        amount: 1,
        label: 'Besiege den Peer Reviewer #2',
      },
    ],
    rewards: { gold: 25000, research: 2000, items: [{ item: 'dungeon_chest', qty: 3 }] },
    outro: '„ACCEPTED! Mit minor revisions! Ich … ich muss mich setzen.“',
  },
  {
    id: 'q_farmer',
    name: 'Mendel wäre stolz',
    icon: '🌱',
    giver: 'Bäuerin Hilde',
    requires: ['q_chickens'],
    story:
      '„Ich habe gehört, deine Pflanzen mutieren? Fantastisch! Ernte zehnmal und zeig mir eine Mutation.“',
    objectives: [
      { type: 'stat', key: 'harvests', amount: 10, label: 'Ernte 10-mal' },
      { type: 'stat', key: 'mutations', amount: 1, label: 'Erziele eine Mutation' },
    ],
    rewards: {
      gold: 3000,
      items: [{ item: 'seed_mandrake', qty: 3 }],
      xp: [{ skill: 'farming', amount: 3000 }],
    },
    outro: '„Eine Alraune! Sie schreit! Wunderschön.“',
  },
  {
    id: 'q_dragon',
    name: 'Der zweite Hauptsatz',
    icon: '🐲',
    giver: 'Zwergin Brunhild',
    requires: ['q_smith'],
    story:
      '„In den Vulkanhöhlen haust Thermodynamos. Er erhöht die Entropie meiner Schmiede. Mach dem ein Ende.“',
    objectives: [
      { type: 'stat', key: 'kills.elder_dragon', amount: 1, label: 'Besiege Thermodynamos' },
    ],
    rewards: { gold: 250000, items: [{ item: 'dragon_scale', qty: 10 }] },
    outro:
      '„Die Schmiede ist wieder ordentlich. Nur meine Werkstatt nicht. Aber das war schon vorher so.“',
  },
  {
    id: 'q_rebirth',
    name: 'Kreislauf des Lebens',
    icon: '🌅',
    giver: 'Die Ahnen',
    story: '„Wer alles erreicht hat, darf neu beginnen – mit Weisheit im Gepäck.“',
    objectives: [{ type: 'stat', key: 'rebirths', amount: 1, label: 'Werde wiedergeboren' }],
    rewards: { research: 5000, items: [{ item: 'newton_apple', qty: 3 }] },
    outro: '„Willkommen zurück. Du siehst jünger aus. Und klüger.“',
  },
  {
    id: 'q_standard',
    name: 'Jenseits des Standardmodells',
    icon: '🌌',
    giver: 'Professorin Dr. Kuhn',
    requires: ['q_reviewer'],
    story:
      '„Am Ereignishorizont wartet das Standardmodell. Es erklärt fast alles. Zeig ihm, was es nicht erklärt: dich.“',
    objectives: [
      { type: 'stat', key: 'kills.standard_model', amount: 1, label: 'Besiege das Standardmodell' },
    ],
    rewards: { gold: 5e6, research: 1e6 },
    outro:
      '„Neue Physik! Endlich! Ich schreibe sofort einen Antrag. Er wird abgelehnt werden. Aber trotzdem!“',
  },
];

// --- Daily / weekly tasks ----------------------------------------------------------------------------

export interface TaskTemplate {
  id: string;
  label: string;
  stat: string;
  /** Base target; scaled by the player's total level. */
  base: number;
  icon: string;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  { id: 'trees', label: 'Fälle {n} Bäume', stat: 'treesFelled', base: 120, icon: '🌳' },
  { id: 'ores', label: 'Baue {n} Erze ab', stat: 'oresMined', base: 100, icon: '⛏️' },
  { id: 'fish', label: 'Fange {n} Fische', stat: 'fishCaught', base: 90, icon: '🎣' },
  { id: 'cook', label: 'Koche {n} Gerichte', stat: 'foodCooked', base: 80, icon: '🍳' },
  { id: 'fuel', label: 'Lege {n}× Brennstoff nach', stat: 'fuelBurned', base: 60, icon: '🔥' },
  { id: 'bars', label: 'Schmelze {n} Barren', stat: 'barsSmelted', base: 60, icon: '🧱' },
  { id: 'smith', label: 'Schmiede {n} Gegenstände', stat: 'itemsSmithed', base: 40, icon: '🔨' },
  { id: 'kills', label: 'Besiege {n} Monster', stat: 'monstersKilled', base: 60, icon: '⚔️' },
  { id: 'gold', label: 'Verdiene {n} Gold', stat: 'goldEarned', base: 3000, icon: '🪙' },
  { id: 'clicks', label: 'Tippe {n}× auf Aktionen', stat: 'clicks', base: 300, icon: '👆' },
  { id: 'harvest', label: 'Ernte {n}-mal', stat: 'harvests', base: 8, icon: '🌾' },
];
