import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const VideoCall: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    getCameraStream();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleEndCall = () => {
    navigate('/dashboard/session-summarizer');
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center relative">
      <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 border-2 border-gray-600 rounded-md">
        <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
      </div>
      <p className="text-white">3D Avatar will be displayed here.</p>
      <div className="absolute bottom-4 flex space-x-4">
        <Button onClick={() => setIsMuted(!isMuted)} variant="destructive" size="icon">
          {isMuted ? <MicOff /> : <Mic />}
        </Button>
        <Button onClick={() => setIsVideoOff(!isVideoOff)} variant="destructive" size="icon">
          {isVideoOff ? <VideoOff /> : <Video />}
        </Button>
        <Button onClick={handleEndCall} variant="destructive" size="icon">
          <Phone />
        </Button>
      </div>
    </div>
  );
};

export default VideoCall;
