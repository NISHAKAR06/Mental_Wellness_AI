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

from .agents import get_agent
from .llm import generate_reply
from .risk import classify_risk, generate_safety_reply
from .memory import MemoryManager
from .emotion_integration import EmotionIntegrator

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

load_dotenv()

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

    async def handle_connection(self, websocket: WebSocket, session_id: str):
        """Handle WebSocket connection for voice session"""
        try:
            await websocket.accept()
            print(f"🔗 WebSocket connection accepted for session: {session_id}")


            # Wait for initialization message from client
            try:
                init_message = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=10.0
                )

                # Validate the init message
                token = init_message.get('token')
                if not token:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Authentication token required"
                    })
                    return

                # Decode and validate JWT token
                try:
                    payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
                    print(f"✅ JWT validated successfully for session {session_id}")
                    print(f"   User: {payload['user_id']}, Agent: {payload['agent_id']}, Lang: {payload['lang']}")

                    # Validate session ID matches URL parameter
                    token_session_id = str(payload.get('session_id'))
                    if token_session_id != session_id:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Session ID mismatch"
                        })
                        return

                    # Store session data
                    self.active_sessions[session_id] = payload

                    # Initialize session components now that we have valid session data
                    agent_config = get_agent(payload['agent_id'])
                    print(f"🎯 Loaded agent: {agent_config.name}")

                    # Initialize memory manager for this session
                    self.memory_managers[session_id] = MemoryManager(
                        session_id=session_id,
                        consent_store=payload['consent']
                    )

                    # Initialize emotion integrator if available
                    if os.getenv("ENABLE_EMOTION_INTEGRATION", "true").lower() == "true":
                        self.emotion_integrators[session_id] = EmotionIntegrator(payload['user_id'])

                    # Send connection confirmation
                    await websocket.send_json({
                        "type": "connection_established",
                        "agent_name": agent_config.name,
                        "voice_prefs": agent_config.voice_prefs
                    })

                    print(f"🎉 Session initialization complete for {agent_config.name}")

                except jwt.InvalidTokenError as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Invalid token: {str(e)}"
                    })
                    return

            except asyncio.TimeoutError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Authentication timeout"
                })
                return

            # Main message loop
            while True:
                message = await websocket.receive_json()
                await self._handle_message(websocket, session_id, message)

        except WebSocketDisconnect:
            print(f"WebSocket disconnected for session: {session_id}")
            await self._cleanup_session(session_id)
        except Exception as e:
            print(f"Error in WebSocket handler: {e}")
            await self._cleanup_session(session_id)

    # Removed unused _validate_session method - JWT validation now handled inline during connection setup

    async def _handle_message(self, websocket: WebSocket, session_id: str, message: Dict[str, Any]):
        """Handle incoming WebSocket messages"""
        message_type = message.get('type')

        if message_type == 'user_utterance_end':
            await self._process_utterance(websocket, session_id)
        elif message_type == 'barge_in':
            await self._handle_barge_in(websocket, session_id)
        elif message_type == 'audio_chunk':
            await self._handle_audio_chunk(websocket, session_id, message)
        elif message_type == 'end_session':
            await self._end_session_gracefully(websocket, session_id)
        else:
            print(f"Unknown message type: {message_type}")

    async def _handle_audio_chunk(self, websocket: WebSocket, session_id: str, message: Dict[str, Any]):
        """Handle incoming audio chunk"""
        try:
            # Decode base64 audio data
            audio_data = message.get('audio_data')
            if not audio_data:
                return

            # Decode base64 audio chunk
            audio_bytes = base64.b64decode(audio_data)

            # Store chunk in buffer
            if session_id not in self.audio_buffers:
                self.audio_buffers[session_id] = []
            self.audio_buffers[session_id].append(audio_bytes)

            print(f"Audio chunk received for session {session_id} ({len(audio_bytes)} bytes)")

        except Exception as e:
            print(f"Error handling audio chunk: {e}")

    async def _process_utterance(self, websocket: WebSocket, session_id: str):
        """Process user utterance after receiving end signal"""
        try:
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

            # Step 1: Speech-to-Text (placeholder - would integrate with Google STT)
            user_text = await self._speech_to_text(combined_audio, lang)

            if not user_text:
                await websocket.send_json({
                    "type": "error",
                    "message": "Speech recognition failed"
                })
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
                await self._text_to_speech_and_stream(websocket, safety_reply, agent_config.voice_prefs.get(lang))

                # Send safety alert to Django backend
                await self._send_safety_alert(
                    session_id,
                    risk_result['risk_level'],
                    f"Safety response triggered: {risk_result['reason']}"
                )

                return  # Skip normal reply flow

            # Step 4: Get emotion snapshot if available
            emotion_snapshot = None
            if session_id in self.emotion_integrators:
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
            await self._text_to_speech_and_stream(websocket, ai_reply, agent_config.voice_prefs.get(lang))

        except Exception as e:
            print(f"Error processing utterance: {e}")
            await websocket.send_json({
                "type": "error",
                "message": "Error processing your message"
            })

    async def _handle_barge_in(self, websocket: WebSocket, session_id: str):
        """Handle user interrupting current response"""
        try:
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

            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=48000,  # Standard for WebRTC/WebM
                language_code=stt_lang,   # Use specific language from config
                enable_automatic_punctuation=True,
                enable_word_time_offsets=False,
                # Utterance-based recognition (non-streaming)
                model="latest_long",
                use_enhanced=True,
                adaptation=None,
                # Handle multiple languages
                alternative_language_codes=[] if language == 'en-IN' else ['en-IN'],
            )

            # Perform speech recognition
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.recognize(config=config, audio=audio)
            )

            # Extract transcript from first result
            if response.results:
                transcript = response.results[0].alternatives[0].transcript.strip()
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

    async def _text_to_speech_and_stream(self, websocket: WebSocket, text: str, lang: str):
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
                lang = session_data.get('lang', 'en-IN')

            # Stop any ongoing TTS for barge-in functionality
            if session_id:
                self.tts_active[session_id] = True

            # Prepare text for chunking
            sentences = self._split_into_sentences(text)
            chunks = self._chunk_sentences(sentences, max_chunks=3)  # Never more than 3 chunks

            # Get language-specific TTS configuration
            lang_config = self.lang_configs.get(lang, self.lang_configs['en-IN'])
            voice_name = lang_config['voice_name']

            print(f"🎵 Generating TTS in {lang} with {len(chunks)} chunks: {voice_name}")

            if ENABLE_REAL_TEXT_TO_SPEECH and GOOGLE_CLOUD_AVAILABLE:
                # Use Google TTS for production
                client = texttospeech.TextToSpeechClient()

                # Prepare TTS requests for each chunk
                tts_config = texttospeech.Voice(
                    language_code=lang.split('-')[0] + '-' + lang.split('-')[1],  # en-IN, hi-IN, etc.
                    name=voice_name
                )

                audio_config = texttospeech.AudioConfig(
                    audio_encoding=texttospeech.AudioEncoding.MP3,
                    speaking_rate=0.9,  # Slightly slower for clarity
                    pitch=0.0,
                )

                # Process each chunk
                for i, chunk_text in enumerate(chunks):
                    if session_id and not self.tts_active.get(session_id, True):
                        break  # Barge-in interrupt

                    # Generate TTS for this chunk
                    synthesis_input = texttospeech.SynthesisInput(text=chunk_text)
                    response = await asyncio.get_event_loop().run_in_executor(
                        None,
                        lambda: client.synthesize_speech(
                            input=synthesis_input,
                            voice=tts_config,
                            audio_config=audio_config
                        )
                    )

                    # Convert to base64 for WebSocket transport
                    audio_content = response.audio_content
                    audio_base64 = base64.b64encode(audio_content).decode('utf-8')

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

                        # Simulate TTS audio chunk
                        # Generate a mock audio size based on text length
                        mock_audio_size = len(chunk_text.encode('utf-8')) * 50  # Rough estimation
                        mock_audio = b'\x00' * mock_audio_size  # Placeholder audio data
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
            await websocket.send_json({
                "type": "tts_complete",
                "total_chunks": len(chunks)
            })

        except Exception as e:
            print(f"❌ TTS Error: {e}")
            # Send error completion
            await websocket.send_json({
                "type": "tts_complete",
                "error": str(e)
            })

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
                if current.strip():
                    sentences.append(current.strip())
                    current = ""
                elif char == '\n':
                    continue

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
                timeout=5
            )

            if response.status_code == 200:
                print(f"Safety alert sent for session {session_id}")
            else:
                print(f"Failed to send safety alert: {response.status_code}")

        except Exception as e:
            print(f"Error sending safety alert: {e}")
