import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { dayPhase, daylight } from './time';

const DAY_SKY = new THREE.Color('#8ec5ff');
const DUSK_SKY = new THREE.Color('#f08a5d');
const NIGHT_SKY = new THREE.Color('#1a2440');

/** Sun, moon, ambient light and background colour following the day/night cycle. */
export function DayNight({ shadows, shadowMapSize }: { shadows: boolean; shadowMapSize: number }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const stars = useRef<THREE.Points>(null);
  const { scene } = useThree();
  const bg = useMemo(() => new THREE.Color(), []);
  const starGeo = useMemo(() => {
    const pos = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45;
      pos[i * 3] = Math.cos(theta) * Math.sin(phi) * 60;
      pos[i * 3 + 1] = Math.cos(phi) * 60;
      pos[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * 60;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame(() => {
    const phase = dayPhase();
    const light = daylight(phase);
    const angle = (phase - 0.25) * Math.PI * 2;
    const dusk = Math.max(0, 1 - Math.abs(light - 0.45) * 4);
    bg.copy(NIGHT_SKY)
      .lerp(DAY_SKY, light)
      .lerp(DUSK_SKY, dusk * 0.5);
    scene.background = bg;
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(bg);
    if (sun.current) {
      sun.current.position.set(Math.cos(angle) * 20, Math.max(2, Math.sin(angle) * 25), 8);
      sun.current.intensity = 0.6 + light * 1.9;
      // Night: cool moonlight; day: warm sun.
      sun.current.color.setHSL(0.1 + (1 - light) * 0.5, 0.5, 0.6 + light * 0.3);
    }
    if (hemi.current) hemi.current.intensity = 0.9 + light * 0.7;
    if (stars.current) {
      const m = stars.current.material as THREE.PointsMaterial;
      m.opacity = Math.max(0, 1 - light * 1.6);
      stars.current.visible = m.opacity > 0.02;
    }
  });

  return (
    <>
      <fog attach="fog" args={['#8ec5ff', 35, 90]} />
      <hemisphereLight ref={hemi} args={['#cfe6ff', '#3d5a2a', 1]} />
      <directionalLight
        ref={sun}
        castShadow={shadows}
        shadow-mapSize-width={shadowMapSize || 512}
        shadow-mapSize-height={shadowMapSize || 512}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <points ref={stars} geometry={starGeo}>
        <pointsMaterial
          color="#ffffff"
          size={0.4}
          transparent
          opacity={0}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </>
  );
}
