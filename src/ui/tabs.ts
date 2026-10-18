import type { MessageKey } from '../i18n';
import type { TabId } from '../store/gameStore';

export const TABS: { id: TabId; icon: string; label: MessageKey }[] = [
  { id: 'world', icon: '🏝️', label: 'tab.world' },
  { id: 'skills', icon: '🎯', label: 'tab.skills' },
  { id: 'inventory', icon: '🎒', label: 'tab.inventory' },
  { id: 'colony', icon: '🏘️', label: 'tab.colony' },
  { id: 'rift', icon: '🌀', label: 'tab.rift' },
  { id: 'menu', icon: '☰', label: 'tab.menu' },
];
