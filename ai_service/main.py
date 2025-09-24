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

# Add core directory to Python path
current_dir = os.path.dirname(__file__)
core_dir = os.path.join(current_dir, 'core')

if core_dir not in sys.path:
    sys.path.insert(0, core_dir)

# Direct imports without complex fallback logic
try:
    # Import modules directly
    import ws_voice
    import ws_emotions
    import agents
    import risk
    import llm
    import memory
    import emotion_integration

    WebSocketVoiceHandler = ws_voice.WebSocketVoiceHandler
    WebSocketEmotionHandler = ws_emotions.WebSocketEmotionHandler
    get_agent = agents.get_agent
    classify_risk = risk.classify_risk
    generate_reply = llm.generate_reply
    MemoryManager = memory.MemoryManager
    EmotionIntegrator = emotion_integration.EmotionIntegrator

except ImportError as e:
    print(f"❌ Critical import error: {e}")
    print("Available files in core directory:")
    try:
        print(os.listdir(core_dir))
    except:
        pass
    raise

load_dotenv()

app = FastAPI(
    title="AI Psychologist Service",
    description="Voice-based AI psychologist with WebSocket support",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add CORS for WebSocket connections
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, Request

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# WebSocket routes
ws_handler = WebSocketVoiceHandler()
emotion_handler = WebSocketEmotionHandler()

@app.websocket("/ws/voice/{session_id}")
async def websocket_voice_endpoint(websocket: WebSocket, session_id: str):
    await ws_handler.handle_connection(websocket, session_id)

@app.websocket("/ws/emotions/")
async def websocket_emotion_endpoint(websocket: WebSocket):
    # Use a fixed session ID for emotion monitoring (could be enhanced for user sessions)
    await emotion_handler.handle_connection(websocket, "emotion_session")

@app.websocket("/ws/emotions/{session_id}")
async def websocket_emotion_endpoint_with_session(websocket: WebSocket, session_id: str):
    # Handle emotion monitoring with specific session ID
    await emotion_handler.handle_connection(websocket, session_id)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
