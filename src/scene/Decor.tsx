import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DECORS } from '../data/progress';
import { decorShown } from '../engine';
import { useGame } from '../store/gameStore';

/** Inselschmuck: cosmetic decorations unlocked across all systems (see DECORS). */

function Lanterns() {
  const spots = [0.35, 1.2, 2.05, 2.9, 3.75, 4.6, 5.45].map((a) => [
    Math.cos(a) * 3.3,
    Math.sin(a) * 3.3,
  ]);
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x!, 0, z!]}>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 1.1, 6]} />
            <meshStandardMaterial color="#3b2a1e" />
          </mesh>
          <mesh position={[0, 1.18, 0]}>
            <boxGeometry args={[0.22, 0.26, 0.22]} />
            <meshStandardMaterial color="#ffb347" emissive="#ff8c1a" emissiveIntensity={1.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Pumpkins() {
  const spots: [number, number, number][] = [
    [0, 0, 0.32],
    [0.6, 0.3, 0.24],
    [-0.5, 0.4, 0.27],
    [0.2, -0.55, 0.22],
    [-0.35, -0.4, 0.18],
  ];
  return (
    <group position={[-5.8, 0, 8.4]}>
      {spots.map(([x, z, r], i) => (
        <group key={i} position={[x, r * 0.8, z]}>
          <mesh scale={[1, 0.78, 1]} castShadow>
            <sphereGeometry args={[r, 10, 8]} />
            <meshStandardMaterial color="#f28c28" flatShading />
          </mesh>
          <mesh position={[0, r * 0.85, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.12, 5]} />
            <meshStandardMaterial color="#3d7a2a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Statue() {
  const stone = '#b9b4a8';
  return (
    <group position={[-1.9, 0, -1.4]} rotation={[0, 0.6, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.9, 0.6, 0.9]} />
        <meshStandardMaterial color="#8f8a80" flatShading />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 0.9, 7]} />
        <meshStandardMaterial color={stone} flatShading />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial color={stone} flatShading />
      </mesh>
      {/* Raised sword arm. */}
      <mesh position={[0.26, 1.55, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.1, 0.55, 0.1]} />
        <meshStandardMaterial color={stone} flatShading />
      </mesh>
      <mesh position={[0.48, 2.0, 0]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.06, 0.7, 0.04]} />
        <meshStandardMaterial color="#d8dde6" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Fountain() {
  const water = useRef<THREE.Mesh>(null);
  const spray = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const t = performance.now() / 1000;
    if (water.current) water.current.position.y = 0.42 + Math.sin(t * 2) * 0.02;
    if (spray.current) spray.current.scale.setScalar(0.9 + Math.sin(t * 6) * 0.12);
  });
  return (
    <group position={[0.3, 0, 5.6]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.95, 1.05, 0.44, 14]} />
        <meshStandardMaterial color="#c9c2b2" flatShading />
      </mesh>
      <mesh ref={water} position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.82, 18]} />
        <meshStandardMaterial color="#5fb8ff" emissive="#1e6fb8" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.8, 8]} />
        <meshStandardMaterial color="#c9c2b2" flatShading />
      </mesh>
      <mesh ref={spray} position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshStandardMaterial color="#bfe6ff" transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

function Banner({ position, color }: { position: [number, number, number]; color: string }) {
  const flag = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (flag.current)
      flag.current.rotation.y = Math.sin(performance.now() / 600 + position[0]) * 0.25;
  });
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.4, 6]} />
        <meshStandardMaterial color="#5a4632" />
      </mesh>
      <mesh ref={flag} position={[0.32, 2.0, 0]}>
        <boxGeometry args={[0.62, 0.42, 0.02]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Banners() {
  return (
    <group>
      <Banner position={[8.7, 0, 7.0]} color="#e5534b" />
      <Banner position={[5.0, 0, 7.9]} color="#ffd166" />
      <Banner position={[9.4, 0, 1.2]} color="#7c5cff" />
    </group>
  );
}

function Crystal() {
  const gem = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const t = performance.now() / 1000;
    if (gem.current) {
      gem.current.rotation.y = t * 0.8;
      gem.current.position.y = 1.5 + Math.sin(t * 1.5) * 0.15;
    }
  });
  return (
    <group position={[1.0, 0, 7.4]}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.45, 0.55, 0.3, 6]} />
        <meshStandardMaterial color="#5b5470" flatShading />
      </mesh>
      <mesh ref={gem} position={[0, 1.5, 0]}>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#c58bff" emissive="#9b5cff" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

function Snowman() {
  return (
    <group position={[-4.0, 0, -0.4]} rotation={[0, 0.8, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.45, 12, 10]} />
        <meshStandardMaterial color="#f4f8ff" />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.32, 12, 10]} />
        <meshStandardMaterial color="#f4f8ff" />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color="#f4f8ff" />
      </mesh>
      <mesh position={[0, 1.45, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.22, 6]} />
        <meshStandardMaterial color="#ff8a1f" />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.22, 10]} />
        <meshStandardMaterial color="#222a3a" />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.03, 12]} />
        <meshStandardMaterial color="#222a3a" />
      </mesh>
    </group>
  );
}

function Lighthouse() {
  const beam = useRef<THREE.Group>(null);
  useFrame(() => {
    if (beam.current) beam.current.rotation.y = performance.now() / 900;
  });
  const stripes = ['#f4f4f4', '#e5534b', '#f4f4f4', '#e5534b'];
  return (
    <group position={[9.0, -0.1, -5.6]}>
      {stripes.map((c, i) => (
        <mesh key={i} position={[0, 0.45 + i * 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.42 - (i + 1) * 0.04, 0.42 - i * 0.04, 0.8, 12]} />
          <meshStandardMaterial color={c} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 3.45, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.4, 10]} />
        <meshStandardMaterial color="#fff1a8" emissive="#ffd166" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, 3.8, 0]}>
        <coneGeometry args={[0.36, 0.4, 10]} />
        <meshStandardMaterial color="#3a3f55" />
      </mesh>
      <group ref={beam} position={[0, 3.45, 0]}>
        <mesh position={[1.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.35, 3.2, 10, 1, true]} />
          <meshBasicMaterial color="#fff5c0" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

function Rainbow() {
  const colors = ['#ff5e5e', '#ff9f43', '#ffd166', '#6bd66b', '#4fa8ff', '#9b6bff'];
  return (
    <group position={[0, -2, -26]}>
      {colors.map((c, i) => (
        <mesh key={c}>
          <torusGeometry args={[16 - i * 0.55, 0.28, 6, 48, Math.PI]} />
          <meshBasicMaterial color={c} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

const PIECES: Record<string, () => React.JSX.Element> = {
  lanterns: Lanterns,
  pumpkins: Pumpkins,
  statue: Statue,
  fountain: Fountain,
  banners: Banners,
  crystal: Crystal,
  snowman: Snowman,
  lighthouse: Lighthouse,
  rainbow: Rainbow,
};

export function IslandDecor() {
  // Primitive key: only re-render when the visible set changes.
  const key = useGame((s) =>
    DECORS.filter((d) => decorShown(s.game, d.id))
      .map((d) => d.id)
      .join(','),
  );
  if (!key) return null;
  return (
    <group>
      {key.split(',').map((id) => {
        const Piece = PIECES[id];
        return Piece ? <Piece key={id} /> : null;
      })}
    </group>
  );
}
