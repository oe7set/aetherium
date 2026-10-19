import { FAMILIAR_MAP, type FamiliarDef } from '../data/summoning';
import { registerTimeEffect } from './actions';
import type { Emit } from './events';
import { invalidateMods, registerModifierSource } from './modifiers';
import type { GameState } from './state';

/** Beschwörung: one familiar at a time, its mods apply while it stays (also offline). */

export function activeFamiliar(s: GameState): FamiliarDef | null {
  return s.familiar && s.familiar.remaining > 0 ? (FAMILIAR_MAP.get(s.familiar.id) ?? null) : null;
}

export function summonFamiliar(s: GameState, id: string, emit: Emit): boolean {
  const def = FAMILIAR_MAP.get(id);
  if (!def) return false;
  // The same familiar again extends its stay, a different one replaces it.
  const extra = s.familiar?.id === id ? s.familiar.remaining : 0;
  s.familiar = { id, remaining: extra + def.minutes * 60 };
  invalidateMods(s);
  emit({ type: 'familiarSummoned', familiar: id });
  return true;
}

export function dismissFamiliar(s: GameState): void {
  s.familiar = null;
  invalidateMods(s);
}

registerModifierSource('familiar', (s) => {
  const f = activeFamiliar(s);
  return f ? [f.mods] : [];
});

registerTimeEffect('familiar', {
  next: (s) => (s.familiar ? s.familiar.remaining : Infinity),
  apply: (s, dt, emit) => {
    if (!s.familiar || dt <= 0) return;
    s.familiar.remaining -= dt;
    if (s.familiar.remaining <= 1e-9) {
      const id = s.familiar.id;
      s.familiar = null;
      invalidateMods(s);
      emit({ type: 'familiarLeft', familiar: id });
    }
  },
});
