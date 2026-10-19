// Typed content definitions. Everything the engine knows about the world comes from here.
// IDs are plain strings so new content never needs engine changes; tests/data.test.ts
// validates that every reference resolves.

export type SkillId = string;
export type ItemId = string;
export type ActionId = string;
export type ToolId = string;

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'peer_reviewed';

export type ItemCategory =
  'log' | 'ore' | 'gem' | 'raw_food' | 'food' | 'consumable' | 'resource' | 'gear' | 'junk';

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
  /** Tech that unlocks this skill (Phase 5). */
  unlockTech?: string;
}

/** Skills that are announced in the UI but not playable yet (motivation teaser). */
export interface ComingSoonSkill {
  name: string;
  icon: string;
  phase: number;
  teaser: string;
}

/**
 * Flat, data-driven modifier map. Values are additive fractions (0.05 = +5 %).
 * Keys: 'xp', 'xp.<skill>', 'speed', 'speed.<skill>', 'double', 'double.<skill>', 'rare', 'gold',
 * 'burn', 'fireDuration', 'offlineHours', 'research', 'helperSpeed', 'combat.accuracy',
 * 'combat.damage', 'combat.defence', 'combat.hp', 'combat.loot', 'wisdom', style-specific
 * 'combat.accuracy.<style>' / 'combat.damage.<style>', 'combat.ammoSave', 'combat.runeSave',
 * 'combat.energy' (special attack charge), 'combat.regen' (extra HP regeneration factor),
 * village: 'village.prod', 'village.defense'; rift run stats: 'rift.might', 'rift.hp', 'rift.speed',
 * 'rift.area', 'rift.luck'.
 */
export type ModifierSet = Partial<Record<string, number>>;

export type ConsumeEffect =
  | { type: 'intelligence'; amount: number }
  | { type: 'tool'; tool: ToolId }
  | { type: 'buff'; buff: string }
  | { type: 'research'; amount: number }
  | { type: 'loot'; table: LootEntry[]; rolls: number }
  | { type: 'gold'; min: number; max: number }
  /** Restores prayer points (Gebete im Kampf). */
  | { type: 'prayer'; amount: number };

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
  /** Drawn icon instead of the emoji in item views (ores and bars look alike as emoji). */
  art?: { kind: 'ore' | 'bar'; color: string };
  /** Hit points restored when eaten in combat. */
  heal?: number;
  /** Equippable gear (Phase 4). */
  equip?: EquipDef;
}

export type EquipSlot =
  | 'weapon'
  | 'shield'
  | 'head'
  | 'cape'
  | 'body'
  | 'hands'
  | 'legs'
  | 'feet'
  | 'ring'
  | 'amulet'
  | 'ammo';
export type CombatStyle = 'melee' | 'ranged' | 'magic';
export type SpellElement = 'arcane' | 'frost' | 'fire' | 'shadow' | 'lightning' | 'void';

export interface EquipDef {
  slot: EquipSlot;
  /** Skill level needed to wear it (e.g. defence 20, ranged 30). */
  req?: { skill: SkillId; level: number };
  /** Weapon style; only meaningful for the weapon slot. */
  style?: CombatStyle;
  /** Attack interval in seconds (weapons). */
  speed?: number;
  attack?: number;
  strength?: number;
  defence?: number;
  /** Extra modifiers while equipped. */
  mods?: ModifierSet;
  /** Element of enchanted ammo (uses the spell weaknesses/resistances). */
  element?: SpellElement;
}

export interface AchievementCondition {
  type: 'stat' | 'level' | 'totalLevel' | 'item' | 'gold' | 'achievements';
  /** Stat key, skill id or item id depending on type. */
  key?: string;
  gte: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  condition: AchievementCondition;
  reward: ModifierSet;
  /** Hidden until unlocked (surprise memes). */
  secret?: boolean;
}

export interface BuffDef {
  id: string;
  name: string;
  icon: string;
  /** Duration in seconds. */
  duration: number;
  mods: ModifierSet;
  desc: string;
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
  /** Sub-group shown in the skill view (e.g. „Barren", „Waffen"). */
  category?: string;
  /** Alchemy analyses: element symbols this action can discover for the codex. */
  elements?: string[];
  /** Tech that must be researched before the action is available. */
  requiresTech?: string;
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
