import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Mic,
  MicOff,
  StopCircle,
  Volume2,
  VolumeX,
  AlertTriangle,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThreeDModelViewer } from "../../../components/ui/ThreeDModelViewer";
import { useLanguage } from "../../../contexts/LanguageContext";
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

const DrAliceJohnson: React.FC = () => {
  // Face emotion detection state
  const [emotionData, setEmotionData] = useState<any>(null);
  const [faceDetectionReady, setFaceDetectionReady] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const emotionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-IN");
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [transcripts, setTranscripts] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [safetyAlert, setSafetyAlert] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const languages = [
    { code: "en-IN", name: "English (India)" },
    { code: "hi-IN", name: "हिंदी (Hindi)" },
    { code: "ta-IN", name: "தமிழ் (Tamil)" },
  ];

  // Load face-api.js models and start video/emotion analysis
  useEffect(() => {
    const loadModelsAndStart = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceExpressionNet.loadFromUri("/models"),
        ]);
        setFaceDetectionReady(true);

        // Start webcam for face analysis
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Analyze emotions every 2 seconds
        emotionIntervalRef.current = setInterval(async () => {
          let facialEmotion = null;
          if (videoRef.current && faceDetectionReady) {
            const detections = await faceapi
              .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceExpressions();

            if (detections && detections.length > 0) {
              const faceExpression = detections[0].expressions;
              facialEmotion = {
                happy: faceExpression.happy || 0,
                neutral: faceExpression.neutral || 0,
                angry: faceExpression.angry || 0,
                fearful: faceExpression.fearful || 0,
                disgusted: faceExpression.disgusted || 0,
                sad: faceExpression.sad || 0,
                surprised: faceExpression.surprised || 0,
                timestamp: new Date().toISOString(),
              };
              setEmotionData(facialEmotion);
            }
          }

          // Fetch voice emotion (dummy, as we don't have live audio here)
          let voiceEmotion = null;
          try {
            // You would send a short audio sample here; for now, just fetch dummy
            const apiBaseUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8001';
            const resp = await fetch(`${apiBaseUrl}/voice-emotion`, {
              method: "POST",
              body: new FormData(), // Should append audio file in real use
            });
            if (resp.ok) {
              voiceEmotion = await resp.json();
            }
          } catch (err) {
            // Ignore errors for now
          }

          // Send combined emotion state to backend via WebSocket if connected
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "emotion_state",
                facial: facialEmotion,
                vocal: voiceEmotion,
                timestamp: new Date().toISOString(),
              })
            );
          }
        }, 2000);
      } catch (err) {
        setFaceDetectionReady(false);
      }
    };

    loadModelsAndStart();

    return () => {
      if (emotionIntervalRef.current) clearInterval(emotionIntervalRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const startSession = async () => {
    // Redirect to video call page with psychologist and language parameters
    navigate(
      `/video-call?psychologist=alice_johnson_academic&lang=${selectedLanguage}&consent=${consentGiven}`
    );
  };

  const connectWebSocket = () => {
    if (!session?.ws_url) return;

    setConnectionStatus("Connecting to AI service...");
    const ws = new WebSocket(session.ws_url);

    ws.onopen = () => {
      setWsConnected(true);
      setConnectionStatus("Connected to AI service");

      ws.send(
        JSON.stringify({
          type: "init",
          token: session.ws_token,
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "connection_established":
          setConnectionStatus(`Connected to Dr. Alice Johnson`);
          break;

        case "final_transcript":
          addTranscript("user", message.data.text);
          break;

        case "ai_text":
          addTranscript("assistant", message.data.text);
          if (
            message.data.text.includes("helpline") ||
            message.data.text.includes("crisis")
          ) {
            setSafetyAlert(
              "Safety alert: Please consider reaching out to professional help."
            );
          }
          break;

        case "ai_audio_chunk":
          setAudioPlaying(true);
          break;

        case "tts_complete":
          setAudioPlaying(false);
          break;

        case "error":
          alert(`Error: ${message.message}`);
          break;
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      setConnectionStatus("Disconnected from AI service");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
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

      // Streaming STT logic
      const [partialTranscript, setPartialTranscript] = useState<string>("");

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const apiBaseUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8001';
          const formData = new FormData();
          formData.append('audio_chunk', event.data, 'chunk.webm');
          try {
            const resp = await fetch(`${apiBaseUrl}/stream/stt`, {
              method: 'POST',
              body: formData
            });
            if (resp.ok) {
              const data = await resp.json();
              if (data.partial_text) {
                setPartialTranscript(data.partial_text);
              }
            }
          } catch (err) {
            // Ignore errors for now
          }
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200); // 200ms chunks
      setRecording(true);
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error("Recording error:", error);
      alert("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
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

  const endSession = async () => {
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      await fetch(`${apiBaseUrl}/api/sessions/end/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    setSession(null);
    setWsConnected(false);
    setTranscripts([]);
    setConnectionStatus("");
    setSafetyAlert("");
  };

  const handleBargeIn = () => {
    if (wsRef.current && wsConnected) {
      wsRef.current.send(
        JSON.stringify({
          type: "barge_in",
        })
      );
    }
  };

  // Configuration for 3D models
  const psychologistConfig = {
    name: "Dr. Alice Johnson",
    modelUrl: "/girl.glb", // Map to available 3D model
    specialty: "Academic Stress Specialist",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hidden video for face-api.js emotion detection */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ display: "none" }}
        />
        {/* Emotion status overlay */}
        {emotionData && (
          <div className="fixed top-4 left-4 bg-black bg-opacity-60 rounded-lg p-3 text-white text-xs z-50">
            <p className="font-medium mb-1">Emotion Analysis</p>
            <div className="space-y-1">
              <p>😊 Happy: {(emotionData.happy * 100).toFixed(0)}%</p>
              <p>😐 Neutral: {(emotionData.neutral * 100).toFixed(0)}%</p>
              <p>😟 Sad: {(emotionData.sad * 100).toFixed(0)}%</p>
            </div>
          </div>
        )}
        {/* Real-time emotion graph (simple bar) */}
        {emotionData && (
          <div className="fixed top-24 left-4 bg-white bg-opacity-80 rounded-lg p-2 shadow z-50 w-56">
            <div className="text-xs font-semibold mb-1 text-gray-700">Emotion Graph</div>
            {["happy", "neutral", "sad"].map((emo) => (
              <div key={emo} className="flex items-center mb-1">
                <span className="w-10 capitalize text-gray-600">{emo}</span>
                <div className="flex-1 bg-gray-200 rounded h-2 mx-2">
                  <div
                    className={`h-2 rounded ${emo === "happy"
                      ? "bg-green-400"
                      : emo === "neutral"
                      ? "bg-blue-300"
                      : "bg-yellow-400"
                    }`}
                    style={{ width: `${(emotionData[emo] * 100).toFixed(0)}%` }}
                  ></div>
                </div>
                <span className="w-8 text-right text-gray-700">{(emotionData[emo] * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}
        {/* Safety indicator (risk level) */}
        {safetyAlert && (
          <div className="fixed top-44 left-4 bg-red-600 text-white rounded-lg px-4 py-2 shadow z-50 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Safety Alert: {safetyAlert}</span>
          </div>
        )}
        <header className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/video-conferencing")}
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Video Conferencing
          </Button>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t("psychologist_pages.alice_johnson.title")}
          </h1>
          <p className="text-xl text-gray-600">
            {t("psychologist_pages.alice_johnson.subtitle")}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {t("psychologist_pages.alice_johnson.description")}
          </p>
        </header>

        {/* Session Control */}
        {!session && !wsConnected && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t("psychologist_pages.alice_johnson.session_title")}
              </CardTitle>
              <CardDescription>
                {t("psychologist_pages.alice_johnson.session_description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Preferred Language
                </label>
                <Select
                  value={selectedLanguage}
                  onValueChange={setSelectedLanguage}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) =>
                    setConsentGiven(checked as boolean)
                  }
                />
                <label htmlFor="consent" className="text-sm">
                  I consent to storing our conversation for improved
                  personalized support
                </label>
              </div>

              <Button onClick={startSession} className="w-full" size="lg">
                Start Voice Session with Dr. Alice Johnson
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active Session */}
        {session && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-6 h-6 text-green-600" />
                  Session with Dr. Alice Johnson
                </CardTitle>
                <CardDescription>
                  Academic Stress Support | Language: {selectedLanguage} |
                  Status:{" "}
                  <Badge variant={wsConnected ? "default" : "secondary"}>
                    {connectionStatus ||
                      (wsConnected ? "Connected" : "Connecting...")}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!wsConnected ? (
                  <Button onClick={connectWebSocket} className="w-full">
                    Connect to Dr. Alice Johnson
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={recording ? stopRecording : startRecording}
                      variant={recording ? "destructive" : "default"}
                      className="flex-1"
                    >
                      {recording ? (
                        <>
                          <MicOff className="w-4 h-4 mr-2" />
                          Stop Speaking
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Start Speaking
                        </>
                      )}
                    </Button>

                    <Button onClick={handleBargeIn} variant="outline">
                      <StopCircle className="w-4 h-4 mr-2" />
                      Barge In
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {audioPlaying ? (
                      <Volume2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm">
                      {audioPlaying
                        ? "Dr. Alice Johnson is speaking..."
                        : "Waiting for your response"}
                    </span>
                  </div>

                  <Button onClick={endSession} variant="destructive" size="sm">
                    End Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Safety Alerts */}
            {safetyAlert && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {safetyAlert}
                </AlertDescription>
              </Alert>
            )}

            {/* 3D Model Viewer & Conversation */}
            {wsConnected && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">3D Session View</CardTitle>
                    <CardDescription>
                      Interact with Dr. Alice Johnson's 3D avatar during your
                      conversation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative h-96 rounded-lg overflow-hidden">
                      <ThreeDModelViewer
                        modelUrl={psychologistConfig.modelUrl}
                        scale={1.8}
                        backgroundColor="#0f172a"
                        showControls={true}
                        voicePlaying={audioPlaying}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      Your Conversation with Dr. Alice Johnson
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {transcripts.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          Start speaking to begin your conversation with Dr.
                          Alice Johnson...
                        </p>
                      ) : (
                        transcripts.map((transcript, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              transcript.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                transcript.role === "user"
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-100 text-blue-800 border border-blue-300"
                              }`}
                            >
                              <p className="text-sm font-medium mb-1">
                                {transcript.role === "assistant"
                                  ? "Dr. Alice Johnson:"
                                  : "You:"}
                              </p>
                              <p className="text-sm">{transcript.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Conversation (when 3D model not shown) */}
            {!wsConnected && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Your Conversation with Dr. Alice Johnson
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transcripts.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Start speaking to begin your conversation with Dr. Alice
                        Johnson...
                      </p>
                    ) : (
                      transcripts.map((transcript, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            transcript.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              transcript.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-blue-100 text-blue-800 border border-blue-300"
                            }`}
                          >
                            <p className="text-sm font-medium mb-1">
                              {transcript.role === "assistant"
                                ? "Dr. Alice Johnson:"
                                : "You:"}
                            </p>
                            <p className="text-sm">{transcript.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DrAliceJohnson;
