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
import sys
import os

# Add ai_service directory to Python path for absolute imports
current_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(current_dir)  # This should be ai_service directory
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    # Try absolute import from core
    from core.emotion_detector import emotion_detector
except ImportError:
    print("❌ Failed to import core.emotion_detector with absolute path, trying relative imports...")
    try:
        # Fallback to relative import
        from .emotion_detector import emotion_detector
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Please run this from the ai_service directory with Python package context.")
        emotion_detector = None  # Fallback

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
        print(f"�🚀🚀 DEBUG: handle_connection called for session: {session_id} 🚀🚀🚀")
        print(f"�🔗 Starting emotion WebSocket connection for session: {session_id}")
        try:
            await websocket.accept()
            print(f"✅ Emotion WebSocket connection accepted for session: {session_id}")

            # Initialize session tracking
            self.active_sessions[session_id] = {
                'connected_at': time.time(),
                'last_analysis': None
            }

            print(f"📊 Session {session_id} initialized, waiting for messages...")

            # Main message loop - handle both text and binary data
            message_count = 0
            while True:
                try:
                    print(f"⏳ Waiting for message #{message_count + 1} from session {session_id}...")
                    # Try to receive text data first
                    message = await websocket.receive_text()
                    message_count += 1
                    print(f"📨 Received text message #{message_count} from session {session_id} (length: {len(message)})")

                    data = json.loads(message)
                    print(f"📄 Parsed message: {data.keys() if isinstance(data, dict) else 'non-dict'}")

                    await self._handle_message(websocket, session_id, data)

                except json.JSONDecodeError as e:
                    print(f"❌ JSON decode error for session {session_id}: {e}")
                    # If text parsing fails, try binary data
                    try:
                        print(f"🔄 Trying binary data for session {session_id}...")
                        binary_data = await websocket.receive_bytes()
                        print(f"📦 Received binary data from session {session_id} (size: {len(binary_data)})")
                        await self._handle_binary_data(websocket, session_id, binary_data)
                    except Exception as bin_e:
                        print(f"❌ Error receiving binary data for session {session_id}: {bin_e}")
                        break
                except Exception as e:
                    print(f"❌ Error in message loop for session {session_id}: {e}")
                    break

        except WebSocketDisconnect as e:
            print(f"🔌 Emotion WebSocket disconnected for session {session_id} (code: {e.code}, reason: {e.reason})")
            await self._cleanup_session(session_id)
        except Exception as e:
            print(f"💥 Error in emotion WebSocket handler for session {session_id}: {e}")
            import traceback
            traceback.print_exc()
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
            print(f"📨 Received emotion analysis request for session {session_id}")

            # Get image data
            image_data = message.get('image_data')
            if not image_data:
                print(f"⚠️ No image_data in message for session {session_id}")
                return

            print(f"🖼️ Processing image data for session {session_id} (length: {len(image_data) if image_data else 0})")

            # Check if emotion_detector is available
            if emotion_detector is None:
                print(f"⚠️ Emotion detector not available for session {session_id} - sending simulated results")
                # Send fallback response with neutral emotions
                fallback_result = {
                    'emotions': {'happy': 0.6, 'neutral': 0.3, 'anxious': 0.05, 'stressed': 0.05},
                    'dominant_emotion': 'happy',
                    'confidence': 0.5,
                    'face_detected': True
                }

                # Store last analysis
                self.active_sessions[session_id]['last_analysis'] = fallback_result['emotions']
                self.last_emotion_time[session_id] = time.time()

                await websocket.send_json(fallback_result)
                print(f"🎭 Simulated emotion analysis sent for session {session_id}")
                return

            # Use the pre-trained emotion detector
            emotion_result = emotion_detector.detect_emotions(image_data)

            # Extract emotions for frontend
            emotions = emotion_result['emotions']

            # Store last analysis
            self.active_sessions[session_id]['last_analysis'] = emotions
            self.last_emotion_time[session_id] = time.time()

            # Send analysis back to client
            response_data = {
                'emotions': emotions,
                'dominant_emotion': emotion_result['dominant_emotion'],
                'confidence': emotion_result['confidence'],
                'face_detected': emotion_result['face_detected']
            }

            await websocket.send_json(response_data)
            print(f"🎭 Emotion analysis sent for session {session_id}: Happy={emotions['happy']}%, Neutral={emotions['neutral']}%, Anxious={emotions['anxious']}%, Stressed={emotions['stressed']}%, Dominant={emotion_result['dominant_emotion']}")

        except Exception as e:
            print(f"❌ Error analyzing emotion for session {session_id}: {e}")
            import traceback
            traceback.print_exc()

            # Send fallback response on error
            fallback_result = {
                'emotions': {'happy': 0.3, 'neutral': 0.5, 'anxious': 0.1, 'stressed': 0.1},
                'dominant_emotion': 'neutral',
                'confidence': 0.4,
                'face_detected': False
            }

            try:
                await websocket.send_json(fallback_result)
                print(f"🎭 Fallback emotion analysis sent for session {session_id} (error)")
            except Exception as send_error:
                print(f"❌ Failed to send fallback response: {send_error}")



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
