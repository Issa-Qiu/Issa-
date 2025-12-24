import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, THEME, TreeMode } from '../types';
import { getRandomSpherePoint, getTreePoint } from '../utils';

interface OrnamentsProps {
  mode: TreeMode;
}

// Reusable dummy object for matrix calculations
const dummy = new THREE.Object3D();
const tempVec3 = new THREE.Vector3();

type OrnamentType = 'bauble' | 'box';

export const Ornaments: React.FC<OrnamentsProps> = ({ mode }) => {
  const baubleRef = useRef<THREE.InstancedMesh>(null);
  const boxRef = useRef<THREE.InstancedMesh>(null);
  
  // Create data for two types of ornaments: Spheres (Baubles) and Boxes (Gifts)
  const instances = useMemo(() => {
    const data = [];
    const count = CONFIG.ornamentCount;
    
    for (let i = 0; i < count; i++) {
      const scatter = getRandomSpherePoint(CONFIG.scatterRadius);
      // Ornaments mostly on surface
      const tree = getTreePoint(CONFIG.treeHeight, CONFIG.treeRadius, true); 
      
      const scale = 0.2 + Math.random() * 0.3;
      
      // Distribution: 70% Baubles, 30% Boxes
      const r = Math.random();
      let type: OrnamentType = 'bauble';
      if (r > 0.7) type = 'box';
      
      data.push({
        scatter,
        tree,
        scale,
        rotationSpeed: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ),
        phase: Math.random() * Math.PI * 2,
        type
      });
    }
    return data;
  }, []);

  // Split indices
  const baubleIndices = useMemo(() => instances.map((d, i) => d.type === 'bauble' ? i : -1).filter(i => i !== -1), [instances]);
  const boxIndices = useMemo(() => instances.map((d, i) => d.type === 'box' ? i : -1).filter(i => i !== -1), [instances]);

  // Current animation progress (0 = scattered, 1 = tree)
  const progress = useRef(0);

  useLayoutEffect(() => {
    // Set colors initially
    
    // Baubles: Gold and Burgundy mix
    if (baubleRef.current) {
        const c1 = new THREE.Color(THEME.gold);
        const c2 = new THREE.Color(THEME.burgundy);
        for(let i=0; i < baubleIndices.length; i++) {
            baubleRef.current.setColorAt(i, Math.random() > 0.5 ? c1 : c2);
        }
        baubleRef.current.instanceColor!.needsUpdate = true;
    }
    
    // Boxes: Burgundy and Emerald mix
    if (boxRef.current) {
        const c1 = new THREE.Color(THEME.burgundy);
        const c2 = new THREE.Color(THEME.emerald);
        for(let i=0; i < boxIndices.length; i++) {
            boxRef.current.setColorAt(i, Math.random() > 0.5 ? c1 : c2);
        }
        boxRef.current.instanceColor!.needsUpdate = true;
    }
  }, [baubleIndices, boxIndices]);

  useFrame((state, delta) => {
    const target = mode === TreeMode.TREE_SHAPE ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, target, 2.0, delta);
    
    const t = state.clock.elapsedTime;
    const p = progress.current;

    // Helper to animate items
    const updateInstances = (ref: React.RefObject<THREE.InstancedMesh>, indices: number[], type: OrnamentType) => {
        if (!ref.current) return;
        
        indices.forEach((realIndex, i) => {
            const data = instances[realIndex];
            
            // Position interpolation
            tempVec3.lerpVectors(data.scatter, data.tree, p);
            
            // Add floating noise when scattered
            if (p < 0.9) {
                const floatAmp = (1 - p) * 2.0;
                tempVec3.y += Math.sin(t + data.phase) * floatAmp;
                if (type === 'bauble') {
                     tempVec3.x += Math.cos(t * 0.5 + data.phase) * floatAmp * 0.5;
                }
            }
    
            dummy.position.copy(tempVec3);
            
            // Scale logic
            let finalScale = data.scale;
            if (type === 'box') finalScale *= 1.2;
            dummy.scale.setScalar(finalScale);
            
            // Rotation logic
            const rotationFactor = (1 - p) + (p * 0.05); // Standard slow rotation
            
            dummy.rotation.x += data.rotationSpeed.x * rotationFactor * delta;
            dummy.rotation.y += data.rotationSpeed.y * rotationFactor * delta;
            if (type === 'box') dummy.rotation.z += data.rotationSpeed.z * rotationFactor * delta;
    
            dummy.updateMatrix();
            ref.current!.setMatrixAt(i, dummy.matrix);
        });
        ref.current.instanceMatrix.needsUpdate = true;
    };

    updateInstances(baubleRef, baubleIndices, 'bauble');
    updateInstances(boxRef, boxIndices, 'box');
  });

  return (
    <group>
      {/* Baubles - High Shininess */}
      <instancedMesh ref={baubleRef} args={[undefined, undefined, baubleIndices.length]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
            roughness={0.1} 
            metalness={0.9} 
            envMapIntensity={1.5}
        />
      </instancedMesh>

      {/* Gift Boxes */}
      <instancedMesh ref={boxRef} args={[undefined, undefined, boxIndices.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
            roughness={0.4} 
            metalness={0.4}
            envMapIntensity={1.0}
        />
      </instancedMesh>
    </group>
  );
};