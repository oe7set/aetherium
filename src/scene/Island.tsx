import { useMemo } from 'react';
import * as THREE from 'three';
import { ISLAND_RADIUS, RIVER_POINTS } from './layout';

export function Island() {
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
      {/* Rocky underside */}
      <mesh position={[0, -2.3, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[ISLAND_RADIUS * 0.82, 3.2, 12, 1]} />
        <meshStandardMaterial color="#4b3a2c" flatShading />
      </mesh>
      {/* River */}
      <mesh geometry={river} position={[0, 0.01, 0]}>
        <meshStandardMaterial
          color="#3d9bd6"
          roughness={0.25}
          metalness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}
