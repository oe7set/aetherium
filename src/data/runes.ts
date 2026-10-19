import type { ActionDef, ItemDef, SpellElement } from './types';

// Magie 2.0: element runes, enchanted arrows and element staffs – all made with Verzauberung.

interface ElementRune {
  element: SpellElement;
  id: string;
  name: string;
  icon: string;
  level: number;
  xp: number;
  /** Element ingredient bound into the essence. */
  input: { item: string; qty: number };
  out: number;
  price: number;
}

const RUNES: ElementRune[] = [
  {
    element: 'fire',
    id: 'rune_fire',
    name: 'Feuerrune',
    icon: '🔥',
    level: 8,
    xp: 12,
    input: { item: 'coal', qty: 1 },
    out: 6,
    price: 4,
  },
  {
    element: 'frost',
    id: 'rune_frost',
    name: 'Frostrune',
    icon: '❄️',
    level: 14,
    xp: 16,
    input: { item: 'herb_mint', qty: 1 },
    out: 6,
    price: 5,
  },
  {
    element: 'lightning',
    id: 'rune_storm',
    name: 'Sturmrune',
    icon: '⚡',
    level: 25,
    xp: 24,
    input: { item: 'feather', qty: 4 },
    out: 6,
    price: 7,
  },
  {
    element: 'shadow',
    id: 'rune_shadow',
    name: 'Schattenrune',
    icon: '🌑',
    level: 38,
    xp: 34,
    input: { item: 'ash', qty: 3 },
    out: 5,
    price: 10,
  },
  {
    element: 'void',
    id: 'rune_void',
    name: 'Leerenrune',
    icon: '🌀',
    level: 55,
    xp: 60,
    input: { item: 'void_shard', qty: 1 },
    out: 8,
    price: 18,
  },
];

interface ElementArrow {
  element: SpellElement;
  id: string;
  name: string;
  icon: string;
  base: string;
  rune: string;
  level: number;
  ranged: number;
  strength: number;
  xp: number;
  price: number;
  desc: string;
}

const ARROWS: ElementArrow[] = [
  {
    element: 'fire',
    id: 'arrow_fire',
    name: 'Feuerpfeile',
    icon: '🔥',
    base: 'arrow_iron',
    rune: 'rune_fire',
    level: 18,
    ranged: 15,
    strength: 14,
    xp: 30,
    price: 6,
    desc: 'Brennen sich durch Spinnennetze und Zombie-Professoren.',
  },
  {
    element: 'frost',
    id: 'arrow_frost',
    name: 'Eispfeile',
    icon: '🧊',
    base: 'arrow_steel',
    rune: 'rune_frost',
    level: 28,
    ranged: 30,
    strength: 19,
    xp: 45,
    price: 12,
    desc: 'Frieren das Ziel manchmal kurz ein. Stark gegen Feuerwesen.',
  },
  {
    element: 'lightning',
    id: 'arrow_storm',
    name: 'Sturmpfeile',
    icon: '⚡',
    base: 'arrow_mithril',
    rune: 'rune_storm',
    level: 40,
    ranged: 45,
    strength: 26,
    xp: 70,
    price: 26,
    desc: 'Golems hassen diesen Trick.',
  },
  {
    element: 'shadow',
    id: 'arrow_shadow',
    name: 'Schattenpfeile',
    icon: '🌑',
    base: 'arrow_adamant',
    rune: 'rune_shadow',
    level: 52,
    ranged: 60,
    strength: 35,
    xp: 95,
    price: 55,
    desc: 'Stehlen ein wenig Leben bei jedem Treffer.',
  },
  {
    element: 'void',
    id: 'arrow_void',
    name: 'Leerenpfeile',
    icon: '🕳️',
    base: 'arrow_rune',
    rune: 'rune_void',
    level: 70,
    ranged: 75,
    strength: 55,
    xp: 140,
    price: 130,
    desc: 'Treffen dort, wo vorher nichts war.',
  },
];

interface ElementStaff {
  element: SpellElement;
  id: string;
  name: string;
  base: string;
  rune: string;
  level: number;
  attack: number;
  magic: number;
  bonus: number;
  xp: number;
  price: number;
}

const STAFFS: ElementStaff[] = [
  {
    element: 'fire',
    id: 'staff_fire',
    name: 'Feuerstab',
    base: 'staff_sapphire',
    rune: 'rune_fire',
    level: 32,
    attack: 26,
    magic: 17,
    bonus: 0.15,
    xp: 120,
    price: 400,
  },
  {
    element: 'frost',
    id: 'staff_frost',
    name: 'Froststab',
    base: 'staff_sapphire',
    rune: 'rune_frost',
    level: 34,
    attack: 26,
    magic: 17,
    bonus: 0.15,
    xp: 125,
    price: 400,
  },
  {
    element: 'lightning',
    id: 'staff_storm',
    name: 'Sturmstab',
    base: 'staff_emerald',
    rune: 'rune_storm',
    level: 50,
    attack: 40,
    magic: 28,
    bonus: 0.15,
    xp: 200,
    price: 900,
  },
  {
    element: 'shadow',
    id: 'staff_shadow',
    name: 'Schattenstab',
    base: 'staff_ruby',
    rune: 'rune_shadow',
    level: 62,
    attack: 56,
    magic: 39,
    bonus: 0.15,
    xp: 280,
    price: 1800,
  },
  {
    element: 'void',
    id: 'staff_void',
    name: 'Leerenstab',
    base: 'staff_diamond',
    rune: 'rune_void',
    level: 80,
    attack: 80,
    magic: 56,
    bonus: 0.2,
    xp: 420,
    price: 4500,
  },
];

const ELEMENT_NAME: Record<SpellElement, string> = {
  arcane: 'Arkan',
  fire: 'Feuer',
  frost: 'Frost',
  lightning: 'Blitz',
  shadow: 'Schatten',
  void: 'Leere',
};

export const RUNE_ITEMS: ItemDef[] = [
  ...RUNES.map((r): ItemDef => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    category: 'resource',
    sellPrice: r.price,
    desc: `Element-Rune für ${ELEMENT_NAME[r.element]}zauber. Wird pro Zauber verbraucht.`,
  })),
  ...ARROWS.map((a): ItemDef => ({
    id: a.id,
    name: a.name,
    icon: a.icon,
    category: 'gear',
    sellPrice: a.price,
    desc: `${a.desc} Munition, Stärke +${a.strength}, Element ${ELEMENT_NAME[a.element]}.`,
    equip: {
      slot: 'ammo',
      strength: a.strength,
      element: a.element,
      req: { skill: 'ranged', level: a.ranged },
    },
  })),
  ...STAFFS.map((st): ItemDef => ({
    id: st.id,
    name: st.name,
    icon: '🪄',
    category: 'gear',
    rarity: st.element === 'void' ? 'epic' : 'rare',
    sellPrice: st.price,
    desc: `Stab mit ${ELEMENT_NAME[st.element]}-Kern: +${Math.round(st.bonus * 100)} % Schaden mit ${ELEMENT_NAME[st.element]}zaubern.`,
    equip: {
      slot: 'weapon',
      style: 'magic',
      speed: 2.4,
      attack: st.attack,
      strength: st.magic,
      mods: { [`combat.element.${st.element}`]: st.bonus },
      req: { skill: 'magic', level: Math.max(1, st.level - 5) },
    },
  })),
];

export const RUNE_ACTIONS: ActionDef[] = [
  ...RUNES.map((r): ActionDef => ({
    id: `bind_${r.id}`,
    skill: 'enchanting',
    category: 'Element-Runen',
    name: `${r.name}n binden`,
    icon: r.icon,
    levelReq: r.level,
    baseTime: 2.4,
    xp: r.xp,
    inputs: [{ item: 'rune_essence', qty: 2 }, r.input],
    outputs: [{ item: r.id, qty: r.out }],
  })),
  ...ARROWS.map((a): ActionDef => ({
    id: `ench_${a.id}`,
    skill: 'enchanting',
    category: 'Element-Pfeile',
    name: `15 ${a.name}`,
    icon: a.icon,
    levelReq: a.level,
    baseTime: 3,
    xp: a.xp,
    inputs: [
      { item: a.base, qty: 15 },
      { item: a.rune, qty: 5 },
    ],
    outputs: [{ item: a.id, qty: 15 }],
  })),
  ...STAFFS.map((st): ActionDef => ({
    id: `ench_${st.id}`,
    skill: 'enchanting',
    category: 'Element-Stäbe',
    name: st.name,
    icon: '🪄',
    levelReq: st.level,
    baseTime: 5,
    xp: st.xp,
    inputs: [
      { item: st.base, qty: 1 },
      { item: st.rune, qty: 60 },
    ],
    outputs: [{ item: st.id, qty: 1 }],
  })),
];
