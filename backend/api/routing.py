# Emotion monitoring moved to FastAPI ai_service (Port 8001)
# ws://localhost:8001/ws/emotions/

# Voice sessions handled by FastAPI AI Service (Port 8001)
# ws://localhost:8001/ws/voice/{session_id}

from django.urls import re_path
from .consumers import WebRTCSignalingConsumer

websocket_urlpatterns = [
    re_path(r"ws/webrtc/(?P<room_name>\w+)/$", WebRTCSignalingConsumer.as_asgi()),
]
