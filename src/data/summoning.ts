import type { ActionDef, ItemDef, LootEntry, ModifierSet } from './types';

// Beschwörung: charms from monsters + spirit shards + an ingredient = a pouch. Opening a pouch
// summons a familiar for a while (also offline): fighters strike alongside you, helpers speed up
// skills, some carry loot or gold.

export interface FamiliarDef {
  id: string;
  name: string;
  icon: string;
  level: number;
  /** Minutes the familiar stays. */
  minutes: number;
  /** Extra hit up to this damage, on half of your attacks (combat familiars). */
  strike?: number;
  mods: ModifierSet;
  charm: string;
  shards: number;
  extra: { item: string; qty: number };
  xp: number;
  desc: string;
}

export const CHARMS: ItemDef[] = [
  {
    id: 'charm_gold',
    name: 'Goldtalisman',
    icon: '🟡',
    category: 'resource',
    sellPrice: 8,
    desc: 'Monster tragen ihn als Glücksbringer. Hat nicht geholfen.',
  },
  {
    id: 'charm_green',
    name: 'Grüner Talisman',
    icon: '🟢',
    category: 'resource',
    sellPrice: 16,
    desc: 'Riecht nach Wald und Abenteuer.',
  },
  {
    id: 'charm_crimson',
    name: 'Purpurtalisman',
    icon: '🔴',
    category: 'resource',
    sellPrice: 30,
    rarity: 'uncommon',
    desc: 'Pulsiert leicht. Bitte nicht ablecken.',
  },
  {
    id: 'charm_blue',
    name: 'Blauer Talisman',
    icon: '🔵',
    category: 'resource',
    sellPrice: 60,
    rarity: 'rare',
    desc: 'Kühl, tief und voller Möglichkeiten.',
  },
  {
    id: 'spirit_shard',
    name: 'Seelensplitter',
    icon: '💠',
    category: 'resource',
    sellPrice: 3,
    desc: 'Ein Krümel Jenseits. Bindet Vertraute an diese Welt.',
  },
];

/** Charm drops by monster level (added to every non-boss monster). */
export function charmDrops(level: number): LootEntry[] {
  const out: LootEntry[] = [];
  if (level < 40) out.push({ item: 'charm_gold', chance: 0.12 });
  if (level >= 12 && level < 80) out.push({ item: 'charm_green', chance: 0.08 });
  if (level >= 35) out.push({ item: 'charm_crimson', chance: 0.07 });
  if (level >= 65) out.push({ item: 'charm_blue', chance: 0.05 });
  return out;
}

export const FAMILIARS: FamiliarDef[] = [
  {
    id: 'spirit_wolf',
    name: 'Geisterwolf',
    icon: '🐺',
    level: 1,
    minutes: 30,
    strike: 3,
    mods: { 'rift.might': 0.03 },
    charm: 'charm_gold',
    shards: 8,
    extra: { item: 'bones', qty: 2 },
    xp: 12,
    desc: 'Beißt mit, wo du hinschlägst.',
  },
  {
    id: 'forest_sprite',
    name: 'Waldgeist',
    icon: '🧚',
    level: 10,
    minutes: 40,
    mods: { 'speed.woodcutting': 0.1, 'double.woodcutting': 0.05, 'xp.farming': 0.05 },
    charm: 'charm_gold',
    shards: 10,
    extra: { item: 'log_oak', qty: 5 },
    xp: 25,
    desc: '+10 % Holzfäll-Tempo, +5 % doppeltes Holz, +5 % Landwirtschafts-XP.',
  },
  {
    id: 'giant_mole',
    name: 'Riesenmaulwurf',
    icon: '🦫',
    level: 18,
    minutes: 40,
    mods: { 'speed.mining': 0.1, 'double.mining': 0.05, 'speed.archaeology': 0.08 },
    charm: 'charm_green',
    shards: 14,
    extra: { item: 'ore_iron', qty: 5 },
    xp: 40,
    desc: '+10 % Bergbau-Tempo, +5 % doppeltes Erz, schnelleres Graben.',
  },
  {
    id: 'otter',
    name: 'Fischotter',
    icon: '🦦',
    level: 24,
    minutes: 45,
    mods: { 'speed.fishing': 0.1, 'double.fishing': 0.06 },
    charm: 'charm_green',
    shards: 16,
    extra: { item: 'raw_trout', qty: 5 },
    xp: 52,
    desc: '+10 % Angel-Tempo, +6 % doppelter Fang.',
  },
  {
    id: 'ember_imp',
    name: 'Glutkobold',
    icon: '😈',
    level: 30,
    minutes: 45,
    mods: { 'speed.smithing': 0.08, 'speed.cooking': 0.08, burn: 0.2, fireDuration: 0.2 },
    charm: 'charm_green',
    shards: 20,
    extra: { item: 'coal', qty: 10 },
    xp: 66,
    desc: 'Hält Feuer und Esse heiß: +8 % Schmieden und Kochen, weniger Anbrennen.',
  },
  {
    id: 'battle_boar',
    name: 'Kampfeber',
    icon: '🐗',
    level: 40,
    minutes: 45,
    strike: 10,
    mods: { 'combat.defence': 0.05, 'rift.might': 0.05 },
    charm: 'charm_crimson',
    shards: 25,
    extra: { item: 'raw_beef', qty: 5 },
    xp: 90,
    desc: 'Rammt alles, was dich anschaut. +5 % Verteidigung.',
  },
  {
    id: 'sage_owl',
    name: 'Weise Eule',
    icon: '🦉',
    level: 48,
    minutes: 60,
    mods: { xp: 0.06, research: 0.1 },
    charm: 'charm_crimson',
    shards: 25,
    extra: { item: 'feather', qty: 20 },
    xp: 110,
    desc: '+6 % XP auf alles, +10 % Forschung. Schuhu.',
  },
  {
    id: 'unicorn',
    name: 'Heil-Einhorn',
    icon: '🦄',
    level: 55,
    minutes: 50,
    mods: { 'combat.regen': 2, 'combat.hp': 0.06, 'rift.hp': 0.05 },
    charm: 'charm_crimson',
    shards: 30,
    extra: { item: 'apple', qty: 10 },
    xp: 130,
    desc: 'Dreifache Heilung, +6 % Lebenspunkte. Glitzert unverschämt.',
  },
  {
    id: 'gold_beetle',
    name: 'Goldkäfer',
    icon: '🪲',
    level: 60,
    minutes: 60,
    mods: { gold: 0.1, 'combat.loot': 0.1, rare: 0.1 },
    charm: 'charm_crimson',
    shards: 32,
    extra: { item: 'bar_gold', qty: 2 },
    xp: 150,
    desc: 'Trägt Beute: +10 % Gold, +10 % Beute, +10 % Seltenes.',
  },
  {
    id: 'iron_titan',
    name: 'Eisentitan',
    icon: '🗿',
    level: 70,
    minutes: 50,
    strike: 22,
    mods: { 'combat.defence': 0.1, 'rift.might': 0.08 },
    charm: 'charm_blue',
    shards: 40,
    extra: { item: 'bar_iron', qty: 10 },
    xp: 200,
    desc: 'Ein wandelnder Amboss. +10 % Verteidigung.',
  },
  {
    id: 'phoenix',
    name: 'Phönix',
    icon: '🐦‍🔥',
    level: 85,
    minutes: 60,
    strike: 32,
    mods: { 'combat.damage': 0.08, 'combat.regen': 1, 'rift.might': 0.1 },
    charm: 'charm_blue',
    shards: 50,
    extra: { item: 'phoenix_feather', qty: 1 },
    xp: 320,
    desc: 'Brennt für dich: Zusatztreffer, +8 % Schaden, Heilung.',
  },
];

export const FAMILIAR_MAP = new Map(FAMILIARS.map((f) => [f.id, f]));

export const SUMMON_ITEMS: ItemDef[] = [
  ...CHARMS,
  ...FAMILIARS.map((f): ItemDef => ({
    id: `pouch_${f.id}`,
    name: `Beutel: ${f.name}`,
    icon: f.icon,
    category: 'consumable',
    sellPrice: f.level * 3,
    desc: `Öffnen: ${f.name} begleitet dich ${f.minutes} Min. ${f.desc}`,
    consume: { type: 'familiar', familiar: f.id },
  })),
];

export const SUMMON_ACTIONS: ActionDef[] = [
  {
    id: 'sm_shards',
    skill: 'summoning',
    category: 'Seelensplitter',
    name: 'Seelensplitter einfangen',
    icon: '💠',
    levelReq: 1,
    baseTime: 3,
    xp: 4,
    inputs: [],
    outputs: [{ item: 'spirit_shard', qty: 3 }],
    desc: 'Mit einem Netz aus Gebeten. Funktioniert erstaunlich gut.',
  },
  {
    id: 'sm_shards_ecto',
    skill: 'summoning',
    category: 'Seelensplitter',
    name: 'Ektoplasma zersetzen',
    icon: '👻',
    levelReq: 30,
    baseTime: 3,
    xp: 20,
    inputs: [{ item: 'ectoplasm', qty: 1 }],
    outputs: [{ item: 'spirit_shard', qty: 25 }],
  },
  ...FAMILIARS.map((f): ActionDef => ({
    id: `sm_${f.id}`,
    skill: 'summoning',
    category: 'Beschwörungsbeutel',
    name: `Beutel: ${f.name}`,
    icon: f.icon,
    levelReq: f.level,
    baseTime: 3.5,
    xp: f.xp,
    inputs: [{ item: f.charm, qty: 1 }, { item: 'spirit_shard', qty: f.shards }, f.extra],
    outputs: [{ item: `pouch_${f.id}`, qty: 1 }],
  })),
];
