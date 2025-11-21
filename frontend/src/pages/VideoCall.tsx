import React, { useState, useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Volume2,
  VolumeX,
  Wifi,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ThreeDModelViewer } from "../components/ui/ThreeDModelViewer";
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

type IconCircleButtonVariant = "primary" | "muted" | "danger" | "ghost";

interface IconCircleButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: IconCircleButtonVariant;
  pulse?: boolean;
}

const IconCircleButton: React.FC<IconCircleButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  active = true,
  disabled,
  variant = "primary",
  pulse,
}) => {
  const variantStyles: Record<IconCircleButtonVariant, string> = {
    primary:
      "bg-white text-slate-900 shadow-[0_18px_35px_rgba(15,23,42,0.35)] hover:bg-slate-50",
    muted: "bg-white/10 text-white/85 border border-white/20 hover:bg-white/20",
    danger:
      "bg-rose-600 text-white shadow-[0_25px_45px_rgba(244,63,94,0.55)] hover:bg-rose-500",
    ghost: "bg-white/10 text-white hover:bg-white/20 border border-white/20",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
        variantStyles[variant]
      } ${!active ? "opacity-60" : ""} ${
        disabled ? "cursor-not-allowed opacity-30" : ""
      } ${pulse ? "animate-pulse" : ""}`}
      aria-label={label}
    >
      <Icon className="h-6 w-6" />
      <span className="sr-only">{label}</span>
    </button>
  );
};

const VideoCall: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [session, setSession] = useState<SessionResponse | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [, setTranscripts] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([]);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Connecting...");

  // Video and face analysis state
  const [videoEnabled, setVideoEnabled] = useState<boolean>(true);
  const [faceDetectionReady, setFaceDetectionReady] = useState<boolean>(false);
  const [, setEmotionData] = useState<any>(null);
  const [speakerMuted, setSpeakerMuted] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const psychologistId = searchParams.get("psychologist") || "eve_black_career";
  const selectedLanguage = searchParams.get("lang") || "en-IN";

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analysisVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emotionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Psychologist configuration
  const getPsychologistConfig = (id: string) => {
    const configs = {
      eve_black_career: {
        name: "Dr. Eve Black",
        modelUrl: "/ALICE.glb",
        specialty: "Career Anxiety Specialist",
      },
      carol_white_relationships: {
        name: "Dr. Carol White",
        modelUrl: "/SARAH.glb",
        specialty: "Relationships Problems Specialist",
      },
      alice_johnson_academic: {
        name: "Dr. Alice Johnson",
        modelUrl: "/BLACK.glb",
        specialty: "Academic Stress Specialist",
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

  // Start video and emotion analysis
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
      emotionIntervalRef.current = setInterval(async () => {
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
            // Send to backend for analysis
            sendEmotionData(emotionSnapshot);
          }
        }
      }, 2000);
    } catch (error) {
      console.error("Error starting video:", error);
      setVideoEnabled(false);
    }
  };

  // Send emotion data to backend
  const sendEmotionData = async (emotionData: any) => {
    if (!session?.session_id) return;

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      await fetch(`${apiBaseUrl}/api/emotions/`, {
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
    } catch (error) {
      console.error("Error sending emotion data:", error);
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
    setConnectionStatus("Connecting to AI service...");
    const ws = new WebSocket(sessionData.ws_url);

    ws.onopen = () => {
      setWsConnected(true);
      setConnectionStatus(`Connected to ${psychologistConfig.name}`);

      // Send initial authentication message with token
      ws.send(
        JSON.stringify({
          token: sessionData.ws_token,
          agent_id: psychologistId,
          lang: selectedLanguage,
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "connection_established":
          setConnectionStatus(`Connected to ${psychologistConfig.name}`);
          break;
        case "final_transcript":
          addTranscript("user", message.data.text);
          break;
        case "ai_text":
          addTranscript("assistant", message.data.text);
          break;
        case "ai_audio_chunk":
          setAudioPlaying(true);
          break;
        case "tts_complete":
          setAudioPlaying(false);
          break;
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      setConnectionStatus("Disconnected from AI service");
    };

    ws.onerror = (error) => {
      setWsConnected(false);
      setConnectionStatus("Connection error");
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
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendAudioData = (chunks: Blob[]) => {
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

  const ControlButton: React.FC<
    IconCircleButtonProps & { caption?: string }
  > = (props) => (
    <div className="flex flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
      <IconCircleButton {...props} />
      <span>{props.caption || props.label}</span>
    </div>
  );

  return (
    <div className="relative flex min-h-screen w-full justify-center bg-[#cfd5df] px-4 py-6">
      <div className="relative w-full max-w-[1380px] overflow-hidden rounded-[48px] bg-gradient-to-br from-[#f1dad7] via-[#d9cfd0] to-[#becedd] shadow-[0_35px_90px_rgba(15,23,42,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.6),transparent),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.35),transparent)]" />

        <div className="relative z-10 flex min-h-[760px] flex-col px-8 py-10 md:px-14 lg:px-20">
          <header className="flex flex-wrap items-start justify-between gap-6 text-slate-900">
            <div>
              <p className="text-xs uppercase tracking-[0.6em] text-slate-600">
                Live Session
              </p>
              <p className="text-3xl font-semibold leading-tight text-slate-900">
                {psychologistConfig.name}
              </p>
              <p className="text-sm text-slate-600">
                {psychologistConfig.specialty}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3 rounded-3xl bg-white/70 px-5 py-4 text-slate-900 shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
              <div className="flex items-center gap-3 text-base font-semibold">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg">
                  <Wifi className="h-4 w-4" />
                </span>
                <span>{formatDuration(elapsedSeconds)}</span>
              </div>
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.35em] text-slate-600">
                <span
                  className={`h-2 w-2 rounded-full ${
                    wsConnected
                      ? "bg-emerald-500"
                      : "bg-amber-500 animate-pulse"
                  }`}
                />
                {connectionStatus}
              </p>
            </div>
          </header>

          <div className="relative mt-10 flex flex-1 items-center justify-center">
            <div className="absolute inset-x-16 top-6 h-48 rounded-full bg-white/35 blur-3xl" />
            <div className="relative w-full max-w-[580px]">
              <div className="absolute inset-0 -z-10 scale-105 rounded-[64px] bg-white/40 blur-[90px]" />
              <div className="relative aspect-[3/4] w-full min-h-[520px] overflow-hidden rounded-[64px] border border-white/35 bg-white/85 shadow-[0_45px_95px_rgba(15,23,42,0.35)]">
                <ThreeDModelViewer
                  modelUrl={psychologistConfig.modelUrl}
                  scale={1.6}
                  modelPosition={[0, -0.6, 0]}
                  cameraPosition={[0, 0, 2.3]}
                  backgroundColor="#f5e2dc"
                  showControls={false}
                  voicePlaying={audioPlaying}
                  showSessionBanner={false}
                />
              </div>

              {videoEnabled && (
                <div className="absolute left-6 bottom-0 hidden w-44 overflow-hidden rounded-[28px] border border-white/50 bg-black/55 shadow-xl backdrop-blur-sm md:block">
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="aspect-[4/3] w-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  <div className="flex items-center justify-between px-3 py-2 text-[11px] text-white/85">
                    <span className="font-semibold tracking-wide">YOU</span>
                    <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                      <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                      Live
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <footer className="mt-12 flex w-full justify-center">
            <div className="flex flex-wrap items-center justify-center gap-8 rounded-full bg-[#0c1526]/90 px-10 py-5 text-white shadow-[0_30px_80px_rgba(12,21,38,0.55)] backdrop-blur-xl">
              <ControlButton
                icon={speakerMuted ? VolumeX : Volume2}
                label="Speaker"
                caption="Speaker"
                onClick={() => setSpeakerMuted((prev) => !prev)}
                active={!speakerMuted}
                variant="muted"
              />
              <span className="hidden h-10 w-px bg-white/20 sm:block" />
              <ControlButton
                icon={recording ? Mic : MicOff}
                label="Microphone"
                caption="Mic"
                onClick={toggleRecording}
                active={recording}
                disabled={!wsConnected}
                variant="muted"
              />
              <span className="hidden h-10 w-px bg-white/20 sm:block" />
              <ControlButton
                icon={videoEnabled ? VideoOff : Video}
                label="Camera"
                caption="Camera"
                onClick={toggleVideo}
                active={videoEnabled}
                variant="primary"
              />
              <span className="hidden h-10 w-px bg-white/20 sm:block" />
              <ControlButton
                icon={Phone}
                label="End Call"
                caption="End"
                onClick={handleEndCall}
                variant="danger"
              />
            </div>
          </footer>
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
