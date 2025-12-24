import React, { useMemo, useState } from 'react';
import { Polaroid } from './Polaroid';
import { TreeMode, CONFIG } from '../types';
import { getRandomSpherePoint } from '../utils';

interface PhotoGalleryProps {
  mode: TreeMode;
  photos: string[];
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ mode, photos }) => {
  const [activeId, setActiveId] = useState<number | null>(null);

  const galleryItems = useMemo(() => {
    return photos.map((url, i) => {
        // Generate stable random positions
        const scatterPos = getRandomSpherePoint(CONFIG.scatterRadius);
        
        // Tree positions
        const t = (i / photos.length); 
        const height = CONFIG.treeHeight * 0.7; 
        const yOffset = -CONFIG.treeHeight / 2 + 2; 
        
        const y = yOffset + t * height; 
        const radiusAtHeight = CONFIG.treeRadius * (1 - (y - (-CONFIG.treeHeight/2)) / CONFIG.treeHeight);
        
        const angle = i * (Math.PI * 2 / 1.618); 
        const r = radiusAtHeight + 0.5; 
        
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        
        const treePos = { x, y, z };

        return {
            id: i,
            url,
            scatterPos,
            treePos
        };
    });
  }, [photos]);

  const handlePhotoClick = (id: number) => {
    if (activeId === id) {
        setActiveId(null); // Deselect if clicking same
    } else {
        setActiveId(id);
    }
  };

  return (
    <group>
      {galleryItems.map((item) => (
        <Polaroid 
            key={item.id}
            url={item.url}
            mode={mode}
            scatterPos={item.scatterPos}
            treePos={item.treePos as any}
            isActive={activeId === item.id}
            onClick={() => handlePhotoClick(item.id)}
        />
      ))}
    </group>
  );
};