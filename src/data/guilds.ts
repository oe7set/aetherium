import type { RewardDef } from './progress';

// Zunftaufträge: guild orders that ask for products of several skills at once. Reputation with a
// guild raises the rewards and, from rank 3, opens an extra order slot.

export interface GuildDef {
  id: string;
  name: string;
  icon: string;
  /** Skills whose products this guild orders. */
  skills: string[];
  desc: string;
}

export const GUILDS: GuildDef[] = [
  {
    id: 'smiths',
    name: 'Schmiedezunft',
    icon: '⚒️',
    skills: ['smithing', 'crafting', 'fletching', 'construction', 'jewelcrafting'],
    desc: 'Bestellt Barren, Waffen, Bögen, Bretter und Schmuck.',
  },
  {
    id: 'kitchen',
    name: 'Küchengilde',
    icon: '🍲',
    skills: ['cooking', 'brewing', 'husbandry', 'fishing', 'farming'],
    desc: 'Will Essen, Getränke, Milch, Wolle und frischen Fisch.',
  },
  {
    id: 'arcane',
    name: 'Arkaner Zirkel',
    icon: '🔮',
    skills: ['enchanting', 'alchemy', 'magic', 'arcane', 'summoning', 'faith'],
    desc: 'Sammelt Runen, Tränke, Beutel und Verzaubertes.',
  },
  {
    id: 'explorers',
    name: 'Entdeckerbund',
    icon: '🧭',
    skills: ['woodcutting', 'mining', 'hunting', 'cartography', 'archaeology', 'thieving'],
    desc: 'Braucht Holz, Erz, Felle, Karten und Fundstücke.',
  },
];

export const GUILD_MAP = new Map(GUILDS.map((g) => [g.id, g]));

export const GUILD = {
  /** Open orders (plus one from rank 3 of any guild). */
  slots: 3,
  /** Seconds an order stays on the board. */
  duration: 8 * 3600,
  /** Seconds of work an order line aims at (at base speed). */
  lineSeconds: 150,
  /** Gold = sell value × this. */
  goldMult: 3,
  /** XP for the producing skill = action XP × amount × this. */
  xpMult: 0.5,
  /** Reputation per rank. */
  repPerRank: 100,
  maxRank: 10,
  /** Reward bonus per rank. */
  rankBonus: 0.1,
  /** Rank that opens the extra order slot. */
  extraSlotRank: 3,
};

export const GUILD_RANKS = [
  'Fremde·r',
  'Lehrling',
  'Geselle',
  'Vertraute·r',
  'Meister·in',
  'Zunftrat',
  'Ehrenmitglied',
  'Großmeister·in',
  'Legende',
  'Gildenherz',
  'Unsterblich',
];

/** Extra reward on every completed order from rank 5. */
export const GUILD_MASTER_BONUS: RewardDef = { items: [{ item: 'coin_pouch', qty: 1 }] };
