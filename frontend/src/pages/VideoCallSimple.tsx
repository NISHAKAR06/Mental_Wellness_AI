import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, Phone } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ThreeDModelViewer } from "../components/ui/ThreeDModelViewer";

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

const VideoCallSimple: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionResponse | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [transcripts, setTranscripts] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([]);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Connecting...");
  const [videoEnabled, setVideoEnabled] = useState<boolean>(false);

  const psychologistId = searchParams.get("psychologist") || "eve_black_career";
  const selectedLanguage = searchParams.get("lang") || "en-IN";

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Psychologist configuration
  const getPsychologistConfig = (id: string) => {
    const configs = {
      eve_black_career: {
        name: "Dr. Eve Black",
        modelUrl: "/girl.glb",
        specialty: "Career Anxiety Specialist",
      },
      carol_white_relationships: {
        name: "Dr. Carol White",
        modelUrl: "/model.glb",
        specialty: "Relationships Problems Specialist",
      },
    };
    return configs[id] || configs["eve_black_career"];
  };

  const psychologistConfig = getPsychologistConfig(psychologistId);

  useEffect(() => {
    startSession();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const startSession = async () => {
    try {
      console.log("Starting video call session...");
      setConnectionStatus("Starting session...");

      // Simulate session start for now (since Django backend is not running)
      setTimeout(() => {
        const mockSession: SessionResponse = {
          session_id: `session_${Date.now()}`,
          ws_url: "ws://localhost:8001/ws/voice/session_123",
          ws_token: "mock_token",
          agent: {
            id: psychologistId,
            name: psychologistConfig.name,
            voice_prefs: {},
          },
        };

        setSession(mockSession);
        connectWebSocket(mockSession);
      }, 2000);
    } catch (error) {
      console.error("Session creation error:", error);
      setConnectionStatus("Failed to start session");
    }
  };

  const connectWebSocket = (sessionData: SessionResponse) => {
    setConnectionStatus("Connecting to AI service...");

    // Simulate WebSocket connection (AI Service not running yet)
    setTimeout(() => {
      setWsConnected(true);
      setConnectionStatus(`Connected to ${psychologistConfig.name}`);

      // Add some demo transcript
      setTranscripts([
        {
          role: "assistant",
          text: `Hello! I am ${psychologistConfig.name}, your ${psychologistConfig.specialty}. How can I help you today?`,
        },
      ]);
    }, 3000);
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
          // In real implementation, send to AI service
          console.log("Audio chunk captured:", audioChunksRef.current.length);
          audioChunksRef.current = [];

          // Add demo response
          setTimeout(() => {
            addTranscript(
              "assistant",
              "Thank you for sharing. Can you tell me more about this?"
            );
          }, 2000);
        }
      };

      mediaRecorder.start();
      setRecording(true);
      mediaRecorderRef.current = mediaRecorder;

      // Simulate user speaking
      addTranscript(
        "user",
        "Demo user speech... (Actual STT will be implemented when AI service runs)"
      );
    } catch (error) {
      console.error("Recording error:", error);
      alert("Microphone access required for voice sessions");
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

  const toggleVideo = () => {
    if (videoEnabled) {
      // Stop video
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      setVideoEnabled(false);
    } else {
      // Start video (basic webcam without face analysis for demo)
      navigator.mediaDevices
        .getUserMedia({
          video: { width: 320, height: 240 },
          audio: false,
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setVideoEnabled(true);
          }
        })
        .catch((error) => {
          console.error("Video error:", error);
        });
    }
  };

  const handleEndCall = async () => {
    // Stop all media tracks
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    navigate("/dashboard/video-conferencing");
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex flex-col relative">
      {/* Header with connection status */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2">
          <p className="text-white text-sm font-medium">
            {psychologistConfig.name}
          </p>
          <p className="text-gray-300 text-xs">
            {psychologistConfig.specialty}
          </p>
        </div>
        <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2">
          <p
            className={`text-xs ${
              wsConnected ? "text-green-400" : "text-yellow-400"
            }`}
          >
            {connectionStatus}
          </p>
        </div>
      </div>

      {/* Main 3D Model Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full h-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl">
          <ThreeDModelViewer
            modelUrl={psychologistConfig.modelUrl}
            scale={2.0}
            backgroundColor="#0f172a"
            showControls={true}
            voicePlaying={audioPlaying}
          />
        </div>
      </div>

      {/* Transcripts overlay */}
      {transcripts.length > 0 && (
        <div className="absolute bottom-32 left-4 right-4 max-w-2xl mx-auto">
          <div className="bg-black bg-opacity-70 rounded-lg p-4 max-h-40 overflow-y-auto">
            <div className="space-y-2">
              {transcripts.slice(-3).map((transcript, index) => (
                <div
                  key={index}
                  className={`flex ${
                    transcript.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      transcript.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-600 text-white border border-gray-500"
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {transcript.role === "assistant"
                        ? psychologistConfig.name
                        : "You"}
                    </div>
                    {transcript.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User's Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
        style={{ display: "none" }}
      />

      {/* User's Camera Feed Preview */}
      {videoEnabled && (
        <div className="absolute bottom-20 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{
              transform: "scaleX(-1)",
            }}
          />
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Control Bar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <Button
          onClick={toggleRecording}
          variant={recording ? "destructive" : "default"}
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          {recording ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        <Button
          onClick={toggleVideo}
          variant={videoEnabled ? "default" : "secondary"}
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          {videoEnabled ? (
            <VideoOff className="h-6 w-6" />
          ) : (
            <Video className="h-6 w-6" />
          )}
        </Button>

        <Button
          onClick={handleEndCall}
          variant="destructive"
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          <Phone className="h-6 w-6" />
        </Button>
      </div>

      {/* AI Speaking Indicator */}
      {audioPlaying && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-green-600 bg-opacity-90 text-white px-6 py-3 rounded-full text-lg font-medium animate-pulse">
            {psychologistConfig.name} is speaking...
          </div>
        </div>
      )}

      {/* Demo Mode Indicator */}
      <div className="absolute bottom-4 right-4 bg-blue-600 bg-opacity-80 text-white px-3 py-1 rounded-full text-xs">
        Demo Mode - AI Service Coming Soon
      </div>
    </div>
  );
};

export default VideoCallSimple;
