"""
Emotion integration module for AI Psychologist service
Integrates with Django emotion monitoring system
"""
from typing import Dict, List, Optional, Any
import requests
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

class EmotionSnapshot:
    """Represents an emotion snapshot from the emotion monitoring system"""
    def __init__(self, data: Dict[str, Any]):
        self.happy = data.get('happy', 0.0)
        self.neutral = data.get('neutral', 0.0)
        self.anxious = data.get('anxious', 0.0)
        self.stressed = data.get('stressed', 0.0)
        self.timestamp = data.get('timestamp') or datetime.utcnow()
        self.session_id = data.get('session_id')

    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary format for LLM integration"""
        return {
            'happy': float(self.happy),
            'neutral': float(self.neutral),
            'anxious': float(self.anxious),
            'stressed': float(self.stressed)
        }

    def get_dominant_emotion(self) -> str:
        """Get the dominant emotion in this snapshot"""
        emotions = [
            ('happy', self.happy),
            ('neutral', self.neutral),
            ('anxious', self.anxious),
            ('stressed', self.stressed)
        ]

        # Sort by intensity and return highest
        emotions.sort(key=lambda x: x[1], reverse=True)
        return emotions[0][0] if emotions[0][1] > 0 else 'neutral'

    def get_stress_level(self) -> float:
        """Calculate overall stress level from emotion data"""
        # Weighted stress calculation
        # Higher weight on anxious and stressed emotions
        return (self.anxious * 0.6) + (self.stressed * 0.4)

    def __str__(self):
        return f"Emotions: H:{self.happy:.2f} N:{self.neutral:.2f} A:{self.anxious:.2f} S:{self.stressed:.2f}"

class EmotionIntegrator:
    """
    Integrates with Django emotion monitoring system
    Provides emotion context for AI agents
    """
    def __init__(self, user_id: int):
        self.user_id = user_id
        self.django_url = os.getenv("DJANGO_URL", "http://localhost:8000")
        self.cache_duration = int(os.getenv("EMOTION_CACHE_SECONDS", "30"))

        # Simple in-memory cache for emotion data
        self._emotion_cache = None
        self._cache_timestamp = None

    def get_latest_emotions(self, force_refresh: bool = False) -> Optional[Dict[str, float]]:
        """
        Get latest emotion snapshot for user
        Returns None if no emotion data available or on error
        """
        try:
            # Check cache first
            if not force_refresh and self._is_cache_valid():
                return self._emotion_cache

            # Fetch latest emotion data from Django
            emotion_data = self._fetch_emotion_data()

            if emotion_data:
                emotion_snapshot = EmotionSnapshot(emotion_data)
                self._emotion_cache = emotion_snapshot.to_dict()
                self._cache_timestamp = datetime.utcnow()

                print(f"Fetched emotion data for user {self.user_id}: {emotion_snapshot}")

                return self._emotion_cache

        except Exception as e:
            print(f"Error fetching emotion data for user {self.user_id}: {e}")

        return None

    def get_emotion_trend(self, minutes_back: int = 10) -> Dict[str, Any]:
        """
        Get emotion trend over recent time period
        Useful for understanding emotion progression during session
        """
        try:
            # Fetch emotion history from Django
            emotion_history = self._fetch_emotion_history(minutes_back)

            if not emotion_history:
                return {"trend": "insufficient_data", "samples": 0}

            # Analyze trend
            if len(emotion_history) < 2:
                # Need at least 2 samples for trend
                latest = EmotionSnapshot(emotion_history[0])
                return {
                    "trend": "stable",
                    "samples": 1,
                    "dominant_emotion": latest.get_dominant_emotion(),
                    "stress_level": latest.get_stress_level()
                }

            # Calculate trend
            first = EmotionSnapshot(emotion_history[0])
            last = EmotionSnapshot(emotion_history[-1])

            first_stress = first.get_stress_level()
            last_stress = last.get_stress_level()

            stress_delta = last_stress - first_stress
            sample_count = len(emotion_history)

            # Determine trend
            if abs(stress_delta) < 0.1:
                trend = "stable"
            elif stress_delta > 0.1:
                trend = "increasing_stress"
            else:
                trend = "decreasing_stress"

            # Average emotions across period
            avg_emotions = {
                'happy': sum(EotionSnapshot(e).happy for e in emotion_history) / sample_count,
                'neutral': sum(EotionSnapshot(e).neutral for e in emotion_history) / sample_count,
                'anxious': sum(EotionSnapshot(e).anxious for e in emotion_history) / sample_count,
                'stressed': sum(EotionSnapshot(e).stressed for e in emotion_history) / sample_count
            }

            return {
                "trend": trend,
                "samples": sample_count,
                "stress_delta": stress_delta,
                "avg_emotions": avg_emotions,
                "current_emotion": last.get_dominant_emotion(),
                "recommendation": self._get_tone_recommendation(trend, last.get_stress_level())
            }

        except Exception as e:
            print(f"Error calculating emotion trend: {e}")
            return {"trend": "error", "samples": 0, "error": str(e)}

    def update_emotion_context(self, emotion_data: Dict[str, Any]):
        """
        Update emotion data (for integration with emotion monitoring)
        This could be called when new emotion data is available during session
        """
        try:
            # Send emotion data to Django if needed
            # For now, this is a placeholder
            self._emotion_cache = {
                'happy': emotion_data.get('happy', 0.0),
                'neutral': emotion_data.get('neutral', 0.0),
                'anxious': emotion_data.get('anxious', 0.0),
                'stressed': emotion_data.get('stressed', 0.0)
            }
            self._cache_timestamp = datetime.utcnow()

            print(f"Updated emotion context for user {self.user_id}")

        except Exception as e:
            print(f"Error updating emotion context: {e}")

    def _is_cache_valid(self) -> bool:
        """Check if cached emotion data is still valid"""
        if not self._cache_timestamp or not self._emotion_cache:
            return False

        age_seconds = (datetime.utcnow() - self._cache_timestamp).total_seconds()
        return age_seconds < self.cache_duration

    def _fetch_emotion_data(self) -> Optional[Dict[str, Any]]:
        """Fetch latest emotion data from Django backend"""
        try:
            endpoint = f"{self.django_url}/api/emotions/{self.user_id}/latest/"
            response = requests.get(endpoint, timeout=5)

            if response.status_code == 200:
                return response.json().get('emotion')
            else:
                print(f"Failed to fetch emotion data: {response.status_code}")

        except requests.RequestException as e:
            print(f"Error fetching emotion data: {e}")

        return None

    def _fetch_emotion_history(self, minutes_back: int) -> List[Dict[str, Any]]:
        """Fetch emotion history for trend analysis"""
        try:
            since_time = datetime.utcnow() - timedelta(minutes=minutes_back)
            endpoint = f"{self.django_url}/api/emotions/{self.user_id}/history/"
            params = {'since': since_time.isoformat()}

            response = requests.get(endpoint, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                return data.get('emotions', [])
            else:
                print(f"Failed to fetch emotion history: {response.status_code}")

        except requests.RequestException as e:
            print(f"Error fetching emotion history: {e}")

        return []

    def _get_tone_recommendation(self, trend: str, stress_level: float) -> str:
        """Get tone adjustment recommendation based on emotion trends"""
        if trend == "increasing_stress" and stress_level > 0.6:
            return "Use calming techniques, suggest grounding exercises, slow down response pace"
        elif trend == "decreasing_stress":
            return "Maintain supportive tone, acknowledge progress"
        elif stress_level > 0.7:
            return "Be very gentle, suggest immediate calming techniques"
        elif self._emotion_cache:
            dominant = EmotionSnapshot(self._emotion_cache).get_dominant_emotion()
            if dominant == 'happy':
                return "Keep positive, engaging tone"
            elif dominant == 'anxious':
                return "Be reassuring, offer practical steps"
            else:
                return "Maintain balanced, empathetic tone"
        else:
            return "Use standard empathetic tone"

# Global emotion integrators for active sessions
_active_emotion_integrators: Dict[int, EmotionIntegrator] = {}

def get_emotion_integrator(user_id: int) -> EmotionIntegrator:
    """Get or create emotion integrator for user"""
    if user_id not in _active_emotion_integrators:
        _active_emotion_integrators[user_id] = EmotionIntegrator(user_id)

    return _active_emotion_integrators[user_id]

def cleanup_emotion_integrator(user_id: int):
    """Remove emotion integrator when user session ends"""
    if user_id in _active_emotion_integrators:
        del _active_emotion_integrators[user_id]

def get_active_emotion_integrators_count() -> int:
    """Get count of active emotion integrators"""
    return len(_active_emotion_integrators)
