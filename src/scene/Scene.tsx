import { useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { labelElements } from './labels';
import { getAction, getItem } from '../data';
import { Clouds, Fireflies, Ocean } from './Ambience';
import { Arena } from './Arena';
import { Birds, Mountains, JumpingFish, Sailboat, SkyDome } from './Life';
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
  Brewery,
  Shrine,
  Obelisk,
  ResearchTower,
  Workbench,
} from './Science';
import { Forest, WorkTree } from './Trees';
import { IslandDecor } from './Decor';

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  useEffect(() => {
    const on = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return visible;
}

/**
 * Portrait screens see less horizontally, so the camera backs off to keep the whole island in view.
 * A flatter angle plus a lens shift (view offset) puts the horizon with its mountains into the
 * upper part of the picture while the island stays the orbit centre.
 */
function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  useEffect(() => {
    const portrait = aspect < 0.8;
    const distance = portrait ? 37 : aspect < 1.3 ? 30 : 23;
    camera.fov = portrait ? 52 : 45;
    // Phones look a bit flatter so the horizon stays in view even with the island above centre.
    if (portrait) camera.position.set(0.2, 0.53, 0.824);
    else camera.position.set(0.18, 0.64, 0.745);
    camera.position.normalize().multiplyScalar(distance);
    camera.lookAt(0, 0.5, 0);
    // Lens shift as a fraction of the height: positive = island higher (phones: above the middle,
    // clear of the Chronik banner), negative = more sky.
    const shift = portrait ? 0.07 : -0.1;
    camera.setViewOffset(size.width, size.height, 0, shift * size.height, size.width, size.height);
    camera.updateProjectionMatrix();
  }, [aspect, camera, size.width, size.height]);
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
      // Keep labels on screen: a station at the edge must not lose half its name.
      const half = el.offsetWidth / 2 + 4;
      const x = Math.min(size.width - half, Math.max(half, ((v.x + 1) / 2) * size.width));
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${((1 - v.y) / 2) * size.height}px)`;
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
      camera={{ position: [13, 12, 15], fov: 45, near: 0.5, far: 260 }}
    >
      <FrameTicker fps={visible ? sceneFps(perf, covered) : 0} />
      <CameraRig />
      <DayNight shadows={quality.shadows} shadowMapSize={quality.shadowMapSize} />
      <SkyDome />
      <Island />
      <Ocean />
      <Mountains />
      {quality.level !== 'low' && <Birds count={quality.level === 'high' ? 9 : 6} />}
      <Sailboat />
      {quality.level !== 'low' && <JumpingFish />}
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
      <Shrine onTap={tap('faith')} />
      <Brewery onTap={tap('brewing')} />
      <IslandDecor />
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
