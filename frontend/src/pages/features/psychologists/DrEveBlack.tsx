import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import { Mic, MicOff, StopCircle, Volume2, VolumeX, AlertTriangle, Heart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThreeDModelViewer } from '../../../components/ui/ThreeDModelViewer';
import { useLanguage } from '../../../contexts/LanguageContext';

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

const DrEveBlack: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-IN');
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [audioPlaying, setAudioPlaying] = useState<boolean>(false);
  const [transcripts, setTranscripts] = useState<Array<{role: 'user'|'assistant', text: string}>>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [safetyAlert, setSafetyAlert] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const languages = [
    { code: 'en-IN', name: 'English (India)' },
    { code: 'hi-IN', name: 'हिंदी (Hindi)' },
    { code: 'ta-IN', name: 'தமிழ் (Tamil)' }
  ];

  const startSession = async () => {
    // Redirect to video call page with psychologist and language parameters
    navigate(`/video-call?psychologist=eve_black_career&lang=${selectedLanguage}&consent=${consentGiven}`);
  };

  const connectWebSocket = () => {
    if (!session?.ws_url) return;

    setConnectionStatus('Connecting to AI service...');
    const ws = new WebSocket(session.ws_url);

    ws.onopen = () => {
      setWsConnected(true);
      setConnectionStatus('Connected to AI service');

      ws.send(JSON.stringify({
        type: 'init',
        token: session.ws_token
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'connection_established':
          setConnectionStatus(`Connected to Dr. Eve Black`);
          break;

        case 'final_transcript':
          addTranscript('user', message.data.text);
          break;

        case 'ai_text':
          addTranscript('assistant', message.data.text);
          if (message.data.text.includes('helpline') || message.data.text.includes('crisis')) {
            setSafetyAlert('Safety alert: Please consider reaching out to professional help.');
          }
          break;

        case 'ai_audio_chunk':
          setAudioPlaying(true);
          break;

        case 'tts_complete':
          setAudioPlaying(false);
          break;

        case 'error':
          alert(`Error: ${message.message}`);
          break;
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      setConnectionStatus('Disconnected from AI service');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
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
      alert('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
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

  const endSession = async () => {
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

    setSession(null);
    setWsConnected(false);
    setTranscripts([]);
    setConnectionStatus('');
    setSafetyAlert('');
  };

  const handleBargeIn = () => {
    if (wsRef.current && wsConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'barge_in'
      }));
    }
  };

  // Configuration for 3D models
  const psychologistConfig = {
    name: 'Dr. Eve Black',
    modelUrl: '/BLACK.glb', // Map to available 3D model
    specialty: 'Career Anxiety Specialist'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/video-conferencing')}
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Video Conferencing
          </Button>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('psychologist_pages.eve_black.title')}</h1>
          <p className="text-xl text-gray-600">{t('psychologist_pages.eve_black.subtitle')}</p>
          <p className="text-sm text-gray-500 mt-2">
            {t('psychologist_pages.eve_black.description')}
          </p>
        </header>

        {/* Session Control */}
        {!session && !wsConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Start AI Voice Session</CardTitle>
              <CardDescription>
                Connect with Dr. Eve Black for personalized career anxiety support through voice conversation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred Language</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
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
                  onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
                />
                <label htmlFor="consent" className="text-sm">
                  I consent to storing our conversation for improved personalized support
                </label>
              </div>

              <Button onClick={startSession} className="w-full" size="lg">
                Start Voice Session with Dr. Eve Black
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
                  <Heart className="w-6 h-6 text-blue-600" />
                  Session with Dr. Eve Black
                </CardTitle>
                <CardDescription>
                  Career Anxiety Support | Language: {selectedLanguage} | Status: {' '}
                  <Badge variant={wsConnected ? 'default' : 'secondary'}>
                    {connectionStatus || (wsConnected ? 'Connected' : 'Connecting...')}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!wsConnected ? (
                  <Button onClick={connectWebSocket} className="w-full">
                    Connect to Dr. Eve Black
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={recording ? stopRecording : startRecording}
                      variant={recording ? 'destructive' : 'default'}
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
                      <Volume2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm">
                      {audioPlaying ? 'Dr. Eve Black is speaking...' : 'Waiting for your response'}
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
                      Interact with Dr. Eve Black's 3D avatar during your conversation
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
                    <CardTitle>Your Conversation with Dr. Eve Black</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {transcripts.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          Start speaking to begin your conversation with Dr. Eve Black...
                        </p>
                      ) : (
                        transcripts.map((transcript, index) => (
                          <div
                            key={index}
                            className={`flex ${transcript.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                transcript.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                              }`}
                            >
                              <p className="text-sm font-medium mb-1">
                                {transcript.role === 'assistant' ? 'Dr. Eve Black:' : 'You:'}
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
                  <CardTitle>Your Conversation with Dr. Eve Black</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transcripts.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Start speaking to begin your conversation with Dr. Eve Black...
                      </p>
                    ) : (
                      transcripts.map((transcript, index) => (
                        <div
                          key={index}
                          className={`flex ${transcript.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              transcript.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            }`}
                          >
                            <p className="text-sm font-medium mb-1">
                              {transcript.role === 'assistant' ? 'Dr. Eve Black:' : 'You:'}
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

export default DrEveBlack;
