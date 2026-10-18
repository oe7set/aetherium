import type { ItemDef } from './types';

// Sell prices roughly track the time it takes to get the item (see docs/BALANCING.md).

const LOGS: ItemDef[] = [
  { id: 'log_oak', name: 'Eichenholz', icon: '🪵', category: 'log', sellPrice: 1, desc: 'Solide, zuverlässig, ein bisschen langweilig. Wie ein gutes Backup.' },
  { id: 'log_birch', name: 'Birkenholz', icon: '🪵', category: 'log', sellPrice: 3, desc: 'Weiße Rinde, schwarzer Humor.' },
  { id: 'log_willow', name: 'Weidenholz', icon: '🪵', category: 'log', sellPrice: 6, desc: 'Biegsam. Hat in der Schule Yoga gemacht.' },
  { id: 'log_maple', name: 'Ahornholz', icon: '🪵', category: 'log', sellPrice: 12, desc: 'Riecht leicht nach Pfannkuchen. Wissenschaftlich unbestätigt.' },
  { id: 'log_yew', name: 'Eibenholz', icon: '🪵', category: 'log', sellPrice: 25, desc: 'Giftig, edel, unverschämt teuer. Die Diva des Waldes.' },
  { id: 'log_magic', name: 'Zauberholz', icon: '✨', category: 'log', sellPrice: 50, desc: 'Funkelt verdächtig. Entspricht keiner DIN-Norm.' },
  { id: 'log_redwood', name: 'Mammutholz', icon: '🌲', category: 'log', sellPrice: 90, desc: 'Älter als die meisten Königreiche. Und besser erhalten.' },
  { id: 'log_yggdrasil', name: 'Yggdrasil-Splitter', icon: '🌳', category: 'log', sellPrice: 200, rarity: 'epic', desc: 'Ein Splitter des Weltenbaums. Enthält Spuren von neun Welten und Nüssen.' },
];

const ORES: ItemDef[] = [
  { id: 'ore_copper', name: 'Kupfererz', icon: '🟠', category: 'ore', sellPrice: 2, desc: 'Leitet Strom. Leider gibt es noch keinen.' },
  { id: 'ore_tin', name: 'Zinnerz', icon: '⚪', category: 'ore', sellPrice: 2, desc: 'Kupfers bester Freund. Zusammen sind sie Bronze.' },
  { id: 'ore_iron', name: 'Eisenerz', icon: '🔩', category: 'ore', sellPrice: 6, desc: 'Fe. Kurz und knapp, wie es sich für ein Element gehört.' },
  { id: 'coal', name: 'Kohle', icon: '⚫', category: 'resource', sellPrice: 9, desc: 'Brennt lange und heiß. Klimaneutral nur in Fantasywelten.' },
  { id: 'ore_silver', name: 'Silbererz', icon: '🥈', category: 'ore', sellPrice: 14, desc: 'Werwölfe hassen diesen Trick.' },
  { id: 'ore_gold', name: 'Golderz', icon: '🥇', category: 'ore', sellPrice: 25, desc: 'Au! Das tut weh im Geldbeutel – im positiven Sinn.' },
  { id: 'ore_mithril', name: 'Mithrilerz', icon: '🔷', category: 'ore', sellPrice: 40, desc: 'Leicht wie eine Feder, hart wie die Deadline.' },
  { id: 'ore_adamant', name: 'Adamanterz', icon: '🟢', category: 'ore', sellPrice: 70, desc: 'Grün, schwer, unnachgiebig. Wie ein Steuerprüfer.' },
  { id: 'ore_runite', name: 'Runiterz', icon: '🔵', category: 'ore', sellPrice: 130, desc: 'Respawnt nur, wenn niemand hinsieht.' },
  { id: 'ore_uranium', name: 'Uranerz', icon: '☢️', category: 'ore', sellPrice: 220, rarity: 'rare', desc: 'Leuchtet im Dunkeln. Bitte nicht ablecken.' },
  { id: 'dark_matter', name: 'Dunkle Materie', icon: '🌑', category: 'ore', sellPrice: 500, rarity: 'epic', desc: 'Macht 27 % des Universums aus und 0 % deines Verständnisses.' },
];

const GEMS: ItemDef[] = [
  { id: 'gem_sapphire', name: 'Saphir', icon: '💎', category: 'gem', sellPrice: 40, rarity: 'uncommon', desc: 'Blau wie ein Bildschirm voller Fehlermeldungen.' },
  { id: 'gem_emerald', name: 'Smaragd', icon: '💚', category: 'gem', sellPrice: 80, rarity: 'uncommon', desc: 'Grün vor Neid auf den Rubin.' },
  { id: 'gem_ruby', name: 'Rubin', icon: '❤️', category: 'gem', sellPrice: 150, rarity: 'rare', desc: 'Al₂O₃ mit einer Prise Chrom und viel Selbstbewusstsein.' },
  { id: 'gem_diamond', name: 'Diamant', icon: '💠', category: 'gem', sellPrice: 400, rarity: 'epic', desc: 'Kohle, die unter Druck nicht eingeknickt ist. Vorbildlich.' },
];

const FOOD: ItemDef[] = [
  { id: 'apple', name: 'Apfel', icon: '🍎', category: 'raw_food', sellPrice: 1, desc: 'An apple a day keeps the Heiler away.' },
  { id: 'mushroom', name: 'Waldpilz', icon: '🍄', category: 'raw_food', sellPrice: 2, desc: 'Garantiert nicht giftig. Zu 87 %.' },
  { id: 'egg', name: 'Ei', icon: '🥚', category: 'raw_food', sellPrice: 3, desc: 'Beantwortet endgültig, was zuerst da war: das Vogelnest.' },
  { id: 'potato', name: 'Kartoffel', icon: '🥔', category: 'raw_food', sellPrice: 2, desc: 'Erdapfel. Grundnahrungsmittel. Basis jeder Zivilisation.' },
  { id: 'raw_chicken', name: 'Rohes Hühnchen', icon: '🍗', category: 'raw_food', sellPrice: 4, desc: 'Bitte nicht roh essen. Salmonellen sind kein Buff.' },
  { id: 'raw_beef', name: 'Rohes Rindfleisch', icon: '🥩', category: 'raw_food', sellPrice: 8, desc: 'Muuuh. Ehemals.' },
  { id: 'flour', name: 'Mehl', icon: '🌾', category: 'raw_food', sellPrice: 3, desc: 'Gemahlener Weizen. Staubt mehr als ein Archiv.' },
  { id: 'baked_apple', name: 'Bratapfel', icon: '🍎', category: 'food', sellPrice: 4, desc: 'Riecht nach Winter und guten Entscheidungen.' },
  { id: 'mushroom_pan', name: 'Pilzpfanne', icon: '🍳', category: 'food', sellPrice: 8, desc: 'Mit Butter. Alles ist besser mit Butter.' },
  { id: 'fried_egg', name: 'Spiegelei', icon: '🍳', category: 'food', sellPrice: 10, desc: 'Sunny Side Up – die einzige Seite, die zählt.' },
  { id: 'baked_potato', name: 'Ofenkartoffel', icon: '🥔', category: 'food', sellPrice: 9, desc: 'Ein Klassiker, so zuverlässig wie die Thermodynamik.' },
  { id: 'roast_chicken', name: 'Brathähnchen', icon: '🍗', category: 'food', sellPrice: 16, desc: 'Knusprig. Hat die Frage „Warum über die Straße?“ nicht mehr nötig.' },
  { id: 'bread', name: 'Brot', icon: '🍞', category: 'food', sellPrice: 14, desc: 'Das Beste seit geschnittenem Brot.' },
  { id: 'steak', name: 'Steak', icon: '🥩', category: 'food', sellPrice: 30, desc: 'Medium rare. Die einzige Rarität, die man essen kann.' },
  { id: 'mushroom_stew', name: 'Pilzeintopf', icon: '🍲', category: 'food', sellPrice: 40, desc: 'Ein Eintopf voller Myzel-Netzwerk. Das Internet des Waldes, jetzt essbar.' },
  { id: 'apple_pie', name: 'Apfelkuchen', icon: '🥧', category: 'food', sellPrice: 60, desc: 'π-förmig. Mathematisch und kulinarisch einwandfrei.' },
  { id: 'feast', name: 'Festmahl der Gelehrten', icon: '🍱', category: 'food', sellPrice: 160, rarity: 'rare', desc: 'Ein Bankett, das Doktoranden zu Tränen rührt (sie haben seit Wochen nichts Warmes gegessen).' },
  { id: 'burnt_food', name: 'Verkohlte Masse', icon: '🪨', category: 'junk', sellPrice: 0, desc: 'Ehemals Essen. Jetzt ein interessanter Kohlenstoff-Allotrop.' },
];

const MISC: ItemDef[] = [
  { id: 'ash', name: 'Asche', icon: '🌫️', category: 'resource', sellPrice: 1, desc: 'Enthält Spuren von Ambition. Wird später Alchemisten interessieren.' },
  {
    id: 'bird_nest',
    name: 'Vogelnest',
    icon: '🪺',
    category: 'consumable',
    sellPrice: 10,
    rarity: 'uncommon',
    desc: 'Fiel dir auf den Kopf. Öffnen, um den Inhalt zu prüfen.',
    consume: {
      type: 'loot',
      rolls: 1,
      table: [
        { item: 'egg', chance: 0.55, min: 1, max: 3 },
        { item: 'apple', chance: 0.25, min: 2, max: 5 },
        { item: 'gold_ring', chance: 0.15 },
        { item: 'gem_sapphire', chance: 0.04, rare: true },
        { item: 'gem_emerald', chance: 0.01, rare: true },
      ],
    },
  },
  { id: 'gold_ring', name: 'Goldring', icon: '💍', category: 'resource', sellPrice: 60, rarity: 'uncommon', desc: 'Ein Ring, sie alle zu verkaufen.' },
  {
    id: 'newton_apple',
    name: 'Newton-Apfel',
    icon: '🍏',
    category: 'consumable',
    sellPrice: 100,
    rarity: 'rare',
    desc: 'Fiel dir auf den Kopf, und plötzlich ergibt alles Sinn. Essen: +1 Intelligenz (+0,2 % XP auf alles, dauerhaft).',
    consume: { type: 'intelligence', amount: 1 },
  },
  {
    id: 'coin_pouch',
    name: 'Verlorener Geldbeutel',
    icon: '👛',
    category: 'consumable',
    sellPrice: 5,
    desc: 'Irgendein Zwerg vermisst ihn. Finderlohn ist Selbstbedienung.',
    consume: { type: 'gold', min: 10, max: 60 },
  },
  { id: 'fossil', name: 'Fossil', icon: '🐚', category: 'resource', sellPrice: 35, rarity: 'uncommon', desc: 'Ein Trilobit. Hat das Kambrium überlebt, aber nicht dich.' },
  { id: 'mitochondrion', name: 'Versteinertes Mitochondrium', icon: '🦠', category: 'resource', sellPrice: 300, rarity: 'epic', desc: 'Das Kraftwerk der Zelle. Seit 2 Mrd. Jahren außer Betrieb.' },
];

export const ITEMS: ItemDef[] = [...LOGS, ...ORES, ...GEMS, ...FOOD, ...MISC];
