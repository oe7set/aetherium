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
  go: { tab: 'world' | 'skills' | 'inventory' | 'village' | 'rift' | 'menu'; skill?: string };
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
    go: { tab: 'village' },
  },
  {
    title: 'Hauptgebäude auf Stufe 3',
    hint: 'Dorf → Dorf: das Hauptgebäude beschleunigt jeden Bau.',
    icon: '🏛️',
    condition: { kind: 'building', id: 'main', gte: 3 },
    reward: { resources: 500, gold: 200 },
    go: { tab: 'village' },
  },
  {
    title: 'Verteile Attributpunkte',
    hint: 'Held → Held: setze die ersten 4 Punkte.',
    icon: '💪',
    condition: { kind: 'heroPoints', gte: 4 },
    reward: { heroXp: 80, essence: 10 },
    go: { tab: 'rift' },
  },
  {
    title: 'Betritt den Ätherriss',
    hint: 'Held → Riss: überlebe so lange du kannst.',
    icon: '🌀',
    condition: { kind: 'stat', key: 'riftRuns', gte: 1 },
    reward: { essence: 20 },
    go: { tab: 'rift' },
  },
  {
    title: 'Überlebe 3 Minuten im Riss',
    hint: 'Wähle bei Level-Ups Waffen, die zusammenpassen.',
    icon: '⏱️',
    condition: { kind: 'riftMinutes', gte: 3 },
    reward: { essence: 40, heroItem: 1 },
    go: { tab: 'rift' },
  },
  {
    title: 'Bestehe ein Abenteuer',
    hint: 'Held → Abenteuer: schick deinen Helden los.',
    icon: '❗',
    condition: { kind: 'stat', key: 'heroAdventures', gte: 1 },
    reward: { heroXp: 150, resources: 400 },
    go: { tab: 'rift' },
  },
  {
    title: 'Baue eine Kaserne',
    hint: 'Braucht Hauptgebäude 3 und einen Versammlungsplatz.',
    icon: '⚔️',
    condition: { kind: 'building', id: 'barracks', gte: 1 },
    reward: { resources: 600 },
    go: { tab: 'village' },
  },
  {
    title: 'Bilde 10 Truppen aus',
    hint: 'Dorf → Militär: Knüppelbauern sind billig und willig.',
    icon: '🧑‍🌾',
    condition: { kind: 'stat', key: 'villageTroopsTrained', gte: 10 },
    reward: { resources: 700, gold: 300 },
    go: { tab: 'village' },
  },
  {
    title: 'Gewinne einen Raubzug',
    hint: 'Dorf → Karte: tippe ein Räuberlager an.',
    icon: '⛺',
    condition: { kind: 'stat', key: 'villageRaidsWon', gte: 1 },
    reward: { heroXp: 200, items: [{ item: 'coin_pouch', qty: 2 }] },
    go: { tab: 'village' },
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
    go: { tab: 'menu' },
  },
  {
    title: 'Baue den Inselhafen',
    hint: 'Marktplatz → Inselhafen: Inselwaren werden Rohstoffe.',
    icon: '⚓',
    condition: { kind: 'building', id: 'harbor', gte: 1 },
    reward: { resources: 1200 },
    go: { tab: 'village' },
  },
  {
    title: 'Heldenstufe 10',
    hint: 'Abenteuer, Riss und Raubzüge geben Helden-XP.',
    icon: '⭐',
    condition: { kind: 'heroLevel', gte: 10 },
    reward: { heroItem: 2, essence: 60 },
    go: { tab: 'rift' },
  },
  {
    title: 'Überlebe 10 Minuten im Riss',
    hint: 'Riss-Talente und Ausrüstung machen dich stärker.',
    icon: '🛡️',
    condition: { kind: 'riftMinutes', gte: 10 },
    reward: { essence: 120, items: [{ item: 'dungeon_chest', qty: 1 }] },
    go: { tab: 'rift' },
  },
  {
    title: 'Wehre eine Riss-Invasion ab',
    hint: 'Mauer, Speerträger und dein Held verteidigen.',
    icon: '🧱',
    condition: { kind: 'stat', key: 'villageInvasionsRepelled', gte: 1 },
    reward: { essence: 80, resources: 1500 },
    go: { tab: 'village' },
  },
  {
    title: '300 Einwohner',
    hint: 'Jede Feld- und Gebäudestufe bringt Einwohner.',
    icon: '👥',
    condition: { kind: 'stat', key: 'villagePopulation', gte: 300 },
    reward: { gold: 3000, heroXp: 500 },
    go: { tab: 'village' },
  },
  {
    title: 'Entdecke eine Evolution',
    hint: 'Max-Waffe + passendes Passiv + Truhe von Elite oder Boss.',
    icon: '✨',
    condition: { kind: 'evolutions', gte: 1 },
    reward: { essence: 200, heroItem: 2 },
    go: { tab: 'rift' },
  },
  {
    title: 'Gründe ein zweites Dorf',
    hint: 'Residenz 10, 3 Siedler und genug Kulturpunkte.',
    icon: '🧳',
    condition: { kind: 'stat', key: 'villagesFounded', gte: 1 },
    reward: { resources: 3000, essence: 150 },
    go: { tab: 'village' },
  },
  {
    title: 'Annektiere eine Oase',
    hint: 'Oase räumen, Held daheim, Residenz Stufe 10.',
    icon: '🏝️',
    condition: { kind: 'stat', key: 'villageOases', gte: 1 },
    reward: { heroItem: 2, resources: 2000 },
    go: { tab: 'village' },
  },
  {
    title: 'Besiege den Prüfer',
    hint: 'Überlebe 15 Minuten im Riss und besiege den Endgegner.',
    icon: '🧑‍⚖️',
    condition: { kind: 'stat', key: 'riftWins', gte: 1 },
    reward: { heroItem: 3, essence: 400 },
    go: { tab: 'rift' },
  },
  {
    title: 'Erste Wiedergeburt',
    hint: 'Mehr → Prestige: Weisheit macht jeden Neustart schneller.',
    icon: '🌅',
    condition: { kind: 'stat', key: 'rebirths', gte: 1 },
    reward: { essence: 300, gold: 10000 },
    go: { tab: 'menu' },
  },
  {
    title: 'Heldenstufe 30',
    hint: 'Legendäre Ausrüstung wartet in schweren Abenteuern.',
    icon: '👑',
    condition: { kind: 'heroLevel', gte: 30 },
    reward: { heroItem: 3, avatar: '🧙‍♂️' },
    go: { tab: 'rift' },
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
