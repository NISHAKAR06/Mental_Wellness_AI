#!/usr/bin/env python3
"""
FastAPI service for AI Psychologist voice interactions
"""
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Robust imports for deployment
def import_with_fallback(module_name: str, class_name: str = None):
    """Import module with multiple fallback strategies"""
    import sys
    import os

    # Try different import strategies
    strategies = [
        # Strategy 1: Direct absolute import
        lambda: __import__(f'ai_service.core.{module_name}', fromlist=[class_name or module_name]),
        # Strategy 2: Relative import
        lambda: __import__(f'.core.{module_name}', fromlist=[class_name or module_name], level=1),
        # Strategy 3: Direct path import
        lambda: __import__(module_name, fromlist=[class_name or module_name]),
    ]

    for strategy in strategies:
        try:
            return strategy()
        except ImportError:
            continue

    # Final fallback - add current directory to path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)

    try:
        return __import__(f'core.{module_name}', fromlist=[class_name or module_name])
    except ImportError as e:
        raise ImportError(f"Failed to import {module_name}: {e}")

# Import all required modules
try:
    ws_voice_mod = import_with_fallback('ws_voice', 'WebSocketVoiceHandler')
    ws_emotions_mod = import_with_fallback('ws_emotions', 'WebSocketEmotionHandler')
    agents_mod = import_with_fallback('agents', 'get_agent')
    risk_mod = import_with_fallback('risk', 'classify_risk')
    llm_mod = import_with_fallback('llm', 'generate_reply')
    memory_mod = import_with_fallback('memory', 'MemoryManager')
    emotion_mod = import_with_fallback('emotion_integration', 'EmotionIntegrator')

    WebSocketVoiceHandler = ws_voice_mod.WebSocketVoiceHandler
    WebSocketEmotionHandler = ws_emotions_mod.WebSocketEmotionHandler
    get_agent = agents_mod.get_agent
    classify_risk = risk_mod.classify_risk
    generate_reply = llm_mod.generate_reply
    MemoryManager = memory_mod.MemoryManager
    EmotionIntegrator = emotion_mod.EmotionIntegrator

except ImportError as e:
    print(f"❌ Critical import error: {e}")
    print("This may indicate missing dependencies or incorrect file structure")
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
    uvicorn.run(app, host="0.0.0.0", port=port)
