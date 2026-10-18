// Typed content definitions. Everything the engine knows about the world comes from here.
// IDs are plain strings so new content never needs engine changes; tests/data.test.ts
// validates that every reference resolves.

export type SkillId = string;
export type ItemId = string;
export type ActionId = string;
export type ToolId = string;

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'peer_reviewed';

export type ItemCategory =
  | 'log'
  | 'ore'
  | 'gem'
  | 'raw_food'
  | 'food'
  | 'consumable'
  | 'resource'
  | 'junk';

export interface SkillDef {
  id: SkillId;
  name: string;
  icon: string;
  /** CSS color used for progress bars and accents. */
  color: string;
  desc: string;
  /** Group shown in the skill list. */
  group: 'gathering' | 'processing' | 'combat' | 'science';
  /** Skills that use tools (axe, pickaxe …) get faster with better tools. */
  usesTools?: boolean;
}

/** Skills that are announced in the UI but not playable yet (motivation teaser). */
export interface ComingSoonSkill {
  name: string;
  icon: string;
  phase: number;
  teaser: string;
}

export type ConsumeEffect =
  | { type: 'intelligence'; amount: number }
  | { type: 'loot'; table: LootEntry[]; rolls: number }
  | { type: 'gold'; min: number; max: number };

export interface ItemDef {
  id: ItemId;
  name: string;
  icon: string;
  category: ItemCategory;
  /** Gold received per unit when sold to the merchant. */
  sellPrice: number;
  desc: string;
  rarity?: Rarity;
  /** If set, the item can be used/opened from the inventory. */
  consume?: ConsumeEffect;
}

export interface ItemStack {
  item: ItemId;
  qty: number;
}

export interface LootEntry {
  item: ItemId;
  /** Probability per roll, 0..1. */
  chance: number;
  min?: number;
  max?: number;
  /** Rare drops trigger special feedback. */
  rare?: boolean;
}

export interface BurnDef {
  /** Burn chance at the action's required level (0..1). */
  chanceAtReq: number;
  /** Level at which the burn chance reaches its floor. */
  stopBurnLevel: number;
  burntItem: ItemId;
}

export interface ActionDef {
  id: ActionId;
  skill: SkillId;
  name: string;
  icon: string;
  levelReq: number;
  /** Seconds per cycle before any speed bonuses. */
  baseTime: number;
  xp: number;
  inputs: ItemStack[];
  outputs: ItemStack[];
  drops?: LootEntry[];
  /** Needs a burning campfire (cooking). */
  requiresFire?: boolean;
  /** Seconds of burn time this action adds to the campfire (firemaking). */
  fuelSeconds?: number;
  burn?: BurnDef;
  desc?: string;
}

export interface ToolDef {
  id: ToolId;
  name: string;
  icon: string;
  skill: SkillId;
  tier: number;
  levelReq: number;
  /** Speed multiplier: action time is divided by this. */
  speed: number;
  price: number;
  desc: string;
}

export interface ShopOffer {
  item: ItemId;
  price: number;
}
