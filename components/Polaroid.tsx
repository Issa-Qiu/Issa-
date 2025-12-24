import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TreeMode } from '../types';
import { handStore } from '../utils/handStore';

interface PolaroidProps {
  url: string;
  mode: TreeMode;
  scatterPos: THREE.Vector3;
  treePos: THREE.Vector3;
  isActive: boolean;
  onClick: (e: THREE.Event | null) => void;
}

export const Polaroid: React.FC<PolaroidProps> = ({ url, mode, scatterPos, treePos, isActive, onClick }) => {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture(url);
  const { camera, raycaster } = useThree();
  
  // State to track hovering for cursor change
  const [hovered, setHover] = useState(false);

  // Calculate direction to face outwards from tree center (0, Y, 0)
  const treeLookAt = useMemo(() => {
    const lookAtPos = new THREE.Vector3(treePos.x * 2, treePos.y, treePos.z * 2);
    return lookAtPos;
  }, [treePos]);

  // Animation progress refs
  const modeProgress = useRef(0); // 0 = Scattered, 1 = Tree
  const focusProgress = useRef(0); // 0 = Normal, 1 = Focused/Active
  
  // Helper objects
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // --- GESTURE INTERACTION LOGIC ---
    // If hand is detected, we manually cast a ray from the hand position
    if (handStore.detected) {
        // Convert normalized hand coords (0..1) to NDC (-1..1)
        const ndcX = (handStore.x * 2) - 1;
        const ndcY = -(handStore.y * 2) + 1;
        
        // Update global raycaster to match hand position
        raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
        
        // Check intersection with this polaroid
        const intersects = raycaster.intersectObject(groupRef.current, true);
        const isIntersecting = intersects.length > 0;
        
        if (isIntersecting) {
            if (!hovered) setHover(true);
            
            // Check for Pinch (Click)
            if (handStore.isPinching) {
                // Debounce pinch slightly using time check
                const now = Date.now();
                if (now - handStore.lastPinchTime > 1000) {
                     handStore.lastPinchTime = now;
                     onClick(null); // Trigger zoom
                }
            }
        } else {
            if (hovered) setHover(false);
        }
    }


    // 1. Update Mode Progress (Tree vs Scattered)
    const modeTarget = mode === TreeMode.TREE_SHAPE ? 1 : 0;
    modeProgress.current = THREE.MathUtils.damp(modeProgress.current, modeTarget, 1.5, delta);
    
    // 2. Update Focus Progress (Active vs Inactive)
    const focusTarget = isActive ? 1 : 0;
    focusProgress.current = THREE.MathUtils.damp(focusProgress.current, focusTarget, 3.0, delta);

    const mp = modeProgress.current;
    const fp = focusProgress.current;

    // --- POSITION CALCULATION ---
    
    // A. Calculate Base Position (Mix between Scatter and Tree)
    tempVec.lerpVectors(scatterPos, treePos, mp);

    // B. Calculate Focus Position (In front of camera)
    // We project a point 8 units in front of the camera
    if (isActive || fp > 0.01) {
        targetPos.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(8));
        // Interpolate between Base Position and Focus Position
        groupRef.current.position.lerpVectors(tempVec, targetPos, fp);
    } else {
        groupRef.current.position.copy(tempVec);
    }


    // --- ROTATION CALCULATION ---

    // A. Base Rotation Logic
    
    if (fp > 0.95) {
        // FULLY FOCUSED: Face the camera directly
        groupRef.current.lookAt(camera.position);
    } else {
        // NOT FULLY FOCUSED: Use Tree or Scatter logic
        
        // Target Quaternion for Tree Mode (facing out)
        dummy.position.copy(groupRef.current.position);
        dummy.lookAt(treeLookAt);
        const treeQ = dummy.quaternion.clone();

        // Target Quaternion for Scatter Mode (Random tumble)
        
        if (isActive) {
             // Transitioning to focus: Slerp towards camera lookAt
             dummy.lookAt(camera.position);
             groupRef.current.quaternion.slerp(dummy.quaternion, fp);
        } else {
            // Normal behavior
             if (mp < 0.1) {
                // Scattered Tumble
                groupRef.current.rotation.x += delta * 0.2;
                groupRef.current.rotation.y += delta * 0.1;
            } else {
                // Tree Alignment
                groupRef.current.quaternion.slerp(treeQ, mp * 0.1); 
                // Sway
                const time = state.clock.elapsedTime;
                groupRef.current.rotation.z += Math.sin(time + scatterPos.x) * 0.002;
            }
        }
    }
    
    // Scale effect on hover/active
    const baseScale = 1.0;
    const hoverScale = hovered ? 1.1 : 1.0;
    const activeScale = 1.5; // Make it bigger when focused
    
    const finalScale = THREE.MathUtils.lerp(baseScale * hoverScale, activeScale, fp);
    groupRef.current.scale.setScalar(finalScale);

  });
  
  // Set cursor based on hover state (for mouse fallback)
  useFrame(() => {
    if (!handStore.detected) {
        if (hovered) document.body.style.cursor = 'pointer';
    }
  });

  return (
    <group ref={groupRef}>
      <group 
        onClick={(e) => {
            e.stopPropagation();
            onClick(e);
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => {
            setHover(false);
            document.body.style.cursor = 'auto';
        }}
      >
        {/* Polaroid Paper Body */}
        <mesh castShadow receiveShadow>
            <boxGeometry args={[1.5, 1.8, 0.05]} />
            <meshStandardMaterial 
                color="#fdfbf7"
                roughness={0.9}
                metalness={0.0}
            />
        </mesh>

        {/* Photo Image Plane */}
        <mesh position={[0, 0.15, 0.03]} castShadow>
            <planeGeometry args={[1.3, 1.3]} />
            <meshStandardMaterial 
                map={texture}
                roughness={0.2} 
                metalness={0.1}
                emissiveMap={texture}
                emissive="white"
                emissiveIntensity={isActive ? 0.3 : 0.1} // Brighten when active
            />
        </mesh>
      </group>
    </group>
  );
};
