import type { ComingSoonSkill, SkillDef } from './types';

export const SKILLS: SkillDef[] = [
  {
    id: 'woodcutting',
    name: 'Holzfällen',
    icon: '🪓',
    color: '#6fbf4a',
    group: 'gathering',
    usesTools: true,
    desc: 'Bäume fällen. Die älteste Form der Ressourcen-Akquise – noch vor dem Venture-Capital.',
  },
  {
    id: 'mining',
    name: 'Bergbau',
    icon: '⛏️',
    color: '#b0876a',
    group: 'gathering',
    usesTools: true,
    desc: 'Steine hauen, bis sie wertvoll werden. Diamanten sind auch nur Kohle mit gutem Zeitmanagement.',
  },
  {
    id: 'firemaking',
    name: 'Feuermachen',
    icon: '🔥',
    color: '#ff8a3d',
    group: 'processing',
    desc: 'Exotherme Oxidation, für Fortgeschrittene. Hält das Lagerfeuer am Brennen: +5 % XP auf alles.',
  },
  {
    id: 'cooking',
    name: 'Kochen',
    icon: '🍳',
    color: '#f2c94c',
    group: 'processing',
    desc: 'Maillard-Reaktion meets Fantasy. Braucht ein brennendes Lagerfeuer. Anbrennen ist Teil der Lernkurve.',
  },
];

export const COMING_SOON_SKILLS: ComingSoonSkill[] = [
  {
    name: 'Schmelzen & Schmieden',
    icon: '🔨',
    phase: 3,
    teaser: 'Erz rein, Barren raus, Werkzeug drauf.',
  },
  { name: 'Angeln', icon: '🎣', phase: 3, teaser: 'Schrödingers Fisch wartet. Oder auch nicht.' },
  { name: 'Nahkampf', icon: '⚔️', phase: 4, teaser: 'Problemlösung durch stumpfe Gewalt.' },
  { name: 'Fernkampf', icon: '🏹', phase: 4, teaser: 'Ballistik, aber mit Federn.' },
  { name: 'Magie', icon: '🪄', phase: 4, teaser: 'Hinreichend fortschrittliche Technologie.' },
  { name: 'Verteidigung', icon: '🛡️', phase: 4, teaser: 'Die beste Attacke ist ein gutes Schild.' },
  { name: 'Lebenspunkte', icon: '❤️', phase: 4, teaser: 'Wichtiger als man denkt.' },
  {
    name: 'Forschung',
    icon: '🔬',
    phase: 5,
    teaser: 'Vom Rad zum Warp-Antrieb. Peer-Review inklusive.',
  },
  { name: 'Alchemie', icon: '🧪', phase: 5, teaser: 'Chemie, bevor sie seriös wurde.' },
  { name: 'Verzauberung', icon: '✨', phase: 5, teaser: 'Runen, Glanz und ein bisschen Glitzer.' },
  {
    name: 'Landwirtschaft',
    icon: '🌾',
    phase: 5,
    teaser: 'Mendel hätte seine Freude an diesen Erbsen.',
  },
  { name: 'Handwerk', icon: '🪚', phase: 5, teaser: 'IKEA, aber mit Zaubersprüchen.' },
  { name: 'Jagen', icon: '🦌', phase: 5, teaser: 'Fallen stellen, Geduld haben, Felle zählen.' },
  {
    name: 'Arkanes Schürfen',
    icon: '🔮',
    phase: 5,
    teaser: 'Mana-Kristalle: wie Erz, nur schimmernder.',
  },
];
