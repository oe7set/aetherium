import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { getMonster } from '../data';
import { useGame } from '../store/gameStore';
import { useCounterPulse } from './hooks';
import { stationFor } from './layout';
import { Burst } from './Particles';

/** Fighting ring with the current monster: hit flashes, death poof and boss crown. */
export function Arena({
  onTap,
  particles,
}: {
  onTap: (e: ThreeEvent<MouseEvent>) => void;
  particles: number;
}) {
  const st = stationFor('combat')!;
  const monster = useRef<THREE.Group>(null);
  const crown = useRef<THREE.Mesh>(null);
  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#888', flatShading: true }),
    [],
  );
  const base = useMemo(() => new THREE.Color(), []);
  const hitAt = useRef(-10);
  const deathAt = useRef(-10);
  const poof = useRef(0);
  const posts = useMemo(() => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2), []);

  useCounterPulse(
    (s) => s.stats.damageDealt ?? 0,
    () => {
      hitAt.current = performance.now() / 1000;
    },
  );
  useCounterPulse(
    (s) => s.stats.monstersKilled ?? 0,
    () => {
      deathAt.current = performance.now() / 1000;
      poof.current++;
    },
  );

  useFrame(() => {
    const g = monster.current;
    if (!g) return;
    const combat = useGame.getState().game.combat;
    const now = performance.now() / 1000;
    if (!combat) {
      g.visible = false;
      return;
    }
    const def = getMonster(combat.monster);
    g.visible = true;
    const sinceDeath = now - deathAt.current;
    const alive = combat.monsterHp > 0;
    const spawnScale = alive
      ? Math.min(1, sinceDeath > 0.4 ? 1 : sinceDeath / 0.4)
      : Math.max(0, 1 - sinceDeath / 0.3);
    g.scale.setScalar(def.size * Math.max(0.01, spawnScale));
    const sinceHit = now - hitAt.current;
    g.position.x = sinceHit < 0.2 ? Math.sin(sinceHit * 80) * 0.08 : 0;
    g.position.y = Math.abs(Math.sin(now * 3)) * 0.1;
    base.set(def.color);
    if (sinceHit < 0.15) base.lerp(new THREE.Color('#ffffff'), 0.7);
    bodyMat.color.copy(base);
    if (crown.current) crown.current.visible = !!def.boss;
  });

  return (
    <group position={[st.pos[0], 0, st.pos[1]]} onClick={onTap}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.2, 16]} />
        <meshStandardMaterial color="#d8c08a" flatShading />
      </mesh>
      {posts.map((a) => (
        <mesh key={a} position={[Math.cos(a) * 2.3, 0.35, Math.sin(a) * 2.3]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.7, 5]} />
          <meshStandardMaterial color="#7a5536" flatShading />
        </mesh>
      ))}
      <group ref={monster} position={[0, 0, 0]}>
        <mesh position={[0, 0.7, 0]} material={bodyMat} castShadow>
          <icosahedronGeometry args={[0.6, 0]} />
        </mesh>
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, 0.85, 0.5]}>
            <sphereGeometry args={[0.09, 6, 5]} />
            <meshStandardMaterial color="#fff" emissive="#ffeeaa" emissiveIntensity={0.4} />
          </mesh>
        ))}
        {[-0.3, 0.3].map((x) => (
          <mesh key={`leg${x}`} position={[x, 0.15, 0]}>
            <boxGeometry args={[0.15, 0.3, 0.15]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        ))}
        <mesh ref={crown} position={[0, 1.35, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.2, 6]} />
          <meshStandardMaterial
            color="#f2c94c"
            metalness={0.8}
            roughness={0.3}
            emissive="#a07d22"
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>
      <Burst
        trigger={poof}
        color="#ffffff"
        count={Math.min(16, particles)}
        position={[0, 0.8, 0]}
        speed={3}
        size={0.14}
      />
    </group>
  );
}
