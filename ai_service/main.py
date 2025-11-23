#!/usr/bin/env python3
"""
FastAPI service for AI Psychologist voice interactions
"""
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Ultra-simple imports for Docker deployment
import sys
import os

# Add current directory and core directory to Python path for robust imports
current_dir = os.path.dirname(__file__)  # ai_service directory
core_dir = os.path.join(current_dir, 'core')
parent_dir = os.path.dirname(current_dir)  # Project root

# Add both to path to handle imports from anywhere
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if core_dir not in sys.path:
    sys.path.insert(0, core_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Direct imports with graceful fallback
try:
    import core.ws_voice as ws_voice
    WebSocketVoiceHandler = ws_voice.WebSocketVoiceHandler
    print("✅ Voice handler loaded successfully")
except ImportError as e:
    print(f"❌ Failed to import voice handler: {e}")
    raise

try:
    import core.ws_emotions as ws_emotions
    WebSocketEmotionHandler = ws_emotions.WebSocketEmotionHandler
    EMOTION_HANDLER_AVAILABLE = True
    print("✅ Emotion handler loaded successfully")
except ImportError as e:
    print(f"⚠️ Emotion handler not available: {e}")
    WebSocketEmotionHandler = None
    EMOTION_HANDLER_AVAILABLE = False

try:
    import core.agents as agents
    get_agent = agents.get_agent
    print("✅ Agents loaded successfully")
except ImportError as e:
    print(f"❌ Failed to import agents: {e}")
    raise

try:
    import core.risk as risk
    classify_risk = risk.classify_risk
    print("✅ Risk classification loaded")
except ImportError as e:
    print(f"❌ Failed to import risk: {e}")
    raise

try:
    import core.llm as llm
    generate_reply = llm.generate_reply
    print("✅ LLM handler loaded")
except ImportError as e:
    print(f"❌ Failed to import LLM: {e}")
    raise

try:
    import core.memory as memory
    MemoryManager = memory.MemoryManager
    print("✅ Memory manager loaded")
except ImportError as e:
    print(f"❌ Failed to import memory: {e}")
    raise

try:
    import core.emotion_integration as emotion_integration
    EmotionIntegrator = emotion_integration.EmotionIntegrator
    print("✅ Emotion integration loaded")
except ImportError as e:
    print(f"⚠️ Emotion integration not available: {e}")
    EmotionIntegrator = None

load_dotenv()

app = FastAPI(
    title="AI Psychologist Service",
    description="Voice-based AI psychologist with WebSocket support",
    version="1.0.0"
)

# CORS middleware for frontend communication
origins = os.getenv("CORS_ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "AI Psychologist Service", "status": "running", "version": "1.0.0"}

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "healthy", "services": ["voice", "emotion", "llm"]}

# Test WebSocket connection
@app.get("/test-ws")
async def test_websocket():
    return {"message": "WebSocket endpoint available at /ws/voice/{session_id}"}

# WebSocket routes
ws_handler = WebSocketVoiceHandler()

# Simple test WebSocket endpoint
@app.websocket("/ws/test")
async def websocket_test_endpoint(websocket: WebSocket):
    print("🔗 Test WebSocket endpoint called")
    try:
        await websocket.accept()
        print("✅ Test WebSocket connection accepted")
        await websocket.send_json({"type": "test", "message": "WebSocket working!"})
        await websocket.close()
    except Exception as e:
        print(f"❌ Error in test WebSocket: {e}")

# Simple demo WebSocket for video calls (no authentication)
# Real WebSocket for video calls - both endpoints go to same handler
@app.websocket("/ws/demo/{session_id}")
async def websocket_demo_endpoint(websocket: WebSocket, session_id: str):
    print(f"🔗 Demo WebSocket endpoint called for session: {session_id} - redirecting to voice handler")
    # Accept connection immediately
    await websocket.accept()
    print(f"✅ Demo WebSocket connection accepted for session: {session_id}")
    
    try:
        # Handle the connection with our real voice handler
        await ws_handler.handle_voice_session(websocket, session_id)
    except Exception as e:
        print(f"❌ Error in demo WebSocket endpoint: {e}")
        try:
            await websocket.close()
        except:
            pass

@app.websocket("/ws/voice/{session_id}")
async def websocket_voice_endpoint(websocket: WebSocket, session_id: str):
    print(f"🔗 WebSocket endpoint called for session: {session_id}")
    
    # Accept connection immediately - no validation at FastAPI level
    try:
        await websocket.accept()
        print(f"✅ WebSocket connection accepted for session: {session_id}")
        
        # Send immediate confirmation
        await websocket.send_json({
            "type": "connection_ready",
            "session_id": session_id,
            "message": "FastAPI WebSocket connected successfully"
        })
        
        # Now handle the voice session - pass that connection is already accepted
        await ws_handler.handle_voice_session_accepted(websocket, session_id)
        
    except Exception as e:
        print(f"❌ WebSocket error for session {session_id}: {e}")
        import traceback
        traceback.print_exc()
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"WebSocket error: {str(e)}"
            })
        except:
            pass
        try:
            await websocket.close()
        except:
            pass

# Define emotion endpoints conditionally
if EMOTION_HANDLER_AVAILABLE:
    emotion_handler = WebSocketEmotionHandler()

    @app.websocket("/ws/emotions/")
    async def websocket_emotion_endpoint(websocket: WebSocket):
        # Use a fixed session ID for emotion monitoring (could be enhanced for user sessions)
        await emotion_handler.handle_connection(websocket, "emotion_session")

    @app.websocket("/ws/emotions/{session_id}")
    async def websocket_emotion_endpoint_with_session(websocket: WebSocket, session_id: str):
        # Handle emotion monitoring with specific session ID
        await emotion_handler.handle_connection(websocket, session_id)

else:
    @app.websocket("/ws/emotions/")
    async def websocket_emotion_endpoint_fallback(websocket: WebSocket):
        try:
            await websocket.accept()
            await websocket.send_json({
                'type': 'error',
                'message': 'Emotion detection service temporarily unavailable'
            })
        except Exception as e:
            print(f"Error in emotion fallback endpoint: {e}")

    @app.websocket("/ws/emotions/{session_id}")
    async def websocket_emotion_endpoint_with_session_fallback(websocket: WebSocket, session_id: str):
        try:
            await websocket.accept()
            await websocket.send_json({
                'type': 'error',
                'message': 'Emotion detection service temporarily unavailable'
            })
        except Exception as e:
            print(f"Error in emotion fallback endpoint with session: {e}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/agents")
async def list_agents():
    """List all built-in AI psychologist agents"""
    try:
        # Get all agents directly from built-in configuration
        import core.agents as agents
        all_agents = agents.get_all_agents()

        # Convert to simple dict for API response
        agent_list = []
        for agent_id, agent_config in all_agents.items():
            agent_list.append({
                "id": agent_config.agent_id,
                "name": agent_config.name,
                "domain": agent_config.domain,
                "languages": agent_config.languages,
                "description": agent_config.description,
                "voice_prefs": agent_config.voice_prefs
            })

        return {"agents": agent_list}

    except Exception as e:
        print(f"Error listing agents: {e}")
        return {"error": "Failed to load agents", "agents": []}

@app.get("/agents/{agent_id}")
async def get_agent_info(agent_id: str):
    """Get specific agent configuration (without exposing internal system prompts)"""
    try:
        # Get agent from built-in configuration only
        import core.agents as agents
        all_agents = agents.get_all_agents()

        if agent_id in all_agents:
            agent = all_agents[agent_id]
            return {
                "id": agent.agent_id,
                "name": agent.name,
                "domain": agent.domain,
                "languages": agent.languages,
                "description": agent.description,
                "voice_prefs": agent.voice_prefs
            }
        else:
            return {"error": "Agent not found"}, 404

    except Exception as e:
        print(f"Error getting agent {agent_id}: {e}")
        return {"error": "Failed to load agent"}, 500

from fastapi import UploadFile, File
import tempfile

@app.post("/stream/stt")
async def stream_stt(audio_chunk: UploadFile = File(...)):
    # Save chunk to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        content = await audio_chunk.read()
        tmp.write(content)
        tmp_path = tmp.name

    # Dummy STT logic (replace with real STT)
    # For example, use Google Speech-to-Text or OpenAI Whisper here
    # text = speech_to_text(tmp_path)
    text = "[partial transcript here]"  # Placeholder

    # Clean up temp file
    try:
        os.remove(tmp_path)
    except Exception:
        pass

    return {"partial_text": text}

from fastapi import Body

@app.post("/chat")
async def chat(payload: dict = Body(...)):
    """
    Generate a Gemini LLM response for the given user text and (optional) emotion state.
    Expects: { "text": "...", "emotion_state": {...} }
    """
    user_text = payload.get("text", "")
    emotion_state = payload.get("emotion_state", None)
    # Call Gemini LLM (core.llm.generate_reply)
    reply = generate_reply(user_text, emotion_state)
    return {"text": reply}

from fastapi.responses import StreamingResponse
import io

# Voice emotion detection endpoint (Librosa placeholder)
from fastapi import UploadFile, File
import numpy as np

@app.post("/voice-emotion")
async def voice_emotion(audio: UploadFile = File(...)):
    """
    Analyze voice emotion from audio using Librosa (placeholder).
    Returns: { "emotion": "stressed", "confidence": 0.85 }
    """
    try:
        # TODO: Use librosa to extract features and predict emotion
        # For now, return dummy result
        return {"emotion": "stressed", "confidence": 0.85}
    except Exception as e:
        return {"error": str(e)}

@app.post("/risk-classify")
async def risk_classify(payload: dict = Body(...)):
    """
    Classify risk level of user input.
    Expects: { "text": "..." }
    Returns: { "risk_level": "...", "reason": "...", "urgent": ... }
    """
    from core.risk import classify_risk
    text = payload.get("text", "")
    result = classify_risk(text)
    return result

@app.post("/session-summary")
async def session_summary(payload: dict = Body(...)):
    """
    Save session summary and analytics.
    Expects: { "session_id": "...", "transcript": [...], "summary": "...", "emotion_timeline": [...], "risk_outcomes": [...] }
    Returns: { "status": "success" }
    """
    # TODO: Save to database or forward to Django backend
    return {"status": "success"}

@app.post("/tts")
async def tts(payload: dict = Body(...)):
    """
    Generate TTS audio for the given text.
    Expects: { "text": "..." }
    Returns: audio/wav stream (dummy data for now)
    """
    text = payload.get("text", "")
    # TODO: Replace with real TTS logic (Google, ElevenLabs, etc.)
    # For now, return a short silent WAV file as a placeholder
    import wave
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(b"\x00" * 32000)  # 1 second of silence
    buf.seek(0)
    return StreamingResponse(buf, media_type="audio/wav")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
