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

/** Kartografie: a tent with a map table and a spinning globe. */
export function MapTent({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('cartography')!;
  const globe = useRef<THREE.Mesh>(null);
  const active = useActive('cartography');
  useFrame((_, dt) => {
    if (globe.current) globe.current.rotation.y += dt * (active.current ? 2.5 : 0.5);
  });
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      <mesh position={[0, 0.7, -0.3]} castShadow>
        <coneGeometry args={[1.0, 1.4, 4]} />
        <meshStandardMaterial color="#e8d9b0" flatShading />
      </mesh>
      <mesh position={[0, 0.35, 0.55]}>
        <boxGeometry args={[0.9, 0.08, 0.6]} />
        <meshStandardMaterial color="#8b6b4a" />
      </mesh>
      <mesh position={[0, 0.4, 0.55]}>
        <boxGeometry args={[0.7, 0.01, 0.45]} />
        <meshStandardMaterial color="#f1e3c0" />
      </mesh>
      <mesh position={[0, 0.2, 0.55]}>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshStandardMaterial color="#5b4030" />
      </mesh>
      <mesh ref={globe} position={[0.35, 0.62, 0.55]}>
        <sphereGeometry args={[0.14, 12, 10]} />
        <meshStandardMaterial color="#4a90d9" flatShading />
      </mesh>
    </group>
  );
}

/** Bogenbau: a hut with a straw target that wobbles while you fletch. */
export function FletcherHut({ onTap }: { onTap: TapHandler }) {
  const target = useRef<THREE.Group>(null);
  const active = useActive('fletching');
  useFrame(({ clock }) => {
    if (target.current)
      target.current.rotation.z = active.current ? Math.sin(clock.elapsedTime * 9) * 0.08 : 0;
  });
  return (
    <Workshop skill="fletching" roof="#6f9a3e" onTap={onTap}>
      <group ref={target} position={[0.45, 0.45, 0.1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 16]} />
          <meshStandardMaterial color="#e8cf7a" flatShading />
        </mesh>
        <mesh position={[0, 0, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.01, 16]} />
          <meshStandardMaterial color="#d64545" />
        </mesh>
        <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.01, 12]} />
          <meshStandardMaterial color="#ffd166" />
        </mesh>
      </group>
      <mesh position={[-0.4, 0.4, 0.1]} rotation={[0, 0, 0.2]}>
        <torusGeometry args={[0.28, 0.025, 6, 16, Math.PI]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
    </Workshop>
  );
}

/** Viehzucht: a fenced pasture with a sheep that wanders faster while you tend the animals. */
export function Pasture({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('husbandry')!;
  const sheep = useRef<THREE.Group>(null);
  const active = useActive('husbandry');
  useFrame(({ clock }) => {
    if (!sheep.current) return;
    const t = clock.elapsedTime * (active.current ? 1.2 : 0.3);
    sheep.current.position.x = Math.sin(t) * 0.45;
    sheep.current.rotation.y = Math.cos(t) > 0 ? 0 : Math.PI;
  });
  const posts = [-0.9, -0.3, 0.3, 0.9];
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 16]} />
        <meshStandardMaterial color="#7fbf5a" />
      </mesh>
      {posts.map((x) => (
        <mesh key={x} position={[x, 0.2, -0.8]}>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#8b6b4a" />
        </mesh>
      ))}
      <mesh position={[0, 0.3, -0.8]}>
        <boxGeometry args={[1.9, 0.05, 0.04]} />
        <meshStandardMaterial color="#8b6b4a" />
      </mesh>
      <group ref={sheep} position={[0, 0, 0.1]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <sphereGeometry args={[0.22, 10, 8]} />
          <meshStandardMaterial color="#f4f1ea" flatShading />
        </mesh>
        <mesh position={[0.22, 0.3, 0]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color="#3b3330" />
        </mesh>
      </group>
      <mesh position={[-0.5, 0.18, 0.5]}>
        <cylinderGeometry args={[0.18, 0.2, 0.12, 10]} />
        <meshStandardMaterial color="#c9a227" />
      </mesh>
    </group>
  );
}

/** Seefahrt: a wooden pier with a moored boat that rocks harder while you sail. */
export function Dock({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('sailing')!;
  const boat = useRef<THREE.Group>(null);
  const active = useActive('sailing');
  useFrame(({ clock }) => {
    if (!boat.current) return;
    const t = clock.elapsedTime;
    const amp = active.current ? 0.12 : 0.05;
    boat.current.rotation.z = Math.sin(t * 1.6) * amp;
    boat.current.position.y = 0.12 + Math.sin(t * 2.1) * amp * 0.4;
  });
  const angle = Math.atan2(st.pos[1], st.pos[0]);
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} rotation={[0, -angle, 0]} onClick={onTap}>
      <mesh position={[0.6, 0.12, 0]}>
        <boxGeometry args={[1.8, 0.08, 0.5]} />
        <meshStandardMaterial color="#8b6b4a" />
      </mesh>
      {[0, 0.6, 1.2].map((x) => (
        <mesh key={x} position={[x, 0, 0.28]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
          <meshStandardMaterial color="#5b4030" />
        </mesh>
      ))}
      <group ref={boat} position={[1.1, 0.12, -0.6]}>
        <mesh>
          <boxGeometry args={[0.9, 0.18, 0.36]} />
          <meshStandardMaterial color="#a0522d" flatShading />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.8, 6]} />
          <meshStandardMaterial color="#5b4030" />
        </mesh>
        <mesh position={[0.15, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.3, 0.55]} />
          <meshStandardMaterial color="#f4f1ea" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/** Sternkunde: a brass telescope on a tripod that sweeps the sky while you watch. */
export function Telescope({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('astronomy')!;
  const tube = useRef<THREE.Group>(null);
  const active = useActive('astronomy');
  useFrame(({ clock }) => {
    if (tube.current)
      tube.current.rotation.y = Math.sin(clock.elapsedTime * (active.current ? 0.8 : 0.2)) * 0.8;
  });
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 0.12, 12]} />
        <meshStandardMaterial color="#6b6f8a" flatShading />
      </mesh>
      {[0, 2.1, 4.2].map((a) => (
        <mesh
          key={a}
          position={[Math.cos(a) * 0.18, 0.4, Math.sin(a) * 0.18]}
          rotation={[Math.sin(a) * 0.25, 0, Math.cos(a) * 0.25]}
        >
          <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
          <meshStandardMaterial color="#5b4030" />
        </mesh>
      ))}
      <group ref={tube} position={[0, 0.78, 0]}>
        <mesh rotation={[0, 0, -0.7]}>
          <cylinderGeometry args={[0.07, 0.11, 0.8, 10]} />
          <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

/** Gewandtheit: hurdles, a balance beam and a climbing frame; a flag waves while you run. */
export function Course({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('agility')!;
  const flag = useRef<THREE.Mesh>(null);
  const active = useActive('agility');
  useFrame(({ clock }) => {
    if (flag.current)
      flag.current.rotation.y = Math.sin(clock.elapsedTime * (active.current ? 8 : 2)) * 0.4;
  });
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      {[-0.6, 0, 0.6].map((x) => (
        <group key={x} position={[x, 0, -0.3]}>
          <mesh position={[-0.22, 0.18, 0]}>
            <boxGeometry args={[0.05, 0.36, 0.05]} />
            <meshStandardMaterial color="#e8e2d0" />
          </mesh>
          <mesh position={[0.22, 0.18, 0]}>
            <boxGeometry args={[0.05, 0.36, 0.05]} />
            <meshStandardMaterial color="#e8e2d0" />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[0.5, 0.05, 0.05]} />
            <meshStandardMaterial color="#ff9f43" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.25, 0.45]}>
        <boxGeometry args={[1.4, 0.06, 0.1]} />
        <meshStandardMaterial color="#8b6b4a" />
      </mesh>
      <mesh position={[0.9, 0.5, 0.2]}>
        <cylinderGeometry args={[0.025, 0.025, 1, 6]} />
        <meshStandardMaterial color="#5b4030" />
      </mesh>
      <mesh ref={flag} position={[1.05, 0.88, 0.2]}>
        <planeGeometry args={[0.3, 0.18]} />
        <meshStandardMaterial color="#ff5d73" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
