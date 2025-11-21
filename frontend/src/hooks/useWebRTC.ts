// frontend/src/hooks/useWebRTC.ts
import { useEffect, useRef, useState } from "react";

export interface WebRTCOptions {
  roomName: string;
  signalingUrl: string;
  localVideoRef?: React.RefObject<HTMLVideoElement>;
}

export function useWebRTC({ roomName, signalingUrl, localVideoRef }: WebRTCOptions) {
  const [connected, setConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    // Setup signaling WS
    const ws = new WebSocket(`${signalingUrl}/ws/webrtc/${roomName}/`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (!pcRef.current) return;

      if (data.type === "offer") {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", answer }));
      } else if (data.type === "answer") {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (data.type === "ice-candidate") {
        try {
          await pcRef.current.addIceCandidate(data.candidate);
        } catch (e) {
          // ignore
        }
      }
    };

    // Setup peer connection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });
    pcRef.current = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Get local media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (localVideoRef && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    });

    // Cleanup
    return () => {
      ws.close();
      pc.close();
    };
  }, [roomName, signalingUrl, localVideoRef]);

  // Start call (for initiator)
  const startCall = async () => {
    if (!pcRef.current || !wsRef.current) return;
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    wsRef.current.send(JSON.stringify({ type: "offer", offer }));
  };

  return { connected, remoteStream, startCall };
}
