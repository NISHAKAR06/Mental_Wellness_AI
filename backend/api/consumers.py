import json
import cv2
import numpy as np
import base64
import io
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import EmotionData
from channels.db import database_sync_to_async
from deepface import DeepFace
import librosa

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

                # Analyze emotions using DeepFace
                analysis = DeepFace.analyze(img, actions=['emotion'], detector_backend='mtcnn', enforce_detection=False)
                emotions = analysis[0]['emotion']

                happy = emotions.get('happy', 0)
                neutral = emotions.get('neutral', 0)
                anxious = emotions.get('sad', 0) + emotions.get('fear', 0)
                stressed = emotions.get('angry', 0) + emotions.get('surprise', 0)

                total = happy + neutral + anxious + stressed
                if total == 0:
                    total = 1

                facial_emotions = {
                    'happy': float((happy / total) * 100),
                    'neutral': float((neutral / total) * 100),
                    'anxious': float((anxious / total) * 100),
                    'stressed': float((stressed / total) * 100),
                }
            except Exception as e:
                print(f"Error analyzing facial emotions: {e}")

        # Process voice stress
        if audio_data:
            try:
                # Decode base64 audio
                audio_bytes = base64.b64decode(audio_data)

                # Convert bytes to numpy array
                audio_np = np.frombuffer(audio_bytes, dtype=np.float32)

                # Use librosa for audio analysis
                # Calculate voice stress based on pitch and amplitude variations
                if len(audio_np) > 1000:  # Ensure we have enough samples
                    # Calculate features that indicate stress (tremor, breath pattern)
                    pitch, _ = librosa.piptrack(y=audio_np, sr=16000)

                    # Voice stress indicators:
                    # - Pitch variability (higher stress = more variation)
                    # - Amplitude variations (stress can affect breathing patterns)
                    pitch_std = np.std(pitch[pitch > 0])  # Remove zeros
                    pitch_std_norm = min(pitch_std / 100, 1.0)  # Normalize and cap at 1.0

                    # Simple heuristic: higher pitch variability often indicates stress
                    voice_stress = float(min(pitch_std_norm * 100, 100))
                else:
                    voice_stress = 0
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
