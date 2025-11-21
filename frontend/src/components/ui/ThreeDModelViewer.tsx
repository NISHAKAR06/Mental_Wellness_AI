import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Html } from "@react-three/drei";

interface ModelProps {
  url: string;
  scale?: number;
  mouthOpen?: boolean;
  position?: [number, number, number];
}

function Model({ url, scale = 1, mouthOpen = false, position = [0, -1, 0] }: ModelProps) {
  // Add error boundary and safer GLTF loading
  try {
    console.log("Loading 3D model:", url);
    const { scene } = useGLTF(url);

    if (!scene) {
      console.warn("No scene found in GLTF file:", url);
      return (
        <mesh visible={false}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
        </mesh>
      );
    }

    // Minimal mouth animation: add a sphere as mouth, scale Y when mouthOpen
    return (
      <group>
        <primitive
          object={scene}
          scale={[scale, scale, scale]}
          position={position}
          rotation={[0, 0, 0]}
        />
        {/* Simple animated mouth (placeholder) */}
        <mesh
          position={[0, -0.2, 0.8]}
          visible
          scale={[1, mouthOpen ? 1.8 : 1, 1]}
        >
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={mouthOpen ? "#ff4d4d" : "#222"} />
        </mesh>
      </group>
    );
  } catch (error) {
    console.error("❌ GLTF loading error for", url, ":", error);
    return (
      <mesh visible={false}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
    );
  }
}

interface ThreeDModelViewerProps {
  modelUrl: string;
  scale?: number;
  backgroundColor?: string;
  showControls?: boolean;
  voicePlaying?: boolean;
  showSessionBanner?: boolean;
  modelPosition?: [number, number, number];
  cameraPosition?: [number, number, number];
}

export function ThreeDModelViewer({
  modelUrl,
  scale = 1.5,
  backgroundColor = "#1a1a2e",
  showControls = true,
  voicePlaying = false,
  showSessionBanner = true,
  modelPosition = [0, -1, 0],
  cameraPosition = [0, 0, 3],
}: ThreeDModelViewerProps) {
  // Debug: Check if model file exists
  React.useEffect(() => {
    fetch(modelUrl, { method: "HEAD" })
      .then((response) => {
        if (response.ok) {
          console.log("✅ 3D model file exists:", modelUrl);
        } else {
          console.error(
            "❌ 3D model file not found:",
            modelUrl,
            "Status:",
            response.status
          );
        }
      })
      .catch((error) => {
        console.error("❌ Error checking 3D model file:", modelUrl, error);
      });
  }, [modelUrl]);

  return (
    <div
      className="relative"
      style={{ width: "100%", height: "100%", minHeight: "400px" }}
    >
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
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
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          <pointLight position={[-10, -10, -10]} intensity={0.4} />
          <directionalLight position={[0, 5, 5]} intensity={0.5} />

          {/* Environment for better lighting and reflections */}
          <Environment preset="studio" />

          <Model
            url={modelUrl}
            scale={scale}
            mouthOpen={voicePlaying}
            position={modelPosition}
          />

          {/* Audio indicator */}
          {voicePlaying && (
            <Html center position={[0, 1, 0]}>
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                Speaking...
              </div>
            </Html>
          )}
        </Suspense>

        {/* Controls for 3D interaction */}
        {showControls && (
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 6}
            maxDistance={10}
            minDistance={1}
          />
        )}
      </Canvas>

      {showSessionBanner && (
        <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black bg-opacity-50 p-3 text-white">
          <div className="text-sm opacity-80">
            AI Psychologist Session Active
          </div>
        </div>
      )}
    </div>
  );
}

// Preload GLTF models using React Three Fiber's useGLTF
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
