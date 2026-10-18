import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BurstProps {
  /** Increment to trigger a new burst. */
  trigger: { current: number };
  color: string;
  count: number;
  position: [number, number, number];
  speed?: number;
  size?: number;
}

/** A pooled one-shot burst of small cubes (ore chunks, wood chips, sparks). One draw call. */
export function Burst({ trigger, color, count, position, speed = 3, size = 0.12 }: BurstProps) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const seen = useRef(0);
  const startedAt = useRef(-10);
  const velocities = useMemo(
    () =>
      Array.from({ length: count }, () =>
        new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() * 0.8 + 0.6,
          Math.random() - 0.5,
        ).multiplyScalar(speed),
      ),
    [count, speed],
  );
  const m = useMemo(() => new THREE.Matrix4(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const scale = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    const inst = mesh.current;
    if (!inst) return;
    if (trigger.current !== seen.current) {
      seen.current = trigger.current;
      startedAt.current = performance.now() / 1000;
    }
    const t = performance.now() / 1000 - startedAt.current;
    const alive = t < 0.9;
    inst.visible = alive;
    if (!alive) return;
    velocities.forEach((v, i) => {
      p.set(v.x * t, v.y * t - 4.9 * t * t, v.z * t);
      scale.setScalar(size * (1 - t / 0.9));
      m.compose(p, q, scale);
      inst.setMatrixAt(i, m);
    });
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      position={position}
      visible={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} flatShading />
    </instancedMesh>
  );
}

interface RiseProps {
  active: () => boolean;
  count: number;
  color: string;
  position: [number, number, number];
  height?: number;
  spread?: number;
  size?: number;
  speed?: number;
  opacity?: number;
}

/** Continuous rising particles (smoke, steam, embers) as Points. Fades out when inactive. */
export function Rise({
  active,
  count,
  color,
  position,
  height = 3,
  spread = 0.4,
  size = 0.25,
  speed = 0.8,
  opacity = 0.5,
}: RiseProps) {
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => [Math.random(), Math.random(), Math.random()] as const),
    [count],
  );
  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame((_, dt) => {
    const pts = points.current;
    if (!pts || !mat.current) return;
    const target = active() ? opacity : 0;
    mat.current.opacity += (target - mat.current.opacity) * Math.min(1, dt * 3);
    pts.visible = mat.current.opacity > 0.01;
    if (!pts.visible) return;
    const time = performance.now() / 1000;
    seeds.forEach(([a, b, c], i) => {
      const life = (time * speed * (0.6 + a * 0.6) + b) % 1;
      positions[i * 3] = Math.sin(c * 20 + time) * spread * (0.3 + life);
      positions[i * 3 + 1] = life * height;
      positions[i * 3 + 2] = Math.cos(a * 20 + time) * spread * (0.3 + life);
    });
    const attr = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
  });

  return (
    <points ref={points} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        color={color}
        size={size}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </points>
  );
}
