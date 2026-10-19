import { useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { getAction } from '../data';
import { stationFor } from './layout';

type TapHandler = (e: ThreeEvent<MouseEvent>) => void;

/** True while the player works at this skill – props animate faster then. */
function useActive(skill: string): React.MutableRefObject<boolean> {
  const active = useRef(false);
  useFrame(() => {
    const a = useGame.getState().game.active;
    active.current = !!a && getAction(a.actionId).skill === skill;
  });
  return active;
}

/** A small hut with a coloured roof plus a skill-specific prop in front. */
function Workshop({
  skill,
  roof,
  onTap,
  children,
}: {
  skill: string;
  roof: string;
  onTap: TapHandler;
  children: ReactNode;
}) {
  const st = stationFor(skill)!;
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[1.1, 1.2, 0.16, 10]} />
        <meshStandardMaterial color="#9b8c74" flatShading />
      </mesh>
      <mesh position={[0, 0.6, -0.35]} castShadow>
        <boxGeometry args={[1.2, 0.9, 0.8]} />
        <meshStandardMaterial color="#c8b48f" flatShading />
      </mesh>
      <mesh position={[0, 1.3, -0.35]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.0, 0.6, 4]} />
        <meshStandardMaterial color={roof} flatShading />
      </mesh>
      <mesh position={[0, 0.45, -0.76]}>
        <boxGeometry args={[0.3, 0.55, 0.02]} />
        <meshStandardMaterial color="#5b4030" />
      </mesh>
      <group position={[0, 0, 0.45]}>{children}</group>
    </group>
  );
}

/** Juwelierkunst: a work table with a slowly turning, glowing gem. */
export function JewelBench({ onTap }: { onTap: TapHandler }) {
  const gem = useRef<THREE.Mesh>(null);
  const active = useActive('jewelcrafting');
  useFrame((_, dt) => {
    if (!gem.current) return;
    gem.current.rotation.y += dt * (active.current ? 3 : 0.6);
    gem.current.position.y = 0.95 + Math.sin(performance.now() / 600) * 0.05;
  });
  return (
    <Workshop skill="jewelcrafting" roof="#3fb7d9" onTap={onTap}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.8, 0.12, 0.5]} />
        <meshStandardMaterial color="#6d4c33" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color="#5b4030" />
      </mesh>
      <mesh ref={gem} position={[0, 0.95, 0]}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#7fe7ff" emissive="#2bb6d9" emissiveIntensity={1.2} />
      </mesh>
    </Workshop>
  );
}
