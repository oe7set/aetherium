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
    // Hit points start at 10, so their first milestones would unlock instantly.
    LEVEL_MILESTONES.filter((m) => skill.id !== 'hitpoints' || m.level > 10).map((m) => ({
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
    key: 'riftKills',
    icon: '🌀',
    desc: (n) => `Besiege ${n} Gegner im Ätherriss.`,
    steps: [
      [100, 'Rissbewohner·in'],
      [5000, 'Hordenbrecher·in'],
      [50000, 'Vampir? Überlebt!'],
      [500000, 'Massenvernichtungsforscher·in'],
    ],
    reward: (i) => ({ 'combat.damage': 0.01 * (i + 1) }),
  },
  {
    key: 'riftBestMinutes',
    icon: '⏱️',
    desc: (n) => `Überlebe ${n} Minuten in einem Riss-Lauf.`,
    steps: [
      [5, 'Fünf Minuten Ruhm'],
      [10, 'Halbzeit im Chaos'],
      [15, 'Bis zum Prüfer'],
    ],
    reward: (i) => ({ xp: 0.01 * (i + 1) }),
  },
  {
    key: 'riftEndlessMinutes',
    icon: '♾️',
    desc: (n) => `Überlebe ${n} Minuten im Endlos-Riss.`,
    steps: [
      [20, 'Kein Ende in Sicht'],
      [30, 'Unkaputtbar'],
      [45, 'Der Riss hat aufgegeben'],
      [60, 'Eine Stunde Chaos'],
    ],
    reward: (i) => ({ 'rift.might': 0.02 * (i + 1) }),
  },
  {
    key: 'masteryLevels',
    icon: '🏅',
    desc: (n) => `Steige insgesamt ${n} Meisterschaftsstufen auf.`,
    steps: [
      [10, 'Übung macht den Meister'],
      [100, 'Routiniert'],
      [500, 'Meister·in aller Klassen'],
      [2000, 'Hat jede Bewegung im Schlaf drauf'],
    ],
    reward: (i) => ({ speed: 0.01 * (i + 1) }),
  },
  {
    key: 'weeklyWins',
    icon: '🦹',
    desc: (n) => `Besiege ${n} Wochenbosse.`,
    steps: [
      [1, 'Wochenend-Held·in'],
      [4, 'Monatsbeste·r'],
      [12, 'Quartalsschreck'],
      [52, 'Ein ganzes Jahr Boss-Montag'],
    ],
    reward: (i) => ({ 'combat.damage': 0.01 * (i + 1) }),
  },
  {
    key: 'albumItems',
    icon: '📗',
    desc: (n) => `Finde ${n} verschiedene Gegenstände.`,
    steps: [
      [25, 'Sammler·in'],
      [75, 'Kurator·in'],
      [150, 'Museumsdirektion'],
      [250, 'Hat alles. Wirklich alles.'],
    ],
    reward: (i) => ({ rare: 0.01 * (i + 1) }),
  },
  {
    key: 'collectionsDone',
    icon: '📚',
    desc: (n) => `Schließe ${n} Sammelbuch-Sets ab.`,
    steps: [
      [1, 'Erstes Set'],
      [5, 'Regal voll'],
      [14, 'Das komplette Album'],
    ],
    reward: (i) => ({ gold: 0.02 * (i + 1) }),
  },
  {
    key: 'riftWins',
    icon: '🧑‍⚖️',
    desc: (n) => `Besiege den Prüfer ${n}-mal.`,
    steps: [
      [1, 'Prüfung bestanden'],
      [10, 'Summa cum laude'],
    ],
    reward: (i) => ({ research: 0.02 * (i + 1) }),
  },
  {
    key: 'villagePopulation',
    icon: '🏘️',
    desc: (n) => `Erreiche ${n} Einwohner in deinen Dörfern.`,
    steps: [
      [50, 'Dorfgründer·in'],
      [250, 'Bürgermeister·in'],
      [1000, 'Landesfürst·in'],
      [3000, 'Kaiser·in von Neu-Aetherium'],
    ],
    reward: (i) => ({ xp: 0.01 * (i + 1), gold: 0.01 * (i + 1) }),
  },
  {
    key: 'villageRaidsWon',
    icon: '⚔️',
    desc: (n) => `Gewinne ${n} Raubzüge.`,
    steps: [
      [1, 'Erste Beute'],
      [50, 'Farmkönig·in'],
      [500, 'Schrecken der Räuberlager'],
    ],
    reward: (i) => ({ 'combat.damage': 0.01 * (i + 1) }),
  },
  {
    key: 'villageInvasionsRepelled',
    icon: '🛡️',
    desc: (n) => `Wehre ${n} Riss-Invasionen ab.`,
    steps: [
      [1, 'Die Mauer hält!'],
      [25, 'Bollwerk gegen den Riss'],
    ],
    reward: (i) => ({ 'combat.defence': 0.01 * (i + 1) }),
  },
  {
    key: 'villagesFounded',
    icon: '🧳',
    desc: (n) => `Gründe ${n} neue Dörfer.`,
    steps: [
      [1, 'Expansion!'],
      [4, 'Reich der fünf Dörfer'],
    ],
    reward: (i) => ({ research: 0.02 * (i + 1) }),
  },
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
  {
    key: 'monstersKilled',
    icon: '⚔️',
    desc: (n) => `Besiege ${n} Monster.`,
    steps: [
      [1, 'Erstes Blut'],
      [100, 'Monsterjäger'],
      [1000, 'Schrecken der Wildnis'],
      [10000, 'Artenschützer besorgt'],
      [100000, 'Massenaussterben'],
    ],
    reward: (i) => ({ 'combat.damage': 0.01 * (i + 1) }),
  },
  {
    key: 'specialsUsed',
    icon: '💥',
    desc: (n) => `Setze ${n} Spezialangriffe ein.`,
    steps: [
      [1, 'Volle Leiste'],
      [50, 'Knopfdrücker mit Stil'],
      [500, 'Combo-König'],
    ],
    reward: () => ({ 'combat.energy': 0.05 }),
  },
  {
    key: 'dodges',
    icon: '💨',
    desc: (n) => `Weiche ${n} Wuchtschlägen aus.`,
    steps: [
      [1, 'Flinke Füße'],
      [100, 'Matrix-Moment'],
      [1000, 'Unberührbar'],
    ],
    reward: (i) => ({ 'combat.defence': 0.01 * (i + 1) }),
  },
  {
    key: 'bossKills',
    icon: '👹',
    desc: (n) => `Besiege ${n} Bosse.`,
    steps: [
      [1, 'Boss-Besieger'],
      [10, 'Raid-Leiter'],
      [100, 'Weltboss-Abo'],
    ],
    reward: (i) => ({ 'combat.loot': 0.02 * (i + 1) }),
  },
  {
    key: 'dungeonsCompleted',
    icon: '🗝️',
    desc: (n) => `Schließe ${n} Dungeons ab.`,
    steps: [
      [1, 'Dungeon-Crawler'],
      [25, 'Kerkermeister'],
      [250, 'Speedrunner'],
    ],
    reward: () => ({ 'combat.accuracy': 0.02 }),
  },
  {
    key: 'deaths',
    icon: '💀',
    desc: (n) => `Stirb ${n}-mal.`,
    steps: [
      [1, 'Respawn-Erfahrung'],
      [10, 'Unsterblich (fast)'],
      [100, 'Dark-Souls-Veteran'],
    ],
    reward: () => ({ 'combat.hp': 0.02 }),
  },
  {
    key: 'foodEaten',
    icon: '🍗',
    desc: (n) => `Iss im Kampf ${n} Portionen.`,
    steps: [
      [10, 'Snackpause'],
      [1000, 'Zweites Frühstück'],
      [10000, 'Hobbit-Ernährungsplan'],
    ],
    reward: () => ({ 'combat.hp': 0.01 }),
  },
  {
    key: 'kills.chicken',
    icon: '🐔',
    desc: (n) => `Besiege ${n} Hühner.`,
    steps: [
      [1, 'Warum über die Straße?'],
      [100, 'Hühnerschreck'],
      [1000, 'Colonel'],
    ],
    reward: () => ({ 'xp.melee': 0.01 }),
  },
  {
    key: 'techsResearched',
    icon: '🔬',
    desc: (n) => `Erforsche ${n} Technologien.`,
    steps: [
      [1, 'Erste Erkenntnis'],
      [10, 'Wissenschaftlerin'],
      [25, 'Universalgelehrter'],
      [40, 'Ende der Geschichte'],
    ],
    reward: (i) => ({ research: 0.05 * (i + 1) }),
  },
  {
    key: 'harvests',
    icon: '🌾',
    desc: (n) => `Ernte ${n}-mal.`,
    steps: [
      [1, 'Grüner Daumen'],
      [100, 'Bauer sucht Ernte'],
      [1000, 'Agrarindustrie'],
    ],
    reward: (i) => ({ 'speed.farming': 0.05 * (i + 1) }),
  },
  {
    key: 'mutations',
    icon: '🧬',
    desc: (n) => `Erziele ${n} Mutationen.`,
    steps: [
      [1, 'Mendels Erbe'],
      [25, 'Gentechnik-Gegner besorgt'],
    ],
    reward: () => ({ rare: 0.03 }),
  },
  {
    key: 'helperTasks',
    icon: '🧑‍🎓',
    desc: (n) => `Lass Helfer ${n} Aufgaben erledigen.`,
    steps: [
      [10, 'Delegieren gelernt'],
      [1000, 'Middle Management'],
      [100000, 'CEO-Modus'],
    ],
    reward: () => ({ helperSpeed: 0.05 }),
  },
  {
    key: 'action.brew_healing',
    icon: '🩺',
    desc: (n) => `Braue ${n} Heiltränke.`,
    steps: [[100, 'Ich bin kein Arzt, aber …']],
    reward: () => ({ 'combat.hp': 0.05 }),
  },
  {
    key: 'questsCompleted',
    icon: '📜',
    desc: (n) => `Schließe ${n} Quests ab.`,
    steps: [
      [1, 'Questgeber-Liebling'],
      [5, 'Abenteurerin'],
      [13, 'Alle Ausrufezeichen weg'],
    ],
    reward: (i) => ({ xp: 0.01 * (i + 1) }),
  },
  {
    key: 'tasksCompleted',
    icon: '📋',
    desc: (n) => `Erledige ${n} Aufträge.`,
    steps: [
      [1, 'Pflichtbewusst'],
      [25, 'Stammkunde'],
      [100, 'Auftragskönigin'],
      [500, 'Workaholic'],
    ],
    reward: (i) => ({ gold: 0.02 * (i + 1) }),
  },
  {
    key: 'petsFound',
    icon: '🐾',
    desc: (n) => `Finde ${n} Haustiere.`,
    steps: [
      [1, 'Haustierbesitzer'],
      [5, 'Streichelzoo'],
      [15, 'Arche Noah'],
    ],
    reward: (i) => ({ rare: 0.05 * (i + 1) }),
  },
  {
    key: 'rebirths',
    icon: '🌅',
    desc: (n) => `Werde ${n}-mal wiedergeboren.`,
    steps: [
      [1, 'Neuanfang'],
      [5, 'Reinkarnations-Profi'],
      [25, 'Samsara-Stammgast'],
    ],
    reward: (i) => ({ wisdom: 0.05 * (i + 1) }),
  },
  {
    key: 'paradigmShifts',
    icon: '🔄',
    desc: (n) => `Leite ${n} Paradigmenwechsel ein.`,
    steps: [
      [1, 'Thomas Kuhn wäre stolz'],
      [5, 'Wissenschaftliche Revolution'],
    ],
    reward: () => ({ research: 0.1 }),
  },
  {
    key: 'bigBangs',
    icon: '💥',
    desc: (n) => `Löse ${n} Urknall(e) aus.`,
    steps: [
      [1, 'Es werde Licht'],
      [3, 'Multiversums-Tourist'],
    ],
    reward: () => ({ xp: 0.1 }),
  },
  // Masterplan 3.0–6.0: every new system gets its own series.
  {
    key: 'slayerTasks',
    icon: '🎯',
    desc: (n) => `Erledige ${n} Kopfgeld-Aufträge.`,
    steps: [
      [10, 'Kopfgeldjäger·in'],
      [100, 'Steckbrief-Sammler·in'],
      [500, 'Der Schrecken der Wildnis'],
    ],
    reward: (i) => ({ 'combat.loot': 0.01 * (i + 1) }),
  },
  {
    key: 'thefts',
    icon: '🗝️',
    desc: (n) => `Gelingen ${n} Diebstähle.`,
    steps: [
      [100, 'Langfinger'],
      [1000, 'Meisterdieb·in'],
      [10000, 'Robin, aber ohne Hood'],
    ],
    reward: (i) => ({ gold: 0.01 * (i + 1) }),
  },
  {
    key: 'buildingsBuilt',
    icon: '🔨',
    desc: (n) => `Baue ${n} Inselbau-Stufen.`,
    steps: [
      [3, 'Bauherr·in'],
      [10, 'Inselarchitekt·in'],
      [25, 'Stadtplaner·in ohne Stadt'],
    ],
    reward: (i) => ({ 'xp.construction': 0.02 * (i + 1) }),
  },
  {
    key: 'mapsDrawn',
    icon: '🧭',
    desc: (n) => `Zeichne ${n} Karten.`,
    steps: [
      [50, 'Kartenzeichner·in'],
      [500, 'Hier sind Drachen'],
      [5000, 'Die Welt ist eine Scheibe (bewiesen)'],
    ],
    reward: (i) => ({ 'xp.cartography': 0.02 * (i + 1) }),
  },
  {
    key: 'bowsFletched',
    icon: '🪶',
    desc: (n) => `Fertige ${n} Bogenbau-Werke.`,
    steps: [
      [100, 'Pfeilschnitzer·in'],
      [1000, 'Sehnenspanner·in'],
      [10000, 'Köcher ohne Boden'],
    ],
    reward: (i) => ({ 'combat.damage.ranged': 0.01 * (i + 1) }),
  },
  {
    key: 'animalsTended',
    icon: '🐄',
    desc: (n) => `Versorge ${n} Tiere.`,
    steps: [
      [100, 'Stallbursche'],
      [1000, 'Kuhflüsterer·in'],
      [10000, 'Old McDonald'],
    ],
    reward: (i) => ({ 'xp.husbandry': 0.02 * (i + 1) }),
  },
  {
    key: 'voyagesMade',
    icon: '⚓',
    desc: (n) => `Unternimm ${n} Seefahrten.`,
    steps: [
      [25, 'Matrose'],
      [250, 'Kapitän·in'],
      [2500, 'Fliegende·r Holländer·in'],
    ],
    reward: (i) => ({ 'speed.sailing': 0.02 * (i + 1) }),
  },
  {
    key: 'nightObservations',
    icon: '🌙',
    desc: (n) => `Beobachte ${n}-mal den Nachthimmel.`,
    steps: [
      [50, 'Nachteule'],
      [500, 'Sternengucker·in'],
      [5000, 'Schläft nie'],
    ],
    reward: (i) => ({ 'xp.astronomy': 0.02 * (i + 1) }),
  },
  {
    key: 'lapsRun',
    icon: '🏃',
    desc: (n) => `Laufe ${n} Parcours-Runden.`,
    steps: [
      [100, 'Läufer·in'],
      [1000, 'Dachkletterer·in'],
      [10000, 'Parkour!'],
    ],
    reward: (i) => ({ 'speed.agility': 0.02 * (i + 1) }),
  },
  {
    key: 'inventionsBuilt',
    icon: '⚙️',
    desc: (n) => `Baue ${n} Erfindungs-Stufen.`,
    steps: [
      [1, 'Tüftler·in'],
      [10, 'Erfinder·in'],
      [30, 'Patentamt hasst dich'],
    ],
    reward: (i) => ({ research: 0.02 * (i + 1) }),
  },
  {
    key: 'forgeSuccesses',
    icon: '✨',
    desc: (n) => `Verstärke ${n}-mal erfolgreich.`,
    steps: [
      [5, 'Funkenschläger·in'],
      [30, 'Glühendes Händchen'],
      [100, '+10 oder nichts'],
    ],
    reward: (i) => ({ 'combat.damage': 0.01 * (i + 1) }),
  },
  {
    key: 'worldBossKills',
    icon: '👹',
    desc: (n) => `Besiege ${n} Weltbosse.`,
    steps: [
      [1, 'Riesentöter·in'],
      [10, 'Kolosskiller·in'],
      [50, 'Die Welt sagt danke'],
    ],
    reward: (i) => ({ 'combat.hp': 0.02 * (i + 1) }),
  },
  {
    key: 'projectStages',
    icon: '🏗️',
    desc: (n) => `Vollende ${n} Großprojekt-Abschnitte.`,
    steps: [
      [1, 'Grundsteinleger·in'],
      [8, 'Baumeister·in der Wunder'],
      [16, 'Alle Wunder der Insel'],
    ],
    reward: (i) => ({ gold: 0.02 * (i + 1) }),
  },
  {
    key: 'milestonesClaimed',
    icon: '🎖️',
    desc: (n) => `Hole ${n} Skill-Meilensteine ab.`,
    steps: [
      [10, 'Meilenstein-Sammler·in'],
      [50, 'Auf allen Wegen'],
      [150, 'Kein Stein bleibt liegen'],
    ],
    reward: (i) => ({ xp: 0.01 * (i + 1) }),
  },
  {
    key: 'empireRanks',
    icon: '👑',
    desc: (n) => `Steige ${n} Reichsränge auf.`,
    steps: [
      [1, 'Aufsteiger·in'],
      [5, 'Adel verpflichtet'],
      [11, 'Kaiserlich'],
    ],
    reward: (i) => ({ 'village.prod': 0.02 * (i + 1) }),
  },
  {
    key: 'islandEvents',
    icon: '🎪',
    desc: (n) => `Erlebe ${n} Insel-Ereignisse.`,
    steps: [
      [5, 'Schaulustige·r'],
      [50, 'Immer dabei'],
      [250, 'Hier ist ja immer was los'],
    ],
    reward: (i) => ({ gold: 0.01 * (i + 1) }),
  },
  {
    key: 'traderDeals',
    icon: '🧳',
    desc: (n) => `Kaufe ${n}-mal beim Wanderhändler.`,
    steps: [
      [1, 'Kundschaft'],
      [25, 'Stammkund·in'],
      [100, 'Er kennt deinen Namen'],
    ],
    reward: (i) => ({ gold: 0.01 * (i + 1) }),
  },
  {
    key: 'villageSupplyGoods',
    icon: '🚚',
    desc: (n) => `Hole ${n} Waren aus dem Dorf auf die Insel.`,
    steps: [
      [100, 'Lieferdienst'],
      [2000, 'Karawanenführer·in'],
      [20000, 'Logistik-Genie'],
    ],
    reward: (i) => ({ 'village.prod': 0.01 * (i + 1) }),
  },
  {
    key: 'riftRelics',
    icon: '🏺',
    desc: (n) => `Finde ${n} Relikte.`,
    steps: [
      [1, 'Grabräuber·in'],
      [10, 'Reliktjäger·in'],
      [30, 'Museumsreif'],
    ],
    reward: (i) => ({ 'rift.luck': 0.02 * (i + 1) }),
  },
  {
    key: 'guildOrders',
    icon: '📜',
    desc: (n) => `Erfülle ${n} Zunftaufträge.`,
    steps: [
      [10, 'Zunftmitglied'],
      [100, 'Zunftmeister·in'],
      [500, 'Ehrenbürger·in aller Zünfte'],
    ],
    reward: (i) => ({ gold: 0.01 * (i + 1) }),
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

export const TOTAL_LEVELS = [50, 100, 150, 250, 400, 600, 800, 1000, 1200, 1500];
const totalLevelAchievements: AchievementDef[] = TOTAL_LEVELS.map((n) => ({
  id: `total_${n}`,
  name: `Gesamtlevel ${n}`,
  desc: `Erreiche ein Gesamtlevel von ${n}.`,
  icon: '📊',
  condition: { type: 'totalLevel', gte: n },
  reward: { xp: 0.01 },
}));

const CODEX = [5, 20, 50, 90, 118];
const codexAchievements: AchievementDef[] = CODEX.map((n, i) => ({
  id: `codex_${n}`,
  name:
    [
      'Wasserstoff-Bombe (harmlos)',
      'Chemie-Leistungskurs',
      'Mendelejews Erbe',
      'Fast alles erklärt',
      'Periodensystem komplett',
    ][i] ?? `Codex ${n}`,
  desc: `Entdecke ${n} Elemente für das Periodensystem.`,
  icon: '⚛️',
  condition: { type: 'stat', key: 'codexSize', gte: n },
  reward: { research: 0.05 * (i + 1), xp: 0.01 * (i + 1) },
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
  ...codexAchievements,
  ...SPECIAL,
];
