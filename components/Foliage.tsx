import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, THEME, TreeMode } from '../types';
import { getRandomSpherePoint, getTreePoint, hexToVec3 } from '../utils';

interface FoliageProps {
  mode: TreeMode;
}

const vertexShader = `
  uniform float uTime;
  uniform float uMix;
  uniform float uPixelRatio;

  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  attribute float aRandom;
  attribute float aSize;

  varying vec3 vColor;
  varying float vAlpha;

  // Simple noise function
  float hash(float n) { return fract(sin(n) * 1e4); }
  float noise(vec3 x) {
    const vec3 step = vec3(110, 241, 171);
    vec3 i = floor(x);
    vec3 f = fract(x);
    float n = dot(i, step);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix( hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
               mix(mix( hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
  }

  void main() {
    // Interpolate positions
    vec3 pos = mix(aScatterPos, aTreePos, uMix);

    // Add breathing/floating movement
    // When uMix is 1.0 (Tree), amplitude is 0.0 (Absolute stillness)
    // When uMix is 0.0 (Scattered), amplitude is 0.5 (Floaty)
    float floatAmp = mix(0.5, 0.0, uMix);
    
    // Time frequency for scattered state
    vec3 noisePos = pos + vec3(uTime * 0.1);
    
    if (floatAmp > 0.001) {
      pos.x += (noise(noisePos) - 0.5) * floatAmp;
      pos.y += (noise(noisePos + 100.0) - 0.5) * floatAmp;
      pos.z += (noise(noisePos + 200.0) - 0.5) * floatAmp;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation
    gl_PointSize = aSize * uPixelRatio * (20.0 / -mvPosition.z);

    // Pass varying for glitter effect
    // Reduced frequency for a slow, deep breathing glow
    float glitter = sin(uTime * 0.5 + aRandom * 10.0);
    vAlpha = 0.6 + 0.4 * glitter;
  }
`;

const fragmentShader = `
  uniform vec3 uColorBase;
  uniform vec3 uColorEdge;

  varying float vAlpha;

  void main() {
    // Circular particle
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float r = length(xy);
    if (r > 0.5) discard;

    // Gradient from center to edge
    // Center is dark green, edge is gold/bright
    float glow = 1.0 - smoothstep(0.0, 0.5, r);
    
    vec3 finalColor = mix(uColorEdge, uColorBase, smoothstep(0.4, 0.5, r));
    
    // Add extra brightness at the very center for "sparkle"
    finalColor += vec3(0.5) * smoothstep(0.0, 0.1, r);

    gl_FragColor = vec4(finalColor, vAlpha);
    
    // Tonemapping chunk usually handles linear to gamma, but we'll do simple here
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const Foliage: React.FC<FoliageProps> = ({ mode }) => {
  const meshRef = useRef<THREE.Points>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMix: { value: 0 },
    uPixelRatio: { value: window.devicePixelRatio },
    uColorBase: { value: hexToVec3(THEME.emerald) },
    uColorEdge: { value: hexToVec3(THEME.gold) }
  }), []);

  const particles = useMemo(() => {
    const count = CONFIG.particleCount;
    const scatterPos = new Float32Array(count * 3);
    const treePos = new Float32Array(count * 3);
    const randoms = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Scatter position
      const s = getRandomSpherePoint(CONFIG.scatterRadius);
      scatterPos[i * 3] = s.x;
      scatterPos[i * 3 + 1] = s.y;
      scatterPos[i * 3 + 2] = s.z;

      // Tree position (Concentrate heavily on volume, but push some to surface)
      const t = getTreePoint(CONFIG.treeHeight, CONFIG.treeRadius, Math.random() > 0.3);
      treePos[i * 3] = t.x;
      treePos[i * 3 + 1] = t.y;
      treePos[i * 3 + 2] = t.z;

      randoms[i] = Math.random();
      sizes[i] = Math.random() * 0.8 + 0.5; // Base size
    }

    return { scatterPos, treePos, randoms, sizes };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const material = meshRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;

    // Smooth transition
    const targetMix = mode === TreeMode.TREE_SHAPE ? 1.0 : 0.0;
    material.uniforms.uMix.value = THREE.MathUtils.lerp(
      material.uniforms.uMix.value,
      targetMix,
      delta * 1.5 // Speed of transition
    );
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position" // Standard position required for raycasting/frustum, but shader overwrites
          count={particles.scatterPos.length / 3}
          array={particles.scatterPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={particles.scatterPos.length / 3}
          array={particles.scatterPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={particles.treePos.length / 3}
          array={particles.treePos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={particles.randoms.length}
          array={particles.randoms}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={particles.sizes.length}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};