import { useEffect } from 'react';
import { useGame } from '../store/gameStore';

/** Read by canvas renderers (rift screen shake) without React. */
export let motionReduced = false;

const TEXT_SCALE = { normal: '100%', large: '112.5%', xlarge: '125%' } as const;

/** Applies text size, reduced motion and high contrast to <html>. */
export function useAccessibility(): void {
  const text = useGame((s) => s.game.settings.textSize);
  const reduce = useGame((s) => s.game.settings.reduceMotion);
  const contrast = useGame((s) => s.game.settings.highContrast);
  useEffect(() => {
    const root = document.documentElement;
    const systemReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    motionReduced = reduce || systemReduce;
    root.style.fontSize = TEXT_SCALE[text] ?? '100%';
    root.classList.toggle('reduce-motion', motionReduced);
    root.classList.toggle('high-contrast', contrast);
  }, [text, reduce, contrast]);
}
