#!/usr/bin/env python3
"""
FastAPI service for AI Psychologist voice interactions
"""
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Direct imports for running from ai_service directory
try:
    from ai_service.core.ws_voice import WebSocketVoiceHandler
    from ai_service.core.agents import get_agent
    from ai_service.core.risk import classify_risk
    from ai_service.core.llm import generate_reply
    from ai_service.core.memory import MemoryManager
    from ai_service.core.emotion_integration import EmotionIntegrator
except ImportError:
    # Fallback to local imports if package structure fails
    try:
        from .core.ws_voice import WebSocketVoiceHandler
        from .core.agents import get_agent
        from .core.risk import classify_risk
        from .core.llm import generate_reply
        from .core.memory import MemoryManager
        from .core.emotion_integration import EmotionIntegrator
    except ImportError:
        # Last fallback - direct imports
        import core.ws_voice as ws_voice_mod
        import core.agents as agents_mod
        import core.risk as risk_mod
        import core.llm as llm_mod
        import core.memory as memory_mod
        import core.emotion_integration as emotion_mod

        WebSocketVoiceHandler = ws_voice_mod.WebSocketVoiceHandler
        get_agent = agents_mod.get_agent
        classify_risk = risk_mod.classify_risk
        generate_reply = llm_mod.generate_reply
        MemoryManager = memory_mod.MemoryManager
        EmotionIntegrator = emotion_mod.EmotionIntegrator

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

@app.websocket("/ws/voice/{session_id}")
async def websocket_voice_endpoint(websocket: WebSocket, session_id: str):
    await ws_handler.handle_connection(websocket, session_id)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
