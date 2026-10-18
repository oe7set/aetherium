import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { getAction } from '../data';
import { useGame } from '../store/gameStore';
import { activeSkillNow, useCounterPulse } from './hooks';
import { scatter, stationFor } from './layout';
import { Burst, Rise } from './Particles';

type TapHandler = (e: ThreeEvent<MouseEvent>) => void;

const ORE_COLORS: Record<string, string> = {
  mine_copper: '#d9822b',
  mine_tin: '#c9ced6',
  mine_iron: '#8a6f62',
  mine_coal: '#2b2b2b',
  mine_silver: '#e8eef5',
  mine_gold: '#f2c94c',
  mine_mithril: '#4a7bd9',
  mine_adamant: '#3fa35a',
  mine_runite: '#3fb7d9',
  mine_uranium: '#7dff5a',
  mine_dark_matter: '#5b2a86',
};

export function Mine({ onTap, particles }: { onTap: TapHandler; particles: number }) {
  const st = stationFor('mining')!;
  const rock = useRef<THREE.Group>(null);
  const oreMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d9822b',
        emissive: '#d9822b',
        emissiveIntensity: 0.25,
        flatShading: true,
      }),
    [],
  );
  const hitAt = useRef(-10);
  const burst = useRef(0);
  const color = useMemo(() => new THREE.Color(), []);
  const crystals = useMemo(() => {
    const rnd = scatter(42);
    return Array.from({ length: 6 }, () => ({
      pos: [(rnd() - 0.5) * 1.6, 0.6 + rnd() * 0.8, (rnd() - 0.5) * 1.6] as [
        number,
        number,
        number,
      ],
      rot: [rnd() * 3, rnd() * 3, rnd() * 3] as [number, number, number],
      s: 0.18 + rnd() * 0.15,
    }));
  }, []);

  useCounterPulse(
    (s) => s.stats.oresMined ?? 0,
    () => {
      hitAt.current = performance.now() / 1000;
      burst.current++;
    },
  );

  useFrame(() => {
    const t = performance.now() / 1000 - hitAt.current;
    if (rock.current) {
      const wobble = t < 0.3 ? Math.sin(t * 60) * 0.06 * (1 - t / 0.3) : 0;
      rock.current.rotation.z = wobble;
    }
    const active = useGame.getState().game.active;
    const id =
      active && getAction(active.actionId).skill === 'mining' ? active.actionId : 'mine_copper';
    color.set(ORE_COLORS[id] ?? '#d9822b');
    oreMat.color.lerp(color, 0.1);
    oreMat.emissive.lerp(color, 0.1);
  });

  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      <group ref={rock}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <dodecahedronGeometry args={[1.3, 0]} />
          <meshStandardMaterial color="#7b7f87" flatShading />
        </mesh>
        <mesh position={[0.9, 0.35, 0.8]} castShadow>
          <dodecahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#6c7078" flatShading />
        </mesh>
        {crystals.map((c, i) => (
          <mesh key={i} position={c.pos} rotation={c.rot} scale={c.s} material={oreMat}>
            <octahedronGeometry args={[1, 0]} />
          </mesh>
        ))}
      </group>
      <Burst
        trigger={burst}
        color="#9aa0a8"
        count={Math.min(14, particles)}
        position={[-0.6, 1, 0.8]}
      />
    </group>
  );
}

export function Campfire({ onTap, particles }: { onTap: TapHandler; particles: number }) {
  const st = stationFor('firemaking')!;
  const flame = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const lit = () => useGame.getState().game.fire > 0;
  const stones = useMemo(() => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2), []);

  useFrame(() => {
    const on = lit();
    const t = performance.now() / 1000;
    if (flame.current) {
      const target = on ? 1 : 0;
      const s = flame.current.scale.y + (target - flame.current.scale.y) * 0.08;
      flame.current.scale.set(
        s * (1 + Math.sin(t * 13) * 0.06),
        s * (1 + Math.sin(t * 17) * 0.12),
        s,
      );
      flame.current.visible = s > 0.02;
    }
    if (light.current)
      light.current.intensity = on ? 6 + Math.sin(t * 11) * 1.2 + Math.sin(t * 23) * 0.6 : 0;
  });

  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      {stones.map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.75, 0.1, Math.sin(a) * 0.75]} castShadow>
          <dodecahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial color="#777" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.15, 0]} rotation={[0, 0.5, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 1.1, 5]} />
        <meshStandardMaterial color="#5a3b22" flatShading />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[0, -0.7, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 1.1, 5]} />
        <meshStandardMaterial color="#5a3b22" flatShading />
      </mesh>
      <group ref={flame} position={[0, 0.25, 0]}>
        <mesh position={[0, 0.35, 0]}>
          <coneGeometry args={[0.35, 0.9, 5]} />
          <meshStandardMaterial
            color="#ff8a2a"
            emissive="#ff6a00"
            emissiveIntensity={2}
            flatShading
          />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.2, 0.6, 5]} />
          <meshStandardMaterial
            color="#ffe08a"
            emissive="#ffd25a"
            emissiveIntensity={2.5}
            flatShading
          />
        </mesh>
      </group>
      <pointLight
        ref={light}
        position={[0, 1, 0]}
        color="#ff9b4a"
        distance={9}
        decay={1.6}
        intensity={0}
      />
      <Rise
        active={lit}
        count={particles}
        color="#9a9a9a"
        position={[0, 1, 0]}
        height={3.5}
        opacity={0.35}
        size={0.35}
      />
      <Rise
        active={lit}
        count={Math.ceil(particles / 3)}
        color="#ffb347"
        position={[0, 0.6, 0]}
        height={1.6}
        spread={0.25}
        size={0.08}
        speed={1.4}
        opacity={0.9}
      />
    </group>
  );
}

export function Kitchen({ onTap, particles }: { onTap: TapHandler; particles: number }) {
  const st = stationFor('cooking')!;
  const lid = useRef<THREE.Mesh>(null);
  const cooking = () => activeSkillNow() === 'cooking' && useGame.getState().game.fire > 0;

  useFrame(() => {
    if (lid.current)
      lid.current.position.y =
        1.02 + (cooking() ? Math.abs(Math.sin(performance.now() / 120)) * 0.05 : 0);
  });

  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.5, 0.55, Math.sin(a) * 0.5]}
            rotation={[Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]}
          >
            <cylinderGeometry args={[0.04, 0.04, 1.2, 4]} />
            <meshStandardMaterial color="#3a3a3a" />
          </mesh>
        );
      })}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.35, 0.5, 8]} />
        <meshStandardMaterial color="#2f3136" metalness={0.5} roughness={0.5} flatShading />
      </mesh>
      <mesh ref={lid} position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.47, 0.47, 0.06, 8]} />
        <meshStandardMaterial color="#44474e" metalness={0.5} flatShading />
      </mesh>
      <Rise
        active={cooking}
        count={Math.ceil(particles / 2)}
        color="#ffffff"
        position={[0, 1.1, 0]}
        height={2}
        spread={0.2}
        opacity={0.45}
        size={0.25}
      />
      {/* Small table with ingredients */}
      <mesh position={[1.1, 0.4, 0.2]} castShadow>
        <boxGeometry args={[0.9, 0.08, 0.6]} />
        <meshStandardMaterial color="#8a6440" flatShading />
      </mesh>
      <mesh position={[1.1, 0.2, 0.2]}>
        <boxGeometry args={[0.8, 0.4, 0.5]} />
        <meshStandardMaterial color="#6b4a2f" flatShading />
      </mesh>
      <mesh position={[1.0, 0.52, 0.2]}>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshStandardMaterial color="#d33" flatShading />
      </mesh>
    </group>
  );
}

/** Some scattered rocks and bushes for life. Instanced. */
export function Decorations({ count }: { count: number }) {
  const rocks = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => {
    const rnd = scatter(99);
    return Array.from({ length: count }, () => {
      const a = rnd() * Math.PI * 2;
      const r = 3 + rnd() * 7.5;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.15 + rnd() * 0.35, rot: rnd() * 6 };
    });
  }, [count]);
  useFrame(() => {
    const inst = rocks.current;
    if (!inst || inst.userData.ready) return;
    const m = new THREE.Matrix4();
    items.forEach((it, i) => {
      m.compose(
        new THREE.Vector3(it.x, it.s * 0.4, it.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(it.rot, it.rot, 0)),
        new THREE.Vector3(it.s, it.s * 0.7, it.s),
      );
      inst.setMatrixAt(i, m);
    });
    inst.instanceMatrix.needsUpdate = true;
    inst.userData.ready = true;
  });
  return (
    <instancedMesh ref={rocks} args={[undefined, undefined, items.length]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8d8f94" flatShading />
    </instancedMesh>
  );
}

export function Forge({ onTap, particles }: { onTap: TapHandler; particles: number }) {
  const st = stationFor('smithing')!;
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const sparks = useRef(0);
  const working = () => activeSkillNow() === 'smithing';

  useCounterPulse(
    (s) => (s.stats.barsSmelted ?? 0) + (s.stats.itemsSmithed ?? 0),
    () => {
      sparks.current++;
    },
  );

  useFrame(() => {
    const t = performance.now() / 1000;
    const on = working();
    if (glow.current) glow.current.emissiveIntensity = on ? 2 + Math.sin(t * 9) * 0.5 : 0.4;
    if (light.current) light.current.intensity = on ? 4 + Math.sin(t * 13) : 0.5;
  });

  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      {/* Furnace */}
      <mesh position={[-0.6, 0.8, 0]} castShadow>
        <boxGeometry args={[1.2, 1.6, 1.1]} />
        <meshStandardMaterial color="#6e6258" flatShading />
      </mesh>
      <mesh position={[-0.6, 0.6, 0.56]}>
        <boxGeometry args={[0.6, 0.45, 0.02]} />
        <meshStandardMaterial
          ref={glow}
          color="#ff7a1a"
          emissive="#ff5a00"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[-0.6, 1.9, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.8, 6]} />
        <meshStandardMaterial color="#4f4640" flatShading />
      </mesh>
      <pointLight
        ref={light}
        position={[-0.6, 0.8, 1]}
        color="#ff8a3d"
        distance={6}
        intensity={0.5}
      />
      {/* Anvil */}
      <mesh position={[0.8, 0.25, 0.2]}>
        <boxGeometry args={[0.35, 0.5, 0.35]} />
        <meshStandardMaterial color="#5a3b22" flatShading />
      </mesh>
      <mesh position={[0.8, 0.6, 0.2]} castShadow>
        <boxGeometry args={[0.8, 0.22, 0.32]} />
        <meshStandardMaterial color="#3b3f46" metalness={0.7} roughness={0.35} flatShading />
      </mesh>
      <Rise
        active={working}
        count={Math.ceil(particles / 3)}
        color="#777"
        position={[-0.6, 2.3, 0]}
        height={2.5}
        opacity={0.35}
        size={0.3}
      />
      <Burst
        trigger={sparks}
        color="#ffcc33"
        count={Math.min(18, particles)}
        position={[0.8, 0.8, 0.2]}
        speed={4}
        size={0.06}
      />
    </group>
  );
}

export function FishingSpot({ onTap, particles }: { onTap: TapHandler; particles: number }) {
  const st = stationFor('fishing')!;
  const bobber = useRef<THREE.Mesh>(null);
  const splash = useRef(0);
  const fishing = () => activeSkillNow() === 'fishing';

  useCounterPulse(
    (s) => s.stats.fishCaught ?? 0,
    () => {
      splash.current++;
    },
  );

  useFrame(() => {
    const b = bobber.current;
    if (!b) return;
    const on = fishing();
    b.visible = on;
    b.position.y = 0.05 + Math.sin(performance.now() / 300) * 0.04;
  });

  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      {/* Small pier towards the river */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0.6 + i * 0.35, 0.08, 0]}>
          <boxGeometry args={[0.32, 0.08, 1]} />
          <meshStandardMaterial color="#8a6440" flatShading />
        </mesh>
      ))}
      <mesh position={[0.4, 0.3, 0.6]}>
        <boxGeometry args={[0.35, 0.5, 0.35]} />
        <meshStandardMaterial color="#6b4a2f" flatShading />
      </mesh>
      <mesh ref={bobber} position={[2.4, 0.05, 0.2]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshStandardMaterial color="#e5534b" />
      </mesh>
      <Burst
        trigger={splash}
        color="#9fd8ff"
        count={Math.min(12, particles)}
        position={[2.4, 0.1, 0.2]}
        speed={2}
        size={0.1}
      />
    </group>
  );
}
