import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { getAction } from '../data';
import { useGame } from '../store/gameStore';
import { distanceToRiver, ISLAND_RADIUS, scatter, STATIONS, stationFor } from './layout';
import { useCounterPulse } from './hooks';

const CANOPY_COLORS: Record<string, string> = {
  wc_oak: '#4f8f35',
  wc_birch: '#8cc152',
  wc_willow: '#6aa84f',
  wc_maple: '#d9662b',
  wc_yew: '#2f6b3a',
  wc_magic: '#7d5fd6',
  wc_redwood: '#2b5e34',
  wc_yggdrasil: '#e0c35a',
};

/** Background forest as two instanced meshes (trunks + canopies): 2 draw calls for all trees. */
export function Forest({ count }: { count: number }) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const canopies = useRef<THREE.InstancedMesh>(null);
  const transforms = useMemo(() => {
    const rnd = scatter(1337);
    const list: { x: number; z: number; s: number; r: number }[] = [];
    let guard = 0;
    while (list.length < count && guard++ < 2000) {
      // Bias towards the forest corner.
      const forest = rnd() < 0.55;
      const angle = forest ? -2.4 + (rnd() - 0.5) * 1.4 : rnd() * Math.PI * 2;
      const radius = forest ? 3 + rnd() * 7 : 4 + rnd() * (ISLAND_RADIUS - 5);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (Math.hypot(x, z) > ISLAND_RADIUS - 0.8) continue;
      if (distanceToRiver(x, z) < 1.6) continue;
      if (STATIONS.some((st) => Math.hypot(st.pos[0] - x, st.pos[1] - z) < 2.2)) continue;
      if (Math.hypot(x, z) < 2.5) continue;
      list.push({ x, z, s: 0.7 + rnd() * 0.6, r: rnd() * Math.PI });
    }
    return list;
  }, [count]);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    transforms.forEach((t, i) => {
      q.setFromEuler(new THREE.Euler(0, t.r, 0));
      m.compose(new THREE.Vector3(t.x, 0.5 * t.s, t.z), q, new THREE.Vector3(t.s, t.s, t.s));
      trunks.current?.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(t.x, 1.55 * t.s, t.z), q, new THREE.Vector3(t.s, t.s, t.s));
      canopies.current?.setMatrixAt(i, m);
    });
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true;
    if (canopies.current) canopies.current.instanceMatrix.needsUpdate = true;
  }, [transforms]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, transforms.length]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1, 5]} />
        <meshStandardMaterial color="#6b4a2f" flatShading />
      </instancedMesh>
      <instancedMesh ref={canopies} args={[undefined, undefined, transforms.length]} castShadow>
        <coneGeometry args={[0.75, 1.6, 6]} />
        <meshStandardMaterial color="#3f7f3a" flatShading />
      </instancedMesh>
    </group>
  );
}

/** The tree the player is chopping. Falls on each completed cycle and regrows. */
export function WorkTree({ onTap }: { onTap: (e: ThreeEvent<MouseEvent>) => void }) {
  const station = stationFor('woodcutting')!;
  const group = useRef<THREE.Group>(null);
  const canopyMat = useRef<THREE.MeshStandardMaterial>(null);
  const fellAt = useRef(-10);
  const color = useMemo(() => new THREE.Color(), []);

  useCounterPulse(
    (s) => s.stats.treesFelled ?? 0,
    () => {
      fellAt.current = performance.now() / 1000;
    },
  );

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const t = performance.now() / 1000 - fellAt.current;
    if (t < 0.5) {
      g.rotation.z = (t / 0.5) ** 2 * (Math.PI / 2.2);
      g.scale.setScalar(1);
    } else if (t < 0.9) {
      g.rotation.z = Math.PI / 2.2;
      g.scale.setScalar(Math.max(0, 1 - (t - 0.5) / 0.4));
    } else if (t < 1.8) {
      g.rotation.z = 0;
      const k = (t - 0.9) / 0.9;
      g.scale.setScalar(1 - (1 - k) ** 3);
    } else {
      g.rotation.z = 0;
      g.scale.setScalar(1);
    }
    // Canopy colour follows the tree type being chopped.
    const active = useGame.getState().game.active;
    const id =
      active && getAction(active.actionId).skill === 'woodcutting' ? active.actionId : 'wc_oak';
    color.set(CANOPY_COLORS[id] ?? '#4f8f35');
    canopyMat.current?.color.lerp(color, 0.1);
  });

  return (
    <group position={[station.pos[0], 0, station.pos[1]]} onClick={onTap}>
      <group ref={group}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.3, 1.6, 6]} />
          <meshStandardMaterial color="#6b4a2f" flatShading />
        </mesh>
        <mesh position={[0, 2.2, 0]} castShadow>
          <icosahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial ref={canopyMat} color="#4f8f35" flatShading />
        </mesh>
      </group>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.32, 0.36, 0.25, 6]} />
        <meshStandardMaterial color="#8a6440" flatShading />
      </mesh>
    </group>
  );
}
