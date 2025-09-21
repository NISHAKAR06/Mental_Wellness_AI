from django.urls import re_path, path
from . import consumers

# Django WebSocket URL patterns (Port 8000)
# Emotion monitoring - separate from FastAPI voice sessions for efficiency
websocket_urlpatterns = [
    path('ws/emotions/', consumers.EmotionConsumer.as_asgi(), name='emotion_monitoring_ws'),

    # Voice sessions handled by FastAPI AI Service (Port 8001)
    # ws://localhost:8001/ws/voice/{session_id}
]
