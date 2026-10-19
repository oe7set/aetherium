import { useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { getAction } from '../data';
import { stationFor } from './layout';
import { ISLAND_BUILDINGS } from '../data/construction';

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

/** Kopfgeldjagd: a notice board with wanted posters next to the arena. */
export function BountyBoard({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('slayer')!;
  const posters = ['#f1e3c0', '#e8d4a8', '#f4e9cf'];
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} rotation={[0, -0.5, 0]} onClick={onTap}>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.7, 0]}>
          <boxGeometry args={[0.1, 1.4, 0.1]} />
          <meshStandardMaterial color="#5b4030" />
        </mesh>
      ))}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[1.3, 0.8, 0.08]} />
        <meshStandardMaterial color="#7a5636" flatShading />
      </mesh>
      {posters.map((c, i) => (
        <mesh key={c} position={[-0.38 + i * 0.38, 1.05 + (i % 2) * 0.06, 0.05]}>
          <boxGeometry args={[0.3, 0.4, 0.01]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[1.5, 0.1, 0.25]} />
        <meshStandardMaterial color="#8a2b25" />
      </mesh>
    </group>
  );
}

/** Beschwörung: a glowing summoning circle with a floating spirit orb. */
export function SummonCircle({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('summoning')!;
  const orb = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const active = useActive('summoning');
  useFrame((_, dt) => {
    const t = performance.now() / 1000;
    if (orb.current) orb.current.position.y = 1.1 + Math.sin(t * 2) * 0.15;
    if (ring.current) ring.current.rotation.z += dt * (active.current ? 2 : 0.4);
  });
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 24]} />
        <meshStandardMaterial color="#3a2a55" />
      </mesh>
      <mesh ref={ring} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 0.95, 6]} />
        <meshStandardMaterial color="#b98cff" emissive="#9b6bff" emissiveIntensity={1.4} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.05, 0.25, Math.sin(a) * 1.05]}>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
            <meshStandardMaterial color="#d7cbe8" />
          </mesh>
        );
      })}
      <mesh ref={orb} position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.22, 14, 10]} />
        <meshStandardMaterial color="#e2d1ff" emissive="#b98cff" emissiveIntensity={1.8} />
      </mesh>
    </group>
  );
}

/** Diebeskunst: two market stalls with striped awnings – tempting targets. */
export function MarketStalls({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('thieving')!;
  const stalls: [number, string, string][] = [
    [-0.6, '#d94a4a', '#f2c94c'],
    [0.6, '#3f7bd9', '#7be495'],
  ];
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      {stalls.map(([x, awning, goods]) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[0.9, 0.7, 0.6]} />
            <meshStandardMaterial color="#8b6b4a" flatShading />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[0.8, 0.12, 0.5]} />
            <meshStandardMaterial color={goods} />
          </mesh>
          {[-0.4, 0.4].map((px) => (
            <mesh key={px} position={[px, 0.9, -0.25]}>
              <cylinderGeometry args={[0.03, 0.03, 1.1, 5]} />
              <meshStandardMaterial color="#5b4030" />
            </mesh>
          ))}
          <mesh position={[0, 1.42, 0]} rotation={[0.35, 0, 0]}>
            <boxGeometry args={[1.0, 0.05, 0.8]} />
            <meshStandardMaterial color={awning} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Baukunst: a scaffold with a little crane – the building site. */
export function BuildSite({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('construction')!;
  const arm = useRef<THREE.Group>(null);
  const active = useActive('construction');
  useFrame((_, dt) => {
    if (arm.current) arm.current.rotation.y += dt * (active.current ? 1.2 : 0.2);
  });
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.6, 0.2, 1.2]} />
        <meshStandardMaterial color="#a89a82" flatShading />
      </mesh>
      {[
        [-0.6, -0.4],
        [0.6, -0.4],
        [-0.6, 0.4],
        [0.6, 0.4],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x!, 0.7, z!]}>
          <boxGeometry args={[0.08, 1.2, 0.08]} />
          <meshStandardMaterial color="#c8a25a" />
        </mesh>
      ))}
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[1.3, 0.06, 0.9]} />
        <meshStandardMaterial color="#c8a25a" />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.9, 0.5, 0.6]} />
        <meshStandardMaterial color="#b8b2a4" flatShading />
      </mesh>
      <group ref={arm} position={[0.6, 1.3, 0.4]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.08, 1.0, 0.08]} />
          <meshStandardMaterial color="#f2c94c" />
        </mesh>
        <mesh position={[-0.4, 1.0, 0]}>
          <boxGeometry args={[0.9, 0.06, 0.06]} />
          <meshStandardMaterial color="#f2c94c" />
        </mesh>
      </group>
    </group>
  );
}

/** Island buildings (Baukunst): grow with each level. */
export function IslandBuildings() {
  const key = useGame((s) =>
    ISLAND_BUILDINGS.map((b) => `${b.id}:${s.game.buildings[b.id] ?? 0}`).join(','),
  );
  return (
    <group>
      {key.split(',').map((entry) => {
        const [id = '', lvl = '0'] = entry.split(':');
        const level = Number(lvl);
        const b = ISLAND_BUILDINGS.find((x) => x.id === id);
        if (!b || level <= 0) return null;
        const k = 0.75 + level * 0.2;
        return (
          <group key={id} position={[b.pos[0], 0, b.pos[1]]} scale={[k, k, k]}>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[1.2, 1, 1]} />
              <meshStandardMaterial color="#d8c8a8" flatShading />
            </mesh>
            <mesh position={[0, 1.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[1.0, 0.7, 4]} />
              <meshStandardMaterial color={b.roof} flatShading />
            </mesh>
            {level >= 3 && (
              <mesh position={[0, 1.85, 0]}>
                <octahedronGeometry args={[0.15, 0]} />
                <meshStandardMaterial color="#ffd166" emissive="#ffb000" emissiveIntensity={1.2} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
