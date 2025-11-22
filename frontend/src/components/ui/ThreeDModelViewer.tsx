import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  Html,
  useAnimations,
} from "@react-three/drei";
import * as THREE from "three";

interface ModelProps {
  url: string;
  scale?: number;
  voicePlaying?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  isProcessingVoice?: boolean;
  isAiThinking?: boolean;
}

function SafeRenderingPlayer({
  url,
  scale = 1,
  voicePlaying = false,
  position = [0, -1, 0],
  rotation = [0, 0, 0],
  isProcessingVoice = false,
  isAiThinking = false,
}: ModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const blinkTimerRef = useRef<number>(0);
  const breathingPhaseRef = useRef<number>(0);
  const lipSyncRef = useRef<number>(0);
  const [lipSyncIntensity, setLipSyncIntensity] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);

  // React hooks must be called unconditionally at the top level
  const gltf = useGLTF(url);
  const { actions, mixer } = useAnimations(gltf?.animations || [], groupRef);

  // Check if model loaded successfully
  const modelLoaded = !!(gltf && gltf.scene);

  // Set error state only when needed
  useEffect(() => {
    if (!gltf || !gltf.scene) {
      console.error("❌ Failed to load GLTF model:", url);
      setHasError(true);
    } else {
      setHasError(false);
      console.log("✅ GLTF model loaded successfully:", url);
    }
  }, [gltf, url]);

  // Enhanced animation system with error handling
  useEffect(() => {
    if (!modelLoaded || !actions || hasError) return;

    try {
      if (voicePlaying) {
        // Try to play talking animation if available
        const talkingAction =
          actions.talking || actions.speak || actions.Talk || actions.Talking;
        if (talkingAction) {
          Object.values(actions).forEach((action) => action?.stop());
          talkingAction.reset().play();
          console.log("🗣️ Playing talking animation");
        }
      } else {
        // Play idle animation if available
        const idleAction =
          actions.idle || actions.Idle || actions.Rest || actions.Stand;
        if (idleAction) {
          Object.values(actions).forEach((action) => action?.stop());
          idleAction.reset().play();
          console.log("😌 Playing idle animation");
        }
      }
    } catch (animationError) {
      console.warn("⚠️ Animation error:", animationError);
    }
  }, [voicePlaying, actions, modelLoaded, hasError]);

  // Humanized character movements with realistic timing
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    try {
      // Natural breathing animation
      breathingPhaseRef.current += delta * 1.2;
      const breathingScale = 1 + Math.sin(breathingPhaseRef.current) * 0.02; // Increased for more visible breathing
      if (groupRef.current.scale) {
        groupRef.current.scale.y = scale * breathingScale;
      }

      // Realistic blinking
      blinkTimerRef.current += delta;
      if (blinkTimerRef.current > 2.5 + Math.random() * 3) {
        // 2.5-5.5 seconds between blinks
        blinkTimerRef.current = 0;
      }

      // Enhanced lip sync with natural movement (throttled updates)
      if (voicePlaying) {
        const baseIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
        const randomVariation = (Math.random() - 0.5) * 0.3;
        const newIntensity = Math.max(0.1, baseIntensity + randomVariation);

        // Only update state if there's a significant change (throttle re-renders)
        if (Math.abs(newIntensity - lipSyncRef.current) > 0.05) {
          lipSyncRef.current = newIntensity;
          setLipSyncIntensity(newIntensity);
        }

        // Natural head movements while talking
        const talkingBob = Math.sin(state.clock.elapsedTime * 1.8) * 0.1; // Increased intensity
        const talkingTurn = Math.sin(state.clock.elapsedTime * 1.2) * 0.15; // Increased intensity

        if (groupRef.current.rotation) {
          groupRef.current.rotation.y = talkingTurn;
          groupRef.current.rotation.x = talkingBob;
          groupRef.current.rotation.z =
            Math.sin(state.clock.elapsedTime * 0.8) * 0.05; // Increased intensity
        }
      } else {
        // Only update if currently not zero
        if (lipSyncRef.current !== 0) {
          lipSyncRef.current = 0;
          setLipSyncIntensity(0);
        }

        // Gentle idle movements
        const idleSway = Math.sin(state.clock.elapsedTime * 0.6) * 0.08; // Increased intensity
        const idleNod = Math.sin(state.clock.elapsedTime * 0.4) * 0.06; // Increased intensity

        if (groupRef.current.rotation) {
          groupRef.current.rotation.y = idleSway;
          groupRef.current.rotation.x = idleNod;
          groupRef.current.rotation.z =
            Math.sin(state.clock.elapsedTime * 0.3) * 0.03; // Added subtle roll
        }
      }

      // Update animation mixer safely (only if model loaded)
      if (mixer && modelLoaded) {
        mixer.update(delta);
      }

      // Add position animations for more humanized movement
      if (groupRef.current.position) {
        // Subtle swaying motion
        const sway = Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
        const bob = Math.sin(state.clock.elapsedTime * 1.2) * 0.015;

        groupRef.current.position.x = position[0] + sway;
        groupRef.current.position.y = position[1] + bob;
        groupRef.current.position.z = position[2];
      }
    } catch (frameError) {
      console.warn("⚠️ Frame animation error:", frameError);
    }
  });

  // Return fallback if model failed to load or has error
  if (hasError || !modelLoaded) {
    return (
      <group ref={groupRef} position={position} rotation={rotation}>
        {/* Humanoid fallback character */}
        <group scale={[scale, scale, scale]}>
          {/* Head */}
          <mesh position={[0, 1.6, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>

          {/* Body */}
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.2, 0.25, 0.8, 8]} />
            <meshStandardMaterial color="#4a90e2" />
          </mesh>

          {/* Arms */}
          <mesh position={[-0.35, 1.2, 0]} rotation={[0, 0, -0.3]}>
            <cylinderGeometry args={[0.06, 0.08, 0.6, 6]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>
          <mesh position={[0.35, 1.2, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.06, 0.08, 0.6, 6]} />
            <meshStandardMaterial color="#fdbcb4" />
          </mesh>

          {/* Legs */}
          <mesh position={[-0.12, 0.3, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.6, 6]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>
          <mesh position={[0.12, 0.3, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.6, 6]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>

          {/* Eyes */}
          <mesh position={[-0.06, 1.65, 0.14]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0.06, 1.65, 0.14]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>

          {/* Mouth with lip sync */}
          <mesh
            position={[0, 1.55, 0.14]}
            scale={[1, voicePlaying ? 1.5 : 1, 1]}
          >
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial
              color={voicePlaying ? "#ff6b6b" : "#333"}
              transparent
              opacity={voicePlaying ? 0.8 : 0.6}
            />
          </mesh>
        </group>

        {/* Status indicator */}
        <Html position={[0, 2.5, 0]} center>
          <div className="bg-orange-500/80 text-white px-2 py-1 rounded text-xs">
            {hasError ? "Using Fallback Character" : "Loading Model..."}
          </div>
        </Html>
      </group>
    );
  }

  // Render loaded model
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {gltf?.scene && (
        <primitive
          object={gltf.scene.clone()}
          scale={[scale, scale, scale]}
          castShadow
          receiveShadow
        />
      )}

      {/* Enhanced mouth animation for lip sync */}
      <mesh
        position={[0, 0.1, 0.85]}
        visible={voicePlaying && lipSyncIntensity > 0}
        scale={[0.8, lipSyncIntensity * 1.5, 0.5]}
      >
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial
          color="#ff6b6b"
          transparent
          opacity={lipSyncIntensity * 0.7}
          emissive="#ff3333"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Realistic eye blinking */}
      {blinkTimerRef.current < 0.15 && (
        <group>
          <mesh
            position={[-0.12, 0.15, 0.82]}
            scale={[0.05, 0.01, 0.02]}
            rotation={[0, 0, -0.1]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#333" transparent opacity={0.8} />
          </mesh>
          <mesh
            position={[0.12, 0.15, 0.82]}
            scale={[0.05, 0.01, 0.02]}
            rotation={[0, 0, 0.1]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#333" transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* Voice activity indicator */}
      {voicePlaying && (
        <mesh position={[0, 1.5, 0]} scale={[0.6, 0.08, 0.6]}>
          <cylinderGeometry args={[0.25, 0.25, 0.04, 16]} />
          <meshStandardMaterial
            color="#4ade80"
            emissive="#22c55e"
            emissiveIntensity={lipSyncIntensity * 0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* AI Processing Voice Indicator */}
      {isProcessingVoice && (
        <group position={[0.4, 1.8, 0]}>
          <mesh>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial
              color="#3b82f6"
              emissive="#1d4ed8"
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </mesh>
          {/* Pulse effect */}
          <mesh>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#60a5fa" transparent opacity={0.3} />
          </mesh>
        </group>
      )}

      {/* AI Thinking Indicator */}
      {isAiThinking && (
        <group position={[0, 2.0, 0]}>
          {/* Thought bubble */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#7c3aed"
              emissiveIntensity={0.4}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh position={[0.15, 0.1, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#7c3aed"
              emissiveIntensity={0.3}
              transparent
              opacity={0.7}
            />
          </mesh>
          <mesh position={[0.25, 0.18, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#7c3aed"
              emissiveIntensity={0.2}
              transparent
              opacity={0.5}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

interface ThreeDModelViewerProps {
  modelUrl: string;
  scale?: number;
  backgroundColor?: string;
  backgroundImage?: string;
  showControls?: boolean;
  voicePlaying?: boolean;
  showSessionBanner?: boolean;
  modelPosition?: [number, number, number];
  cameraPosition?: [number, number, number];
  isProcessingVoice?: boolean;
  isAiThinking?: boolean;
}

export function ThreeDModelViewer({
  modelUrl,
  scale = 1.5,
  backgroundColor = "#1a1a2e",
  backgroundImage,
  showControls = true,
  voicePlaying = false,
  showSessionBanner = true,
  modelPosition = [0, -1, 0],
  cameraPosition = [0, 0, 3],
  isProcessingVoice = false,
  isAiThinking = false,
}: ThreeDModelViewerProps) {
  const [modelStatus, setModelStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");

  // Enhanced model file checking
  React.useEffect(() => {
    const checkModel = async () => {
      try {
        console.log("🔍 Checking 3D model file:", modelUrl);
        const response = await fetch(modelUrl, { method: "HEAD" });

        if (response.ok) {
          console.log("✅ 3D model file exists:", modelUrl);
          setModelStatus("loaded");
          // Preload the model
          try {
            useGLTF.preload(modelUrl);
            console.log("🚀 Model preloaded successfully");
          } catch (preloadError) {
            console.warn("⚠️ Model preload failed:", preloadError);
          }
        } else {
          console.error(
            "❌ 3D model file not found:",
            modelUrl,
            "Status:",
            response.status
          );
          setModelStatus("error");
        }
      } catch (error) {
        console.error("❌ Error checking 3D model file:", modelUrl, error);
        setModelStatus("error");
      }
    };

    checkModel();
  }, [modelUrl]);

  return (
    <div
      className="relative"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        style={{
          backgroundColor: backgroundImage ? "transparent" : backgroundColor,
        }}
        shadows
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense
          fallback={
            <Html center>
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-white mx-auto mb-3"></div>
                <div className="text-lg font-medium">Loading Character...</div>
                <div className="text-sm mt-1 opacity-70">
                  Humanized Rendering Player
                </div>
                <div className="text-xs mt-2 opacity-50">
                  {modelStatus === "loading" && "Initializing model..."}
                  {modelStatus === "error" && "Using fallback character"}
                  {modelStatus === "loaded" && "Rendering 3D model..."}
                </div>
              </div>
            </Html>
          }
        >
          {/* Professional lighting setup */}
          <ambientLight intensity={0.5} color="#ffeedd" />
          <directionalLight
            position={[3, 6, 4]}
            intensity={1.0}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.1}
            shadow-camera-far={20}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={5}
            shadow-camera-bottom={-5}
          />
          <pointLight position={[-3, 3, 3]} intensity={0.4} color="#fff5e6" />
          <pointLight position={[3, 1, -3]} intensity={0.3} color="#e6f3ff" />

          {/* Professional environment */}
          <Environment preset="apartment" background={false} />

          {/* Enhanced Safe Rendering Player */}
          <SafeRenderingPlayer
            url={modelUrl}
            scale={scale}
            voicePlaying={voicePlaying}
            position={modelPosition}
            rotation={[0, 0, 0]}
            isProcessingVoice={isProcessingVoice}
            isAiThinking={isAiThinking}
          />

          {/* Professional ground plane */}
          <mesh
            receiveShadow
            position={[0, -1.8, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[15, 15]} />
            <shadowMaterial transparent opacity={0.15} />
          </mesh>

          {/* Dynamic audio visualizer */}
          {voicePlaying && (
            <group position={[0, 1.8, 0]}>
              {[...Array(7)].map((_, i) => {
                const height = 0.1 + Math.sin(Date.now() * 0.01 + i) * 0.3;
                const hue = 120 + i * 15;
                return (
                  <mesh key={i} position={[i * 0.2 - 0.6, height / 2, 0]}>
                    <boxGeometry args={[0.08, height, 0.08]} />
                    <meshStandardMaterial
                      color={`hsl(${hue}, 75%, 55%)`}
                      emissive={`hsl(${hue}, 60%, 25%)`}
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                );
              })}
            </group>
          )}
        </Suspense>

        {/* Smooth controls */}
        {showControls && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 1.6}
            minPolarAngle={Math.PI / 6}
            maxDistance={6}
            minDistance={1.8}
            enableDamping
            dampingFactor={0.08}
            autoRotate={false}
            rotateSpeed={0.5}
            zoomSpeed={0.8}
          />
        )}
      </Canvas>

      {/* Enhanced session info */}
      {showSessionBanner && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-2xl bg-gradient-to-r from-black/75 to-black/60 backdrop-blur-xl p-4 text-white border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold">
                  AI Psychologist Active
                </div>
                <div className="text-sm opacity-80 flex items-center gap-2 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      modelStatus === "loaded"
                        ? "bg-green-400"
                        : modelStatus === "loading"
                        ? "bg-yellow-400 animate-pulse"
                        : "bg-orange-400"
                    }`}
                  ></span>
                  {modelStatus === "loaded" && "3D Model Loaded"}
                  {modelStatus === "loading" && "Loading Character..."}
                  {modelStatus === "error" && "Fallback Character"}
                </div>
              </div>
              {voicePlaying && (
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-green-400 rounded-full animate-pulse"
                        style={{
                          height: `${
                            8 + Math.sin(Date.now() * 0.01 + i) * 4
                          }px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-sm font-medium text-green-400">
                    Speaking
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performance and status indicator */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
        <div className="flex items-center space-x-3 text-white/80">
          <div className="text-xs font-mono">
            STATUS: {modelStatus.toUpperCase()}
          </div>
          <div className="w-px h-4 bg-white/20"></div>
          <div className="text-xs font-mono">
            RENDER: {voicePlaying ? "ACTIVE" : "IDLE"}
          </div>
        </div>
      </div>
    </div>
  );
}

// Preload GLTF models using React Three Fiber's useGLTF
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
