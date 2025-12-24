import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';
import { HandManager } from './components/HandManager';
import { TreeMode, USER_PHOTOS } from './types';

function App() {
  const [mode, setMode] = useState<TreeMode>(TreeMode.SCATTERED);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [photos, setPhotos] = useState<string[]>(USER_PHOTOS);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Create ObjectURLs for the uploaded files
      const newPhotos = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      // Replace existing photos with new ones
      setPhotos(newPhotos);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#01161a]">
      {/* Hand Manager handles the webcam and updates the store */}
      <HandManager enabled={cameraEnabled} />

      <Canvas
        dpr={[1, 2]}
        gl={{ 
            antialias: false, 
            toneMappingExposure: 1.5,
            stencil: false,
            depth: true 
        }}
        camera={{ position: [0, 0, 30], fov: 45 }}
      >
        <color attach="background" args={['#01161a']} />
        
        <Suspense fallback={null}>
          <Scene mode={mode} setMode={setMode} photos={photos} />
        </Suspense>
      </Canvas>
      
      <Overlay 
        mode={mode} 
        setMode={setMode} 
        cameraEnabled={cameraEnabled}
        setCameraEnabled={setCameraEnabled}
        onUploadPhotos={handlePhotoUpload}
      />
      
      <Loader 
        containerStyles={{ background: '#01161a' }}
        innerStyles={{ background: '#10302b', width: '200px', height: '4px' }}
        barStyles={{ background: '#F2D388', height: '100%' }}
        dataStyles={{ color: '#F2D388', fontFamily: 'Cinzel, serif', fontSize: '14px' }}
      />
    </div>
  );
}

export default App;