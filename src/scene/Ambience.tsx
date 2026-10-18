import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ISLAND_RADIUS, scatter } from './layout';
import { HORIZON } from './Life';
import { dayPhase, daylight } from './time';

/** Animated ocean: vertex waves + depth gradient + glinting highlights. One draw call. */
export function Ocean() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDay: { value: 1 },
          uDeep: { value: new THREE.Color('#0b4a86') },
          uShallow: { value: new THREE.Color('#1f8fc4') },
          uIsland: { value: ISLAND_RADIUS },
          uHorizon: { value: new THREE.Color() },
        },
        vertexShader: /* glsl */ `
          uniform float uTime;
          varying vec2 vPos;
          varying float vWave;
          void main() {
            vec3 p = position;
            float w = sin(p.x * 0.35 + uTime * 0.9) * 0.12 + cos(p.y * 0.3 + uTime * 0.7) * 0.12;
            p.z += w;
            vWave = w;
            vPos = p.xy;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uDay;
          uniform vec3 uDeep;
          uniform vec3 uShallow;
          uniform float uIsland;
          uniform vec3 uHorizon;
          varying vec2 vPos;
          varying float vWave;
          void main() {
            float d = length(vPos);
            float shore = smoothstep(uIsland + 6.0, uIsland - 0.5, d);
            vec3 col = mix(uDeep, uShallow, shore);
            float foam = smoothstep(0.75, 1.0, sin(d * 3.0 - uTime * 1.6) * 0.5 + 0.5) * smoothstep(uIsland + 2.5, uIsland, d);
            float glint = pow(max(0.0, vWave * 4.0 + 0.2), 3.0) * 0.35;
            col += vec3(foam * 0.6) + vec3(glint);
            col *= 0.35 + 0.65 * uDay;
            // Far water fades into the sky – no hard edge, a real horizon.
            col = mix(col, uHorizon, smoothstep(uIsland + 4.0, 46.0, d) * 0.75);
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  );
  useFrame(() => {
    material.uniforms.uTime!.value = performance.now() / 1000;
    material.uniforms.uDay!.value = daylight(dayPhase());
    (material.uniforms.uHorizon!.value as THREE.Color).copy(HORIZON);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]} material={material}>
      <planeGeometry args={[160, 160, 64, 64]} />
    </mesh>
  );
}

/** A handful of low-poly clouds drifting around the island. */
export function Clouds({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);
  const clouds = useMemo(() => {
    const rnd = scatter(777);
    return Array.from({ length: count }, () => ({
      angle: rnd() * Math.PI * 2,
      radius: 14 + rnd() * 12,
      y: 9 + rnd() * 5,
      scale: 0.8 + rnd() * 1.2,
      speed: 0.01 + rnd() * 0.02,
    }));
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        flatShading: true,
        transparent: true,
        opacity: 0.88,
      }),
    [],
  );
  useFrame(() => {
    const t = performance.now() / 1000;
    const light = daylight(dayPhase());
    mat.color.setHSL(0.62, 0.25, 0.45 + light * 0.5);
    group.current?.children.forEach((c, i) => {
      const cl = clouds[i]!;
      const a = cl.angle + t * cl.speed;
      c.position.set(Math.cos(a) * cl.radius, cl.y, Math.sin(a) * cl.radius);
    });
  });
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} scale={c.scale}>
          <mesh material={mat}>
            <icosahedronGeometry args={[1.2, 0]} />
          </mesh>
          <mesh material={mat} position={[1.1, -0.2, 0.2]}>
            <icosahedronGeometry args={[0.9, 0]} />
          </mesh>
          <mesh material={mat} position={[-1.1, -0.25, -0.1]}>
            <icosahedronGeometry args={[0.8, 0]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Fireflies at night, pollen during the day. Additive points, fade with daylight. */
export function Fireflies({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);
  const seeds = useMemo(() => {
    const rnd = scatter(4242);
    return Array.from({ length: count }, () => {
      const a = rnd() * Math.PI * 2;
      const r = 2 + rnd() * (ISLAND_RADIUS - 3);
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, p: rnd() * 10, h: 0.4 + rnd() * 1.6 };
    });
  }, [count]);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  useFrame(() => {
    const t = performance.now() / 1000;
    const night = 1 - daylight(dayPhase());
    if (mat.current) {
      mat.current.opacity = 0.25 + night * 0.75;
      mat.current.color.set(night > 0.5 ? '#c8ff6a' : '#fff4c2');
      mat.current.size = night > 0.5 ? 0.18 : 0.08;
    }
    seeds.forEach((s, i) => {
      positions[i * 3] = s.x + Math.sin(t * 0.6 + s.p) * 0.6;
      positions[i * 3 + 1] = s.h + Math.sin(t * 1.3 + s.p * 2) * 0.25;
      positions[i * 3 + 2] = s.z + Math.cos(t * 0.5 + s.p) * 0.6;
    });
    const attr = points.current?.geometry.getAttribute('position') as
      THREE.BufferAttribute | undefined;
    if (attr) attr.needsUpdate = true;
  });
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        size={0.15}
        color="#c8ff6a"
      />
    </points>
  );
}
