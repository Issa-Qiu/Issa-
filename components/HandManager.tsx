
import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { handStore } from '../utils/handStore';

interface HandManagerProps {
    enabled: boolean;
}

export const HandManager: React.FC<HandManagerProps> = ({ enabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) {
        // Reset store if disabled
        handStore.detected = false;
        handStore.gesture = 'NONE';
        setLoaded(false);
        return; 
    }

    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
        );

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startCamera();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn("Camera API not available");
            return;
        }

        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.addEventListener('loadeddata', () => {
                    setLoaded(true);
                    predictWebcam();
                });
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            // If permission denied or error, we might want to inform parent, but for now just log
        }
    };

    const predictWebcam = () => {
        if (!handLandmarker || !videoRef.current) return;

        // Ensure video is playing and has data
        if (videoRef.current.videoWidth > 0) {
            const results = handLandmarker.detectForVideo(videoRef.current, performance.now());

            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0];
                const indexTip = landmarks[8];
                const thumbTip = landmarks[4];
                const wrist = landmarks[0];

                // Update store position
                handStore.detected = true;
                handStore.x = 1.0 - indexTip.x; 
                handStore.y = indexTip.y;

                // --- Pinch Detection ---
                const dx = indexTip.x - thumbTip.x;
                const dy = indexTip.y - thumbTip.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                handStore.isPinching = dist < 0.1;

                // --- Gesture Recognition (Open vs Closed) ---
                // Helper to check distance squared
                const distSq = (p1: NormalizedLandmark, p2: NormalizedLandmark) => {
                    return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
                };

                // Indices for finger tips and PIP joints (Proximal Interphalangeal - the middle knuckle)
                // Index(8,6), Middle(12,10), Ring(16,14), Pinky(20,18)
                // We compare distance to wrist. If Tip is further from wrist than PIP, finger is extended.
                const fingers = [
                    { tip: 8, pip: 6 },   // Index
                    { tip: 12, pip: 10 }, // Middle
                    { tip: 16, pip: 14 }, // Ring
                    { tip: 20, pip: 18 }  // Pinky
                ];

                let extendedCount = 0;
                fingers.forEach(f => {
                    const dTip = distSq(landmarks[f.tip], wrist);
                    const dPip = distSq(landmarks[f.pip], wrist);
                    if (dTip > dPip) {
                        extendedCount++;
                    }
                });

                // Classification
                // 4 fingers extended = OPEN (Ignoring thumb for stability)
                // 0 fingers extended = CLOSED
                if (extendedCount === 4) {
                    handStore.gesture = 'OPEN';
                } else if (extendedCount === 0) {
                    handStore.gesture = 'CLOSED';
                } else {
                    handStore.gesture = 'NONE';
                }

            } else {
                handStore.detected = false;
                handStore.isPinching = false;
                handStore.gesture = 'NONE';
            }
        }
        animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
        cancelAnimationFrame(animationFrameId);
        if (handLandmarker) handLandmarker.close();
        
        // Stop all tracks to turn off camera light
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current && videoRef.current.srcObject) {
             const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
             tracks.forEach(track => track.stop());
             videoRef.current.srcObject = null;
        }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="absolute bottom-4 right-4 z-50 pointer-events-auto transition-all duration-500 ease-out">
        <div className={`
            relative rounded-xl overflow-hidden 
            border-2 border-[#F2D388] 
            shadow-[0_0_20px_rgba(242,211,136,0.3)]
            bg-[#011c16]/80 backdrop-blur-sm
            transition-opacity duration-500
            ${loaded ? 'opacity-80 hover:opacity-100' : 'opacity-0'}
        `}>
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-48 h-36 object-cover transform -scale-x-100" 
            />
            {/* Visual indicator for "Rec" feeling */}
            <div className="absolute top-2 right-2 flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${loaded ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
            </div>
            
            {/* Debug/Status text overlay on video */}
            {loaded && (
               <div className="absolute bottom-1 left-2 text-[10px] text-[#F2D388] font-mono opacity-80">
                   Gesture AI Active
               </div>
            )}
        </div>
        
        {!loaded && (
            <div className="absolute bottom-0 right-0 w-48 text-center pb-2 text-[#F2D388] text-xs font-serif animate-pulse">
                Initializing Magic Eye...
            </div>
        )}
    </div>
  );
};
