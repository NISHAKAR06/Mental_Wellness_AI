"""
WebSocket voice pipeline handler for AI Psychologist service - FastAPI Implementation
Comprehensive voice session lifecycle, STT → Risk Check → LLM Reply → TTS Stream
Separate WebSocket from Django emotion monitoring for real-time efficiency
"""
import json
import asyncio
import uuid
import jwt
import requests
from typing import Dict, List, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
import base64
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
import io
import hashlib
from pathlib import Path

# Import directly since this may be run as a script, not a package
import sys
import os

# Add parent directory to Python path for absolute imports
current_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / '.env')

SERVICE_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_GOOGLE_CREDENTIALS = 'crafty-centaur-467514-r3-d220951b4070.json'


def _resolve_google_credentials_path(raw_path: Optional[str]) -> Optional[Path]:
    candidate_paths = []

    if raw_path:
        raw_candidate = Path(raw_path).expanduser()
        candidate_paths.append(raw_candidate)

        if not raw_candidate.is_absolute():
            candidate_paths.append((Path.cwd() / raw_candidate).resolve())
            candidate_paths.append((SERVICE_ROOT / raw_candidate).resolve())
            candidate_paths.append((SERVICE_ROOT / raw_candidate.name).resolve())

    candidate_paths.append((SERVICE_ROOT / DEFAULT_GOOGLE_CREDENTIALS).resolve())

    for candidate_path in candidate_paths:
        if candidate_path.exists():
            return candidate_path

    return None

try:
    from core.agents import get_agent
    from core.llm import generate_reply
    from core.risk import classify_risk, generate_safety_reply
    from core.memory import MemoryManager
    from core.emotion_integration import EmotionIntegrator
except ImportError:
    print("❌ Failed to import core modules with absolute paths, trying relative imports...")
    try:
        from .agents import get_agent
        from .llm import generate_reply
        from .risk import classify_risk, generate_safety_reply
        from .memory import MemoryManager
        from .emotion_integration import EmotionIntegrator
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Please run this from the ai_service directory with Python package context.")
        raise

# Google Cloud imports (loaded conditionally)
try:
    from google.cloud import speech_v1 as speech
    try:
        from google.cloud import texttospeech_v1 as texttospeech
        # Check if enums exists
        hasattr(texttospeech, 'enums')
        GOOGLE_CLOUD_AVAILABLE = True
        print("✅ Google Cloud libraries available")
    except (ImportError, AttributeError) as e:
        print(f"⚠️ Google Cloud TTS not fully available: {e}")
        GOOGLE_CLOUD_AVAILABLE = False
except ImportError:
    print("⚠️ Google Cloud libraries not available - using simulation mode")
    GOOGLE_CLOUD_AVAILABLE = False

# Voice integration settings from environment
ENABLE_REAL_SPEECH_TO_TEXT = os.getenv("ENABLE_REAL_SPEECH_TO_TEXT", "false").lower() == "true"
ENABLE_REAL_TEXT_TO_SPEECH = os.getenv("ENABLE_REAL_TEXT_TO_SPEECH", "false").lower() == "true"
FALLBACK_TO_DEMO_VOICE = os.getenv("FALLBACK_TO_DEMO_VOICE", "true").lower() == "true"

print(f"🎤 Real STT enabled: {ENABLE_REAL_SPEECH_TO_TEXT}")
print(f"🔊 Real TTS enabled: {ENABLE_REAL_TEXT_TO_SPEECH}")
print(f"🎭 Demo voice fallback: {FALLBACK_TO_DEMO_VOICE}")

class WebSocketVoiceHandler:
    """
    AI Psychologist WebSocket Handler - FastAPI Service (Port 8001)
    Separate from Django emotion monitoring for isolated voice processing.
    Handles STT → Risk Check → LLM Reply → TTS Stream pipeline.
    """

    def __init__(self):
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.audio_buffers: Dict[str, List[bytes]] = {}
        self.memory_managers: Dict[str, MemoryManager] = {}
        self.emotion_integrators: Dict[str, EmotionIntegrator] = {}
        self.tts_active: Dict[str, bool] = {}  # For barge-in functionality

        # Secret key for JWT validation (should match Django)
        self.secret_key = os.getenv("SECRET_KEY", "your-secret-key-here")
        if self.secret_key == "your-secret-key-here":
            print("⚠️ WARNING: Using default SECRET_KEY. Set actual secret key in production!")

        # Language configurations for STT and TTS (access enums safely)
        try:
            neutral_gender = texttospeech.enums.SsmlVoiceGender.NEUTRAL if hasattr(texttospeech, 'enums') else None
            female_gender = texttospeech.enums.SsmlVoiceGender.FEMALE if hasattr(texttospeech, 'enums') else None
        except:
            neutral_gender = None
            female_gender = None

        self.lang_configs = {
            'en-IN': {
                'stt': 'en-IN',
                'tts': neutral_gender,
                'voice_name': 'en-IN-Neural2-A' if GOOGLE_CLOUD_AVAILABLE else 'en-IN',
                'fallback_voice': 'en-IN-Standard-A'
            },
            'hi-IN': {
                'stt': 'hi-IN',
                'tts': female_gender,
                'voice_name': 'hi-IN-Standard-A' if GOOGLE_CLOUD_AVAILABLE else 'hi-IN',
                'fallback_voice': 'hi-IN-Standard-A'
            },
            'ta-IN': {
                'stt': 'ta-IN',
                'tts': female_gender,
                'voice_name': 'ta-IN-Standard-A' if GOOGLE_CLOUD_AVAILABLE else 'ta-IN',
                'fallback_voice': 'ta-IN-Standard-A'
            }
        }

        # Helpline information for safety responses
        self.helplines = {
            'en-IN': {
                'emergency': '112',
                'aasra': '9820466726',
                'icall': '9152987821',
                'kirann': '1800-599-0019'
            },
            'hi-IN': {
                'emergency': '112',
                'aasra': '9820466726',
                'icall': '9152987821',
                'kirann': '1800-599-0019'
            },
            'ta-IN': {
                'emergency': '112',
                'aasra': '9820466726',
                'icall': '9152987821',
                'kirann': '1800-599-0019'
            }
        }

        self.stt_phrase_hints = {
            'en-IN': [
                'academic stress',
                'assignment',
                'project',
                'deadline',
                'exam',
                'class',
                'presentation',
                'exam pressure',
                'feeling overwhelmed',
                'I am feeling stressed',
                'I need help',
            ],
            'hi-IN': [
                'परीक्षा',
                'असाइनमेंट',
                'प्रोजेक्ट',
                'डेडलाइन',
                'कक्षा',
                'तनाव',
                'मुझे मदद चाहिए',
            ],
            'ta-IN': [
                'தேர்வு',
                'பாடப்பணி',
                'திட்டம்',
                'காலக்கெடு',
                'வகுப்பு',
                'மனஅழுத்தம்',
                'எனக்கு உதவி வேண்டும்',
            ],
        }

    async def handle_voice_session_accepted(self, websocket: WebSocket, session_id: str):
        """Handle WebSocket voice session when connection is already accepted"""
        try:
            print(f"🔗 Starting voice session handler for: {session_id} (connection already accepted)")

            # Check if demo mode is enabled (allow unauthenticated connections)
            DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
            print(f"🔧 Demo mode enabled: {DEMO_MODE}")

            # Wait for initialization message from client
            try:
                init_message = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=10.0
                )
                print(f"📩 Received init message: {init_message}")

                # Validate the init message
                token = init_message.get('token')
                agent_id = init_message.get('agent_id') or init_message.get('preferred_agent')
                lang = init_message.get('lang', 'en-IN')
                
                # Default agent selection if none specified - FastAPI manages all agents
                if not agent_id:
                    agent_id = 'eve_black_career'  # Default professional counselor
                    print(f"🎯 No agent specified, FastAPI selecting default: {agent_id}")
                else:
                    print(f"🎯 Client requested agent: {agent_id}, FastAPI will handle this agent")

                if DEMO_MODE:
                    # Demo mode - skip JWT validation
                    print(f"🔓 Demo mode: Processing session for agent {agent_id}")
                    payload = {
                        'user_id': f'demo_user_{session_id}',
                        'session_id': session_id,
                        'session_type': 'video_call'
                    }
                else:
                    # Production mode - validate JWT token
                    if not token:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Authentication token required"
                        })
                        return

                    try:
                        payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
                        print(f"✅ JWT validated successfully for session {session_id}")
                        print(f"   User: {payload['user_id']}, Session Type: {payload.get('session_type', 'video_call')}")
                    except jwt.InvalidTokenError as e:
                        print(f"❌ JWT Validation Failed: {e}")
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Invalid token: {str(e)}"
                        })
                        return

                # Store session data with agent info
                self.active_sessions[session_id] = {
                    **payload,
                    'agent_id': agent_id,
                    'lang': lang,
                    'consent': True
                }

                # Initialize session components with FastAPI-managed agent
                session_data = self.active_sessions[session_id]
                agent_config = get_agent(session_data['agent_id'])
                print(f"🎯 Loaded AI agent: {agent_config.name} (Domain: {agent_config.domain})")

                # Initialize memory manager for this session
                self.memory_managers[session_id] = MemoryManager(
                    session_id=session_id,
                    consent_store=session_data['consent']
                )

                # Initialize emotion integrator if available
                if os.getenv("ENABLE_EMOTION_INTEGRATION", "true").lower() == "true" and EmotionIntegrator:
                    self.emotion_integrators[session_id] = EmotionIntegrator(session_data['user_id'])

                # Send connection confirmation with agent details
                await websocket.send_json({
                    "type": "connection_established",
                    "agent_name": agent_config.name,
                    "agent_domain": agent_config.domain,
                    "agent_languages": agent_config.languages,
                    "voice_prefs": agent_config.voice_prefs,
                    "demo_mode": DEMO_MODE
                })

                print(f"🎉 AI Conference session initialized: {agent_config.name}")

                # Send initial greeting from AI agent (AI speaks first in video call)
                greetings = {
                    'en-IN': f"Hello! I'm {agent_config.name}, your AI {agent_config.domain} specialist. I'm here to support you today. How are you feeling?",
                    'hi-IN': f"नमस्ते! मैं {agent_config.name} हूँ। मैं आज आपकी मदद करने के लिए यहाँ हूँ। आप कैसा महसूस कर रहे हैं?",
                    'ta-IN': f"வணக்கம்! நான் {agent_config.name}. இன்று உங்களுக்கு உதவ நான் இங்கு இருக்கிறேன். நீங்கள் எப்படி உணர்கிறீர்கள்?"
                }
                initial_greeting = getattr(agent_config, 'initial_greeting', None) or greetings.get(lang, greetings['en-IN'])

                print(f"🎤 AI Agent speaking first: {initial_greeting[:50]}...")
                await self._generate_ai_response_and_stream(websocket, session_id, initial_greeting)

            except asyncio.TimeoutError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Authentication timeout"
                })
                return

            # Main message loop - handle both text and binary messages
            while True:
                try:
                    # Wait for any message type
                    message = await websocket.receive()
                    
                    if "text" in message:
                        # Handle JSON text message
                        try:
                            data = json.loads(message["text"])
                            await self._handle_json_message(websocket, session_id, data)
                        except json.JSONDecodeError:
                            print(f"⚠️ Received invalid JSON: {message['text'][:50]}...")
                            
                    elif "bytes" in message:
                        # Handle binary audio message
                        await self._handle_binary_audio(websocket, session_id, message["bytes"])
                        
                    elif message.get("type") == "websocket.disconnect":
                        print(f"WebSocket disconnect signal received")
                        break
                        
                except WebSocketDisconnect:
                    print("WebSocket disconnected")
                    break
                except Exception as e:
                    print(f"❌ Error in message loop: {e}")
                    break

        except WebSocketDisconnect:
            print(f"WebSocket disconnected for session: {session_id}")
        except Exception as e:
            print(f"❌ Error in voice session handler: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await self._cleanup_session(session_id)

    async def handle_voice_session(self, websocket: WebSocket, session_id: str):
        """Handle WebSocket voice session after connection is already accepted"""
        try:
            print(f"🔗 Starting voice session handler for: {session_id}")

            # Check if demo mode is enabled (allow unauthenticated connections)
            DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
            print(f"🔧 Demo mode enabled: {DEMO_MODE}")

            # Wait for initialization message from client
            try:
                init_message = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=10.0
                )
                print(f"📩 Received init message: {init_message}")

                # Validate the init message
                token = init_message.get('token')
                agent_id = init_message.get('agent_id') or init_message.get('preferred_agent')
                lang = init_message.get('lang', 'en-IN')
                
                # Default agent selection if none specified - FastAPI manages all agents
                if not agent_id:
                    agent_id = 'eve_black_career'  # Default professional counselor
                    print(f"🎯 No agent specified, FastAPI selecting default: {agent_id}")
                else:
                    print(f"🎯 Client requested agent: {agent_id}, FastAPI will handle this agent")

                if DEMO_MODE:
                    # Demo mode - skip JWT validation
                    print(f"🔓 Demo mode: Processing session for agent {agent_id}")
                    payload = {
                        'user_id': f'demo_user_{session_id}',
                        'session_id': session_id,
                        'session_type': 'video_call'
                    }
                else:
                    # Production mode - validate JWT token
                    if not token:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Authentication token required"
                        })
                        return

                    try:
                        payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
                        print(f"✅ JWT validated successfully for session {session_id}")
                        print(f"   User: {payload['user_id']}, Session Type: {payload.get('session_type', 'video_call')}")
                    except jwt.InvalidTokenError as e:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Invalid token: {str(e)}"
                        })
                        return

                # Store session data with agent info
                self.active_sessions[session_id] = {
                    **payload,
                    'agent_id': agent_id,
                    'lang': lang,
                    'consent': True
                }

                # Initialize session components with FastAPI-managed agent
                session_data = self.active_sessions[session_id]
                agent_config = get_agent(session_data['agent_id'])
                print(f"🎯 Loaded AI agent: {agent_config.name} (Domain: {agent_config.domain})")

                # Initialize memory manager for this session
                self.memory_managers[session_id] = MemoryManager(
                    session_id=session_id,
                    consent_store=session_data['consent']
                )

                # Initialize emotion integrator if available
                if os.getenv("ENABLE_EMOTION_INTEGRATION", "true").lower() == "true" and EmotionIntegrator:
                    self.emotion_integrators[session_id] = EmotionIntegrator(session_data['user_id'])

                # Send connection confirmation with agent details
                await websocket.send_json({
                    "type": "connection_established",
                    "agent_name": agent_config.name,
                    "agent_domain": agent_config.domain,
                    "agent_languages": agent_config.languages,
                    "voice_prefs": agent_config.voice_prefs,
                    "demo_mode": DEMO_MODE
                })

                print(f"🎉 AI Conference session initialized: {agent_config.name}")

                # Send initial greeting from AI agent (AI speaks first in video call)
                greetings = {
                    'en-IN': f"Hello! I'm {agent_config.name}, your AI {agent_config.domain} specialist. I'm here to support you today. How are you feeling?",
                    'hi-IN': f"नमस्ते! मैं {agent_config.name} हूँ। मैं आज आपकी मदद करने के लिए यहाँ हूँ। आप कैसा महसूस कर रहे हैं?",
                    'ta-IN': f"வணக்கம்! நான் {agent_config.name}. இன்று உங்களுக்கு உதவ நான் இங்கு இருக்கிறேன். நீங்கள் எப்படி உணர்கிறீர்கள்?"
                }
                initial_greeting = getattr(agent_config, 'initial_greeting', None) or greetings.get(lang, greetings['en-IN'])

                print(f"🎤 AI Agent speaking first: {initial_greeting[:50]}...")
                await self._generate_ai_response_and_stream(websocket, session_id, initial_greeting)

            except asyncio.TimeoutError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Authentication timeout"
                })
                return

            # Main message loop - handle both text and binary messages
            while True:
                try:
                    # Try to receive as JSON first
                    try:
                        message = await asyncio.wait_for(websocket.receive_json(), timeout=0.1)
                        await self._handle_json_message(websocket, session_id, message)
                    except asyncio.TimeoutError:
                        # No JSON message, try binary audio
                        audio_chunk = await websocket.receive_bytes()
                        await self._handle_binary_audio(websocket, session_id, audio_chunk)
                except WebSocketDisconnect:
                    break

        except WebSocketDisconnect:
            print(f"WebSocket disconnected for session: {session_id}")
            await self._cleanup_session(session_id)
        except WebSocketDisconnect:
            print(f"WebSocket disconnected for session: {session_id}")
        except Exception as e:
            print(f"❌ Error in voice session handler: {e}")
        finally:
            # Clean up any resources if needed
            pass

    async def _handle_json_message(self, websocket: WebSocket, session_id: str, message: Dict[str, Any]):
        """Handle incoming JSON WebSocket messages"""
        message_type = message.get('type')

        if message_type == 'audio_chunk':
            # Handle base64-encoded audio data from frontend
            audio_data = message.get('audio_data')
            if audio_data:
                try:
                    # Decode base64 audio data to bytes
                    audio_bytes = base64.b64decode(audio_data)
                    await self._handle_binary_audio(websocket, session_id, audio_bytes)
                    print(f"📥 Received base64 audio chunk: {len(audio_bytes)} bytes")
                except Exception as e:
                    print(f"❌ Error decoding base64 audio: {e}")
        elif message_type == 'user_utterance_end':
            await self._process_utterance(websocket, session_id)
        elif message_type == 'no_speech_detected':
            await self._handle_no_speech(websocket, session_id)
        elif message_type == 'barge_in':
            await self._handle_barge_in(websocket, session_id)
        elif message_type == 'end_session':
            await self._end_session_gracefully(websocket, session_id)
        elif message_type == 'emotion_update':
            # Handle real-time emotion updates from frontend
            emotion_data = message.get('data')
            if emotion_data and session_id in self.emotion_integrators:
                # Update the emotion integrator with new data
                # We can manually inject it or just rely on the fact that we have the data now
                # Ideally EmotionIntegrator should have an update method, but for now let's store it in session
                self.active_sessions[session_id]['latest_emotion'] = emotion_data
                print(f"😊 Emotion update received for session {session_id}: {emotion_data.get('happy', 0):.2f} happy")
        else:
            print(f"Unknown message type: {message_type}")

    async def _handle_binary_audio(self, websocket: WebSocket, session_id: str, audio_chunk: bytes):
        """Handle incoming binary audio chunk"""
        try:
            # Store binary audio chunk directly
            if session_id not in self.audio_buffers:
                self.audio_buffers[session_id] = []
            self.audio_buffers[session_id].append(audio_chunk)

            print(f"Binary audio chunk received for session {session_id} ({len(audio_chunk)} bytes)")

        except Exception as e:
            print(f"Error handling binary audio chunk: {e}")

    async def _process_utterance(self, websocket: WebSocket, session_id: str):
        """Process user utterance after receiving end signal"""
        try:
            # Send processing notification to frontend
            await websocket.send_json({
                "type": "processing_voice",
                "message": "Processing your voice..."
            })

            session_data = self.active_sessions[session_id]
            agent_config = get_agent(session_data['agent_id'])
            lang = session_data['lang']

            # Combine all audio chunks
            if session_id not in self.audio_buffers or not self.audio_buffers[session_id]:
                await websocket.send_json({
                    "type": "error",
                    "message": "No audio data received"
                })
                return

            audio_chunks = self.audio_buffers[session_id]
            combined_audio = b''.join(audio_chunks)

            print(f"Processing utterance for session {session_id}: {len(combined_audio)} bytes total")

            # Clear buffer for next utterance
            self.audio_buffers[session_id] = []

            # Step 1: Speech-to-Text
            user_text = await self._speech_to_text(combined_audio, lang)

            if not user_text:
                print(f"⚠️ STT returned no text for session {session_id}, checking for visual cues...")
                await self._handle_no_speech(websocket, session_id)
                return

            # Send recognized text back to client
            await websocket.send_json({
                "type": "final_transcript",
                "data": {"text": user_text}
            })

            # Step 2: Risk Classification
            risk_result = classify_risk(user_text)

            # Step 3: Handle safety if needed
            if risk_result['risk_level'] in ['medium', 'high']:
                # Generate safety response instead of normal agent reply
                safety_reply = generate_safety_reply(risk_result['risk_level'], lang)

                # Send safety reply
                await websocket.send_json({
                    "type": "ai_text",
                    "data": {"text": safety_reply}
                })

                # Generate TTS (placeholder)
                await self._text_to_speech_and_stream(websocket, safety_reply, lang, agent_config.voice_prefs.get(lang))

                # Send safety alert to Django backend
                await self._send_safety_alert(
                    session_id,
                    risk_result['risk_level'],
                    f"Safety response triggered: {risk_result['reason']}"
                )

                return  # Skip normal reply flow

            # Step 4: Get emotion snapshot if available
            emotion_snapshot = None
            
            # First check if we have a direct WebSocket update
            if 'latest_emotion' in self.active_sessions[session_id]:
                emotion_snapshot = self.active_sessions[session_id]['latest_emotion']
                print(f"🎭 Using real-time emotion data from WebSocket: {emotion_snapshot}")
            # Fallback to integrator if available
            elif session_id in self.emotion_integrators:
                emotion_snapshot = self.emotion_integrators[session_id].get_latest_emotions()

            # Step 5: Get memory context
            memory_manager = self.memory_managers[session_id]
            conversation_history = memory_manager.get_context()

            # Step 6: Generate LLM response
            ai_reply = generate_reply(
                system_prompt=agent_config.build_prompt(lang, emotion_snapshot),
                user_text=user_text,
                memory_turns=conversation_history,
                emotion_snapshot=emotion_snapshot
            )

            if not ai_reply:
                ai_reply = "I'm sorry, I couldn't generate a response. Please try again."

            # Step 7: Update memory
            memory_manager.add_turn(user_text, ai_reply)

            # Step 8: Send reply to client
            await websocket.send_json({
                "type": "ai_text",
                "data": {"text": ai_reply}
            })

            # Step 9: Generate and stream TTS
            await self._text_to_speech_and_stream(websocket, ai_reply, lang, agent_config.voice_prefs.get(lang))

        except Exception as e:
            print(f"Error processing utterance: {e}")
            await websocket.send_json({
                "type": "error",
                "message": "Error processing your message"
            })

    async def _handle_barge_in(self, websocket: WebSocket, session_id: str):
        """Handle user interrupting current response"""
        try:
            # Stop backend TTS loop
            self.tts_active[session_id] = False
            
            # Clear any ongoing audio
            await websocket.send_json({
                "type": "stop_tts"
            })

            # Clear audio buffer to prevent processing
            self.audio_buffers[session_id] = []

            print(f"Barge-in handled for session {session_id}")

        except Exception as e:
            print(f"Error handling barge-in: {e}")

    async def _end_session_gracefully(self, websocket: WebSocket, session_id: str):
        """End session gracefully"""
        try:
            # Send session end confirmation
            await websocket.send_json({
                "type": "session_ended"
            })

            # Close WebSocket connection
            await websocket.close()

            # Cleanup session
            await self._cleanup_session(session_id)

        except Exception as e:
            print(f"Error ending session: {e}")

    async def _cleanup_session(self, session_id: str):
        """Clean up session resources"""
        try:
            # Remove from active sessions
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]

            # Clear audio buffers
            if session_id in self.audio_buffers:
                del self.audio_buffers[session_id]

            # Cleanup memory and emotion integrators
            if session_id in self.memory_managers:
                del self.memory_managers[session_id]

            if session_id in self.emotion_integrators:
                del self.emotion_integrators[session_id]

            print(f"Session {session_id} cleaned up")

        except Exception as e:
            print(f"Error cleaning up session {session_id}: {e}")

    async def _speech_to_text(self, audio_data: bytes, language: str) -> Optional[str]:
        """Google Speech-to-Text processing with utterance-based recognition"""
        try:
            print(f"🎤 Processing audio: {len(audio_data)} bytes, lang: {language}, demo: {FALLBACK_TO_DEMO_VOICE}")

            # Check if real STT is enabled, otherwise use demo mode
            if not ENABLE_REAL_SPEECH_TO_TEXT or not GOOGLE_CLOUD_AVAILABLE or len(audio_data) < 100:
                print(f"🎤 Using demo STT mode (real STT: {ENABLE_REAL_SPEECH_TO_TEXT}, Google Cloud: {GOOGLE_CLOUD_AVAILABLE})")

                if len(audio_data) < 500:
                    return "Testing speech recognition system"

                # Return different sample responses based on audio length and language
                sample_responses = {
                    'en-IN': [
                        "I'm feeling stressed about my upcoming exams",
                        "I need help managing my anxiety",
                        "Work is really overwhelming right now",
                        "I feel depressed and don't know what to do"
                    ],
                    'hi-IN': [
                        "मुझे अपनी परीक्षाओं पर बहुत दबाव महसूस हो रहा है",
                        "मैंने बहुत तनाव महसूस कर रहा हूँ",
                        "मुझे मदद चाहिए मानसिक स्वास्थ्य से संबंधित",
                        "काम बहुत ज्यादा कठिन हो गया है"
                    ],
                    'ta-IN': [
                        "எனக்கு வரவிருக்கும் தேர்வுகளில் அதிக அழுத்தம் உள்ளது",
                        "நான் மன அழுத்தம் உணர்ந்தேன்",
                        "எனக்கு உளவியல் ஆலோசனை தேவை",
                        "வேலை மிகவும் கடினமானது"
                    ]
                }

                responses_for_lang = sample_responses.get(language, sample_responses['en-IN'])
                sample_text = responses_for_lang[hash(audio_data[:50]) % len(responses_for_lang)]

                print(f"🎤 Demo STT: '{sample_text}' ({language})")
                return sample_text

            # Google STT configuration - utterance-based, not fully streaming
            client = speech.SpeechClient()

            # Convert audio to Google STT format
            audio = speech.RecognitionAudio(content=audio_data)

            # STT config for specified language
            lang_config = self.lang_configs.get(language, self.lang_configs['en-IN'])
            stt_lang = lang_config['stt']
            phrase_hints = self.stt_phrase_hints.get(stt_lang, self.stt_phrase_hints['en-IN'])

            alternative_languages = []
            if stt_lang == 'en-IN':
                alternative_languages = ['hi-IN']
            elif stt_lang == 'hi-IN':
                alternative_languages = ['en-IN']
            elif stt_lang == 'ta-IN':
                alternative_languages = ['en-IN']

            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=48000,  # Standard for WebRTC/WebM
                language_code=stt_lang,   # Use specific language from config
                enable_automatic_punctuation=True,
                enable_word_time_offsets=False,
                # Utterance-based recognition (non-streaming)
                model="latest_long",
                use_enhanced=True,
                max_alternatives=5,
                speech_contexts=[
                    speech.SpeechContext(
                        phrases=phrase_hints,
                        boost=15.0,
                    )
                ],
                adaptation=None,
                # Handle likely code-switching without widening the language search too much
                alternative_language_codes=alternative_languages,
            )

            # Perform speech recognition with timeout
            try:
                response = await asyncio.wait_for(
                    asyncio.get_event_loop().run_in_executor(
                        None,
                        lambda: client.recognize(config=config, audio=audio)
                    ),
                    timeout=30.0  # 30 second timeout for STT
                )
            except asyncio.TimeoutError:
                print("⚠️ STT request timed out")
                return f"Speech recognition timeout ({language})"

            # Extract the best transcript from all results instead of only the first one
            if response.results:
                segments: List[str] = []
                for result in response.results:
                    if not result.alternatives:
                        continue

                    best_alternative = max(
                        result.alternatives,
                        key=lambda alternative: getattr(alternative, 'confidence', 0.0) or 0.0,
                    )

                    segment_text = best_alternative.transcript.strip()
                    if segment_text:
                        segments.append(segment_text)

                transcript = ' '.join(segments).strip()
                if transcript:
                    print(f"✅ STT: '{transcript}' (language: {language})")
                    return transcript

            # No transcript found
            print("⚠️ STT: No speech detected")
            return None

        except Exception as e:
            print(f"❌ STT Error: {e}")
            # Fallback: return simulation text if STT fails
            return f"Speech recognition temporarily unavailable ({language})"

    def _create_wav_chunk(self, duration_sec: float) -> bytes:
        """Create a valid WAV byte string for a given duration of silence/tone"""
        import io
        import wave
        import math
        import struct
        
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wav:
            n_channels = 1
            sampwidth = 2
            framerate = 24000
            n_frames = int(framerate * duration_sec)
            
            wav.setparams((n_channels, sampwidth, framerate, n_frames, 'NONE', 'not compressed'))
            
            # Generate a simple sine wave tone (440Hz) so user hears something in demo mode
            # or just silence if preferred. Let's do a very quiet low hum to indicate "active"
            values = []
            for i in range(n_frames):
                # 200Hz tone, low volume
                value = int(3000 * math.sin(2 * math.pi * 200 * i / framerate))
                values.append(struct.pack('<h', value))
                
            wav.writeframes(b''.join(values))
            
        return buf.getvalue()

    async def _text_to_speech_and_stream(self, websocket: WebSocket, text: str, lang: str, specific_voice: str = None):
        """
        Google Text-to-Text processing with sentence-level chunking (1-3 MP3 chunks)
        Stream MP3 chunks for fast perceived response time
        """
        session_id = None
        for sid, data in self.active_sessions.items():
            if data.get('agent_id'):
                session_id = sid
                break

        try:
            if session_id and self.active_sessions.get(session_id):
                session_data = self.active_sessions[session_id]
                # Ensure we use the session language
                lang = session_data.get('lang', 'en-IN')

            # Stop any ongoing TTS for barge-in functionality
            if session_id:
                self.tts_active[session_id] = True

            # Prepare text for chunking
            sentences = self._split_into_sentences(text)
            chunks = self._chunk_sentences(sentences, max_chunks=3)  # Never more than 3 chunks

            # Get language-specific TTS configuration
            lang_config = self.lang_configs.get(lang, self.lang_configs['en-IN'])
            
            # Use specific voice if provided, otherwise default
            voice_name = specific_voice if specific_voice else lang_config['voice_name']

            print(f"🎵 Generating TTS in {lang} with {len(chunks)} chunks: {voice_name}")
            print(f"🔧 TTS Settings: ENABLE_REAL_TTS={ENABLE_REAL_TEXT_TO_SPEECH}, GOOGLE_CLOUD={GOOGLE_CLOUD_AVAILABLE}")

            if ENABLE_REAL_TEXT_TO_SPEECH and GOOGLE_CLOUD_AVAILABLE:
                print("✅ Using Real Google Cloud TTS")
                # Use Google TTS for production
                try:
                    # Set up Google Cloud credentials from environment or local default
                    creds_path = _resolve_google_credentials_path(os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
                    if creds_path:
                        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(creds_path)
                        print(f"✅ Google Cloud credentials set: {creds_path}")
                    else:
                        print(
                            "⚠️ Google Cloud credentials file not found. "
                            f"Checked env path and default file: {SERVICE_ROOT / DEFAULT_GOOGLE_CREDENTIALS}"
                        )
                    
                    client = texttospeech.TextToSpeechClient()
                    print("✅ Google TTS client created successfully")
                except Exception as e:
                    print(f"❌ Failed to create TTS client: {e}")
                    # Fall back to simulation mode
                    print("⚠️ Falling back to TTS simulation mode")
                    for i, chunk_text in enumerate(chunks):
                        # Generate valid WAV audio (approx duration based on text length)
                        duration = max(1.0, len(chunk_text.split()) * 0.3)
                        mock_audio = self._create_wav_chunk(duration)
                        audio_base64 = base64.b64encode(mock_audio).decode('utf-8')
                        
                        if websocket.client_state.name == 'CONNECTED':
                            await websocket.send_json({
                                "type": "ai_audio_chunk",
                                "data": {
                                    "audio_base64": audio_base64,
                                    "chunk_index": i,
                                    "total_chunks": len(chunks),
                                    "text": chunk_text,
                                    "simulation": True
                                }
                            })
                        await asyncio.sleep(0.2)
                    
                    if websocket.client_state.name == 'CONNECTED':
                        await websocket.send_json({"type": "tts_complete", "total_chunks": len(chunks)})
                    return

                # Prepare TTS requests for each chunk
                try:
                    tts_config = texttospeech.VoiceSelectionParams(
                        language_code=lang.split('-')[0] + '-' + lang.split('-')[1],  # en-IN, hi-IN, etc.
                        name=voice_name
                    )

                    audio_config = texttospeech.AudioConfig(
                        audio_encoding=texttospeech.AudioEncoding.MP3,
                        speaking_rate=0.9,  # Slightly slower for clarity
                        pitch=0.0,
                    )
                    print("✅ TTS configuration created successfully")
                except Exception as e:
                    print(f"❌ Failed to create TTS configuration: {e}")
                    return

                # Process each chunk
                for i, chunk_text in enumerate(chunks):
                    if session_id and not self.tts_active.get(session_id, True):
                        break  # Barge-in interrupt

                    # Check if WebSocket is still connected
                    if websocket.client_state.name != 'CONNECTED':
                        print(f"WebSocket disconnected during TTS generation")
                        break

                    # Generate TTS for this chunk
                    try:
                        synthesis_input = texttospeech.SynthesisInput(text=chunk_text)
                        print(f"🎵 Synthesizing chunk {i+1}/{len(chunks)}: '{chunk_text[:30]}...'")
                        
                        response = await asyncio.get_event_loop().run_in_executor(
                            None,
                            lambda: client.synthesize_speech(
                                input=synthesis_input,
                                voice=tts_config,
                                audio_config=audio_config
                            )
                        )
                        print(f"✅ Chunk {i+1} synthesized successfully ({len(response.audio_content)} bytes)")
                        
                    except Exception as e:
                        print(f"❌ TTS synthesis failed for chunk {i+1}: {e}")
                        # Skip this chunk and continue
                        continue

                    # Convert to base64 for WebSocket transport
                    audio_content = response.audio_content
                    audio_base64 = base64.b64encode(audio_content).decode('utf-8')

                    # Check again before sending
                    if websocket.client_state.name != 'CONNECTED':
                        print(f"WebSocket disconnected before sending chunk {i}")
                        break

                    # Stream chunk to client
                    await websocket.send_json({
                        "type": "ai_audio_chunk",
                        "data": {
                            "audio_base64": audio_base64,
                            "chunk_index": i,
                            "total_chunks": len(chunks),
                            "text": chunk_text  # For lip-sync if needed
                        }
                    })

                    # Small delay between chunks for natural speaking rhythm
                    await asyncio.sleep(min(0.05 * len(chunk_text.split()), 0.3))

            else:
                # Google TTS not available - simulation mode
                print("⚠️ Using TTS simulation mode")

                for i, chunk_text in enumerate(chunks):
                    if session_id and not self.tts_active.get(session_id, True):
                        break  # Barge-in interrupt

                    # Simulate TTS audio chunk with valid WAV
                    duration = max(1.0, len(chunk_text.split()) * 0.3)
                    mock_audio = self._create_wav_chunk(duration)
                    audio_base64 = base64.b64encode(mock_audio).decode('utf-8')

                    await websocket.send_json({
                        "type": "ai_audio_chunk",
                        "data": {
                            "audio_base64": audio_base64,
                            "chunk_index": i,
                            "total_chunks": len(chunks),
                            "text": chunk_text,
                            "simulation": True
                        }
                    })

                    # Simulated speaking delay
                    await asyncio.sleep(min(0.1 * len(chunk_text.split()), 0.5))

            # Mark TTS as complete
            if websocket.client_state.name == 'CONNECTED':
                await websocket.send_json({
                    "type": "tts_complete",
                    "total_chunks": len(chunks)
                })

        except Exception as e:
            print(f"❌ TTS Error: {e}")
            # Send error completion only if connected
            try:
                if websocket.client_state.name == 'CONNECTED':
                    await websocket.send_json({
                        "type": "tts_complete",
                        "error": str(e)
                    })
            except:
                pass

        finally:
            # Clear TTS active status
            if session_id:
                self.tts_active[session_id] = False

    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences for natural chunking"""
        # Simple sentence splitting - could be enhanced with NLTK
        sentences = []
        current = ""

        for char in text:
            current += char
            if char in '.!?\n':
                # Only split if we have actual content, ignore repeated punctuation
                if current.strip(char + " \n\t"):
                    sentences.append(current.strip())
                    current = ""
                elif char == '\n':
                    continue
                else:
                    # It's just punctuation, append to previous sentence if possible
                    if sentences:
                        sentences[-1] += char
                    current = ""

        if current.strip():
            sentences.append(current.strip())

        return sentences if sentences else [text]

    def _chunk_sentences(self, sentences: List[str], max_chunks: int = 3) -> List[str]:
        """Combine sentences into chunks (1-3 maximum)"""
        if not sentences:
            return []

        if len(sentences) <= max_chunks:
            # If we have fewer sentences than max chunks, use each sentence as a chunk
            return sentences

        # Combine sentences into balanced chunks
        total_sentences = len(sentences)
        base_chunk_size = total_sentences // max_chunks
        remainder = total_sentences % max_chunks

        chunks = []
        start_idx = 0

        for i in range(max_chunks):
            chunk_size = base_chunk_size + (1 if i < remainder else 0)
            end_idx = start_idx + chunk_size
            chunk_sentences = sentences[start_idx:end_idx]
            chunks.append(' '.join(chunk_sentences))
            start_idx = end_idx

        return chunks

    async def _send_safety_alert(self, session_id: str, risk_level: str, summary: str):
        """Send safety alert to Django backend"""
        try:
            session_data = self.active_sessions[session_id]
            django_url = os.getenv("DJANGO_URL", "http://localhost:8000")

            alert_data = {
                "user_id": session_data['user_id'],
                "session_id": session_id,
                "risk_level": risk_level,
                "summary": summary
            }

            response = requests.post(
                f"{django_url}/api/alerts/",
                json=alert_data,
                headers={'X-Internal-Token': os.getenv('INTERNAL_AI_TOKEN', 'your-secret-token-here')},
                timeout=5
            )

            if response.status_code == 200:
                print(f"Safety alert sent for session {session_id}")
            else:
                print(f"Failed to send safety alert: {response.status_code}")

        except Exception as e:
            print(f"Error sending safety alert: {e}")

    async def _generate_ai_response_and_stream(self, websocket: WebSocket, session_id: str, text: str):
        """Generate AI response and stream it to the client"""
        try:
            # Check if websocket is still connected
            if websocket.client_state.name != 'CONNECTED':
                print(f"WebSocket not connected for session {session_id}")
                return

            # Send the text response first
            await websocket.send_json({
                "type": "ai_text",
                "data": {"text": text}
            })

            # Send TTS processing notification
            await websocket.send_json({
                "type": "generating_tts",
                "message": "Generating voice response..."
            })

            # Get session data for voice preferences
            session_data = self.active_sessions.get(session_id)
            if not session_data:
                print(f"No session data found for {session_id}")
                return

            agent_config = get_agent(session_data['agent_id'])
            lang = session_data.get('lang', 'en-IN')
            
            # Generate and stream TTS
            await self._text_to_speech_and_stream(
                websocket, 
                text, 
                lang,
                agent_config.voice_prefs.get(lang, lang)
            )

        except Exception as e:
            print(f"Error generating AI response: {e}")
            try:
                if websocket.client_state.name == 'CONNECTED':
                    await websocket.send_json({
                        "type": "error",
                        "message": "Error generating response"
                    })
            except:
                pass

    async def _handle_no_speech(self, websocket: WebSocket, session_id: str):
        """Handle case where no speech was detected from user"""
        try:
            print(f"😶 No speech detected for session {session_id}")
            
            session_data = self.active_sessions.get(session_id)
            if not session_data:
                return
                
            lang = session_data.get('lang', 'en-IN')
            agent_config = get_agent(session_data['agent_id'])

            # Get emotion snapshot if available
            emotion_snapshot = None
            if 'latest_emotion' in self.active_sessions[session_id]:
                emotion_snapshot = self.active_sessions[session_id]['latest_emotion']
            elif session_id in self.emotion_integrators:
                emotion_snapshot = self.emotion_integrators[session_id].get_latest_emotions()
            
            # If we have strong emotions, generate a context-aware nudge
            if emotion_snapshot:
                # Check if there is a dominant negative emotion
                negatives = ['sad', 'angry', 'fearful', 'stressed', 'anxious', 'disgusted']
                dominant = max(emotion_snapshot.items(), key=lambda x: x[1])[0] if emotion_snapshot else "neutral"
                score = emotion_snapshot.get(dominant, 0)
                
                if dominant in negatives and score > 0.4:
                    print(f"🎭 Generating emotion-aware nudge for {dominant} ({score:.2f})")
                    
                    # Use LLM to generate a gentle nudge based on visual observation
                    memory_manager = self.memory_managers[session_id]
                    conversation_history = memory_manager.get_context()
                    
                    # Create a special prompt for silence with emotion
                    silence_prompt = f"(User is silent, but their face shows {dominant})"
                    
                    ai_reply = generate_reply(
                        system_prompt=agent_config.build_prompt(lang, emotion_snapshot),
                        user_text=silence_prompt,
                        memory_turns=conversation_history,
                        emotion_snapshot=emotion_snapshot
                    )
                    
                    if ai_reply:
                        # Update memory with this interaction
                        memory_manager.add_turn("(Silence)", ai_reply)
                        await self._generate_ai_response_and_stream(websocket, session_id, ai_reply)
                        return

            # Fallback to simple prompts if no strong emotion or neutral
            prompts = {
                'en-IN': "Tell me, I'm listening",
                'hi-IN': "बताइए, मैं सुन रहा हूँ",
                'ta-IN': "சொல்லுங்கள், நான் கேட்கிறேன்"
            }
            
            prompt_text = prompts.get(lang, prompts['en-IN'])
            
            # Send text and audio
            await self._generate_ai_response_and_stream(websocket, session_id, prompt_text)
            
        except Exception as e:
            print(f"Error handling no speech: {e}")
