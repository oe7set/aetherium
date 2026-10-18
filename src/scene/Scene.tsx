import { useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { labelElements } from './labels';
import { getAction, getItem } from '../data';
import { Clouds, Fireflies, Ocean } from './Ambience';
import { Arena } from './Arena';
import { useGame } from '../store/gameStore';
import { Character } from './Character';
import { Growth } from './Growth';
import { Island } from './Island';
import { STATIONS } from './layout';
import type { QualityProfile } from './quality';
import { sceneFps, usePerfMode } from '../ui/perf';
import { useIsDesktop } from '../ui/hooks';
import { DayNight } from './Sky';
import { Campfire, Decorations, FishingSpot, Forge, Kitchen, Mine } from './Stations';
import {
  AcceleratorRing,
  Fields,
  Helpers,
  HuntingGround,
  DigSite,
  AlchemyLab,
  RuneCircle,
  AetherSpring,
  Obelisk,
  ResearchTower,
  Workbench,
} from './Science';
import { Forest, WorkTree } from './Trees';

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  useEffect(() => {
    const on = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return visible;
}

/** Portrait screens see less horizontally, so the camera backs off to keep the whole island in view. */
function CameraRig() {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  useEffect(() => {
    const distance = aspect < 0.8 ? 40 : aspect < 1.3 ? 28 : 21;
    camera.position.set(0.15, 0.78, 0.62).normalize().multiplyScalar(distance);
    camera.lookAt(0, 0.5, 0);
  }, [aspect, camera]);
  return null;
}

/** Projects station anchors to screen space and positions the DOM labels (see labels.ts). */
function LabelProjector() {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const st of STATIONS) {
      const el = labelElements.get(st.skill);
      if (!el) continue;
      v.set(st.pos[0], 3.2, st.pos[1]).project(camera);
      const visible = v.z < 1;
      el.style.opacity = visible ? '1' : '0';
      el.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`;
    }
  });
  return null;
}

/**
 * The 3D island (Phase 2). Reads game state only; all interaction goes through store actions.
 * Lazy-loaded so the first paint does not wait for three.js.
 */
/** Renders on demand at a capped frame rate – the island never needs 60 FPS behind a menu. */
function FrameTicker({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (fps <= 0) return;
    invalidate();
    const id = window.setInterval(() => invalidate(), 1000 / fps);
    return () => window.clearInterval(id);
  }, [fps, invalidate]);
  return null;
}

export default function WorldScene({ quality }: { quality: QualityProfile }) {
  const visible = usePageVisible();
  const perf = usePerfMode();
  const desktop = useIsDesktop();
  const covered = useGame((s) => !desktop && s.ui.tab !== 'world');
  const activeSkill = useGame((s) => {
    if (s.game.combat) {
      const w = s.game.equipment.weapon;
      const style = w ? (getItem(w).equip?.style ?? 'melee') : 'melee';
      return `combat-${style}`;
    }
    return s.game.active ? getAction(s.game.active.actionId).skill : null;
  });
  const tapStation = useGame((s) => s.tapStation);

  const tap = (skill: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    tapStation(skill);
  };

  return (
    <Canvas
      className="scene-canvas"
      frameloop={visible ? 'demand' : 'never'}
      dpr={[1, perf === 'eco' ? Math.min(1.5, quality.dpr) : quality.dpr]}
      shadows={quality.shadows && perf === 'smooth'}
      gl={{
        antialias: quality.antialias,
        powerPreference: perf === 'eco' ? 'low-power' : 'high-performance',
      }}
      camera={{ position: [13, 12, 15], fov: 45, near: 0.5, far: 200 }}
    >
      <FrameTicker fps={visible ? sceneFps(perf, covered) : 0} />
      <CameraRig />
      <DayNight shadows={quality.shadows} shadowMapSize={quality.shadowMapSize} />
      <Island />
      <Ocean />
      <Clouds count={quality.level === 'low' ? 3 : 7} />
      <Fireflies count={quality.particles} />
      <Forest count={quality.trees} />
      <Decorations count={quality.level === 'low' ? 8 : 20} />
      <WorkTree onTap={tap('woodcutting')} />
      <Mine onTap={tap('mining')} particles={quality.particles} />
      <Campfire onTap={tap('firemaking')} particles={quality.particles} />
      <Kitchen onTap={tap('cooking')} particles={quality.particles} />
      <Forge onTap={tap('smithing')} particles={quality.particles} />
      <FishingSpot onTap={tap('fishing')} particles={quality.particles} />
      <Arena onTap={tap('combat')} particles={quality.particles} />
      <ResearchTower onTap={tap('research')} />
      <AcceleratorRing />
      <Obelisk />
      <Growth />
      <Fields onTap={tap('farming')} />
      <Workbench onTap={tap('crafting')} />
      <HuntingGround onTap={tap('hunting')} />
      <DigSite onTap={tap('archaeology')} />
      <AlchemyLab onTap={tap('alchemy')} />
      <RuneCircle onTap={tap('enchanting')} />
      <AetherSpring onTap={tap('arcane')} />
      <Helpers />
      <Character skill={activeSkill} />
      <LabelProjector />
      <OrbitControls
        enablePan={false}
        minDistance={9}
        maxDistance={48}
        minPolarAngle={0.35}
        maxPolarAngle={1.25}
        enableDamping
        dampingFactor={0.12}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  );
}
