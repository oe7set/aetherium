import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { activeSkillNow } from './hooks';
import { IDLE_POS, stationFor } from './layout';

const WALK_SPEED = 3.2;

/** What the character holds per skill. */
function Tool({ skill }: { skill: string | null }) {
  if (skill === 'woodcutting' || skill === 'mining') {
    const head =
      skill === 'woodcutting' ? (
        <boxGeometry args={[0.28, 0.18, 0.05]} />
      ) : (
        <boxGeometry args={[0.45, 0.07, 0.07]} />
      );
    return (
      <group position={[0, -0.55, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 4]} />
          <meshStandardMaterial color="#7a5536" />
        </mesh>
        <mesh position={[skill === 'woodcutting' ? 0.12 : 0, 0.33, 0]}>
          {head}
          <meshStandardMaterial color="#9aa0a8" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    );
  }
  if (skill === 'cooking') {
    return (
      <mesh position={[0, -0.55, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.05, 0.6, 4]} />
        <meshStandardMaterial color="#c9a26b" />
      </mesh>
    );
  }
  return null;
}

/**
 * Low-poly farmer built from boxes. Walks to the active station and plays a simple work loop.
 * Animation is driven entirely in useFrame; React only re-renders when the held tool changes.
 */
export function Character({ skill }: { skill: string | null }) {
  const root = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    const current = activeSkillNow();
    const st = stationFor(current);
    const [tx, tz] = st ? st.workPos : IDLE_POS;
    target.set(tx, 0, tz);
    const dist = g.position.distanceTo(target);
    const moving = dist > 0.05;
    const t = performance.now() / 1000;

    if (moving) {
      const step = Math.min(dist, WALK_SPEED * Math.min(dt, 0.1));
      const dir = target.clone().sub(g.position).normalize();
      g.position.addScaledVector(dir, step);
      g.rotation.y = Math.atan2(dir.x, dir.z);
    } else if (st) {
      lookAt.set(st.pos[0], 0, st.pos[1]);
      const desired = Math.atan2(lookAt.x - g.position.x, lookAt.z - g.position.z);
      g.rotation.y +=
        Math.atan2(Math.sin(desired - g.rotation.y), Math.cos(desired - g.rotation.y)) * 0.15;
    }

    const swing = moving ? Math.sin(t * 10) * 0.6 : 0;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    g.position.y = moving ? Math.abs(Math.sin(t * 10)) * 0.06 : 0;

    let work = 0;
    if (!moving && current) {
      const speed = current === 'cooking' ? 6 : current === 'firemaking' ? 3 : 7;
      work = Math.sin(t * speed);
    }
    if (armR.current)
      armR.current.rotation.x = moving ? -swing : current && !moving ? -1.2 + work * 0.9 : 0;
    if (armL.current)
      armL.current.rotation.x = moving
        ? swing
        : current === 'firemaking' && !moving
          ? -0.8 + work * 0.3
          : 0;
  });

  return (
    <group ref={root} position={[IDLE_POS[0], 0, IDLE_POS[1]]} scale={1.4}>
      {/* Legs */}
      <group ref={legL} position={[-0.13, 0.6, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.18, 0.6, 0.2]} />
          <meshStandardMaterial color="#3b4f7a" flatShading />
        </mesh>
      </group>
      <group ref={legR} position={[0.13, 0.6, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.18, 0.6, 0.2]} />
          <meshStandardMaterial color="#3b4f7a" flatShading />
        </mesh>
      </group>
      {/* Body */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.3]} />
        <meshStandardMaterial color="#6fa84a" flatShading />
      </mesh>
      {/* Head + straw hat */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.34, 0.34, 0.34]} />
        <meshStandardMaterial color="#f0c8a0" flatShading />
      </mesh>
      <mesh position={[0, 1.72, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.05, 8]} />
        <meshStandardMaterial color="#e6c35c" flatShading />
      </mesh>
      <mesh position={[0, 1.82, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.18, 8]} />
        <meshStandardMaterial color="#e6c35c" flatShading />
      </mesh>
      {/* Arms (pivot at shoulder) */}
      <group ref={armL} position={[-0.33, 1.25, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.14, 0.56, 0.16]} />
          <meshStandardMaterial color="#6fa84a" flatShading />
        </mesh>
      </group>
      <group ref={armR} position={[0.33, 1.25, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.14, 0.56, 0.16]} />
          <meshStandardMaterial color="#6fa84a" flatShading />
        </mesh>
        <Tool skill={skill} />
      </group>
    </group>
  );
}
