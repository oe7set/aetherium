import type { SkillId } from '../data/types';

export type StopReason =
  'noInputs' | 'inventoryFull' | 'noFire' | 'levelTooLow' | 'locked' | 'manual';
export type CombatStopReason = 'manual' | 'noAmmo' | 'noRunes' | 'died';

/** Everything the engine wants the UI (feed, popups, sounds) to know about. */
export type GameEvent =
  | { type: 'xp'; skill: SkillId; amount: number }
  | { type: 'itemGained'; item: string; qty: number }
  | { type: 'itemConsumed'; item: string; qty: number }
  | { type: 'itemLost'; item: string; qty: number }
  | { type: 'rareDrop'; item: string; qty: number }
  | { type: 'levelUp'; skill: SkillId; level: number }
  | { type: 'burnt'; item: string }
  | { type: 'actionComplete'; actionId: string }
  | { type: 'actionStarted'; actionId: string }
  | { type: 'actionStopped'; actionId: string; reason: StopReason; missingItem?: string }
  | { type: 'fireLit' }
  | { type: 'fireOut' }
  | { type: 'gold'; amount: number }
  | { type: 'intelligence'; amount: number }
  | { type: 'achievement'; id: string }
  | { type: 'buffStarted'; id: string }
  | { type: 'buffExpired'; id: string }
  | { type: 'marketTrend'; item: string; mult: number }
  | { type: 'toolUnlocked'; tool: string }
  | { type: 'combatStarted'; monster: string }
  | { type: 'monsterSpawned'; monster: string }
  | { type: 'combatStopped'; monster: string; reason: CombatStopReason }
  | { type: 'hit'; target: 'monster' | 'player'; damage: number }
  | { type: 'monsterKilled'; monster: string }
  | { type: 'bossPhase'; monster: string; phase: number }
  | { type: 'dungeonCompleted'; dungeon: string }
  | { type: 'playerDied'; monster: string }
  | { type: 'ate'; item: string; heal: number }
  | { type: 'techResearched'; tech: string }
  | { type: 'elementDiscovered'; symbol: string }
  | { type: 'harvested'; plot: number; item: string; qty: number; mutated?: string }
  | { type: 'helperStopped'; helper: number; actionId: string; reason: StopReason }
  | { type: 'research'; amount: number }
  | { type: 'prestige'; layer: 'rebirth' | 'paradigm' | 'bigbang'; gain: number }
  | { type: 'petFound'; pet: string }
  | { type: 'questCompleted'; quest: string }
  | { type: 'taskCompleted'; task: string }
  | { type: 'colonyStarted' }
  | { type: 'colonySetupDone' }
  | { type: 'colonyRoll'; roll: number; gained: number }
  | { type: 'colonyRobber'; by: string; victim: string | null; res: string | null; lost: number }
  | {
      type: 'colonyBuilt';
      /** Persona id ('you' for the player). */
      player: string;
      kind: 'road' | 'settlement' | 'city' | 'building';
      id?: string;
      setup?: boolean;
    }
  | { type: 'colonyDevCard'; card: string }
  | { type: 'colonyDevPlayed'; card: string }
  | { type: 'colonyOffer'; from: string }
  | { type: 'colonyQuip'; player: string; line: number }
  | { type: 'colonyFinished'; winner: string; place: number }
  | { type: 'colonyClaimed'; fame: number; place: number }
  | {
      type: 'riftFinished';
      essence: number;
      won: boolean;
      time: number;
      kills: number;
      record: boolean;
    }
  | { type: 'riftEcho'; essence: number };

export type Emit = (event: GameEvent) => void;

export const noopEmit: Emit = () => {};

/** Convenience collector for tests and the live loop. */
export function collector(): { events: GameEvent[]; emit: Emit } {
  const events: GameEvent[] = [];
  return { events, emit: (e) => events.push(e) };
}
