import { t, type MessageKey } from '../i18n';
import type { TabId, UiState } from '../store/gameStore';

export interface TabShortcut {
  icon: string;
  label: string;
  ui: Partial<UiState>;
}

/** Where a re-tap on the active tab leads: the heart of each area. */
export const TAB_HOME: Record<TabId, Partial<UiState>> = {
  world: { agenda: true },
  skills: { skillDetail: false },
  inventory: { inventorySegment: 'items' },
  village: { villageSegment: 'fields' },
  rift: { heroSegment: 'hero' },
  menu: { menuSection: 'home' },
};

const MENU: [UiState['menuSection'], string][] = [
  ['home', '☰'],
  ['empire', '📚'],
  ['pass', '🏅'],
  ['research', '🔬'],
  ['quests', '📋'],
  ['prestige', '🌅'],
  ['achievements', '🏆'],
  ['stats', '📊'],
  ['log', '📜'],
  ['settings', '⚙️'],
  ['save', '💾'],
];

/** Long-press menu per tab: every sub-area one gesture away. */
export function tabShortcuts(tab: TabId): TabShortcut[] {
  switch (tab) {
    case 'world':
      return [
        { icon: '📌', label: 'Was jetzt?', ui: { agenda: true } },
        { icon: '🧭', label: 'Schnellzugriff', ui: { quickNav: true } },
      ];
    case 'skills':
      return [{ icon: '🎯', label: 'Alle Skills', ui: { tab: 'skills', skillDetail: false } }];
    case 'inventory':
      return (
        [
          ['items', '🎒', 'Taschen'],
          ['gear', '🛡️', 'Ausrüstung'],
          ['album', '📗', 'Sammelbuch'],
          ['market', '📈', 'Markt'],
          ['shop', '🏪', 'Krämer'],
          ['tools', '🧰', 'Werkzeuge'],
        ] as [UiState['inventorySegment'], string, string][]
      ).map(([inventorySegment, icon, label]) => ({
        icon,
        label,
        ui: { tab: 'inventory', inventorySegment },
      }));
    case 'village':
      return (
        [
          ['fields', '🌾', 'Felder'],
          ['center', '🏘️', 'Dorf'],
          ['map', '🗺️', 'Karte'],
          ['military', '⚔️', 'Militär'],
          ['market', '⚖️', 'Markt'],
          ['reports', '📜', 'Berichte'],
          ['empire', '👑', 'Reich'],
        ] as [UiState['villageSegment'], string, string][]
      ).map(([villageSegment, icon, label]) => ({
        icon,
        label,
        ui: { tab: 'village', villageSegment },
      }));
    case 'rift':
      return (
        [
          ['hero', '🦸', 'Held'],
          ['adventures', '❗', 'Abenteuer'],
          ['start', '🌀', 'Riss'],
          ['talents', '✨', 'Talente'],
          ['codex', '📖', 'Kodex'],
        ] as [UiState['heroSegment'], string, string][]
      ).map(([heroSegment, icon, label]) => ({ icon, label, ui: { tab: 'rift', heroSegment } }));
    case 'menu':
      return MENU.map(([menuSection, icon]) => ({
        icon,
        label: t(`menu.${menuSection}` as MessageKey),
        ui: { tab: 'menu', menuSection },
      }));
  }
}
