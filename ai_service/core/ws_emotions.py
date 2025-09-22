"""
WebSocket emotion detection handler for AI Psychologist service
Real-time emotion analysis from image/video frames using pre-trained ML models
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
import logging
from dotenv import load_dotenv

# Import the emotion detector - robust import for deployment
try:
    # Try relative import first (when run as package)
    from .emotion_detector import emotion_detector
except ImportError:
    try:
        # Try absolute import (when run directly)
        from ai_service.core.emotion_detector import emotion_detector
    except ImportError:
        # Final fallback - add parent directory to path and import
        import sys
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)
        from emotion_detector import emotion_detector

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

            # Main message loop - handle both text and binary data
            while True:
                try:
                    # Try to receive text data first
                    message = await websocket.receive_text()
                    data = json.loads(message)
                    await self._handle_message(websocket, session_id, data)
                except json.JSONDecodeError:
                    # If text parsing fails, try binary data
                    try:
                        binary_data = await websocket.receive_bytes()
                        await self._handle_binary_data(websocket, session_id, binary_data)
                    except Exception as e:
                        print(f"Error receiving data: {e}")
                        break
                except Exception as e:
                    print(f"Error in message loop: {e}")
                    break

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

    async def _handle_binary_data(self, websocket: WebSocket, session_id: str, binary_data: bytes):
        """Handle binary image data"""
        try:
            # Convert binary data to base64 for processing
            image_data = base64.b64encode(binary_data).decode('utf-8')

            # Create message format expected by _analyze_emotion
            message = {
                'type': 'image',
                'image_data': f'data:image/jpeg;base64,{image_data}'
            }

            await self._analyze_emotion(websocket, session_id, message)

        except Exception as e:
            print(f"Error handling binary data: {e}")
            await websocket.send_json({
                'type': 'error',
                'message': f'Binary data processing failed: {str(e)}'
            })

    async def _analyze_emotion(self, websocket: WebSocket, session_id: str, message: Dict[str, Any]):
        """Process image and return emotion analysis using pre-trained ML models"""
        try:
            # Get image data
            image_data = message.get('image_data')
            if not image_data:
                return

            # Use the pre-trained emotion detector
            emotion_result = emotion_detector.detect_emotions(image_data)

            # Extract emotions for frontend
            emotions = emotion_result['emotions']

            # Store last analysis
            self.active_sessions[session_id]['last_analysis'] = emotions
            self.last_emotion_time[session_id] = time.time()

            # Send analysis back to client
            await websocket.send_json({
                'emotions': emotions,
                'dominant_emotion': emotion_result['dominant_emotion'],
                'confidence': emotion_result['confidence'],
                'face_detected': emotion_result['face_detected']
            })

            print(f"🎭 ML Emotion analysis sent for session {session_id}: Happy={emotions['happy']}%, Neutral={emotions['neutral']}%, Anxious={emotions['anxious']}%, Stressed={emotions['stressed']}%, Dominant={emotion_result['dominant_emotion']}")

        except Exception as e:
            print(f"Error analyzing emotion with ML model: {e}")
            # Send error response
            await websocket.send_json({
                'type': 'error',
                'message': f'Emotion analysis failed: {str(e)}'
            })



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
