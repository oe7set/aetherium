import { newGame, type GameState } from '../src/engine/state';
import { xpForLevel } from '../src/engine/xp';

export function gameWith(overrides: Partial<GameState> = {}): GameState {
  return { ...newGame(0), ...overrides };
}

export function setLevel(s: GameState, skill: string, level: number): void {
  s.skills[skill] = { xp: xpForLevel(level) };
}
