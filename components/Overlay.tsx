import React from 'react';
import { TreeMode } from '../types';

interface OverlayProps {
  mode: TreeMode;
  setMode: (m: TreeMode) => void;
  cameraEnabled: boolean;
  setCameraEnabled: (enabled: boolean) => void;
  onUploadPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Overlay: React.FC<OverlayProps> = ({ 
    mode, 
    setMode, 
    cameraEnabled, 
    setCameraEnabled, 
    onUploadPhotos 
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      
      {/* Top Left Controls */}
      <div className="absolute top-8 left-8 z-50 flex flex-col gap-4 pointer-events-auto items-start">
        {/* Camera Toggle Button */}
        <button 
            onClick={() => setCameraEnabled(!cameraEnabled)}
            className={`
                px-4 py-2 border text-xs md:text-sm tracking-widest uppercase font-serif
                transition-all duration-300 backdrop-blur-sm
                ${cameraEnabled 
                    ? 'border-[#F2D388] text-[#F2D388] bg-[#011c16]/80 hover:bg-[#F2D388] hover:text-[#011c16]' 
                    : 'border-gray-500 text-gray-400 bg-black/50 hover:border-[#F2D388] hover:text-[#F2D388]'
                }
            `}
            style={{ fontFamily: '"Cinzel", serif' }}
        >
            {cameraEnabled ? 'Disable Camera' : 'Enable Camera'}
        </button>

        {/* Upload Button */}
        <label className={`
            cursor-pointer px-4 py-2 border border-[#F2D388] text-xs md:text-sm 
            tracking-widest uppercase font-serif text-[#F2D388] bg-[#011c16]/80
            transition-all duration-300 backdrop-blur-sm
            hover:bg-[#F2D388] hover:text-[#011c16]
        `} style={{ fontFamily: '"Cinzel", serif' }}>
            Upload Memories
            <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={onUploadPhotos} 
            />
        </label>
      </div>

      {/* Header */}
      <header className="flex flex-col items-center justify-center mt-8 pointer-events-none">
        <h1 className="text-4xl md:text-6xl text-[#F2D388] font-serif tracking-widest uppercase drop-shadow-[0_0_10px_rgba(242,211,136,0.5)]" style={{ fontFamily: '"Cinzel", serif' }}>
          Merry Christmas
        </h1>
        <p className="text-emerald-200 mt-2 font-light tracking-wider text-sm md:text-base opacity-80" style={{ fontFamily: '"Playfair Display", serif' }}>
          An Interactive 3D Experience
        </p>
      </header>

      {/* Controls */}
      <footer className="mb-12 flex justify-center pointer-events-auto">
        <button
          onClick={() => setMode(mode === TreeMode.SCATTERED ? TreeMode.TREE_SHAPE : TreeMode.SCATTERED)}
          className={`
            relative overflow-hidden group px-10 py-4 
            border border-[#F2D388] 
            transition-all duration-500 ease-out
            bg-[#011c16]/80 backdrop-blur-md
          `}
        >
            {/* Button Content */}
          <span className={`
            relative z-10 text-lg font-bold tracking-widest uppercase
            transition-colors duration-300
            ${mode === TreeMode.SCATTERED ? 'text-[#F2D388]' : 'text-emerald-900'}
            group-hover:text-emerald-900
          `} style={{ fontFamily: '"Cinzel", serif' }}>
            {mode === TreeMode.SCATTERED ? 'Assemble Tree' : 'Release Magic'}
          </span>

          {/* Fill Animation */}
          <div className={`
            absolute inset-0 bg-[#F2D388] 
            transform transition-transform duration-500 ease-in-out origin-left
            ${mode === TreeMode.TREE_SHAPE ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}
          `}></div>
        </button>
      </footer>
    </div>
  );
};