from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'agents', views.AgentViewSet, basename='agents')

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/me/', views.user_me, name='user_me'),

    path('', include(router.urls)),

    # Sessions
    path('sessions/start/', views.start_session_view, name='start_session'),
    path('sessions/end/', views.end_session_view, name='end_session'),

    # AI Alerts (internal)
    path('ai/alerts/', views.create_safety_alert_view, name='ai_alerts'),

    # Legacy (can remove later)
    path('summarize/', views.summarize_session, name='summarize_session'),
    # Agent endpoints
    path('get-agents/', views.get_agents, name='get_agents'),  # legacy
    path('agents/<str:agent_id>/get/', views.get_agent_by_id, name='get_agent_by_id'),  # legacy
    # Session endpoints
    path('start-session/', views.start_session, name='start_session_legacy'),  # legacy
    path('end-session/', views.end_session, name='end_session_legacy'),  # legacy
    # Safety alerts (internal use)
    path('alerts/', views.create_safety_alert, name='create_safety_alert'),  # legacy
]
