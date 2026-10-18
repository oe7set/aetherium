export type QualityLevel = 'low' | 'medium' | 'high';
export type QualitySetting = 'auto' | QualityLevel;

export interface QualityProfile {
  level: QualityLevel;
  /** Max device pixel ratio (capped at 2 per spec). */
  dpr: number;
  shadows: boolean;
  shadowMapSize: number;
  particles: number;
  trees: number;
  antialias: boolean;
}

export const PROFILES: Record<QualityLevel, QualityProfile> = {
  low: {
    level: 'low',
    dpr: 1,
    shadows: false,
    shadowMapSize: 0,
    particles: 12,
    trees: 18,
    antialias: false,
  },
  medium: {
    level: 'medium',
    dpr: 1.5,
    shadows: false,
    shadowMapSize: 0,
    particles: 28,
    trees: 34,
    antialias: true,
  },
  high: {
    level: 'high',
    dpr: 2,
    shadows: true,
    shadowMapSize: 1024,
    particles: 60,
    trees: 52,
    antialias: true,
  },
};

interface NavigatorHints {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  userAgent?: string;
}

/** Heuristic device detection. Pure so it can be tested; pass `navigator` in the browser. */
export function detectQuality(nav: NavigatorHints, screenWidth: number): QualityLevel {
  const memory = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent ?? '') || screenWidth < 820;
  if (memory <= 2 || cores <= 2) return 'low';
  if (mobile) return memory >= 6 && cores >= 8 ? 'medium' : memory <= 3 ? 'low' : 'medium';
  return cores >= 8 ? 'high' : 'medium';
}

export function resolveQuality(setting: QualitySetting, detected: QualityLevel): QualityProfile {
  return PROFILES[setting === 'auto' ? detected : setting];
}

/** WebGL availability check; the 2D world is used as fallback. */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
