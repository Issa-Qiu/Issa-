import { ThreeElements } from '@react-three/fiber';

export enum TreeMode {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export type ThemeColors = {
  emerald: string;
  burgundy: string;
  gold: string;
  darkGreen: string;
  warmLight: string;
};

export const THEME: ThemeColors = {
  emerald: '#044f43',
  burgundy: '#6b0f1a',
  gold: '#F2D388', // High luminance gold for bloom
  darkGreen: '#011c16',
  warmLight: '#fff5d6'
};

export const CONFIG = {
  particleCount: 8000,
  ornamentCount: 120, // Reduced slightly to make room for photos
  treeHeight: 13,
  treeRadius: 6.5,
  scatterRadius: 25,
};

// Placeholders matching the vibe of your uploaded photos (Cats & Christmas)
// TODO: Replace these URLs with your local file paths (e.g., "/photos/cat1.jpg")
export const USER_PHOTOS = [
  "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=1000&auto=format&fit=crop", // Cat in tree
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1000&auto=format&fit=crop", // Cat close up
  "https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?q=80&w=1000&auto=format&fit=crop", // Girl with gift
  "https://images.unsplash.com/photo-1513297887119-d46091b24bfa?q=80&w=1000&auto=format&fit=crop", // Christmas tree background
  "https://images.unsplash.com/photo-1606225457115-9b0de873c5db?q=80&w=1000&auto=format&fit=crop", // Orange cat
  "https://images.unsplash.com/photo-1545048702-79362596cdc9?q=80&w=1000&auto=format&fit=crop"  // Winter mood
];

// Augment React's IntrinsicElements to include R3F elements
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}