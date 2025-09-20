import json
import cv2
import numpy as np
import base64
import io
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import EmotionData
from channels.db import database_sync_to_async

# Temporarily disable ML imports to get WebSocket working first
# from deepface import DeepFace
# import librosa

class EmotionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        image_data = text_data_json.get('image')
        audio_data = text_data_json.get('audio')

        facial_emotions = {
            'happy': 0,
            'neutral': 0,
            'anxious': 0,
            'stressed': 0,
        }

        voice_stress = 0

        # Process facial emotions
        if image_data:
            try:
                # Decode the base64 image
                image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                # Temporarily disabled ML processing - just return sample data
                # analysis = DeepFace.analyze(img, actions=['emotion'], detector_backend='mtcnn', enforce_detection=False)
                # emotions = analysis[0]['emotion']

                # Sample emotion data for now
                import random
                base_happy = random.randint(20, 40)
                base_neutral = random.randint(30, 50)
                base_anxious = random.randint(10, 30)
                base_stressed = random.randint(10, 25)

                total = base_happy + base_neutral + base_anxious + base_stressed

                facial_emotions = {
                    'happy': float((base_happy / total) * 100),
                    'neutral': float((base_neutral / total) * 100),
                    'anxious': float((base_anxious / total) * 100),
                    'stressed': float((base_stressed / total) * 100),
                }
            except Exception as e:
                print(f"Error analyzing facial emotions: {e}")
                # Return default neutral emotions if processing fails
                facial_emotions = {
                    'happy': 25.0,
                    'neutral': 50.0,
                    'anxious': 15.0,
                    'stressed': 10.0,
                }

        # Process voice stress
        if audio_data:
            try:
                # Decode base64 audio
                audio_bytes = base64.b64decode(audio_data)

                # Convert bytes to numpy array
                audio_np = np.frombuffer(audio_bytes, dtype=np.float32)

                # Simplified voice stress detection without librosa
                # Calculate voice stress based on amplitude variations and length
                if len(audio_np) > 1000:  # Ensure we have enough samples
                    # Simple stress indicators without librosa:
                    # - Amplitude variability (stress can cause voice tremor)
                    # - Average amplitude (stress can affect volume)

                    # Calculate amplitude variability
                    amplitude_std = np.std(audio_np)
                    amplitude_mean = np.mean(np.abs(audio_np))

                    # Normalize and combine metrics
                    stress_score = min(amplitude_std * 100 + amplitude_mean * 50, 100.0)

                    voice_stress = float(stress_score)
                else:
                    voice_stress = 0

                print(f"Simplified voice analysis: stress_level={voice_stress}")
            except Exception as e:
                print(f"Error analyzing voice stress: {e}")
                voice_stress = 0

        # Combine facial and voice analysis
        combined_emotions = {
            'happy': facial_emotions['happy'],
            'neutral': facial_emotions['neutral'],
            'anxious': max(facial_emotions['anxious'], voice_stress),  # Use higher of facial or voice stress
            'stressed': max(facial_emotions['stressed'], voice_stress),  # Use higher of facial or voice stress
        }

        voice_stress_result = {
            'stress_level': voice_stress,
            'facial_anxious': facial_emotions['anxious'],
            'facial_stressed': facial_emotions['stressed']
        }

        await self.save_emotions(combined_emotions)

        await self.send(text_data=json.dumps({
            'emotions': combined_emotions,
            'voice_analysis': voice_stress_result
        }))


    @database_sync_to_async
    def save_emotions(self, emotions):
        EmotionData.objects.create(
            happy=emotions.get('happy', 0),
            neutral=emotions.get('neutral', 0),
            anxious=emotions.get('anxious', 0),
            stressed=emotions.get('stressed', 0),
        )
