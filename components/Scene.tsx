import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { TopStar } from './TopStar';
import { PhotoGallery } from './PhotoGallery';
import { MagicDust } from './MagicDust';
import { TreeMode, THEME } from '../types';
import { handStore } from '../utils/handStore';

interface SceneProps {
  mode: TreeMode;
  setMode: (m: TreeMode) => void;
  photos: string[];
}

export const Scene: React.FC<SceneProps> = ({ mode, setMode, photos }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Gesture Debouncing Refs
  const lastGestureRef = useRef<string>('NONE');
  const gestureTimerRef = useRef<number>(0);

  useFrame((state, delta) => {
    // Rotation logic
    if (groupRef.current) {
        groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }

    // --- Gesture State Switching Logic ---
    const currentGesture = handStore.gesture;

    if (currentGesture !== 'NONE' && currentGesture === lastGestureRef.current) {
        gestureTimerRef.current += delta;
        
        // If gesture holds for 0.5 seconds, trigger action
        if (gestureTimerRef.current > 0.5) {
            if (currentGesture === 'OPEN' && mode === TreeMode.TREE_SHAPE) {
                setMode(TreeMode.SCATTERED);
                gestureTimerRef.current = 0; // Reset to avoid repeat firing immediately
            } else if (currentGesture === 'CLOSED' && mode === TreeMode.SCATTERED) {
                setMode(TreeMode.TREE_SHAPE);
                gestureTimerRef.current = 0;
            }
        }
    } else {
        // Gesture changed or lost, reset timer
        lastGestureRef.current = currentGesture;
        gestureTimerRef.current = 0;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 25]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={10} 
        maxDistance={40}
        maxPolarAngle={Math.PI / 1.5} 
      />

      {/* Lighting */}
      <ambientLight intensity={0.2} color={THEME.emerald} />
      <pointLight position={[10, 10, 10]} intensity={1} color={THEME.warmLight} />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color={THEME.burgundy} />
      <spotLight 
        position={[0, 20, 0]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        castShadow 
        color={THEME.gold} 
      />

      {/* Environment for reflections */}
      <Environment preset="city" background={false} />

      {/* Main Content Group */}
      <group ref={groupRef}>
        <TopStar mode={mode} />
        <Foliage mode={mode} />
        <Ornaments mode={mode} />
        <PhotoGallery mode={mode} photos={photos} />
      </group>
      
      {/* Interactive Elements */}
      <MagicDust />

      {/* Post Processing for Cinematic Glow */}
      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={1.5} 
            radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
};