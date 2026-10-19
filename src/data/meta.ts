import type { RewardDef } from './progress';
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
  | { type: 'level'; skill: string; level: number; label: string }
  /** Best level of a village building across all villages. */
  | { type: 'building'; id: string; level: number; label: string }
  | { type: 'heroLevel'; level: number; label: string };

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
    /** Rewards from the other systems (essence, village resources, hero XP/items, avatar). */
    extra?: RewardDef;
  };
  requires?: string[];
  /** Quest line the quest belongs to (shown as a badge). */
  chain?: string;
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
  // --- Questreihe „Das Band der Welten": verbindet Insel, Dorf, Held und Riss ------------------------
  {
    id: 'qx_two_worlds',
    chain: 'Das Band der Welten',
    name: 'Zwei Welten',
    icon: '🌉',
    giver: 'Archivarin Æla',
    story:
      '„Insel und Dorf – zwei Hälften desselben Reichs. Zeig mir, dass du beide pflegen kannst: Fälle Holz und baue Felder aus.“',
    objectives: [
      { type: 'level', skill: 'woodcutting', level: 10, label: 'Holzfällen Level 10' },
      { type: 'stat', key: 'villageFieldLevels', amount: 8, label: 'Baue 8 Feldstufen im Dorf' },
    ],
    rewards: { gold: 250, extra: { resources: 400 } },
    outro: '„Holz für die Insel, Getreide fürs Dorf. Ein Anfang. Ein guter.“',
  },
  {
    id: 'qx_hero_wakes',
    chain: 'Das Band der Welten',
    requires: ['qx_two_worlds'],
    name: 'Der Held erwacht',
    icon: '🦸',
    giver: 'Archivarin Æla',
    story:
      '„Jedes Reich braucht jemanden, der mutig genug ist, vor die Tür zu gehen. Schick deinen Helden auf Abenteuer.“',
    objectives: [
      { type: 'heroLevel', level: 3, label: 'Held Stufe 3' },
      { type: 'stat', key: 'heroAdventures', amount: 2, label: 'Bestehe 2 Abenteuer' },
    ],
    rewards: { gold: 300, extra: { heroItem: 1, essence: 30 } },
    outro: '„Er kam zurück. Mit Beute. Und Schlamm an den Stiefeln. Perfekt.“',
  },
  {
    id: 'qx_first_rift',
    chain: 'Das Band der Welten',
    requires: ['qx_hero_wakes'],
    name: 'Ein Blick in den Riss',
    icon: '🌀',
    giver: 'Archivarin Æla',
    story:
      '„Der Ätherriss flackert. Was dort drin kämpft, kämpft auch für die Insel – jede Essenz macht dein Reich stärker.“',
    objectives: [
      { type: 'stat', key: 'riftRuns', amount: 2, label: 'Wage 2 Riss-Läufe' },
      { type: 'stat', key: 'riftKills', amount: 300, label: 'Besiege 300 Riss-Gegner' },
    ],
    rewards: { research: 120, extra: { essence: 80, heroXp: 150 } },
    outro: '„Du hast hineingeschaut – und der Riss hat zurückgeschaut. Er wirkte beeindruckt.“',
  },
  {
    id: 'qx_harbor',
    chain: 'Das Band der Welten',
    requires: ['qx_first_rift'],
    name: 'Ein Hafen für die Insel',
    icon: '⚓',
    giver: 'Archivarin Æla',
    story:
      '„Baue den Inselhafen und schicke Holz von der Insel ins Dorf. Dann fließt der Wohlstand in beide Richtungen.“',
    objectives: [
      { type: 'building', id: 'harbor', level: 1, label: 'Inselhafen Stufe 1' },
      {
        type: 'stat',
        key: 'villageImports',
        amount: 1,
        label: 'Importiere einmal Waren über den Hafen',
      },
    ],
    rewards: { gold: 800, extra: { resources: 1200 } },
    outro:
      '„Die erste Fähre legt ab. Ein Fischer winkt. Eine Möwe stiehlt sein Brot. Alles wie immer.“',
  },
  {
    id: 'qx_forged',
    chain: 'Das Band der Welten',
    requires: ['qx_harbor'],
    name: 'Geschmiedet für alles',
    icon: '⚒️',
    giver: 'Archivarin Æla',
    story:
      '„Die Schmiede im Dorf stärkt die Truppen, die Schmiede auf der Insel die Ausrüstung – und beide den Helden im Riss.“',
    objectives: [
      { type: 'building', id: 'smithy', level: 3, label: 'Dorfschmiede Stufe 3' },
      { type: 'level', skill: 'smithing', level: 25, label: 'Schmieden Level 25' },
      { type: 'heroLevel', level: 8, label: 'Held Stufe 8' },
    ],
    rewards: { gold: 1500, extra: { heroItem: 2, essence: 120 } },
    outro: '„Hammer, Amboss, Held. In dieser Reihenfolge. Meistens.“',
  },
  {
    id: 'qx_collector',
    chain: 'Das Band der Welten',
    requires: ['qx_forged'],
    name: 'Das Gedächtnis des Reichs',
    icon: '📗',
    giver: 'Archivarin Æla',
    story:
      '„Alles, was du findest – auf der Insel, im Riss, bei Abenteuern – gehört ins Sammelbuch. Fülle es!“',
    objectives: [
      { type: 'stat', key: 'albumItems', amount: 30, label: 'Finde 30 neue Gegenstände' },
      { type: 'stat', key: 'collectionsDone', amount: 1, label: 'Schließe ein Sammelbuch-Set ab' },
    ],
    rewards: { research: 400, extra: { essence: 150, heroXp: 400 } },
    outro: '„Ein Museum! Mit Eintritt! Gut, der Eintritt ist kostenlos. Aber trotzdem!“',
  },
  {
    id: 'qx_bulwark',
    chain: 'Das Band der Welten',
    requires: ['qx_collector'],
    name: 'Bollwerk gegen den Riss',
    icon: '🛡️',
    giver: 'Archivarin Æla',
    story: '„Der Riss greift das Dorf an. Mauer, Truppen und Held müssen zusammenstehen.“',
    objectives: [
      { type: 'building', id: 'wall', level: 5, label: 'Mauer Stufe 5' },
      {
        type: 'stat',
        key: 'villageInvasionsRepelled',
        amount: 1,
        label: 'Wehre eine Riss-Invasion ab',
      },
    ],
    rewards: { gold: 3000, extra: { resources: 2500, heroItem: 2 } },
    outro: '„Die Riss-Kreaturen ziehen ab. Eine hat ihre Mütze vergessen. Die behalten wir.“',
  },
  {
    id: 'qx_weekly_legend',
    chain: 'Das Band der Welten',
    requires: ['qx_bulwark'],
    name: 'Legende der Woche',
    icon: '🌌',
    giver: 'Archivarin Æla',
    story:
      '„Nur wer Insel, Dorf, Held und Riss vereint, bezwingt den Wochenboss. Bist du so weit?“',
    objectives: [
      { type: 'stat', key: 'weeklyWins', amount: 1, label: 'Besiege einen Wochenboss' },
      { type: 'stat', key: 'riftBossKills', amount: 3, label: 'Besiege 3 Riss-Bosse' },
    ],
    rewards: { gold: 5000, research: 1000, extra: { heroItem: 3, essence: 300, avatar: '🌌' } },
    outro:
      '„Das Band der Welten ist geknüpft. Ich schreibe deinen Namen in die Chronik. In Großbuchstaben.“',
  },
  // --- Questreihe „Wissen ist Macht": Forschung, Alchemie und Verzauberung ↔ Riss ---------------
  {
    id: 'qk_lab',
    chain: 'Wissen ist Macht',
    name: 'Die Laborordnung',
    icon: '🔬',
    giver: 'Professorin Quantina',
    story: '„Ein Labor ohne Ergebnisse ist nur eine Küche mit Brille. Erforsche etwas!“',
    objectives: [
      { type: 'stat', key: 'techsResearched', amount: 3, label: 'Erforsche 3 Technologien' },
    ],
    rewards: { research: 200, extra: { essence: 40 } },
    outro: '„Drei Durchbrüche! Ich habe sie alle auf Servietten notiert.“',
  },
  {
    id: 'qk_rift_theory',
    chain: 'Wissen ist Macht',
    requires: ['qk_lab'],
    name: 'Rissologie, Grundkurs',
    icon: '🌀',
    giver: 'Professorin Quantina',
    story: '„Der Riss gehorcht Regeln. Lerne sie: Talente sind Gleichungen mit Wumms.“',
    objectives: [
      { type: 'stat', key: 'riftRuns', amount: 3, label: 'Wage 3 Riss-Läufe' },
      { type: 'stat', key: 'riftTalents', amount: 3, label: 'Kaufe 3 Riss-Talente' },
    ],
    rewards: { research: 300, extra: { essence: 150 } },
    outro: '„Sehr gut. Ihre Hausaufgaben haben mich nur zweimal angegriffen.“',
  },
  {
    id: 'qk_potions',
    chain: 'Wissen ist Macht',
    requires: ['qk_rift_theory'],
    name: 'Flüssiger Mut',
    icon: '🧪',
    giver: 'Professorin Quantina',
    story: '„Ein Held ohne Tränke ist ein Held mit Kopfschmerzen. Braue welche!“',
    objectives: [
      { type: 'level', skill: 'alchemy', level: 20, label: 'Alchemie Level 20' },
      { type: 'deliver', item: 'potion_haste', qty: 5, label: 'Bringe 5 Eiltränke' },
    ],
    rewards: { gold: 1500, extra: { heroXp: 500, heroItem: 1 } },
    outro: '„Geschmack: Erdbeere mit Raumzeit. Wirkung: hervorragend.“',
  },
  {
    id: 'qk_bosses',
    chain: 'Wissen ist Macht',
    requires: ['qk_potions'],
    name: 'Feldforschung am Ungeheuer',
    icon: '👹',
    giver: 'Professorin Quantina',
    story:
      '„Theorie ist schön. Messdaten sind schöner. Besiege Riss-Bosse – im Namen der Wissenschaft!“',
    objectives: [
      {
        type: 'stat',
        key: 'techsResearched',
        amount: 5,
        label: 'Erforsche 5 weitere Technologien',
      },
      { type: 'stat', key: 'riftBossKills', amount: 5, label: 'Besiege 5 Riss-Bosse' },
    ],
    rewards: { research: 1000, extra: { essence: 250, heroItem: 2 } },
    outro: '„Die Daten sind eindeutig: Bosse mögen keine Äxte.“',
  },
  {
    id: 'qk_examiner',
    chain: 'Wissen ist Macht',
    requires: ['qk_bosses'],
    name: 'Die Abschlussprüfung',
    icon: '🧑‍⚖️',
    giver: 'Professorin Quantina',
    story: '„Der Prüfer wartet. Verzaubere deine Ausrüstung und bestehe!“',
    objectives: [
      { type: 'level', skill: 'enchanting', level: 30, label: 'Verzauberung Level 30' },
      { type: 'stat', key: 'riftWins', amount: 1, label: 'Besiege den Prüfer' },
    ],
    rewards: { gold: 5000, research: 2000, extra: { heroItem: 3, avatar: '🧪' } },
    outro: '„Summa cum laude! Ich habe ein Diplom gedruckt. Es leuchtet ein bisschen.“',
  },
  // --- Questreihe „Spuren der Vorläufer": Archäologie ↔ Abenteuer, Oasen, neue Dörfer --------------
  {
    id: 'qv_first_dig',
    chain: 'Spuren der Vorläufer',
    name: 'Der erste Spatenstich',
    icon: '🏺',
    giver: 'Grabungsleiterin Dr. Kelle',
    story: '„Die Vorläufer haben Münzen verloren. Viele Münzen. Finde sie!“',
    objectives: [
      { type: 'level', skill: 'archaeology', level: 12, label: 'Archäologie Level 12' },
      { type: 'deliver', item: 'ancient_coin', qty: 10, label: 'Bringe 10 antike Münzen' },
    ],
    rewards: { gold: 600, research: 150 },
    outro: '„Diese hier ist von 3000 v. Chr. Oder von gestern. Schwer zu sagen.“',
  },
  {
    id: 'qv_expedition',
    chain: 'Spuren der Vorläufer',
    requires: ['qv_first_dig'],
    name: 'Expedition ins Ungewisse',
    icon: '🗺️',
    giver: 'Grabungsleiterin Dr. Kelle',
    story:
      '„Auf der Karte tauchen Orte auf, die gestern noch nicht da waren. Schick deinen Helden hin!“',
    objectives: [
      { type: 'stat', key: 'heroAdventures', amount: 5, label: 'Bestehe 5 Abenteuer' },
      { type: 'stat', key: 'heroDungeons', amount: 1, label: 'Spiele einen Dungeon live' },
    ],
    rewards: { gold: 1200, extra: { heroItem: 1, resources: 800 } },
    outro: '„Er hat Fotos gemacht! Na gut, Skizzen. Mit Kreide. Auf seinem Schild.“',
  },
  {
    id: 'qv_oasis',
    chain: 'Spuren der Vorläufer',
    requires: ['qv_expedition'],
    name: 'Wasser in der Wüste',
    icon: '🏝️',
    giver: 'Grabungsleiterin Dr. Kelle',
    story: '„Die Oasen stehen auf Vorläufer-Ruinen. Sichere eine – und grab daneben weiter.“',
    objectives: [
      { type: 'stat', key: 'villageOases', amount: 1, label: 'Annektiere eine Oase' },
      { type: 'level', skill: 'archaeology', level: 28, label: 'Archäologie Level 28' },
    ],
    rewards: { gold: 2500, extra: { resources: 2000, essence: 150 } },
    outro: '„Unter der Palme: eine Tafel. Darauf: „Hier war Kurt.“ Faszinierend.“',
  },
  {
    id: 'qv_tablets',
    chain: 'Spuren der Vorläufer',
    requires: ['qv_oasis'],
    name: 'Die Bibliothek der Vorläufer',
    icon: '📜',
    giver: 'Grabungsleiterin Dr. Kelle',
    story: '„Tontafeln und Fossilien erzählen, wer den Riss zuerst geöffnet hat. Sammle sie!“',
    objectives: [
      { type: 'deliver', item: 'clay_tablet', qty: 15, label: 'Bringe 15 Tontafeln' },
      { type: 'deliver', item: 'fossil', qty: 5, label: 'Bringe 5 Fossilien' },
    ],
    rewards: { research: 1500, extra: { heroItem: 2, heroXp: 600 } },
    outro: '„Übersetzung der ersten Tafel: „Nicht den roten Knopf drücken.“ Hm.“',
  },
  {
    id: 'qv_precursor',
    chain: 'Spuren der Vorläufer',
    requires: ['qv_tablets'],
    name: 'Das Erbe der Vorläufer',
    icon: '🗿',
    giver: 'Grabungsleiterin Dr. Kelle',
    story:
      '„Die goldene Maske öffnet das letzte Tor. Und für das, was dahinter liegt, brauchst du ein zweites Dorf.“',
    objectives: [
      { type: 'level', skill: 'archaeology', level: 60, label: 'Archäologie Level 60' },
      { type: 'deliver', item: 'golden_mask', qty: 1, label: 'Bringe eine goldene Maske' },
      { type: 'stat', key: 'villagesFounded', amount: 1, label: 'Gründe ein neues Dorf' },
    ],
    rewards: { gold: 8000, extra: { heroItem: 3, essence: 400, avatar: '🗿' } },
    outro:
      '„Hinter dem Tor: ein Spiegel. Die Vorläufer – das waren wir. Oder zumindest sehr ähnliche Leute.“',
  },
  // --- Questreihe „Die Karawane des Glücks": Handel im Dorf ↔ Insel-Markt, Haustiere ↔ Held, Expansion -------
  {
    id: 'qk_first_trade',
    chain: 'Die Karawane des Glücks',
    name: 'Ein Händler klopft an',
    icon: '🐫',
    giver: 'Karawanenführerin Zahra',
    story:
      '„Meine Kamele sind müde, meine Taschen leer. Baut ihr einen Marktplatz, bringe ich die Welt in euer Dorf.“',
    objectives: [
      { type: 'building', id: 'market', level: 1, label: 'Marktplatz Stufe 1' },
      { type: 'stat', key: 'villageTrades', amount: 3, label: 'Handle 3-mal auf dem Dorfmarkt' },
    ],
    rewards: { gold: 800, extra: { resources: 600 } },
    outro: '„Ein fairer Tausch! Na gut, für mich etwas fairer. Willkommen im Geschäft.“',
  },
  {
    id: 'qk_island_goods',
    chain: 'Die Karawane des Glücks',
    requires: ['qk_first_trade'],
    name: 'Inselware für die Karawane',
    icon: '📦',
    giver: 'Karawanenführerin Zahra',
    story:
      '„In der Wüste zahlt man für Inselware ein Vermögen. Verkauf mir deine Überschüsse – und schick Waren ins Dorf.“',
    objectives: [
      { type: 'stat', key: 'itemsSold', amount: 500, label: 'Verkaufe 500 Gegenstände' },
      { type: 'stat', key: 'villageImports', amount: 50, label: 'Schicke 50 Inselwaren ins Dorf' },
    ],
    rewards: { gold: 2000, research: 400, extra: { resources: 1200 } },
    outro: '„Getrockneter Fisch! In der Wüste! Ich werde reich. Reicher. Am reichsten.“',
  },
  {
    id: 'qk_companion',
    chain: 'Die Karawane des Glücks',
    requires: ['qk_island_goods'],
    name: 'Ein treuer Begleiter',
    icon: '🐾',
    giver: 'Karawanenführerin Zahra',
    story:
      '„Kein Held reist allein. Ein Haustier warnt vor Banditen – und frisst sie manchmal auch.“',
    objectives: [
      { type: 'stat', key: 'petsFound', amount: 1, label: 'Finde ein Haustier' },
      { type: 'heroLevel', level: 10, label: 'Held Stufe 10' },
      { type: 'stat', key: 'heroAdventures', amount: 10, label: 'Bestehe 10 Abenteuer' },
    ],
    rewards: { gold: 3000, extra: { heroItem: 2, heroXp: 800 } },
    outro: '„Das Tier mag dich. Oder deinen Proviant. Bei Haustieren ist das dasselbe.“',
  },
  {
    id: 'qk_trade_route',
    chain: 'Die Karawane des Glücks',
    requires: ['qk_companion'],
    name: 'Die große Handelsroute',
    icon: '🛤️',
    giver: 'Karawanenführerin Zahra',
    story:
      '„Eine Handelsroute braucht zwei Enden. Gründe ein zweites Dorf, und ich verbinde sie mit Gold.“',
    objectives: [
      { type: 'building', id: 'market', level: 10, label: 'Marktplatz Stufe 10' },
      { type: 'stat', key: 'villagesFounded', amount: 1, label: 'Gründe ein neues Dorf' },
      { type: 'stat', key: 'villageTrades', amount: 25, label: 'Handle 25-mal auf dem Dorfmarkt' },
    ],
    rewards: { gold: 6000, extra: { resources: 3000, essence: 200 } },
    outro: '„Hörst du das? Das ist das Geräusch von Zinsen. Wunderschön.“',
  },
  {
    id: 'qk_fortune',
    chain: 'Die Karawane des Glücks',
    requires: ['qk_trade_route'],
    name: 'Das Glück der Karawane',
    icon: '🪔',
    giver: 'Karawanenführerin Zahra',
    story:
      '„In meiner ältesten Truhe liegt eine Wunderlampe. Ich tausche sie – gegen Gold, Edelsteine und ein Heldenstück.“',
    objectives: [
      { type: 'deliver', item: 'gem_ruby', qty: 5, label: 'Bringe 5 Rubine' },
      { type: 'stat', key: 'goldEarned', amount: 250000, label: 'Verdiene insgesamt 250 000 Gold' },
      { type: 'heroLevel', level: 25, label: 'Held Stufe 25' },
    ],
    rewards: { gold: 15000, extra: { heroItem: 3, essence: 500, avatar: '🐫' } },
    outro:
      '„Der Geist hat drei Wünsche frei. Zwei davon hat er schon für Urlaub verbraucht. Viel Glück!“',
  }, // --- Questreihe „Die Zünfte der Insel": die sechs neuen Skills und Kampf 2.0 ----------------------
  {
    id: 'qz_jeweller',
    chain: 'Die Zünfte der Insel',
    name: 'Funkelnde Anfänge',
    icon: '💎',
    giver: 'Gildenmeisterin Odila',
    story:
      '„Jede Zunft beginnt mit einem Stein. Siebe Kiesel, knacke Geoden und bring mir einen Quarzring.“',
    objectives: [
      { type: 'level', skill: 'jewelcrafting', level: 10, label: 'Juwelierkunst Level 10' },
      { type: 'deliver', item: 'ring_quartz', qty: 1, label: 'Bringe 1 Quarzring' },
    ],
    rewards: { gold: 600, items: [{ item: 'geode', qty: 10 }] },
    outro:
      '„Hübsch. Der erste Ring ist immer der schiefste. Behalt ihn als Erinnerung – nein, warte, ich behalte ihn.“',
  },
  {
    id: 'qz_builder',
    chain: 'Die Zünfte der Insel',
    requires: ['qz_jeweller'],
    name: 'Ein Dach über der Zunft',
    icon: '🔨',
    giver: 'Gildenmeisterin Odila',
    story: '„Eine Zunft braucht ein Haus. Säge Bretter, zimmere Möbel und errichte die Werkstatt.“',
    objectives: [
      { type: 'stat', key: 'constructionActions', amount: 60, label: 'Säge oder zimmere 60-mal' },
      { type: 'stat', key: 'buildingsBuilt', amount: 1, label: 'Errichte einen Inselbau' },
    ],
    rewards: { gold: 1500, items: [{ item: 'nails', qty: 100 }] },
    outro: '„Es steht! Es wackelt ein bisschen, aber es steht.“',
  },
  {
    id: 'qz_thief',
    chain: 'Die Zünfte der Insel',
    requires: ['qz_builder'],
    name: 'Lange Finger',
    icon: '🗝️',
    giver: 'Der Schatten',
    story:
      '„Odila muss das nicht wissen. Zeig mir, dass du leise sein kannst: 40 Diebstähle – und lass dich nicht zu oft erwischen.“',
    objectives: [
      { type: 'stat', key: 'thefts', amount: 40, label: 'Stiehl 40-mal' },
      { type: 'level', skill: 'thieving', level: 20, label: 'Diebeskunst Level 20' },
    ],
    rewards: { gold: 2500, items: [{ item: 'lockpick', qty: 15 }] },
    outro: '„Nicht schlecht. Deine Geldbörse habe ich übrigens zurückgelegt. Fast vollständig.“',
  },
  {
    id: 'qz_hunter',
    chain: 'Die Zünfte der Insel',
    requires: ['qz_thief'],
    name: 'Kopfgeld auf Bestellung',
    icon: '🎯',
    giver: 'Hauptfrau Brunna',
    story:
      '„Die Wildnis wird frech. Erfülle drei Kopfgeld-Aufträge und lerne, Gebete im Kampf zu nutzen.“',
    objectives: [
      { type: 'stat', key: 'slayerTasks', amount: 3, label: 'Erfülle 3 Kopfgeld-Aufträge' },
      { type: 'level', skill: 'faith', level: 12, label: 'Glaube Level 12' },
    ],
    rewards: { gold: 5000, items: [{ item: 'prayer_draught', qty: 5 }] },
    outro: '„Drei Ziele, drei Treffer. Die Wildnis wird sich das merken.“',
  },
  {
    id: 'qz_summoner',
    chain: 'Die Zünfte der Insel',
    requires: ['qz_hunter'],
    name: 'Ein treuer Begleiter',
    icon: '🐾',
    giver: 'Druidin Wynn',
    story:
      '„Kämpfer jagen allein. Weise nicht. Fertige zehn Beschwörungsbeutel und rufe einen Vertrauten an deine Seite.“',
    objectives: [
      { type: 'stat', key: 'pouchesMade', amount: 10, label: 'Fertige 10 Beschwörungsbeutel' },
      { type: 'level', skill: 'summoning', level: 25, label: 'Beschwörung Level 25' },
    ],
    rewards: { gold: 8000, items: [{ item: 'spirit_shard', qty: 200 }] },
    outro: '„Er mag dich. Oder deine Taschen voller Knochen. Schwer zu sagen.“',
  },
  {
    id: 'qz_cartographer',
    chain: 'Die Zünfte der Insel',
    requires: ['qz_summoner'],
    name: 'Bis zum Rand der Karte',
    icon: '🧭',
    giver: 'Gildenmeisterin Odila',
    story:
      '„Die letzte Prüfung der Zünfte: Zeichne die Welt. 30 Karten und eine Expedition in die Ruinen.“',
    objectives: [
      { type: 'stat', key: 'mapsDrawn', amount: 30, label: 'Zeichne 30 Karten' },
      { type: 'level', skill: 'cartography', level: 30, label: 'Kartografie Level 30' },
    ],
    rewards: {
      gold: 15000,
      items: [{ item: 'treasure_map_2', qty: 2 }],
      extra: { essence: 300, avatar: '🧭' },
    },
    outro:
      '„Die Zünfte der Insel grüßen ihr neues Ehrenmitglied. Der Mitgliedsbeitrag? Ein Lächeln. Und 500 Gold.“',
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
  { id: 'rites', label: 'Vollziehe {n} Andachten', stat: 'ritesPerformed', base: 40, icon: '🙏' },
  { id: 'brew', label: 'Braue {n} Getränke', stat: 'drinksBrewed', base: 30, icon: '🍺' },
  {
    id: 'jewels',
    label: 'Fertige {n} Juwelierarbeiten',
    stat: 'jewelsCrafted',
    base: 30,
    icon: '💎',
  },
  {
    id: 'slayer',
    label: 'Erfülle {n} Kopfgeld-Aufträge',
    stat: 'slayerTasks',
    base: 2,
    icon: '🎯',
  },
  {
    id: 'pouches',
    label: 'Fertige {n} Beschwörungsbeutel',
    stat: 'pouchesMade',
    base: 15,
    icon: '🐾',
  },
  { id: 'thefts', label: 'Stiehl {n}-mal erfolgreich', stat: 'thefts', base: 40, icon: '🗝️' },
  {
    id: 'furniture',
    label: 'Zimmere oder säge {n}-mal',
    stat: 'constructionActions',
    base: 40,
    icon: '🔨',
  },
  { id: 'maps', label: 'Zeichne {n} Karten', stat: 'mapsDrawn', base: 30, icon: '🧭' },
  {
    id: 'laps',
    label: 'Laufe {n} Parcours-Runden',
    stat: 'lapsRun',
    base: 40,
    icon: '🏃',
  },
  {
    id: 'stars',
    label: 'Beobachte {n}-mal den Himmel',
    stat: 'starsWatched',
    base: 40,
    icon: '🔭',
  },
  {
    id: 'voyages',
    label: 'Segle {n}-mal hinaus',
    stat: 'voyagesMade',
    base: 20,
    icon: '⚓',
  },
  {
    id: 'herd',
    label: 'Versorge {n}-mal deine Tiere',
    stat: 'animalsTended',
    base: 40,
    icon: '🐄',
  },
  {
    id: 'fletch',
    label: 'Fertige {n}-mal im Bogenbau',
    stat: 'bowsFletched',
    base: 40,
    icon: '🪶',
  },
];
