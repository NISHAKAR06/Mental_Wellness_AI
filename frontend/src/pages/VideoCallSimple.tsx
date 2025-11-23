import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Video, VideoOff, Phone } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ThreeJsModelViewer } from "../components/ui/ThreeJsModelViewer";

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

  const [selectedPsychologistId, setSelectedPsychologistId] = useState<string>(
    searchParams.get("psychologist") || "eve_black_career"
  );

  const [session, setSession] = useState<SessionResponse | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcripts, setTranscripts] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([]);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Connecting...");
  const [videoEnabled, setVideoEnabled] = useState<boolean>(false);

  const selectedLanguage = searchParams.get("lang") || "en-IN";

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Audio playback refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const pendingChunksRef = useRef<Map<number, AudioBuffer>>(new Map());
  const nextChunkIndexRef = useRef<number>(0);
  const incomingChunkIndexRef = useRef<number>(0);

  const isPlayingRef = useRef<boolean>(false);
  const nextStartTimeRef = useRef<number>(0);
  const isResponseCompleteRef = useRef<boolean>(false);
  const responseGenerationRef = useRef<number>(0);

  // VAD (Voice Activity Detection) refs
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noSpeechTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);

  // Psychologist configuration
  const getPsychologistConfig = (id: string) => {
    const configs = {
      eve_black_career: {
        name: "Dr. Evan Black",
        modelUrl: "/agent3.glb",
        specialty: "Career Anxiety Specialist",
      },
      carol_white_relationships: {
        name: "Dr. Carol White",
        modelUrl: "/agent2.glb",
        specialty: "Relationships Problems Specialist",
      },
      alice_johnson_academic: {
        name: "Dr. Alex Johnson",
        modelUrl: "/agent1.glb",
        specialty: "Academic Stress Specialist",
      },
    };
    return configs[id] || configs["eve_black_career"];
  };

  const psychologistConfig = getPsychologistConfig(selectedPsychologistId);

  const [hasJoined, setHasJoined] = useState<boolean>(false);

  useEffect(() => {
    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleJoinSession = async () => {
    if (hasJoined) return; // Prevent multiple clicks

    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }
    setHasJoined(true);
    startSession();
  };

  const startSession = async () => {
    // Cleanup existing session
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Reset audio state
    activeSourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    pendingChunksRef.current.clear();
    nextChunkIndexRef.current = 0;
    incomingChunkIndexRef.current = 0;

    isPlayingRef.current = false;
    nextStartTimeRef.current = 0;
    isResponseCompleteRef.current = false;
    setAudioPlaying(false);

    try {
      console.log("Starting video call session...");
      setConnectionStatus("Starting session...");

      // Generate a random session ID
      const sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // In a real app, we would fetch a token from the backend here
      // For now, we'll use the demo mode or a mock token
      const mockSession: SessionResponse = {
        session_id: sessionId,
        ws_url: `ws://localhost:8001/ws/voice/${sessionId}`,
        ws_token: "mock_token", // The backend accepts this in demo mode
        agent: {
          id: selectedPsychologistId,
          name: psychologistConfig.name,
          voice_prefs: {},
        },
      };

      setSession(mockSession);
      connectWebSocket(mockSession);
    } catch (error) {
      console.error("Session creation error:", error);
      setConnectionStatus("Failed to start session");
    }
  };

  const connectWebSocket = (sessionData: SessionResponse) => {
    setConnectionStatus("Connecting to AI service...");

    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(sessionData.ws_url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsConnected(true);
      setConnectionStatus(`Connected to ${psychologistConfig.name}`);

      // Send initialization message
      ws.send(
        JSON.stringify({
          token: sessionData.ws_token,
          agent_id: selectedPsychologistId,
          lang: selectedLanguage,
          session_type: "video_call",
        })
      );
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setWsConnected(false);
      setConnectionStatus("Disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("Connection error");
    };
  };

  const handleWebSocketMessage = async (message: any) => {
    switch (message.type) {
      case "connection_established":
        console.log("Session initialized:", message);
        break;

      case "ai_text":
        setIsProcessing(false);
        addTranscript("assistant", message.data.text);
        break;

      case "ai_audio_chunk":
        // Handle audio chunk
        if (message.data.audio_base64) {
          isResponseCompleteRef.current = false; // Reset completion flag as we have new audio
          // Use provided index or auto-increment
          const index =
            message.data.chunk_index !== undefined
              ? message.data.chunk_index
              : incomingChunkIndexRef.current++;
          await queueAudioChunk(message.data.audio_base64, index);
        }
        break;

      case "tts_complete":
        // AI finished generating speech.
        console.log("TTS generation complete");
        isResponseCompleteRef.current = true;
        break;

      case "processing_voice":
        setIsProcessing(true);
        // Increment generation to invalidate in-flight chunks
        responseGenerationRef.current++;

        // Stop any existing audio (safety)
        activeSourcesRef.current.forEach((s) => {
          try {
            s.stop();
          } catch (e) {}
        });
        activeSourcesRef.current = [];

        // Reset state
        incomingChunkIndexRef.current = 0;
        nextChunkIndexRef.current = 0;
        pendingChunksRef.current.clear();
        nextStartTimeRef.current = 0;
        isPlayingRef.current = false;
        setAudioPlaying(false);
        break;

      case "stop_tts":
        console.log("🛑 Received stop_tts signal");
        // Increment generation to invalidate in-flight chunks
        responseGenerationRef.current++;

        // Stop all active sources
        activeSourcesRef.current.forEach((s) => {
          try {
            s.stop();
          } catch (e) {}
        });
        activeSourcesRef.current = [];
        pendingChunksRef.current.clear();
        nextChunkIndexRef.current = 0;
        incomingChunkIndexRef.current = 0;

        isPlayingRef.current = false;
        setAudioPlaying(false);
        nextStartTimeRef.current = 0;
        isResponseCompleteRef.current = false;
        break;

      case "error":
        console.error("Server error:", message.message);
        break;
    }
  };

  // Monitor audio queue to detect when AI finishes speaking
  useEffect(() => {
    const checkAudioStatus = setInterval(() => {
      // 1. Update playback state
      if (isPlayingRef.current && activeSourcesRef.current.length === 0) {
        // Check if we are truly done (no pending chunks to schedule)
        if (pendingChunksRef.current.size === 0) {
          // Double check time
          if (
            audioContextRef.current &&
            audioContextRef.current.currentTime >= nextStartTimeRef.current
          ) {
            isPlayingRef.current = false;
            setAudioPlaying(false);
            // Do NOT reset nextStartTimeRef here to prevent overlap issues
          }
        }
      }

      // 2. Check for Turn-Taking Trigger
      if (
        isResponseCompleteRef.current &&
        !isPlayingRef.current &&
        activeSourcesRef.current.length === 0 &&
        pendingChunksRef.current.size === 0
      ) {
        // CYCLIC FLOW: Auto-start recording after AI finishes
        if (wsConnected && !recording) {
          console.log("🔄 AI finished speaking, auto-starting microphone...");
          startRecording();
          isResponseCompleteRef.current = false; // Reset flag to prevent double trigger
        }
      }
    }, 100);

    return () => clearInterval(checkAudioStatus);
  }, [wsConnected, recording]);

  const queueAudioChunk = async (base64Audio: string, index: number) => {
    // Capture current generation
    const currentGeneration = responseGenerationRef.current;

    try {
      if (!audioContextRef.current) return;

      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(
        bytes.buffer
      );

      // Check if generation has changed during decoding
      if (currentGeneration !== responseGenerationRef.current) {
        console.log("Discarding audio chunk from previous generation");
        return;
      }

      // Store in pending map
      pendingChunksRef.current.set(index, audioBuffer);

      // Try to schedule available chunks in order
      processPendingChunks();
    } catch (error) {
      console.error("Error decoding audio chunk:", error);
    }
  };

  const processPendingChunks = () => {
    if (!audioContextRef.current) return;

    // Schedule all consecutive chunks available
    while (pendingChunksRef.current.has(nextChunkIndexRef.current)) {
      const buffer = pendingChunksRef.current.get(nextChunkIndexRef.current)!;
      pendingChunksRef.current.delete(nextChunkIndexRef.current);
      schedulePlayback(buffer);
      nextChunkIndexRef.current++;
    }
  };

  const schedulePlayback = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    if (buffer.duration < 0.05) {
      console.log("Skipping empty/short audio chunk");
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;

    // If we are starting fresh or fell behind, reset start time to now
    // Add a tiny buffer (0.05s) to ensure smooth start if we are resetting
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime + 0.05;
    }

    console.log(
      `🎵 Scheduling chunk at ${nextStartTimeRef.current.toFixed(
        3
      )} (current: ${currentTime.toFixed(3)}, dur: ${buffer.duration.toFixed(
        3
      )})`
    );

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;

    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(
        (s) => s !== source
      );
    };

    isPlayingRef.current = true;
    setAudioPlaying(true);
  };

  const addTranscript = (role: "user" | "assistant", text: string) => {
    setTranscripts((prev) => [...prev, { role, text }]);
  };

  const startRecording = async () => {
    try {
      // Resume audio context if suspended (browser policy)
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup VAD
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        // Start VAD monitoring
        isSpeakingRef.current = false;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Start "No Speech" timer (e.g., 8 seconds)
        if (noSpeechTimerRef.current) clearTimeout(noSpeechTimerRef.current);
        noSpeechTimerRef.current = setTimeout(() => {
          console.log("⏳ No speech detected for 8s, prompting user...");
          stopRecording();
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "no_speech_detected" }));
          }
        }, 8000);

        vadIntervalRef.current = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);

          // Calculate average volume
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;

          // Thresholds
          const SPEAKING_THRESHOLD = 8; // Lowered threshold for better sensitivity
          const SILENCE_DURATION = 2000; // 2 seconds of silence to stop

          if (average > SPEAKING_THRESHOLD) {
            // User is speaking
            if (!isSpeakingRef.current) {
              console.log("🗣️ Voice detected");
              isSpeakingRef.current = true;
              setIsUserSpeaking(true);

              // Clear "No Speech" timer as user has started speaking
              if (noSpeechTimerRef.current) {
                clearTimeout(noSpeechTimerRef.current);
                noSpeechTimerRef.current = null;
              }
            }
            // Reset silence timer
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          } else if (isSpeakingRef.current) {
            // User was speaking, now silent - start timer
            if (!silenceTimerRef.current) {
              console.log("🤫 Silence detected, waiting to stop...");
              setIsUserSpeaking(false); // Visual feedback: stopped speaking
              silenceTimerRef.current = setTimeout(() => {
                console.log("🛑 Auto-stopping recording due to silence");
                stopRecording();
              }, SILENCE_DURATION);
            }
          }
        }, 100);
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (
          event.data.size > 0 &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          // Convert blob to base64 and send
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = (reader.result as string).split(",")[1];
            wsRef.current?.send(
              JSON.stringify({
                type: "audio_chunk",
                audio_data: base64Audio,
              })
            );
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.start(100); // Send chunks every 100ms
      setRecording(true);
      mediaRecorderRef.current = mediaRecorder;

      // Clear previous audio queue if any (barge-in)
      if (
        activeSourcesRef.current.length > 0 ||
        pendingChunksRef.current.size > 0 ||
        isPlayingRef.current
      ) {
        console.log("🛑 Barge-in detected, notifying backend...");
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "barge_in" }));
        }
      }

      activeSourcesRef.current.forEach((s) => {
        try {
          s.stop();
        } catch (e) {}
      });
      activeSourcesRef.current = [];
      pendingChunksRef.current.clear();
      nextChunkIndexRef.current = 0;
    } catch (error) {
      console.error("Recording error:", error);
      alert("Microphone access required for voice sessions");
    }
  };

  const stopRecording = () => {
    // Cleanup VAD
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (noSpeechTimerRef.current) {
      clearTimeout(noSpeechTimerRef.current);
      noSpeechTimerRef.current = null;
    }
    isSpeakingRef.current = false;

    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setRecording(false);

      // Send end of utterance signal
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "user_utterance_end",
          })
        );
      }
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
      {!hasJoined && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center p-8 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to start?
            </h2>

            <div className="mb-6 text-left">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Your Specialist
              </label>
              <select
                value={selectedPsychologistId}
                onChange={(e) => setSelectedPsychologistId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="alice_johnson_academic">
                  Dr. Alex Johnson (Academic Stress)
                </option>
                <option value="carol_white_relationships">
                  Dr. Carol White (Relationships)
                </option>
                <option value="eve_black_career">
                  Dr. Evan Black (Career Anxiety)
                </option>
              </select>
            </div>

            <p className="text-slate-300 mb-8">
              Click below to join the session with {psychologistConfig.name}.
              Please allow microphone access when prompted.
            </p>
            <Button
              onClick={handleJoinSession}
              className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-500 transition-all"
            >
              Join Session
            </Button>
          </div>
        </div>
      )}

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
          <ThreeJsModelViewer
            modelUrl={psychologistConfig.modelUrl}
            scale={2.0}
            backgroundColor="#0f172a"
            showControls={true}
            voicePlaying={audioPlaying}
            isProcessingVoice={isProcessing}
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

      {/* Listening Indicator */}
      {recording && !audioPlaying && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-16 flex flex-col items-center gap-2">
          <div
            className={`px-6 py-3 rounded-full text-lg font-medium flex items-center gap-2 transition-all duration-300 ${
              isUserSpeaking
                ? "bg-green-600 text-white scale-110 shadow-lg shadow-green-500/50"
                : "bg-red-600 bg-opacity-90 text-white animate-pulse"
            }`}
          >
            <Mic
              className={`h-5 w-5 ${isUserSpeaking ? "animate-bounce" : ""}`}
            />
            {isUserSpeaking ? "Voice Detected" : "Listening..."}
          </div>
          {isUserSpeaking && (
            <div className="text-xs text-green-400 font-mono">
              Speak clearly...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoCallSimple;
