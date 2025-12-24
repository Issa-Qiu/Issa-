import * as THREE from 'three';
import { CONFIG } from './types';

// Random point in sphere
export const getRandomSpherePoint = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// Point on/in a cone (Christmas Tree shape)
export const getTreePoint = (height: number, maxRadius: number, isSurface: boolean = false): THREE.Vector3 => {
  const y = Math.random() * height; // 0 to height
  // Radius at this height (linear taper)
  const currentRadius = maxRadius * (1 - y / height);
  
  // Angle
  const theta = Math.random() * Math.PI * 2;
  
  // Distance from center: if surface, close to currentRadius, else random inside
  const r = isSurface 
    ? currentRadius * (0.8 + Math.random() * 0.2) 
    : Math.sqrt(Math.random()) * currentRadius;

  const x = r * Math.cos(theta);
  const z = r * Math.sin(theta);
  
  // Center the tree vertically
  return new THREE.Vector3(x, y - height / 2, z);
};

export const hexToVec3 = (hex: string) => {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
};