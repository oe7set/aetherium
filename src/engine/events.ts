import type { CombatStyle, SkillId } from '../data/types';

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
  /** An action reached a new mastery level. */
  | { type: 'mastery'; actionId: string; level: number }
  /** First time an item that belongs to a Sammelbuch set was obtained. */
  | { type: 'albumFound'; item: string; set: string; have: number; total: number }
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
  | {
      type: 'hit';
      target: 'monster' | 'player';
      damage: number;
      special?: boolean;
      heavy?: boolean;
      blocked?: boolean;
    }
  | { type: 'windup'; monster: string }
  | { type: 'prayerEmpty' }
  | { type: 'utilityCast'; spell: string }
  | { type: 'islandBuilt'; building: string; level: number }
  | { type: 'caught'; actionId: string; damage: number; stun: number }
  | { type: 'fell'; actionId: string; damage: number }
  | { type: 'invented'; invention: string; level: number }
  | { type: 'forged'; slot: string; level: number; result: string }
  | { type: 'worldBoss'; boss: string; event: 'spawn' | 'phase' | 'killed' | 'escaped' }
  | { type: 'familiarSummoned'; familiar: string }
  | { type: 'familiarLeft'; familiar: string }
  | { type: 'slayerTask'; monster: string; count: number }
  | { type: 'slayerTaskDone'; monster: string; points: number; streak: number }
  | { type: 'dodged'; monster: string }
  | { type: 'special'; style: CombatStyle }
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
  | { type: 'villageBuilt'; village: string; name: string; level: number; field: boolean }
  | { type: 'villageTrained'; village: string; troop: string }
  | { type: 'villageResearched'; troop: string }
  | { type: 'villageReport'; kind: string; won: boolean; title: string }
  | { type: 'villageFounded'; name: string }
  | { type: 'villageCelebration'; village: string; cp: number }
  | {
      type: 'riftFinished';
      essence: number;
      won: boolean;
      time: number;
      kills: number;
      record: boolean;
    }
  | { type: 'riftEcho'; essence: number }
  | { type: 'relicFound'; relic: string }
  | { type: 'guildOrder'; guild: string; gold: number; rank: number }
  | { type: 'heroLevel'; level: number }
  | { type: 'heroDied' }
  | { type: 'heroRevived' }
  | { type: 'heroArrived' }
  | {
      type: 'heroAdventure';
      name: string;
      success: boolean;
      xp: number;
      item: string | null;
      tier: number;
    };

export type Emit = (event: GameEvent) => void;

export const noopEmit: Emit = () => {};

/** Convenience collector for tests and the live loop. */
export function collector(): { events: GameEvent[]; emit: Emit } {
  const events: GameEvent[] = [];
  return { events, emit: (e) => events.push(e) };
}
