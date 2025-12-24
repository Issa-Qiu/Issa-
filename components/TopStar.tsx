import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, THEME, TreeMode } from '../types';
import { getRandomSpherePoint } from '../utils';

interface TopStarProps {
  mode: TreeMode;
}

export const TopStar: React.FC<TopStarProps> = ({ mode }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const progress = useRef(0);

  // Generate 5-point star shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outerRadius = 0.8; // Reduced from 1.2
    const innerRadius = 0.35; // Reduced from 0.5
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outerRadius : innerRadius;
      // -PI/2 to start pointing up
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const positions = useMemo(() => {
    // Random position for scattered state
    const scatter = getRandomSpherePoint(CONFIG.scatterRadius);
    // Exact top of tree
    const tree = new THREE.Vector3(0, CONFIG.treeHeight / 2 + 0.5, 0); 
    return { scatter, tree };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Transition Logic
    const target = mode === TreeMode.TREE_SHAPE ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, target, 1.5, delta);
    
    // Position Lerp
    meshRef.current.position.lerpVectors(positions.scatter, positions.tree, progress.current);

    // Rotation
    // Fast tumble when scattered, slow majestic spin when tree
    const p = progress.current;
    if (p < 0.9) {
        meshRef.current.rotation.x += delta * 2 * (1 - p);
        meshRef.current.rotation.y += delta * 2 * (1 - p);
    } else {
        // Stabilize upright
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, delta * 2);
        // Spin Y
        meshRef.current.rotation.y += delta * 0.5;
        // Make sure it faces viewer roughly or spins nicely
        meshRef.current.rotation.z = 0;
    }
  });

  return (
    <mesh ref={meshRef}>
      <extrudeGeometry 
        args={[
          starShape, 
          { 
            depth: 0.2, // Reduced depth
            bevelEnabled: true, 
            bevelThickness: 0.05, 
            bevelSize: 0.05, 
            bevelSegments: 2 
          }
        ]} 
      />
      <meshStandardMaterial 
        color={THEME.gold}
        roughness={0.1}
        metalness={1.0}
        emissive={THEME.gold}
        emissiveIntensity={1.5} // High intensity for Bloom
      />
    </mesh>
  );
};