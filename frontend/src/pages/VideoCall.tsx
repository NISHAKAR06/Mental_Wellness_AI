import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ThreeJsModelViewer } from "../components/ui/ThreeJsModelViewer";
import * as faceapi from "face-api.js";

interface SessionResponse {
  session_id: string;
  ws_url: string;
  ws_token: string;
  agent: {
    id: string;
    name: string;
    voice_prefs: Record<string, string>;
  };
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const VideoCall: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();

  const [session, setSession] = useState<SessionResponse | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [conversationActive, setConversationActive] = useState<boolean>(false);
  const [, setTranscripts] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([]);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Connecting...");

  // AI Processing Flow States
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("");

  // Video and face analysis state
  const [videoEnabled, setVideoEnabled] = useState<boolean>(true);
  const [faceDetectionReady, setFaceDetectionReady] = useState<boolean>(false);
  const [, setEmotionData] = useState<any>(null);
  const [speakerMuted, setSpeakerMuted] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const psychologistId = searchParams.get("psychologist") || "eve_black_career";
  const selectedLanguage = searchParams.get("lang") || "en-IN";

  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef<boolean>(false); // Prevent double connections
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analysisVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emotionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Queue Refs
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Queue Management
  const playNextChunk = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      if (audioQueueRef.current.length === 0) {
        isPlayingRef.current = false;
        setAudioPlaying(false);
      }
      return;
    }

    isPlayingRef.current = true;
    setAudioPlaying(true);

    const audioUrl = audioQueueRef.current.shift();
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      isPlayingRef.current = false;
      playNextChunk();
    };

    audio.onerror = (e) => {
      console.error("Audio playback error", e);
      URL.revokeObjectURL(audioUrl);
      isPlayingRef.current = false;
      playNextChunk();
    };

    audio.play().catch((e) => {
      console.error("Play failed", e);
      isPlayingRef.current = false;
      playNextChunk();
    });
  };

  const stopAudioPlayback = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    audioQueueRef.current.forEach((url) => URL.revokeObjectURL(url));
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setAudioPlaying(false);
  };

  // Psychologist configuration with enhanced rendering models
  const getPsychologistConfig = (id: string) => {
    const configs = {
      eve_black_career: {
        name: "Dr. Evan Black",
        modelUrl: "/agent1.glb", // Enhanced rendering model
        backgroundImage: "/agent1_background_img.jpg",
        specialty: "Career Anxiety Specialist",
        scale: 1.3,
        modelPosition: [0, -1.4, 0] as [number, number, number],
        cameraPosition: [0, 0.4, 1.6] as [number, number, number],
      },
      carol_white_relationships: {
        name: "Dr. Carol White",
        modelUrl: "/agent2.glb", // Updated to agent2 3D model
        backgroundImage: "/agent2_background_img.jpg",
        specialty: "Relationships Problems Specialist",
        scale: 1.3,
        modelPosition: [0, -1.4, 0] as [number, number, number],
        cameraPosition: [0, 0.4, 1.6] as [number, number, number],
      },
      alice_johnson_academic: {
        name: "Dr. Alex Johnson",
        modelUrl: "/agent3.glb", // Enhanced rendering model
        backgroundImage: "/agent3_background_img.jpg",
        specialty: "Academic Stress Specialist",
        scale: 1.3,
        modelPosition: [0, -1.4, 0] as [number, number, number],
        cameraPosition: [0, 0.4, 1.6] as [number, number, number],
      },
    };
    return configs[id] || configs["eve_black_career"];
  };

  const psychologistConfig = getPsychologistConfig(psychologistId);

  useEffect(() => {
    initializeFaceDetection();
    startSession();
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopEmotionAnalysis();
      stopVideoStreams();
      clearInterval(timer);
    };
  }, []);

  const stopVideoStreams = () => {
    [analysisVideoRef.current, previewVideoRef.current].forEach((videoEl) => {
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoEl.srcObject = null;
      }
    });
  };

  const stopEmotionAnalysis = () => {
    if (emotionIntervalRef.current) {
      clearInterval(emotionIntervalRef.current);
      emotionIntervalRef.current = null;
    }
  };

  // Initialize face detection models (optional - won't block app if fails)
  const initializeFaceDetection = async () => {
    try {
      console.log("Initializing face detection (optional)...");

      // Check if models directory exists first
      const modelPaths = [
        "/models/tiny_face_detector_model-weights_manifest.json",
        "/models/face_landmark_68_model-weights_manifest.json",
        "/models/face_recognition_model-weights_manifest.json",
        "/models/face_expression_model-weights_manifest.json",
      ];

      const responses = await Promise.allSettled(
        modelPaths.map((path) => fetch(path, { method: "HEAD" }))
      );

      const missingModels = responses.filter(
        (r) => r.status === "rejected"
      ).length;

      if (missingModels > 0) {
        console.warn(
          "Face detection models not found. Skipping face analysis."
        );
        setFaceDetectionReady(false);
        return;
      }

      // Try to load models if they exist
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);

      setFaceDetectionReady(true);
      console.log("✅ Face detection models loaded successfully");

      // Start emotion analysis if video is enabled
      if (videoEnabled) {
        startVideoAndAnalysis();
      }
    } catch (error: any) {
      console.warn("⚠️ Face detection unavailable:", error.message);
      setFaceDetectionReady(false);

      if (videoEnabled) {
        startVideoAndAnalysis();
      }
    }
  };

  // Start video and emotion analysis with enhanced error handling
  const startVideoAndAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false, // Audio handled separately
      });

      if (analysisVideoRef.current) {
        analysisVideoRef.current.srcObject = stream;
      }

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }

      stopEmotionAnalysis();

      // Only start emotion analysis if face detection is ready
      if (faceDetectionReady) {
        console.log("🎭 Starting emotion analysis with rendering player...");
        emotionIntervalRef.current = setInterval(async () => {
          try {
            if (
              faceDetectionReady &&
              analysisVideoRef.current &&
              canvasRef.current
            ) {
              const detections = await faceapi
                .detectAllFaces(
                  analysisVideoRef.current,
                  new faceapi.TinyFaceDetectorOptions()
                )
                .withFaceLandmarks()
                .withFaceExpressions();

              if (detections && detections.length > 0) {
                const faceExpression = detections[0].expressions;
                const emotionSnapshot = {
                  happy: faceExpression.happy || 0,
                  neutral: faceExpression.neutral || 0,
                  angry: faceExpression.angry || 0,
                  fearful: faceExpression.fearful || 0,
                  disgusted: faceExpression.disgusted || 0,
                  sad: faceExpression.sad || 0,
                  surprised: faceExpression.surprised || 0,
                  timestamp: new Date().toISOString(),
                  session_id: session?.session_id || null,
                };

                setEmotionData(emotionSnapshot);
                // Send to backend for analysis (with error handling)
                await sendEmotionData(emotionSnapshot);
              }
            }
          } catch (emotionError) {
            console.warn(
              "⚠️ Emotion analysis error (non-critical):",
              emotionError
            );
            // Don't break the interval, just log the error
          }
        }, 2000);
      } else {
        console.log(
          "⚠️ Face detection not available, skipping emotion analysis"
        );
      }
    } catch (error) {
      console.error("❌ Error starting video:", error);
      setVideoEnabled(false);
      // Ensure emotion monitoring doesn't cause issues
      stopEmotionAnalysis();
    }
  };

  // Send emotion data to backend with enhanced error handling
  const sendEmotionData = async (emotionData: any) => {
    if (!session?.session_id) {
      console.warn("No session ID available for emotion data");
      return;
    }

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      const response = await fetch(`${apiBaseUrl}/api/emotions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          session_id: session.session_id,
          emotions: emotionData,
          user_id: 1, // Would typically get from auth context
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log("✅ Emotion data sent successfully");
    } catch (error) {
      console.error("❌ Error sending emotion data:", error);
      // Don't throw error to avoid breaking the UI
      // Emotion monitoring is optional feature
    }
  };

  // Toggle video/camera
  const toggleVideo = () => {
    if (videoEnabled) {
      stopVideoStreams();
      stopEmotionAnalysis();
      setVideoEnabled(false);
    } else {
      // Start video
      startVideoAndAnalysis();
      setVideoEnabled(true);
    }
  };

  const startSession = async () => {
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/api/start-session/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: psychologistId,
          lang: selectedLanguage,
          consent_store: true,
        }),
      });

      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
        connectWebSocket(sessionData);
      } else {
        const error = await response.json();
        alert(`Session creation failed: ${error.error}`);
        navigate("/dashboard/video-conferencing");
      }
    } catch (error) {
      console.error("Session creation error:", error);
      alert("Failed to create session");
      navigate("/dashboard/video-conferencing");
    }
  };

  const connectWebSocket = (sessionData: SessionResponse) => {
    // Prevent double connections or race conditions
    if (wsRef.current || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionStatus("Connecting to AI service...");
    const ws = new WebSocket(sessionData.ws_url);

    ws.onopen = () => {
      isConnectingRef.current = false;
      setWsConnected(true);
      setConnectionStatus(`Connected to ${psychologistConfig.name}`);

      // Send initial authentication message - FastAPI will handle agent selection
      ws.send(
        JSON.stringify({
          token: sessionData.ws_token,
          lang: selectedLanguage,
          // Optionally suggest an agent, FastAPI will choose default if not provided
          preferred_agent: psychologistId,
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "connection_established":
          setConnectionStatus(`Connected to ${psychologistConfig.name}`);
          setConversationActive(true);
          break;
        case "final_transcript":
          setIsProcessingVoice(false);
          setIsAiThinking(true);
          setProcessingStep("AI is thinking...");
          addTranscript("user", message.data.text);
          // User finished speaking, ensure we are ready for AI response
          stopAudioPlayback();
          break;
        case "ai_text":
          setIsAiThinking(false);
          setProcessingStep("Generating voice response...");
          addTranscript("assistant", message.data.text);
          break;
        case "ai_audio_chunk":
          setProcessingStep("");
          // Queue the audio chunk
          if (message.data.audio_base64 && !speakerMuted) {
            try {
              const audioData = atob(message.data.audio_base64);
              const audioArray = new Uint8Array(audioData.length);
              for (let i = 0; i < audioData.length; i++) {
                audioArray[i] = audioData.charCodeAt(i);
              }

              const audioBlob = new Blob([audioArray], { type: "audio/mp3" });
              const audioUrl = URL.createObjectURL(audioBlob);

              audioQueueRef.current.push(audioUrl);

              if (!isPlayingRef.current) {
                playNextChunk();
              }
            } catch (error) {
              console.log("Audio processing error:", error);
            }
          }
          break;
        case "tts_complete":
          setProcessingStep("");
          // AI finished speaking, now patient can speak
          if (conversationActive && wsConnected) {
            console.log("🎤 AI finished speaking - patient can now speak");
          }
          break;
      }
    };

    ws.onclose = () => {
      isConnectingRef.current = false;
      // Only update state if this is the current socket
      if (wsRef.current === ws) {
        setWsConnected(false);
        setConnectionStatus("Disconnected from AI service");
        stopAudioPlayback();
      }
    };

    ws.onerror = (error) => {
      isConnectingRef.current = false;
      if (wsRef.current === ws) {
        setWsConnected(false);
        setConnectionStatus("Connection error");
      }
    };

    wsRef.current = ws;
  };

  const addTranscript = (role: "user" | "assistant", text: string) => {
    setTranscripts((prev) => [...prev, { role, text }]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (audioChunksRef.current.length > 0) {
          sendAudioData(audioChunksRef.current);
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.start();
      setRecording(true);
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error("Recording error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const toggleRecording = () => {
    if (!conversationActive || audioPlaying) {
      console.log(
        "🚫 Cannot record: conversation not active or AI is speaking"
      );
      return;
    }

    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendAudioData = (chunks: Blob[]) => {
    // Start voice processing indication
    setIsProcessingVoice(true);
    setProcessingStep("Processing your voice...");

    const audioBlob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
    const reader = new FileReader();

    reader.onload = () => {
      const base64Audio = (reader.result as string).split(",")[1];

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "audio_chunk",
            audio_data: base64Audio,
          })
        );

        wsRef.current.send(
          JSON.stringify({
            type: "user_utterance_end",
          })
        );
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  const handleEndCall = async () => {
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      await fetch(`${apiBaseUrl}/api/end-session/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: session?.session_id,
        }),
      });
    } catch (error) {
      console.error("Session end error:", error);
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    stopVideoStreams();
    stopEmotionAnalysis();
    navigate("/dashboard/session-summarizer");
  };

  return (
    <div className="relative flex min-h-screen w-full bg-gray-900">
      {/* Main Video Area - Full Screen */}
      <div className="relative flex-1 flex flex-col">
        {/* Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-6 bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white">
            <h2 className="text-lg font-medium">{psychologistConfig.name}</h2>
            <p className="text-sm text-gray-300">
              {psychologistConfig.specialty}
            </p>
          </div>
          <div className="flex items-center gap-3 text-white">
            <span
              className={`h-2 w-2 rounded-full ${
                wsConnected ? "bg-green-500" : "bg-red-500 animate-pulse"
              }`}
            />
            <span className="text-sm">{formatDuration(elapsedSeconds)}</span>
          </div>
        </div>

        {/* AI Processing Flow Indicators */}
        {(isProcessingVoice || isAiThinking || processingStep) && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-3 rounded-full bg-black/70 px-6 py-3 text-white shadow-lg backdrop-blur-md">
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

            {processingStep && !isProcessingVoice && !isAiThinking && (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-green-400" />
                </div>
                <span className="text-sm font-medium">{processingStep}</span>
              </>
            )}
          </div>
        )}

        {/* Main Speaker View - Full Screen */}
        <div className="relative w-full h-full">
          <ThreeJsModelViewer
            modelUrl={psychologistConfig.modelUrl}
            scale={psychologistConfig.scale}
            modelPosition={psychologistConfig.modelPosition}
            cameraPosition={psychologistConfig.cameraPosition}
            backgroundColor={
              psychologistConfig.backgroundImage ? undefined : "#f5e2dc"
            }
            backgroundImage={psychologistConfig.backgroundImage}
            showControls={false}
            voicePlaying={audioPlaying}
            showSessionBanner={false}
            isProcessingVoice={isProcessingVoice}
            isAiThinking={isAiThinking}
          />

          {/* Speaker Name Label */}
          <div className="absolute bottom-6 left-6">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-white font-medium">
                {psychologistConfig.name}
              </span>
            </div>
          </div>
        </div>

        {/* Picture-in-Picture for User Video */}
        {videoEnabled && (
          <div className="absolute bottom-24 right-6 z-20">
            <div className="relative w-48 h-36 overflow-hidden rounded-xl border-2 border-white/30 bg-black shadow-2xl">
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <div className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1">
                <span className="text-white text-xs font-medium">
                  {user?.name || "You"} (you)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Control Bar at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center p-6 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center gap-4 rounded-full bg-black/70 backdrop-blur-xl px-8 py-4">
            <button
              onClick={() => setSpeakerMuted((prev) => !prev)}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                speakerMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              {speakerMuted ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>

            <button
              onClick={toggleRecording}
              disabled={!wsConnected}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                recording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
              }`}
            >
              {recording ? (
                <Mic className="h-5 w-5 text-white" />
              ) : (
                <MicOff className="h-5 w-5 text-white" />
              )}
            </button>

            <button
              onClick={toggleVideo}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                videoEnabled
                  ? "bg-gray-600 hover:bg-gray-700"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {videoEnabled ? (
                <Video className="h-5 w-5 text-white" />
              ) : (
                <VideoOff className="h-5 w-5 text-white" />
              )}
            </button>

            <div className="w-px h-8 bg-gray-500 mx-2" />

            <button
              onClick={handleEndCall}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-all"
            >
              <Phone className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden analysis elements */}
      <video
        ref={analysisVideoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default VideoCall;
