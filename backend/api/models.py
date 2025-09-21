from django.db import models
from django.contrib.auth.models import User
import uuid

class Agent(models.Model):
    AGENT_CHOICES = [
        ('academic_stress_psychologist', 'Academic Stress Psychologist'),
        ('relationships_psychologist', 'Relationships Psychologist'),
        ('career_anxiety_psychologist', 'Career Anxiety Psychologist'),
    ]

    DOMAINS = [
        ('academic', 'Academic'),
        ('relationships', 'Relationships'),
        ('career', 'Career'),
    ]

    agent_id = models.SlugField(unique=True, choices=AGENT_CHOICES)
    name = models.CharField(max_length=100)
    domain = models.CharField(max_length=20, choices=DOMAINS)
    languages = models.JSONField(default=list)
    description = models.TextField()
    system_prompt = models.TextField()
    safety_prompt = models.TextField()
    voice_prefs = models.JSONField(default=dict)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class VoiceSession(models.Model):
    session_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE)
    lang = models.CharField(max_length=10)
    consented_store = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_sec = models.IntegerField(null=True, blank=True)
    risk_level = models.CharField(max_length=20, choices=[
        ('none', 'None'),
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ], default='none')

    def __str__(self):
        return f"Session {self.session_id} - {self.user.username}"

class Turn(models.Model):
    session = models.ForeignKey(VoiceSession, on_delete=models.CASCADE, related_name='turns')
    role = models.CharField(max_length=20, choices=[
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ])
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.role}: {self.text[:50]}..."

class SafetyAlert(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session = models.ForeignKey(VoiceSession, on_delete=models.CASCADE, related_name='alerts')
    risk_level = models.CharField(max_length=20, choices=[
        ('none', 'None'),
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ])
    summary = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged = models.BooleanField(default=False)

    def __str__(self):
        return f"Alert {self.session.session_id} - {self.risk_level}"

class EmotionSession(models.Model):
    session = models.ForeignKey(VoiceSession, on_delete=models.CASCADE, related_name='emotions')
    happy = models.FloatField()
    neutral = models.FloatField()
    anxious = models.FloatField()
    stressed = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Emotions for {self.session.session_id}"

# Keep the existing EmotionData model for general emotion monitoring
class EmotionData(models.Model):
    happy = models.FloatField()
    neutral = models.FloatField()
    anxious = models.FloatField()
    stressed = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Emotions at {self.timestamp}"
