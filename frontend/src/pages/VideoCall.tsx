import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ThreeDModelViewer } from '../components/ui/ThreeDModelViewer';
import * as faceapi from 'face-api.js';

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

const VideoCall: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionResponse | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [transcripts, setTranscripts] = useState<Array<{role: 'user'|'assistant', text: string}>>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');

  // Video and face analysis state
  const [videoEnabled, setVideoEnabled] = useState<boolean>(true);
  const [faceDetectionReady, setFaceDetectionReady] = useState<boolean>(false);
  const [emotionData, setEmotionData] = useState<any>(null);
  const [emotionHistory, setEmotionHistory] = useState<any[]>([]);

  const psychologistId = searchParams.get('psychologist') || 'eve_black_career';
  const selectedLanguage = searchParams.get('lang') || 'en-IN';

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emotionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Psychologist configuration
  const getPsychologistConfig = (id: string) => {
    const configs = {
      'eve_black_career': {
        name: 'Dr. Eve Black',
        modelUrl: '/ALICE.glb',
        specialty: 'Career Anxiety Specialist'
      },
      'carol_white_relationships': {
        name: 'Dr. Carol White',
        modelUrl: '/SARAH.glb',
        specialty: 'Relationships Problems Specialist'
      },
      'alice_johnson_academic': {
        name: 'Dr. Alice Johnson',
        modelUrl: '/BLACK.glb',
        specialty: 'Academic Stress Specialist'
      }
    };
    return configs[id] || configs['eve_black_career'];
  };

  const psychologistConfig = getPsychologistConfig(psychologistId);

  useEffect(() => {
    initializeFaceDetection();
    startSession();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
    };
  }, []);

  // Initialize face detection models (optional - won't block app if fails)
  const initializeFaceDetection = async () => {
    try {
      console.log('Initializing face detection (optional)...');

      // Check if models directory exists first
      const modelPaths = [
        '/models/tiny_face_detector_model-weights_manifest.json',
        '/models/face_landmark_68_model-weights_manifest.json',
        '/models/face_recognition_model-weights_manifest.json',
        '/models/face_expression_model-weights_manifest.json'
      ];

      const responses = await Promise.allSettled(
        modelPaths.map(path => fetch(path, { method: 'HEAD' }))
      );

      const missingModels = responses.filter(r => r.status === 'rejected').length;

      if (missingModels > 0) {
        console.warn('Face detection models not found. Skipping face analysis.');
        setFaceDetectionReady(false);
        return;
      }

      // Try to load models if they exist
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      ]);

      setFaceDetectionReady(true);
      console.log('✅ Face detection models loaded successfully');

      // Start emotion analysis if video is enabled
      if (videoEnabled) {
        startVideoAndAnalysis();
      }
    } catch (error) {
      console.warn('⚠️ Face detection unavailable:', error.message);
      setFaceDetectionReady(false);

      // Still start video if camera is available (without face analysis)
      if (videoEnabled) {
        // Video will start later when user clicks video button
        console.log('Video enabled - will start when user clicks video button');
      }
    }
  };

  // Start video and emotion analysis
  const startVideoAndAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false // Audio handled separately
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Start emotion analysis
        emotionIntervalRef.current = setInterval(async () => {
          if (faceDetectionReady && videoRef.current && canvasRef.current) {
            const detections = await faceapi
              .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceExpressions();

            if (detections && detections.length > 0) {
              const faceExpression = detections[0].expressions;
              const emotionData = {
                happy: faceExpression.happy || 0,
                neutral: faceExpression.neutral || 0,
                angry: faceExpression.angry || 0,
                fearful: faceExpression.fearful || 0,
                disgusted: faceExpression.disgusted || 0,
                sad: faceExpression.sad || 0,
                surprised: faceExpression.surprised || 0,
                timestamp: new Date().toISOString(),
                session_id: session?.session_id || null
              };

              setEmotionData(emotionData);
              setEmotionHistory(prev => [...prev.slice(-9), emotionData]); // Keep last 10 readings

              // Send to backend for analysis
              sendEmotionData(emotionData);
            }
          }
        }, 2000); // Analyze every 2 seconds
      }
    } catch (error) {
      console.error('Error starting video:', error);
      setVideoEnabled(false);
    }
  };

  // Send emotion data to backend
  const sendEmotionData = async (emotionData: any) => {
    if (!session?.session_id) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      await fetch(`${apiBaseUrl}/api/emotions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          emotions: emotionData,
          user_id: 1 // Would typically get from auth context
        })
      });
    } catch (error) {
      console.error('Error sending emotion data:', error);
    }
  };

  // Toggle video/camera
  const toggleVideo = () => {
    if (videoEnabled) {
      // Stop video
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
      setVideoEnabled(false);
    } else {
      // Start video
      startVideoAndAnalysis();
      setVideoEnabled(true);
    }
  };

  const startSession = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/api/sessions/start/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: psychologistId,
          lang: selectedLanguage,
          consent_store: true
        })
      });

      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
        connectWebSocket(sessionData);
      } else {
        const error = await response.json();
        alert(`Session creation failed: ${error.error}`);
        navigate('/dashboard/video-conferencing');
      }
    } catch (error) {
      console.error('Session creation error:', error);
      alert('Failed to create session');
      navigate('/dashboard/video-conferencing');
    }
  };

  const connectWebSocket = (sessionData: SessionResponse) => {
    setConnectionStatus('Connecting to AI service...');
    const ws = new WebSocket(sessionData.ws_url);

    ws.onopen = () => {
      setWsConnected(true);
      setConnectionStatus(`Connected to ${psychologistConfig.name}`);

      // Send initial authentication message with token
      ws.send(JSON.stringify({
        token: sessionData.ws_token,
        agent_id: psychologistId,
        lang: selectedLanguage
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'connection_established':
          setConnectionStatus(`Connected to ${psychologistConfig.name}`);
          break;
        case 'final_transcript':
          addTranscript('user', message.data.text);
          break;
        case 'ai_text':
          addTranscript('assistant', message.data.text);
          break;
        case 'ai_audio_chunk':
          setAudioPlaying(true);
          break;
        case 'tts_complete':
          setAudioPlaying(false);
          break;
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      setConnectionStatus('Disconnected from AI service');
    };

    ws.onerror = (error) => {
      setWsConnected(false);
      setConnectionStatus('Connection error');
    };

    wsRef.current = ws;
  };

  const addTranscript = (role: 'user'|'assistant', text: string) => {
    setTranscripts(prev => [...prev, { role, text }]);
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
        stream.getTracks().forEach(track => track.stop());
        if (audioChunksRef.current.length > 0) {
          sendAudioData(audioChunksRef.current);
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.start();
      setRecording(true);
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error('Recording error:', error);
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
    const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
    const reader = new FileReader();

    reader.onload = () => {
      const base64Audio = (reader.result as string).split(',')[1];

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'audio_chunk',
          audio_data: base64Audio
        }));

        wsRef.current.send(JSON.stringify({
          type: 'user_utterance_end'
        }));
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  const handleEndCall = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      await fetch(`${apiBaseUrl}/api/sessions/end/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session?.session_id
        })
      });
    } catch (error) {
      console.error('Session end error:', error);
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    navigate('/dashboard/session-summarizer');
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex flex-col relative">
      {/* Header with connection status */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2">
          <p className="text-white text-sm font-medium">{psychologistConfig.name}</p>
          <p className="text-gray-300 text-xs">{psychologistConfig.specialty}</p>
        </div>
        <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2">
          <p className={`text-xs ${wsConnected ? 'text-green-400' : 'text-yellow-400'}`}>
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

      {/* Debug Info - Remove this after testing */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs">
        <div>Model: {psychologistConfig.modelUrl}</div>
        <div>Scale: 2.0</div>
        <div>Audio: {audioPlaying ? 'Playing' : 'Silent'}</div>
      </div>

      {/* Transcripts overlay */}
      {transcripts.length > 0 && (
        <div className="absolute bottom-20 left-4 right-4 max-w-2xl mx-auto">
          <div className="bg-black bg-opacity-70 rounded-lg p-4 max-h-40 overflow-y-auto">
            <p className="text-white text-sm mb-2">Last message:</p>
            <p className="text-gray-300 text-sm">
              {transcripts[transcripts.length - 1]?.role === 'assistant' ? psychologistConfig.name : 'You'}:
              {' '}{transcripts[transcripts.length - 1]?.text}
            </p>
          </div>
        </div>
      )}

      {/* User Video Feed (Hidden for emotion analysis) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="hidden"
        style={{ display: 'none' }}
      />
      <canvas
        ref={canvasRef}
        className="hidden"
        style={{ display: 'none' }}
      />

      {/* User's Camera Feed (Visible small preview) */}
      {videoEnabled && (
        <div className="absolute bottom-20 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{
              transform: 'scaleX(-1)', // Mirror video feed
            }}
          />
          {/* Live indicator dot */}
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Emotion Status Overlay */}
      {emotionData && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg p-3 text-white text-xs">
          <p className="font-medium mb-1">Emotion Analysis</p>
          <div className="space-y-1">
            <p>😊 Happy: {(emotionData.happy * 100).toFixed(0)}%</p>
            <p>😐 Neutral: {(emotionData.neutral * 100).toFixed(0)}%</p>
            <p>😟 Sad: {(emotionData.sad * 100).toFixed(0)}%</p>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <Button
          onClick={toggleRecording}
          variant={recording ? "destructive" : "default"}
          size="icon"
          disabled={!wsConnected}
          className="h-12 w-12 rounded-full"
        >
          {recording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>

        <Button
          onClick={toggleVideo}
          variant={videoEnabled ? "default" : "secondary"}
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          {videoEnabled ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
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
    </div>
  );
};

export default VideoCall;
