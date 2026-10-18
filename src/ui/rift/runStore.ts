import { create } from 'zustand';
import type { RunState } from '../../rift/sim';

/**
 * The active rift run lives outside the game store: it is mutated in place every frame by the
 * canvas loop. `version` is bumped (throttled) so the React HUD can re-render.
 */
interface RiftRunStore {
  run: RunState | null;
  version: number;
  setRun: (run: RunState | null) => void;
  bump: () => void;
}

export const useRiftRun = create<RiftRunStore>()((set, get) => ({
  run: null,
  version: 0,
  setRun: (run) => set({ run, version: get().version + 1 }),
  bump: () => set({ version: get().version + 1 }),
}));
