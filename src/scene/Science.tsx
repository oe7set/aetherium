import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { CROP_MAP, getAction } from '../data';
import { useGame } from '../store/gameStore';
import { stationFor } from './layout';

type TapHandler = (e: ThreeEvent<MouseEvent>) => void;

/** Research tower: scaffolded until the first tech, then a glowing lab. */
export function ResearchTower({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('research')!;
  const researched = useGame((s) => s.game.techs.length);
  const windowMat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (windowMat.current)
      windowMat.current.emissiveIntensity =
        researched > 0 ? 1.2 + Math.sin(performance.now() / 400) * 0.4 : 0;
  });
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.9, 1.1, 3.6, 8]} />
        <meshStandardMaterial color="#b8b0a0" flatShading />
      </mesh>
      <mesh position={[0, 4.1, 0]} castShadow>
        <coneGeometry args={[1.2, 1.4, 8]} />
        <meshStandardMaterial color="#5b4a8a" flatShading />
      </mesh>
      <mesh position={[0, 2.6, 0.92]}>
        <boxGeometry args={[0.4, 0.6, 0.05]} />
        <meshStandardMaterial
          ref={windowMat}
          color="#ffe9a8"
          emissive="#ffcc55"
          emissiveIntensity={0}
        />
      </mesh>
      {researched === 0 &&
        [-1, 1].map((x) => (
          <mesh key={x} position={[x * 1.2, 1.6, 0]}>
            <boxGeometry args={[0.08, 3.2, 0.08]} />
            <meshStandardMaterial color="#8a6440" />
          </mesh>
        ))}
      {researched >= 5 && (
        <mesh position={[0, 5.1, 0]}>
          <octahedronGeometry args={[0.25, 0]} />
          <meshStandardMaterial color="#7d5fd6" emissive="#7d5fd6" emissiveIntensity={2} />
        </mesh>
      )}
    </group>
  );
}

/** Particle accelerator ring around the island once researched (the world grows with progress). */
export function AcceleratorRing() {
  const has = useGame((s) => s.game.techs.includes('accelerator'));
  const ring = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (ring.current) ring.current.rotation.z += 0.002;
    if (mat.current) mat.current.emissiveIntensity = 0.6 + Math.sin(performance.now() / 300) * 0.3;
  });
  if (!has) return null;
  return (
    <mesh ref={ring} position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[12.5, 0.35, 8, 64]} />
      <meshStandardMaterial
        ref={mat}
        color="#9aa0a8"
        metalness={0.8}
        roughness={0.3}
        emissive="#3fb7d9"
        emissiveIntensity={0.6}
      />
    </mesh>
  );
}

/** 3×n farm patches with crops scaled by growth. */
export function Fields({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('farming')!;
  const count = useGame((s) => s.game.plots.length);
  const crops = useRef<(THREE.Mesh | null)[]>([]);
  const cropMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#7fbf3f', flatShading: true }),
    [],
  );
  useFrame(() => {
    const plots = useGame.getState().game.plots;
    plots.forEach((p, i) => {
      const m = crops.current[i];
      if (!m) return;
      const crop = p.seed ? CROP_MAP.get(p.seed) : undefined;
      const f = crop ? Math.min(1, p.elapsed / crop.growTime) : 0;
      m.visible = !!crop;
      m.scale.set(0.6 + f * 0.6, 0.2 + f * 1.4, 0.6 + f * 0.6);
    });
  });
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      {Array.from({ length: count }, (_, i) => {
        const x = (i % 3) * 1.1 - 1.1;
        const z = Math.floor(i / 3) * 1.1 - 0.5;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.05, 0]} receiveShadow>
              <boxGeometry args={[0.95, 0.1, 0.95]} />
              <meshStandardMaterial color="#5a3d26" flatShading />
            </mesh>
            <mesh
              ref={(el) => {
                crops.current[i] = el;
              }}
              position={[0, 0.3, 0]}
              material={cropMat}
            >
              <coneGeometry args={[0.3, 0.5, 5]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function Workbench({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('crafting')!;
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.4, 0.12, 0.7]} />
        <meshStandardMaterial color="#9a7046" flatShading />
      </mesh>
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.27, 0]}>
          <boxGeometry args={[0.1, 0.55, 0.6]} />
          <meshStandardMaterial color="#6b4a2f" />
        </mesh>
      ))}
      <mesh position={[0.3, 0.75, 0]} rotation={[0, 0, Math.PI / 2.2]}>
        <torusGeometry args={[0.25, 0.02, 4, 8, Math.PI]} />
        <meshStandardMaterial color="#5a3b22" />
      </mesh>
    </group>
  );
}

export function HuntingGround({ onTap }: { onTap: TapHandler }) {
  const st = stationFor('hunting')!;
  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#7a5536" wireframe />
      </mesh>
      <mesh position={[0.8, 0.15, 0.4]}>
        <sphereGeometry args={[0.18, 6, 5]} />
        <meshStandardMaterial color="#c9b79c" flatShading />
      </mesh>
    </group>
  );
}

const HELPER_COLORS: Record<string, string> = {
  intern: '#f0c8a0',
  gnome: '#d9534f',
  golem: '#8a7f72',
  robot: '#b8c4d4',
  ai: '#7d5fd6',
};

/** Small helper figures bobbing at their assigned stations. */
export function Helpers() {
  const key = useGame((s) => s.game.helpers.map((h) => `${h.type}:${h.actionId ?? ''}`).join('|'));
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    group.current?.children.forEach((c, i) => {
      c.position.y = Math.abs(Math.sin(performance.now() / 250 + i)) * 0.15;
    });
  });
  if (!key) return null;
  return (
    <group ref={group}>
      {key.split('|').map((entry, i) => {
        const [type = 'intern', actionId] = entry.split(':');
        const st = actionId ? stationFor(getAction(actionId).skill) : stationFor('research');
        if (!st) return null;
        const angle = i * 1.3;
        const scale = type === 'golem' ? 1.3 : type === 'gnome' ? 0.7 : 1;
        return (
          <group
            key={i}
            position={[
              st.workPos[0] + Math.cos(angle) * 1.2,
              0,
              st.workPos[1] + Math.sin(angle) * 1.2,
            ]}
            scale={scale}
          >
            <mesh position={[0, 0.45, 0]} castShadow>
              <capsuleGeometry args={[0.18, 0.4, 3, 6]} />
              <meshStandardMaterial color={HELPER_COLORS[type] ?? '#ccc'} flatShading />
            </mesh>
            {type === 'gnome' && (
              <mesh position={[0, 0.95, 0]}>
                <coneGeometry args={[0.18, 0.4, 6]} />
                <meshStandardMaterial color="#d9534f" />
              </mesh>
            )}
            <mesh position={[0, 0.8, 0]}>
              <sphereGeometry args={[0.15, 6, 5]} />
              <meshStandardMaterial
                color={type === 'robot' || type === 'ai' ? '#dfe6ee' : '#f0c8a0'}
                flatShading
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Ahnen-Obelisk: appears after the first rebirth and grows with every prestige. */
export function Obelisk() {
  const rebirths = useGame(
    (s) => s.game.prestige.rebirths + s.game.prestige.paradigms * 3 + s.game.prestige.bigBangs * 10,
  );
  const gem = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (gem.current) {
      gem.current.rotation.y += 0.01;
      gem.current.position.y =
        2.2 + Math.min(3, rebirths * 0.15) + Math.sin(performance.now() / 500) * 0.1;
    }
  });
  if (rebirths <= 0) return null;
  const height = 1.6 + Math.min(3, rebirths * 0.15);
  return (
    <group position={[1.4, 0, -2.2]}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[0.45, height, 0.45]} />
        <meshStandardMaterial color="#d8d2c4" flatShading />
      </mesh>
      <mesh ref={gem} position={[0, height + 0.5, 0]}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#b085f5" emissive="#b085f5" emissiveIntensity={1.8} />
      </mesh>
    </group>
  );
}
