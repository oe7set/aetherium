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
      <sphereGeometry args={[170, 32, 16]} />
    </mesh>
  );
}

/** One ring of terrain: jagged silhouette from layered sines, snow above `snow` (world units). */
function ringGeometry(
  radius: number,
  base: number,
  amp: number,
  seed: number,
  rock: THREE.Color,
  low: THREE.Color,
  snow: number,
): THREE.BufferGeometry {
  const N = 220;
  const rnd = scatter(seed);
  const ph = Array.from({ length: 5 }, () => rnd() * Math.PI * 2);
  const pos: number[] = [];
  const col: number[] = [];
  const t: number[] = [];
  const white = new THREE.Color('#f4f7ff');
  const c = new THREE.Color();
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = radius + Math.sin(a * 4 + ph[0]!) * radius * 0.06;
    // Broad ranges, mid hills and sharp ridges (1 - |sin| gives pointed peaks).
    const n =
      0.45 * (0.5 + 0.5 * Math.sin(a * 3 + ph[1]!)) +
      0.3 * (1 - Math.abs(Math.sin(a * 7 + ph[2]!))) +
      0.17 * (1 - Math.abs(Math.sin(a * 19 + ph[3]!))) +
      0.08 * Math.sin(a * 41 + ph[4]!);
    const h = base + amp * Math.max(0, n);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    pos.push(x, -1.2, z, x, h, z);
    c.copy(h > snow ? white : rock);
    col.push(low.r, low.g, low.b, c.r, c.g, c.b);
    t.push(0, 1);
  }
  const index: number[] = [];
  for (let i = 0; i < N; i++) {
    const k = i * 2;
    index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(t, 1));
  g.setIndex(index);
  return g;
}

function hazeMaterial(haze: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    fog: false,
    vertexColors: true,
    uniforms: {
      uHorizon: { value: new THREE.Color() },
      uDay: { value: 1 },
      uHaze: { value: haze },
    },
    vertexShader: /* glsl */ `
      attribute float aT;
      varying vec3 vCol;
      varying float vT;
      void main() {
        vCol = color;
        vT = aT;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uHorizon;
      uniform float uDay;
      uniform float uHaze;
      varying vec3 vCol;
      varying float vT;
      void main() {
        vec3 col = vCol * (0.3 + 0.7 * uDay);
        // Atmospheric perspective: far layers and the foot of the mountains melt into the horizon.
        float haze = clamp(uHaze + (1.0 - vT) * 0.35, 0.0, 0.9);
        col = mix(col, uHorizon, haze);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

const MOUNTAIN_ROCK = new THREE.Color('#4a5a7e');
const MOUNTAIN_FOOT = new THREE.Color('#2c3852');
const HILL_GREEN = new THREE.Color('#3f7a46');
const HILL_FOOT = new THREE.Color('#2d5a3a');

/**
 * Mountains and hills far behind the island – two hazy rings so the world does not end at the
 * beach. Not affected by scene fog (they would vanish); they fade into the horizon colour instead.
 */
export function Mountains() {
  const layers = useMemo(
    () => [
      {
        // Mountains with snow caps, just behind the hills.
        geo: ringGeometry(66, 3, 9.5, 11, MOUNTAIN_ROCK, MOUNTAIN_FOOT, 8.5),
        mat: hazeMaterial(0.06),
      },
      {
        // Green hills around the bay.
        geo: ringGeometry(56, 0.4, 4, 23, HILL_GREEN, HILL_FOOT, 99),
        mat: hazeMaterial(0.12),
      },
    ],
    [],
  );
  useFrame(() => {
    const light = daylight(dayPhase());
    for (const l of layers) {
      (l.mat.uniforms.uHorizon!.value as THREE.Color).copy(HORIZON);
      l.mat.uniforms.uDay!.value = light;
    }
  });
  return (
    <group>
      {layers.map((l, i) => (
        <mesh key={i} geometry={l.geo} material={l.mat} renderOrder={-0.5} />
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
