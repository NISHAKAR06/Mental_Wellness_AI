import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

interface ThreeJsModelViewerProps {
  modelUrl: string;
  scale?: number;
  modelPosition?: [number, number, number];
  cameraPosition?: [number, number, number];
  backgroundColor?: string;
  backgroundImage?: string;
  showControls?: boolean;
  voicePlaying?: boolean;
  showSessionBanner?: boolean;
  isProcessingVoice?: boolean;
  isAiThinking?: boolean;
}

export const ThreeJsModelViewer: React.FC<ThreeJsModelViewerProps> = ({
  modelUrl,
  scale = 1,
  modelPosition = [0, -1, 0],
  cameraPosition = [0, 0, 3],
  backgroundColor = "#f5e2dc",
  backgroundImage,
  voicePlaying = false,
  isProcessingVoice = false,
  isAiThinking = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animationIdRef = useRef<number | null>(null);

  // Refs for blinking animation
  const faceMeshRef = useRef<THREE.Mesh | null>(null);
  const blinkMorphIndexRef = useRef<number>(-1);
  const mouthMorphIndexRef = useRef<number>(-1);
  const nextBlinkTimeRef = useRef<number>(0);
  const isBlinkingRef = useRef<boolean>(false);
  const blinkStartTimeRef = useRef<number>(0);

  // Refs for mutable state to avoid re-running effects
  const voicePlayingRef = useRef(voicePlaying);
  const modelPositionRef = useRef(modelPosition);

  // Update refs when props change
  useEffect(() => {
    voicePlayingRef.current = voicePlaying;
  }, [voicePlaying]);

  useEffect(() => {
    modelPositionRef.current = modelPosition;
  }, [modelPosition]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // Get dimensions from container
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2]
    );
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    // Renderer setup - use provided canvas
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: backgroundImage ? true : false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Set clear color based on background
    if (backgroundImage) {
      renderer.setClearColor(0x000000, 0); // Transparent for background image
    } else {
      const bgColor = new THREE.Color(backgroundColor);
      renderer.setClearColor(bgColor, 1);
    }
    rendererRef.current = renderer;

    // Lighting setup - simplified to prevent flickering
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(3, 6, 4);
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0xfff5e6, 0.3);
    pointLight1.position.set(-3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xe6f3ff, 0.3);
    pointLight2.position.set(3, 1, -3);
    scene.add(pointLight2);

    // Load GLTF model
    const loader = new GLTFLoader();

    console.log("🔄 Loading 3D model:", modelUrl);

    loader.load(
      modelUrl,
      (gltf) => {
        console.log("✅ Model loaded successfully:", modelUrl);

        const model = gltf.scene;

        // Calculate model bounding box to understand its dimensions
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        console.log("📐 Model dimensions:", {
          width: size.x.toFixed(2),
          height: size.y.toFixed(2),
          depth: size.z.toFixed(2),
          center: {
            x: center.x.toFixed(2),
            y: center.y.toFixed(2),
            z: center.z.toFixed(2),
          },
        });

        model.position.set(
          modelPosition[0],
          modelPosition[1],
          modelPosition[2]
        );
        model.scale.set(scale, scale, scale);

        // Ensure stable rendering
        model.frustumCulled = false;
        model.matrixAutoUpdate = true;
        model.renderOrder = 1;

        // Simplify materials and disable shadows
        model.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            // Check for morph targets (for blinking)
            if (node.morphTargetDictionary && node.morphTargetInfluences) {
              const dict = node.morphTargetDictionary;
              // Look for common blink names
              const blinkName = Object.keys(dict).find(
                (k) =>
                  k.toLowerCase().includes("blink") ||
                  (k.toLowerCase().includes("eye") &&
                    k.toLowerCase().includes("close"))
              );

              if (blinkName && faceMeshRef.current === null) {
                faceMeshRef.current = node;
                blinkMorphIndexRef.current = dict[blinkName];
                console.log("👁️ Found blink morph target:", blinkName);
              }

              // Look for mouth open morph target
              const mouthName = Object.keys(dict).find(
                (k) =>
                  (k.toLowerCase().includes("mouth") &&
                    k.toLowerCase().includes("open")) ||
                  (k.toLowerCase().includes("jaw") &&
                    k.toLowerCase().includes("open")) ||
                  k.toLowerCase() === "viseme_aa" ||
                  k.toLowerCase() === "aa" ||
                  k.toLowerCase() === "mouthopen" ||
                  k.toLowerCase().includes("viseme") // Fallback: any viseme
              );

              if (mouthName) {
                // If we haven't set the face mesh yet, or if this is the same mesh
                if (
                  faceMeshRef.current === null ||
                  faceMeshRef.current === node
                ) {
                  faceMeshRef.current = node;
                  mouthMorphIndexRef.current = dict[mouthName];
                  console.log("👄 Found mouth morph target:", mouthName);
                }
              } else {
                // Fallback: Try to find ANY morph target if no specific mouth one is found
                // This is a "last resort" to get some movement
                if (
                  Object.keys(dict).length > 0 &&
                  mouthMorphIndexRef.current === -1
                ) {
                  const firstKey = Object.keys(dict)[0];
                  mouthMorphIndexRef.current = dict[firstKey];
                  console.log(
                    "⚠️ Using fallback morph target for mouth:",
                    firstKey
                  );
                  if (faceMeshRef.current === null) faceMeshRef.current = node;
                }
              }
            }

            node.castShadow = false;
            node.receiveShadow = false;
            node.frustumCulled = false;
            node.matrixAutoUpdate = true;
            node.renderOrder = 1;

            // Ensure materials are stable and opaque
            if (node.material) {
              if (Array.isArray(node.material)) {
                node.material.forEach((mat) => {
                  mat.side = THREE.FrontSide;
                  mat.transparent = false;
                  mat.opacity = 1;
                  mat.depthTest = true;
                  mat.depthWrite = true;
                });
              } else {
                node.material.side = THREE.FrontSide;
                node.material.transparent = false;
                node.material.opacity = 1;
                node.material.depthTest = true;
                node.material.depthWrite = true;
              }
            }
          }
        });

        // Find skeleton and adjust arm bones slightly down
        let skeleton: THREE.Skeleton | null = null;
        model.traverse((node) => {
          if (
            (node as any).isSkinnedMesh &&
            (node as THREE.SkinnedMesh).skeleton
          ) {
            skeleton = (node as THREE.SkinnedMesh).skeleton;
          }
        });

        if (skeleton) {
          skeleton.bones.forEach((bone) => {
            const boneName = bone.name.toLowerCase();

            // Push upper arms further down
            if (
              boneName.match(/arm|shoulder/) &&
              !boneName.match(/forearm|lower/)
            ) {
              bone.rotation.x = Math.PI * 0.5; // 63 degrees down - more aggressive
              console.log("Lowered arm:", bone.name);
            }
          });
          console.log("✅ Arms adjusted further down");
        }

        scene.add(model);
        modelRef.current = model;

        // Disable built-in animations to prevent blinking
        console.log("⚠️ Built-in animations disabled - using procedural only");
      },
      (xhr) => {
        const progress = (xhr.loaded / xhr.total) * 100;
        console.log(`Loading: ${progress.toFixed(1)}%`);
      },
      (error) => {
        console.error("❌ Error loading model:", error);
      }
    );

    // Simple stable animation loop
    let lastUpdateTime = 0;
    const MIN_UPDATE_INTERVAL = 1000 / 60; // 60 FPS max

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const now = performance.now();

      // Only update at most 60 times per second
      if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
        return;
      }
      lastUpdateTime = now;

      const elapsed = clockRef.current.getElapsedTime();
      const isTalking = voicePlayingRef.current;

      // Blinking Logic
      if (
        faceMeshRef.current &&
        blinkMorphIndexRef.current !== -1 &&
        faceMeshRef.current.morphTargetInfluences
      ) {
        // Start a new blink?
        if (!isBlinkingRef.current && now > nextBlinkTimeRef.current) {
          isBlinkingRef.current = true;
          blinkStartTimeRef.current = now;
          // Schedule next blink (random 0.5-2.5 seconds) - Increased frequency
          nextBlinkTimeRef.current = now + 500 + Math.random() * 2000;
        }

        // Animate current blink
        if (isBlinkingRef.current) {
          const blinkDuration = 150; // ms
          const progress = (now - blinkStartTimeRef.current) / blinkDuration;

          if (progress >= 1) {
            isBlinkingRef.current = false;
            faceMeshRef.current.morphTargetInfluences[
              blinkMorphIndexRef.current
            ] = 0;
          } else {
            // Sine wave 0 -> 1 -> 0
            const value = Math.sin(progress * Math.PI);
            faceMeshRef.current.morphTargetInfluences[
              blinkMorphIndexRef.current
            ] = value;
          }
        }
      }

      // Lip Sync Logic
      if (
        faceMeshRef.current &&
        mouthMorphIndexRef.current !== -1 &&
        faceMeshRef.current.morphTargetInfluences
      ) {
        if (isTalking) {
          // Simple lip sync simulation using sine wave + noise
          // Speed ~15Hz for speech
          const time = now * 0.02;
          // Combine sine waves for more natural look
          const value =
            (Math.sin(time) * 0.5 + 0.5) * 0.6 + Math.random() * 0.2;

          // Smooth transition could be added here, but direct mapping is responsive
          faceMeshRef.current.morphTargetInfluences[
            mouthMorphIndexRef.current
          ] = Math.min(0.8, Math.max(0, value));
        } else {
          // Close mouth smoothly
          const current =
            faceMeshRef.current.morphTargetInfluences[
              mouthMorphIndexRef.current
            ];
          // Faster closing
          faceMeshRef.current.morphTargetInfluences[
            mouthMorphIndexRef.current
          ] = Math.max(0, current - 0.2);
        }
      } else if (isTalking && modelRef.current) {
        // Fallback: If no morph targets, bob the head more vigorously
        modelRef.current.rotation.x = Math.sin(elapsed * 15) * 0.05;
      }

      if (modelRef.current) {
        // Base breathing animation (always active)
        const breathSpeed = isTalking ? 2 : 1;
        const breathAmp = isTalking ? 0.02 : 0.01;
        modelRef.current.position.y =
          modelPositionRef.current[1] +
          Math.sin(elapsed * breathSpeed) * breathAmp;

        if (isTalking) {
          // Head movement (nodding/swaying) - Increased amplitude
          modelRef.current.rotation.y = Math.sin(elapsed * 3) * 0.15;
          modelRef.current.rotation.x = Math.sin(elapsed * 2) * 0.08;

          // Subtle body sway - Increased
          modelRef.current.rotation.z = Math.sin(elapsed * 1.5) * 0.05;
        } else {
          // Idle drift - Slightly increased
          modelRef.current.rotation.y = Math.sin(elapsed * 0.5) * 0.05;
          modelRef.current.rotation.x = Math.sin(elapsed * 0.3) * 0.03;
          modelRef.current.rotation.z = 0;
        }
      }

      // Render scene - simple and stable
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current)
        return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);

      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }

      // Dispose renderer (don't remove canvas - it's controlled by React)
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [
    modelUrl,
    scale,
    // modelPosition, // Removed to prevent re-init
    // cameraPosition, // Keep if camera doesn't change often
    backgroundColor,
    backgroundImage,
    // voicePlaying, // Removed to prevent re-init
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background image overlay if provided */}
      {backgroundImage && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* Canvas for Three.js - fixed size */}
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          position: "relative",
          zIndex: 1,
        }}
      />

      {/* Status indicator */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
        <div className="flex items-center space-x-3 text-white/80">
          <div className="text-xs font-mono">
            RENDER: {voicePlaying ? "ACTIVE" : "IDLE"}
          </div>
        </div>
      </div>

      {/* Processing indicators */}
      {(isProcessingVoice || isAiThinking) && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 flex items-center gap-3 rounded-full bg-black/70 px-6 py-3 text-white shadow-lg backdrop-blur-md">
          {isProcessingVoice && (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                <div className="h-4 w-4 animate-pulse rounded-full bg-blue-400" />
              </div>
              <span className="text-sm font-medium">Processing voice...</span>
            </>
          )}

          {isAiThinking && (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
              </div>
              <span className="text-sm font-medium">AI is thinking...</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
