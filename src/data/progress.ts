// Motivation layer: daily login rewards, the Ruhmesleiter (cross-system progress track) and the
// Chronik (a guided goal chain that doubles as the tutorial).

/** A reward bundle. Amounts marked "scaled" grow with the player's overall progress. */
export interface RewardDef {
  /** Gold (scaled). */
  gold?: number;
  /** Riss-Essenz (scaled). */
  essence?: number;
  /** Research points (scaled). */
  research?: number;
  /** Each village resource for the active village (scaled). */
  resources?: number;
  /** Hero XP (scaled). */
  heroXp?: number;
  /** A hero item of at least this tier. */
  heroItem?: 1 | 2 | 3;
  /** Island items (not scaled). */
  items?: { item: string; qty: number }[];
  /** Unlocks a special hero avatar. */
  avatar?: string;
}

// --- Daily login --------------------------------------------------------------------------------

export const DAILY_REWARDS: RewardDef[] = [
  { gold: 300, resources: 300 },
  { essence: 25, resources: 500 },
  { research: 40, items: [{ item: 'research_notes', qty: 3 }] },
  { gold: 600, heroXp: 150 },
  { resources: 900, items: [{ item: 'coin_pouch', qty: 3 }] },
  { essence: 60, items: [{ item: 'dungeon_chest', qty: 1 }] },
  { heroItem: 2, essence: 80, gold: 1000 },
];

// --- Ruhmesleiter ---------------------------------------------------------------------------------

export const PASS_TIERS = 50;

/** Total points needed for tier n (1-based). */
export function passThreshold(n: number): number {
  return Math.round(60 * Math.pow(n, 1.35));
}

/** Special avatars handed out by the Ruhmesleiter. */
export const SPECIAL_AVATARS = ['🐉', '🦄', '🤖', '👽', '🧞'];

export function passReward(tier: number): RewardDef {
  if (tier % 10 === 0)
    return {
      avatar: SPECIAL_AVATARS[tier / 10 - 1],
      heroItem: tier >= 30 ? 3 : 2,
      essence: 50 + tier * 4,
    };
  if (tier % 5 === 0)
    return {
      heroItem: tier >= 25 ? 2 : 1,
      items: [{ item: 'dungeon_chest', qty: 1 + Math.floor(tier / 20) }],
    };
  switch (tier % 4) {
    case 0:
      return { essence: 15 + tier * 2 };
    case 1:
      return { gold: 200 + tier * 60 };
    case 2:
      return { resources: 250 + tier * 50 };
    default:
      return { research: 20 + tier * 4, heroXp: 60 + tier * 10 };
  }
}

/** How each stat feeds the Ruhmesleiter (points per unit). */
export const PASS_SOURCES: { stat: string; per: number; label: string; icon: string }[] = [
  { stat: 'totalLevel', per: 2, label: 'Gesamtlevel', icon: '🏝️' },
  { stat: 'villageFieldLevels', per: 2, label: 'Feldstufen', icon: '🌾' },
  { stat: 'villageBuildingLevels', per: 3, label: 'Gebäudestufen', icon: '🏘️' },
  { stat: 'villageRaidsWon', per: 4, label: 'Raubzüge', icon: '⚔️' },
  { stat: 'heroLevel', per: 15, label: 'Heldenstufe', icon: '🦸' },
  { stat: 'heroAdventures', per: 25, label: 'Abenteuer', icon: '❗' },
  { stat: 'riftKills', per: 1 / 40, label: 'Riss-Gegner', icon: '🌀' },
  { stat: 'riftBossKills', per: 20, label: 'Riss-Bosse', icon: '👹' },
  { stat: 'questsCompleted', per: 40, label: 'Quests', icon: '📜' },
  { stat: 'achievementsUnlocked', per: 10, label: 'Erfolge', icon: '🏆' },
  { stat: 'techsResearched', per: 10, label: 'Forschung', icon: '🔬' },
  { stat: 'tasksCompleted', per: 15, label: 'Aufträge', icon: '📋' },
  { stat: 'albumItems', per: 2, label: 'Sammelbuch-Funde', icon: '📗' },
  { stat: 'collectionsDone', per: 40, label: 'Sammelbuch-Sets', icon: '📚' },
  { stat: 'weeklyWins', per: 60, label: 'Wochenbosse', icon: '🦹' },
  { stat: 'masteryLevels', per: 3, label: 'Meisterschaftsstufen', icon: '🏅' },
  { stat: 'ritesPerformed', per: 1 / 25, label: 'Andachten', icon: '🙏' },
  { stat: 'drinksBrewed', per: 1 / 20, label: 'Gebraute Getränke', icon: '🍺' },
  { stat: 'jewelsCrafted', per: 1 / 20, label: 'Juwelierarbeiten', icon: '💎' },
  { stat: 'slayerTasks', per: 1, label: 'Kopfgeld-Aufträge', icon: '🎯' },
];

// --- Chronik ---------------------------------------------------------------------------------------

export type ChronicleCondition =
  | { kind: 'stat'; key: string; gte: number }
  | { kind: 'totalLevel'; gte: number }
  | { kind: 'building'; id: string; gte: number }
  | { kind: 'heroLevel'; gte: number }
  | { kind: 'heroPoints'; gte: number }
  | { kind: 'riftMinutes'; gte: number }
  | { kind: 'evolutions'; gte: number };

export interface ChronicleStep {
  title: string;
  hint: string;
  icon: string;
  condition: ChronicleCondition;
  reward: RewardDef;
  /** Where the "Los" button leads. */
  go: {
    tab: 'world' | 'skills' | 'inventory' | 'village' | 'rift' | 'menu';
    skill?: string;
    /** Sub-section: village segment, hero segment or menu section. */
    section?: string;
  };
}

export const CHRONICLE: ChronicleStep[] = [
  {
    title: 'Fälle 10 Bäume',
    hint: 'Skills → Holzfällen → Eiche fällen.',
    icon: '🪓',
    condition: { kind: 'stat', key: 'treesFelled', gte: 10 },
    reward: { gold: 100 },
    go: { tab: 'skills', skill: 'woodcutting' },
  },
  {
    title: 'Entfache ein Feuer',
    hint: 'Feuermachen braucht Holz. Wärme ist Fortschritt.',
    icon: '🔥',
    condition: { kind: 'stat', key: 'fuelBurned', gte: 1 },
    reward: { gold: 150, resources: 200 },
    go: { tab: 'skills', skill: 'firemaking' },
  },
  {
    title: 'Baue ein Rohstofffeld aus',
    hint: 'Dorf → Felder: tippe ein Feld an und baue es aus.',
    icon: '🌾',
    condition: { kind: 'stat', key: 'villageFieldLevels', gte: 1 },
    reward: { resources: 300 },
    go: { tab: 'village', section: 'fields' },
  },
  {
    title: 'Hauptgebäude auf Stufe 3',
    hint: 'Dorf → Dorf: das Hauptgebäude beschleunigt jeden Bau.',
    icon: '🏛️',
    condition: { kind: 'building', id: 'main', gte: 3 },
    reward: { resources: 500, gold: 200 },
    go: { tab: 'village', section: 'center' },
  },
  {
    title: 'Verteile Attributpunkte',
    hint: 'Held → Held: setze die ersten 4 Punkte.',
    icon: '💪',
    condition: { kind: 'heroPoints', gte: 4 },
    reward: { heroXp: 80, essence: 10 },
    go: { tab: 'rift', section: 'hero' },
  },
  {
    title: 'Betritt den Ätherriss',
    hint: 'Held → Riss: überlebe so lange du kannst.',
    icon: '🌀',
    condition: { kind: 'stat', key: 'riftRuns', gte: 1 },
    reward: { essence: 20 },
    go: { tab: 'rift', section: 'start' },
  },
  {
    title: 'Überlebe 3 Minuten im Riss',
    hint: 'Wähle bei Level-Ups Waffen, die zusammenpassen.',
    icon: '⏱️',
    condition: { kind: 'riftMinutes', gte: 3 },
    reward: { essence: 40, heroItem: 1 },
    go: { tab: 'rift', section: 'start' },
  },
  {
    title: 'Bestehe ein Abenteuer',
    hint: 'Held → Abenteuer: schick deinen Helden los.',
    icon: '❗',
    condition: { kind: 'stat', key: 'heroAdventures', gte: 1 },
    reward: { heroXp: 150, resources: 400 },
    go: { tab: 'rift', section: 'adventures' },
  },
  {
    title: 'Baue eine Kaserne',
    hint: 'Braucht Hauptgebäude 3 und einen Versammlungsplatz.',
    icon: '⚔️',
    condition: { kind: 'building', id: 'barracks', gte: 1 },
    reward: { resources: 600 },
    go: { tab: 'village', section: 'center' },
  },
  {
    title: 'Bilde 10 Truppen aus',
    hint: 'Dorf → Militär: Knüppelbauern sind billig und willig.',
    icon: '🧑‍🌾',
    condition: { kind: 'stat', key: 'villageTroopsTrained', gte: 10 },
    reward: { resources: 700, gold: 300 },
    go: { tab: 'village', section: 'military' },
  },
  {
    title: 'Gewinne einen Raubzug',
    hint: 'Dorf → Karte: tippe ein Räuberlager an.',
    icon: '⛺',
    condition: { kind: 'stat', key: 'villageRaidsWon', gte: 1 },
    reward: { heroXp: 200, items: [{ item: 'coin_pouch', qty: 2 }] },
    go: { tab: 'village', section: 'map' },
  },
  {
    title: 'Gesamtlevel 50',
    hint: 'Jede Fertigkeit zählt. Abwechslung lohnt sich.',
    icon: '🏝️',
    condition: { kind: 'totalLevel', gte: 50 },
    reward: { gold: 800, research: 60 },
    go: { tab: 'skills' },
  },
  {
    title: 'Erforsche eine Technologie',
    hint: 'Mehr → Forschung: Forschungspunkte aus allen Aktionen.',
    icon: '🔬',
    condition: { kind: 'stat', key: 'techsResearched', gte: 1 },
    reward: { research: 80, essence: 30 },
    go: { tab: 'menu', section: 'research' },
  },
  {
    title: 'Baue den Inselhafen',
    hint: 'Marktplatz → Inselhafen: Inselwaren werden Rohstoffe.',
    icon: '⚓',
    condition: { kind: 'building', id: 'harbor', gte: 1 },
    reward: { resources: 1200 },
    go: { tab: 'village', section: 'center' },
  },
  {
    title: 'Heldenstufe 10',
    hint: 'Abenteuer, Riss und Raubzüge geben Helden-XP.',
    icon: '⭐',
    condition: { kind: 'heroLevel', gte: 10 },
    reward: { heroItem: 2, essence: 60 },
    go: { tab: 'rift', section: 'adventures' },
  },
  {
    title: 'Überlebe 10 Minuten im Riss',
    hint: 'Riss-Talente und Ausrüstung machen dich stärker.',
    icon: '🛡️',
    condition: { kind: 'riftMinutes', gte: 10 },
    reward: { essence: 120, items: [{ item: 'dungeon_chest', qty: 1 }] },
    go: { tab: 'rift', section: 'start' },
  },
  {
    title: 'Wehre eine Riss-Invasion ab',
    hint: 'Mauer, Speerträger und dein Held verteidigen.',
    icon: '🧱',
    condition: { kind: 'stat', key: 'villageInvasionsRepelled', gte: 1 },
    reward: { essence: 80, resources: 1500 },
    go: { tab: 'village', section: 'military' },
  },
  {
    title: '300 Einwohner',
    hint: 'Jede Feld- und Gebäudestufe bringt Einwohner.',
    icon: '👥',
    condition: { kind: 'stat', key: 'villagePopulation', gte: 300 },
    reward: { gold: 3000, heroXp: 500 },
    go: { tab: 'village', section: 'fields' },
  },
  {
    title: 'Entdecke eine Evolution',
    hint: 'Max-Waffe + passendes Passiv + Truhe von Elite oder Boss.',
    icon: '✨',
    condition: { kind: 'evolutions', gte: 1 },
    reward: { essence: 200, heroItem: 2 },
    go: { tab: 'rift', section: 'start' },
  },
  {
    title: 'Gründe ein zweites Dorf',
    hint: 'Residenz 10, 3 Siedler und genug Kulturpunkte.',
    icon: '🧳',
    condition: { kind: 'stat', key: 'villagesFounded', gte: 1 },
    reward: { resources: 3000, essence: 150 },
    go: { tab: 'village', section: 'empire' },
  },
  {
    title: 'Annektiere eine Oase',
    hint: 'Oase räumen, Held daheim, Residenz Stufe 10.',
    icon: '🏝️',
    condition: { kind: 'stat', key: 'villageOases', gte: 1 },
    reward: { heroItem: 2, resources: 2000 },
    go: { tab: 'village', section: 'map' },
  },
  {
    title: 'Besiege den Prüfer',
    hint: 'Überlebe 15 Minuten im Riss und besiege den Endgegner.',
    icon: '🧑‍⚖️',
    condition: { kind: 'stat', key: 'riftWins', gte: 1 },
    reward: { heroItem: 3, essence: 400 },
    go: { tab: 'rift', section: 'start' },
  },
  {
    title: 'Erste Wiedergeburt',
    hint: 'Mehr → Prestige: Weisheit macht jeden Neustart schneller.',
    icon: '🌅',
    condition: { kind: 'stat', key: 'rebirths', gte: 1 },
    reward: { essence: 300, gold: 10000 },
    go: { tab: 'menu', section: 'prestige' },
  },
  {
    title: 'Heldenstufe 30',
    hint: 'Legendäre Ausrüstung wartet in schweren Abenteuern.',
    icon: '👑',
    condition: { kind: 'heroLevel', gte: 30 },
    reward: { heroItem: 3, avatar: '🧙‍♂️' },
    go: { tab: 'rift', section: 'adventures' },
  },
  {
    title: 'Gesamtlevel 500',
    hint: 'Der Teilchenbeschleuniger ruft.',
    icon: '⚛️',
    condition: { kind: 'totalLevel', gte: 500 },
    reward: { essence: 1000, items: [{ item: 'dungeon_chest', qty: 3 }] },
    go: { tab: 'skills' },
  },
];

// --- Porträt-Rahmen (Kosmetik) -----------------------------------------------------------------

export type FrameCondition =
  | { stat: string; gte: number }
  | { totalLevel: number }
  | { achievements: number }
  /** Highest Meisterschafts-Pool of any skill (0–1). */
  | { masteryPool: number };

export interface FrameDef {
  id: string;
  name: string;
  icon: string;
  /** Ring colour and glow of the hero portrait. */
  ring: string;
  glow: string;
  hint: string;
  unlock?: FrameCondition;
}

export const FRAMES: FrameDef[] = [
  {
    id: 'gold',
    name: 'Goldrand',
    icon: '🟡',
    ring: '#ffd166',
    glow: 'rgba(124, 92, 255, 0.6)',
    hint: 'Für alle – Held sein reicht.',
  },
  {
    id: 'leaf',
    name: 'Waldkranz',
    icon: '🌿',
    ring: '#5fbf6a',
    glow: 'rgba(95, 191, 106, 0.6)',
    hint: 'Gesamtlevel 250',
    unlock: { totalLevel: 250 },
  },
  {
    id: 'royal',
    name: 'Königsrahmen',
    icon: '👑',
    ring: '#c58bff',
    glow: 'rgba(197, 139, 255, 0.6)',
    hint: 'Ein zweites Dorf gründen',
    unlock: { stat: 'villagesFounded', gte: 1 },
  },
  {
    id: 'ember',
    name: 'Glutring',
    icon: '🔥',
    ring: '#ff7a3d',
    glow: 'rgba(255, 122, 61, 0.65)',
    hint: 'Einen Riss-Lauf gewinnen',
    unlock: { stat: 'riftWins', gte: 1 },
  },
  {
    id: 'frost',
    name: 'Montagsfrost',
    icon: '❄️',
    ring: '#9be7ff',
    glow: 'rgba(155, 231, 255, 0.6)',
    hint: 'Den Wochenboss besiegen',
    unlock: { stat: 'weeklyWins', gte: 1 },
  },
  {
    id: 'collector',
    name: 'Sammlerrahmen',
    icon: '📗',
    ring: '#e6c34a',
    glow: 'rgba(230, 195, 74, 0.6)',
    hint: '5 Sammelbuch-Sets abschließen',
    unlock: { stat: 'collectionsDone', gte: 5 },
  },
  {
    id: 'master',
    name: 'Meisterring',
    icon: '🏅',
    ring: '#ffe066',
    glow: 'rgba(255, 224, 102, 0.75)',
    hint: 'Ein Meisterschafts-Pool auf 50 %',
    unlock: { masteryPool: 0.5 },
  },
  {
    id: 'cosmic',
    name: 'Kosmischer Rahmen',
    icon: '🌌',
    ring: '#5ef2ff',
    glow: 'rgba(94, 242, 255, 0.7)',
    hint: 'Einmal wiedergeboren',
    unlock: { stat: 'rebirths', gte: 1 },
  },
  {
    id: 'legend',
    name: 'Legendenrahmen',
    icon: '💖',
    ring: '#ff5ec4',
    glow: 'rgba(255, 94, 196, 0.7)',
    hint: '150 Erfolge',
    unlock: { achievements: 150 },
  },
];

export const FRAME_MAP = new Map(FRAMES.map((f) => [f.id, f]));

/** Inselschmuck: 3D decorations on the island, unlocked across all systems (purely cosmetic). */
export interface DecorDef {
  id: string;
  name: string;
  icon: string;
  hint: string;
  unlock: FrameCondition;
}

export const DECORS: DecorDef[] = [
  {
    id: 'lanterns',
    name: 'Laternenweg',
    icon: '🏮',
    hint: '100 Rituale im Schrein',
    unlock: { stat: 'ritesPerformed', gte: 100 },
  },
  {
    id: 'pumpkins',
    name: 'Kürbisbeet',
    icon: '🎃',
    hint: '100 Ernten',
    unlock: { stat: 'harvests', gte: 100 },
  },
  {
    id: 'statue',
    name: 'Heldenstatue',
    icon: '🗿',
    hint: '25 Erfolge',
    unlock: { achievements: 25 },
  },
  {
    id: 'fountain',
    name: 'Springbrunnen',
    icon: '⛲',
    hint: 'Gesamtlevel 300',
    unlock: { totalLevel: 300 },
  },
  {
    id: 'banners',
    name: 'Siegesbanner',
    icon: '🚩',
    hint: '10 Bosse besiegen',
    unlock: { stat: 'bossKills', gte: 10 },
  },
  {
    id: 'crystal',
    name: 'Ätherkristall',
    icon: '💎',
    hint: '3 Riss-Läufe gewinnen',
    unlock: { stat: 'riftWins', gte: 3 },
  },
  {
    id: 'snowman',
    name: 'Schneemann',
    icon: '☃️',
    hint: 'Einen Yeti am Frostgipfel besiegen',
    unlock: { stat: 'kills.yeti', gte: 1 },
  },
  {
    id: 'lighthouse',
    name: 'Leuchtturm',
    icon: '🗼',
    hint: 'Gesamtlevel 800',
    unlock: { totalLevel: 800 },
  },
  {
    id: 'rainbow',
    name: 'Regenbogen',
    icon: '🌈',
    hint: 'Einmal wiedergeboren',
    unlock: { stat: 'rebirths', gte: 1 },
  },
];

export const DECOR_MAP = new Map(DECORS.map((d) => [d.id, d]));
