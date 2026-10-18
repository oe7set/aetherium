import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { totalLevel } from '../engine';
import { useGame } from '../store/gameStore';

// The world grows with progress: a village appears as the total level rises, and research
// adds buildings from windmills to a wormhole portal.

const HOUSE_SPOTS: [number, number, number][] = [
  [-3.2, -9.4, 0.3],
  [0.9, 9.4, 2.4],
  [-8, 5, 0.9],
  [8.6, 1.4, -1.2],
  [-9.6, 3.2, 1.6],
  [6.4, -6.8, -0.6],
  [-4.4, -8.8, 0.2],
  [9.4, -2.4, 1.9],
];

function House({ pos, rot, tier }: { pos: [number, number]; rot: number; tier: number }) {
  const wall = tier >= 2 ? '#d8d2c4' : '#c8a274';
  const roof = tier >= 3 ? '#3f6fb0' : tier >= 2 ? '#8a3a2a' : '#7a5a2a';
  return (
    <group position={[pos[0], 0, pos[1]]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.1, 0.9, 0.9]} />
        <meshStandardMaterial color={wall} flatShading />
      </mesh>
      <mesh position={[0, 1.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.95, 0.6, 4]} />
        <meshStandardMaterial color={roof} flatShading />
      </mesh>
      <mesh position={[0, 0.3, 0.46]}>
        <boxGeometry args={[0.25, 0.45, 0.02]} />
        <meshStandardMaterial color="#5a3b22" />
      </mesh>
    </group>
  );
}

function Windmill() {
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 0.8;
  });
  return (
    <group position={[-6.2, 0, 8.2]}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.6, 2.6, 6]} />
        <meshStandardMaterial color="#e8e0cc" flatShading />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <coneGeometry args={[0.55, 0.6, 6]} />
        <meshStandardMaterial color="#8a3a2a" flatShading />
      </mesh>
      <group ref={blades} position={[0, 2.3, 0.5]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0]}>
            <boxGeometry args={[0.14, 1.8, 0.03]} />
            <meshStandardMaterial color="#f5f0e6" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function LampPosts() {
  const spots = useMemo<[number, number][]>(
    () => [
      [-1, 1.5],
      [2.2, -1],
      [-3.2, -1.2],
      [3.4, 3.6],
      [-0.4, 4.6],
    ],
    [],
  );
  return (
    <>
      {spots.map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 1.6, 5]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, 1.65, 0]}>
            <sphereGeometry args={[0.12, 6, 5]} />
            <meshStandardMaterial color="#fff6c8" emissive="#ffe08a" emissiveIntensity={1.5} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function SolarField() {
  return (
    <group position={[7.6, 0, -4.2]} rotation={[0, -0.6, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.9 - 0.9, 0.35, 0]} rotation={[-0.6, 0, 0]}>
          <boxGeometry args={[0.8, 0.04, 0.6]} />
          <meshStandardMaterial color="#1e3a6e" metalness={0.6} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function Portal() {
  const ring = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z += dt;
    if (inner.current)
      inner.current.emissiveIntensity = 1.2 + Math.sin(performance.now() / 200) * 0.5;
  });
  return (
    <group position={[-1.8, 0, -2.4]}>
      <mesh ref={ring} position={[0, 1.4, 0]}>
        <torusGeometry args={[0.9, 0.12, 6, 18]} />
        <meshStandardMaterial color="#7d5fd6" emissive="#7d5fd6" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <circleGeometry args={[0.8, 18]} />
        <meshStandardMaterial
          ref={inner}
          color="#1a0f33"
          emissive="#5b2a86"
          emissiveIntensity={1.2}
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

export function Growth() {
  const total = useGame((s) => totalLevel(s.game));
  const techKey = useGame((s) =>
    ['agriculture', 'electricity', 'fusion', 'wormholes']
      .map((t) => (s.game.techs.includes(t) ? '1' : '0'))
      .join(''),
  );
  const houses = Math.min(HOUSE_SPOTS.length, Math.floor(total / 120));
  const tier = total >= 1200 ? 3 : total >= 600 ? 2 : 1;
  return (
    <group>
      {HOUSE_SPOTS.slice(0, houses).map(([x, z, r]) => (
        <House key={`${x}:${z}`} pos={[x, z]} rot={r} tier={tier} />
      ))}
      {techKey[0] === '1' && <Windmill />}
      {techKey[1] === '1' && <LampPosts />}
      {techKey[2] === '1' && <SolarField />}
      {techKey[3] === '1' && <Portal />}
    </group>
  );
}
