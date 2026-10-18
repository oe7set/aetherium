import { getSkill } from '../data';
import type { GameEvent } from '../engine';

/** Asks for permission; returns whether notifications can be shown. */
export async function requestNotifications(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

/** Level-ups and stops while the tab is hidden become system notifications. */
export function notifyInBackground(events: GameEvent[], enabled: boolean): void {
  if (!enabled || typeof document === 'undefined' || document.visibilityState !== 'hidden') return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  for (const e of events) {
    if (e.type === 'levelUp') {
      const skill = getSkill(e.skill);
      new Notification(`${skill.icon} Level ${e.level}!`, {
        body: `${skill.name} ist jetzt Level ${e.level}.`,
        tag: 'levelup',
      });
    } else if (e.type === 'actionStopped' && e.reason === 'inventoryFull') {
      new Notification('🎒 Inventar voll!', {
        body: 'Deine Aktion wurde gestoppt. Mehr Taschen benötigt.',
        tag: 'inventory',
      });
    }
  }
}
