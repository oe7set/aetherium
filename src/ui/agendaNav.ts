import { useEffect, useState } from 'react';
import { agenda, type AgendaTarget } from '../engine';
import { useGame } from '../store/gameStore';

/** Agenda summary, recomputed at most every 1.5 s (it checks many build options – keep phones cool). */
export function useAgendaSummary(): { count: number; rewards: number } {
  const [sum, setSum] = useState({ count: 0, rewards: 0 });
  useEffect(() => {
    const update = () => {
      const items = agenda(useGame.getState().game, Date.now());
      const rewards = items.filter((i) => i.kind === 'reward').length;
      setSum((old) =>
        old.count === items.length && old.rewards === rewards
          ? old
          : { count: items.length, rewards },
      );
    };
    update();
    const id = window.setInterval(update, 1500);
    return () => window.clearInterval(id);
  }, []);
  return sum;
}

/** Jumps to the screen an agenda item points at. */
export function goToAgenda(target: AgendaTarget): void {
  const store = useGame.getState();
  switch (target.area) {
    case 'daily':
      store.setDailyOpen(true);
      break;
    case 'chronicle':
      store.claimChronicle();
      break;
    case 'skills':
      store.setUi({ tab: 'skills', skillDetail: false });
      break;
    case 'skill':
      store.openSkill(target.skill);
      break;
    case 'inventory':
      store.setUi({ tab: 'inventory', inventorySegment: target.section });
      break;
    case 'village':
      store.setUi({ tab: 'village', villageSegment: target.section });
      break;
    case 'hero':
      store.setUi({ tab: 'rift', heroSegment: target.section });
      break;
    case 'menu':
      store.setUi({
        tab: 'menu',
        menuSection: target.section,
        ...(target.sub ? { questSegment: target.sub } : {}),
      });
      break;
  }
}
