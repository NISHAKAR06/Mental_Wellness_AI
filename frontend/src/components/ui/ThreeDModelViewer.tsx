import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  Html,
} from "@react-three/drei";

function Model({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);

  if (!scene) return null;

  return (
    <primitive
      object={scene}
      scale={[scale, scale, scale]}
      position={[0, -1, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

interface ThreeDModelViewerProps {
  modelUrl: string;
  scale?: number;
  backgroundColor?: string;
  showControls?: boolean;
  voicePlaying?: boolean;
}

export function ThreeDModelViewer({
  modelUrl,
  scale = 1.5,
  backgroundColor = "#1a1a2e",
  showControls = true,
  voicePlaying = false,
}: ThreeDModelViewerProps) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "400px" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ backgroundColor }}
      >
        <Suspense
          fallback={
            <Html center>
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                Loading 3D Model...
              </div>
            </Html>
          }
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          <Environment preset="studio" />

          <Model url={modelUrl} scale={scale} />

          {/* Audio indicator */}
          {voicePlaying && (
            <Html center position={[0, 1, 0]}>
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                Speaking...
              </div>
            </Html>
          )}
        </Suspense>

        {showControls && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 3}
          />
        )}
      </Canvas>

      {/* Subtitles area */}
      <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 rounded-lg p-3 text-white">
        <div className="text-sm opacity-80">AI Psychologist Session Active</div>
      </div>
    </div>
  );
}

// Preload GLTF models using React Three Fiber's useGLTF
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
