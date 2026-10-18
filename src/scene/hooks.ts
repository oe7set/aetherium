import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getAction } from '../data';
import type { GameState } from '../engine';
import { useGame } from '../store/gameStore';

/**
 * Calls `onPulse` (inside the render loop) whenever a counter derived from the game state increases.
 * Used for "tree falls on completion" style feedback without React re-renders.
 */
export function useCounterPulse(
  read: (s: GameState) => number,
  onPulse: (delta: number) => void,
): void {
  const last = useRef<number | null>(null);
  useFrame(() => {
    const value = read(useGame.getState().game);
    if (last.current !== null && value > last.current) onPulse(value - last.current);
    last.current = value;
  });
}

/** Current active skill, read without subscribing React. */
export function activeSkillNow(): string | null {
  const a = useGame.getState().game.active;
  return a ? getAction(a.actionId).skill : null;
}
