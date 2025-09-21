from django.urls import path
from . import views

urlpatterns = [
    path('summarize/', views.summarize_session, name='summarize_session'),
    # Agent endpoints
    path('agents/', views.get_agents, name='get_agents'),
    path('agents/<str:agent_id>/', views.get_agent_by_id, name='get_agent_by_id'),
    # Session endpoints
    path('sessions/start/', views.start_session, name='start_session'),
    path('sessions/end/', views.end_session, name='end_session'),
    # Safety alerts (internal use)
    path('alerts/', views.create_safety_alert, name='create_safety_alert'),
]
