import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ISLAND_RADIUS, scatter } from './layout';
import { HORIZON } from './horizon';
import { dayPhase, daylight } from './time';

/**
 * Sky dome: vertical gradient (zenith → horizon) with a sun glow and a moon, both following the
 * day/night cycle. Replaces the flat background colour; one draw call, no textures.
 */
export function SkyDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uSun: { value: new THREE.Vector3(0, 1, 0) },
          uSunColor: { value: new THREE.Color('#fff2c4') },
          uNight: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uHorizon;
          uniform vec3 uSun;
          uniform vec3 uSunColor;
          uniform float uNight;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, 0.0, 1.0);
            vec3 col = mix(uHorizon, uTop, pow(h, 0.55));
            float d = max(0.0, dot(vDir, normalize(uSun)));
            // Sun by day, moon by night (opposite side), both with a soft halo.
            col += uSunColor * (pow(d, 900.0) * 1.4 + pow(d, 12.0) * 0.35) * (1.0 - uNight);
            float m = max(0.0, dot(vDir, normalize(-uSun)));
            col += vec3(0.85, 0.9, 1.0) * (pow(m, 1400.0) * 1.1 + pow(m, 40.0) * 0.12) * uNight;
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  );
  const top = useMemo(() => new THREE.Color(), []);
  const horizon = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const phase = dayPhase();
    const light = daylight(phase);
    const dusk = Math.max(0, 1 - Math.abs(light - 0.45) * 4);
    top.set('#0b1230').lerp(new THREE.Color('#3f8fe0'), light);
    horizon
      .set('#1f2a4d')
      .lerp(new THREE.Color('#bfe3ff'), light)
      .lerp(new THREE.Color('#ff9a62'), dusk * 0.7);
    const angle = (phase - 0.25) * Math.PI * 2;
    material.uniforms.uTop!.value.copy(top);
    material.uniforms.uHorizon!.value.copy(horizon);
    HORIZON.copy(horizon);
    (material.uniforms.uSun!.value as THREE.Vector3).set(
      Math.cos(angle),
      Math.sin(angle) * 0.8 + 0.05,
      0.35,
    );
    material.uniforms.uNight!.value = 1 - light;
  });
  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[95, 32, 16]} />
    </mesh>
  );
}

/** Hazy islands on the horizon – the world does not end at the beach. */
export function DistantIslands() {
  const islands = useMemo(() => {
    const rnd = scatter(9191);
    return Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + rnd() * 0.5;
      const r = 72 + rnd() * 12;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: 5 + rnd() * 7, h: 3 + rnd() * 5 };
    });
  }, []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4d7a55', flatShading: true }),
    [],
  );
  return (
    <group>
      {islands.map((it, i) => (
        <mesh key={i} material={mat} position={[it.x, -1.1, it.z]} scale={[it.s, it.h, it.s * 0.8]}>
          <coneGeometry args={[1, 1, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** A little flock circling above the island; they head home at night. */
export function Birds({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);
  const birds = useMemo(() => {
    const rnd = scatter(321);
    return Array.from({ length: count }, (_, i) => ({
      offset: i * 0.22 + rnd() * 0.1,
      radius: 6 + rnd() * 5,
      y: 6 + rnd() * 2,
      flap: rnd() * 10,
    }));
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ color: '#f2f4ff', side: THREE.DoubleSide, transparent: true }),
    [],
  );
  const wing = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([0, 0, -0.08, 0, 0, 0.08, 0.32, 0, 0]), 3),
    );
    g.computeVertexNormals();
    return g;
  }, []);
  useFrame(() => {
    const t = performance.now() / 1000;
    const light = daylight(dayPhase());
    mat.opacity = Math.min(1, light * 1.6);
    if (!group.current) return;
    group.current.visible = mat.opacity > 0.05;
    group.current.children.forEach((b, i) => {
      const bd = birds[i]!;
      const a = t * 0.18 + bd.offset;
      b.position.set(
        Math.cos(a) * bd.radius,
        bd.y + Math.sin(t * 0.7 + bd.flap) * 0.4,
        Math.sin(a) * bd.radius,
      );
      b.rotation.y = -a;
      const flap = Math.sin(t * 9 + bd.flap) * 0.6;
      b.children[0]!.rotation.z = flap;
      b.children[1]!.rotation.z = -flap;
    });
  });
  return (
    <group ref={group}>
      {birds.map((_, i) => (
        <group key={i}>
          <mesh geometry={wing} material={mat} />
          <mesh geometry={wing} material={mat} scale={[-1, 1, 1]} />
        </group>
      ))}
    </group>
  );
}

/** A sailboat slowly circling the island, bobbing on the waves. */
export function Sailboat() {
  const boat = useRef<THREE.Group>(null);
  const sail = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([0, 0.25, 0, 0, 2.2, 0, 1.1, 0.25, 0]), 3),
    );
    g.computeVertexNormals();
    return g;
  }, []);
  useFrame(() => {
    const t = performance.now() / 1000;
    const a = t * 0.025;
    const r = ISLAND_RADIUS + 7;
    if (!boat.current) return;
    boat.current.position.set(Math.cos(a) * r, -0.95 + Math.sin(t * 1.4) * 0.08, Math.sin(a) * r);
    boat.current.rotation.set(Math.sin(t * 1.1) * 0.05, -a, Math.sin(t * 1.4) * 0.06);
  });
  return (
    <group ref={boat} scale={0.9}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.7, 0.35, 2]} />
        <meshStandardMaterial color="#8a5a35" flatShading />
      </mesh>
      <mesh position={[0, 1.1, 0.1]}>
        <cylinderGeometry args={[0.04, 0.05, 2]} />
        <meshStandardMaterial color="#5a3b22" />
      </mesh>
      <mesh geometry={sail} position={[0.03, 0.05, 0.1]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color="#f4ecd8" side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh position={[0, 2.2, 0.1]}>
        <boxGeometry args={[0.02, 0.18, 0.3]} />
        <meshStandardMaterial color="#7c5cff" emissive="#7c5cff" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

/** Now and then a fish jumps out of the water near the beach. */
export function JumpingFish() {
  const fish = useRef<THREE.Mesh>(null);
  const state = useRef({ start: 0, x: 0, z: 0, dir: 0 });
  useFrame(() => {
    const t = performance.now() / 1000;
    const st = state.current;
    const JUMP = 1.1;
    if (t - st.start > 4 + (Math.floor(st.start) % 3)) {
      const a = Math.random() * Math.PI * 2;
      const r = ISLAND_RADIUS + 2 + Math.random() * 4;
      st.start = t;
      st.x = Math.cos(a) * r;
      st.z = Math.sin(a) * r;
      st.dir = a + Math.PI / 2;
    }
    const p = (t - st.start) / JUMP;
    if (!fish.current) return;
    fish.current.visible = p < 1;
    if (p >= 1) return;
    const along = (p - 0.5) * 1.6;
    fish.current.position.set(
      st.x + Math.cos(st.dir) * along,
      -1 + Math.sin(p * Math.PI) * 1.2,
      st.z + Math.sin(st.dir) * along,
    );
    fish.current.rotation.set(0, -st.dir, (0.5 - p) * 2.2);
  });
  return (
    <mesh ref={fish} visible={false} scale={[0.45, 0.18, 0.12]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#9fd3ff" metalness={0.4} roughness={0.3} flatShading />
    </mesh>
  );
}
