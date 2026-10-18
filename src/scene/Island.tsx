import { useMemo } from 'react';
import * as THREE from 'three';
import { distanceToRiver, IDLE_POS, ISLAND_RADIUS, RIVER_POINTS, STATIONS } from './layout';

/** Distance from p to the segment a–b (2D). */
function segDist(
  px: number,
  pz: number,
  a: readonly [number, number],
  b: readonly [number, number],
) {
  const [ax, az] = a;
  const dx = b[0] - ax;
  const dz = b[1] - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

/**
 * The island's surface as one static, vertex-coloured disc: grass patches, lush banks along the
 * river, a sandy beach at the rim and trodden paths from the middle to every station.
 */
function useGroundGeometry(): THREE.BufferGeometry {
  return useMemo(() => {
    const geo = new THREE.RingGeometry(0.001, ISLAND_RADIUS, 72, 28);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position!;
    const colors = new Float32Array(pos.count * 3);
    const grass = new THREE.Color('#5c9e45');
    const light = new THREE.Color('#79b955');
    const lush = new THREE.Color('#3f8a3a');
    const dirt = new THREE.Color('#a8865a');
    const sand = new THREE.Color('#e3cf95');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.hypot(x, z);
      // Soft patches from a few overlapping sine waves (deterministic, no texture).
      const n =
        Math.sin(x * 0.9 + z * 0.4) * 0.5 +
        Math.sin(z * 1.3 - x * 0.7) * 0.3 +
        Math.sin(x * 2.1) * 0.2;
      c.copy(grass).lerp(light, Math.max(0, n) * 0.6);
      const river = distanceToRiver(x, z);
      if (river < 1.8) c.lerp(lush, (1 - river / 1.8) * 0.7);
      let path = Infinity;
      for (const st of STATIONS) path = Math.min(path, segDist(x, z, IDLE_POS, st.workPos));
      if (path < 0.45 && river > 1) c.lerp(dirt, (1 - path / 0.45) * 0.75);
      const beach = (d - (ISLAND_RADIUS - 1.1)) / 0.9;
      if (beach > 0) c.lerp(sand, Math.min(1, beach));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);
}

export function Island() {
  const ground = useGroundGeometry();
  const river = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      RIVER_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    );
    const geo = new THREE.TubeGeometry(curve, 40, 0.9, 6, false);
    geo.scale(1, 0.06, 1);
    return geo;
  }, []);

  return (
    <group>
      {/* Island body: grass top, dirt sides. Cylinder groups: 0 side, 1 top, 2 bottom. */}
      <mesh position={[0, -0.75, 0]} receiveShadow>
        <cylinderGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS * 0.82, 1.5, 18, 1]} />
        <meshStandardMaterial attach="material-0" color="#7a5536" flatShading />
        <meshStandardMaterial attach="material-1" color="#5c9e45" flatShading />
        <meshStandardMaterial attach="material-2" color="#5a3d26" flatShading />
      </mesh>
      <mesh geometry={ground} position={[0, 0.004, 0]} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} />
      </mesh>
      {/* Rocky underside */}
      <mesh position={[0, -2.3, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[ISLAND_RADIUS * 0.82, 3.2, 12, 1]} />
        <meshStandardMaterial color="#4b3a2c" flatShading />
      </mesh>
      {/* River */}
      <mesh geometry={river} position={[0, 0.01, 0]}>
        <meshStandardMaterial
          color="#49b3e8"
          emissive="#1a6fa8"
          emissiveIntensity={0.35}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}
