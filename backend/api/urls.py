from django.urls import path
from . import views

urlpatterns = [
    path('summarize/', views.summarize_session, name='summarize_session'),
]
