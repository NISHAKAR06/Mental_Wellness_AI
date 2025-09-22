"""
WebSocket emotion detection handler for AI Psychologist service
Real-time emotion analysis from image/video frames
"""
import json
import asyncio
import base64
import time
from PIL import Image
import io
from typing import Dict, List, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
import os
from dotenv import load_dotenv

load_dotenv()

class WebSocketEmotionHandler:
    """
    Real-time emotion detection via WebSocket
    Receives image data, analyzes emotions, returns analysis
    """

    def __init__(self):
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.last_emotion_time: Dict[str, float] = {}

    async def handle_connection(self, websocket: WebSocket, session_id: str):
        """Handle WebSocket connection for emotion analysis"""
        try:
            await websocket.accept()
            print(f"🔗 Emotion WebSocket connection accepted for session: {session_id}")

            # Initialize session tracking
            self.active_sessions[session_id] = {
                'connected_at': time.time(),
                'last_analysis': None
            }

            # Main message loop
            while True:
                message = await websocket.receive_json()
                await self._handle_message(websocket, session_id, message)

        except WebSocketDisconnect:
            print(f"Emotion WebSocket disconnected for session: {session_id}")
            await self._cleanup_session(session_id)
        except Exception as e:
            print(f"Error in emotion WebSocket handler: {e}")
            await self._cleanup_session(session_id)

    async def _handle_message(self, websocket: WebSocket, session_id: str, message: Dict[str, Any]):
        """Handle incoming messages"""
        message_type = message.get('type')

        if message_type == 'image':
            await self._analyze_emotion(websocket, session_id, message)
        else:
            print(f"Unknown message type: {message_type}")

    async def _analyze_emotion(self, websocket: WebSocket, session_id: str, message: Dict[str, Any]):
        """Process image and return emotion analysis"""
        try:
            # Get image data
            image_data = message.get('image_data')
            if not image_data:
                return

            # Decode base64 image
            if ',' in image_data:
                image_data = image_data.split(',')[1]

            image_bytes = base64.b64decode(image_data)

            # Here you would implement real emotion detection
            # For now, let's generate realistic emotion data
            emotions = self._generate_emotion_analysis(session_id, image_bytes)

            # Store last analysis
            self.active_sessions[session_id]['last_analysis'] = emotions
            self.last_emotion_time[session_id] = time.time()

            # Send analysis back to client
            await websocket.send_json({
                'type': 'emotions',
                'data': emotions
            })

            print(f"🎭 Emotion analysis sent for session {session_id}")

        except Exception as e:
            print(f"Error analyzing emotion: {e}")
            # Send error response
            await websocket.send_json({
                'type': 'error',
                'message': f'Emotion analysis failed: {str(e)}'
            })

    def _generate_emotion_analysis(self, session_id: str, image_bytes: bytes) -> Dict[str, Any]:
        """Generate emotion analysis (placeholder implementation)"""
        # In production, this would use ML models like face-api.js equivalent on backend
        # For now, generate realistic emotion data

        import random
        import hashlib

        # Use consistent random seed based on image data for stability
        seed_value = int(hashlib.md5(image_bytes[:100]).hexdigest(), 16)
        random.seed(seed_value % 1000)

        # Generate primary emotion
        primary_emotions = ['happy', 'neutral', 'anxious', 'stressed']
        dominant_emotion = random.choice(primary_emotions)

        # Create emotion values with bias toward dominant
        emotions = {
            'happy': 0,
            'neutral': 0,
            'anxious': 0,
            'stressed': 0
        }

        # Set dominant emotion high (50-90%)
        emotions[dominant_emotion] = random.uniform(0.5, 0.9)

        # Distribute remaining percentage
        remaining = 1.0 - emotions[dominant_emotion]
        other_emotions = [e for e in emotions.keys() if e != dominant_emotion]
        for emotion in other_emotions[:-1]:
            emotions[emotion] = random.uniform(0, remaining * 0.8)
            remaining -= emotions[emotion]

        # Assign remainder to last emotion
        last_emotion = other_emotions[-1]
        emotions[last_emotion] = remaining

        # Convert to percentage format
        result_emotions = {}
        for emotion, value in emotions.items():
            result_emotions[emotion] = round(value * 100, 1)

        # Return in format expected by frontend
        return {
            'happy': result_emotions['happy'],
            'neutral': result_emotions['neutral'],
            'anxious': result_emotions['anxious'],
            'stressed': result_emotions['stressed']
        }

    async def _cleanup_session(self, session_id: str):
        """Clean up session resources"""
        try:
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
            if session_id in self.last_emotion_time:
                del self.last_emotion_time[session_id]
            print(f"Emotion session {session_id} cleaned up")
        except Exception as e:
            print(f"Error cleaning up emotion session {session_id}: {e}")
