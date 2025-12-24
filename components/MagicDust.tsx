import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { THEME } from '../types';
import { handStore } from '../utils/handStore';

const COUNT = 300; // Number of magic particles

const vertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute float aRandom;
  
  varying float vAlpha;
  
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = aScale * uPixelRatio * (20.0 / -mvPosition.z);
    
    // Twinkle effect
    vAlpha = 0.5 + 0.5 * sin(uTime * 3.0 + aRandom * 100.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    // Soft circular particle
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Soft glow edge
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 1.5);

    gl_FragColor = vec4(uColor, vAlpha * glow);
  }
`;

export const MagicDust = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const hoverTarget = useRef(new THREE.Vector3(0, 0, 0));

  // Initialize particles
  const { positions, velocities, randoms, scales } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    const rnd = new Float32Array(COUNT);
    const scl = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      vel[i * 3] = 0;
      vel[i * 3 + 1] = 0;
      vel[i * 3 + 2] = 0;

      rnd[i] = Math.random();
      scl[i] = Math.random() * 2.0 + 1.0;
    }

    return { 
        positions: pos, 
        velocities: vel, 
        randoms: rnd, 
        scales: scl 
    };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(THEME.gold) },
    uPixelRatio: { value: window.devicePixelRatio }
  }), []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    // Update time
    const material = pointsRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;

    // Determine Input Source (Hand or Mouse)
    let x = 0;
    let y = 0;

    if (handStore.detected) {
        // Convert Hand (0 to 1) to NDC (-1 to 1)
        x = (handStore.x * 2) - 1;
        y = -(handStore.y * 2) + 1; // Flip Y for 3D space
    } else {
        // Fallback to mouse
        x = state.pointer.x;
        y = state.pointer.y;
    }

    // Project 2D input to 3D world space
    const vec = new THREE.Vector3(x, y, 0.5);
    vec.unproject(state.camera);
    const dir = vec.sub(state.camera.position).normalize();
    const distance = -state.camera.position.z / dir.z; 
    
    // Clamp distance to keep particles visible
    const targetDist = Math.abs(distance) < 5 ? 15 : Math.min(Math.abs(distance), 30);
    
    hoverTarget.current.copy(state.camera.position).add(dir.multiplyScalar(targetDist));

    const positionsAttribute = pointsRef.current.geometry.attributes.position;
    
    // Update physics
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Current pos
      const px = positionsAttribute.getX(i);
      const py = positionsAttribute.getY(i);
      const pz = positionsAttribute.getZ(i);

      // Target attraction
      const dx = hoverTarget.current.x - px;
      const dy = hoverTarget.current.y - py;
      const dz = hoverTarget.current.z - pz;

      // Increase speed slightly for hand interaction to feel more responsive
      velocities[ix] += dx * 0.08 * delta;
      velocities[iy] += dy * 0.08 * delta;
      velocities[iz] += dz * 0.08 * delta;

      // Swirl noise
      const time = state.clock.elapsedTime;
      velocities[ix] += Math.sin(py * 0.5 + time) * 0.1 * delta;
      velocities[iy] += Math.cos(px * 0.5 + time) * 0.1 * delta;
      velocities[iz] += Math.sin(time * 0.5) * 0.1 * delta;

      // Dampening
      velocities[ix] *= 0.90;
      velocities[iy] *= 0.90;
      velocities[iz] *= 0.90;

      // Update position
      positionsAttribute.setXYZ(
          i,
          px + velocities[ix],
          py + velocities[iy],
          pz + velocities[iz]
      );
    }
    positionsAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} pointerEvents="none">
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={scales.length}
          array={scales}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
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
