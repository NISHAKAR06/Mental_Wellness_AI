import json
import cv2
import numpy as np
import base64
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import EmotionData
from channels.db import database_sync_to_async
import face_recognition
from deepface import DeepFace

class EmotionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        image_data = text_data_json['image']

        # Decode the base64 image
        image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Analyze emotions using DeepFace
        try:
            analysis = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)
            emotions = analysis[0]['emotion']
            
            happy = emotions.get('happy', 0)
            neutral = emotions.get('neutral', 0)
            anxious = emotions.get('sad', 0) + emotions.get('fear', 0)
            stressed = emotions.get('angry', 0) + emotions.get('surprise', 0)

            total = happy + neutral + anxious + stressed
            if total == 0:
                total = 1 

            processed_emotions = {
                'happy': (happy / total) * 100,
                'neutral': (neutral / total) * 100,
                'anxious': (anxious / total) * 100,
                'stressed': (stressed / total) * 100,
            }

            await self.save_emotions(processed_emotions)

            await self.send(text_data=json.dumps({
                'emotions': processed_emotions
            }))
        except Exception as e:
            print(f"Error analyzing emotions: {e}")


    @database_sync_to_async
    def save_emotions(self, emotions):
        EmotionData.objects.create(
            happy=emotions.get('happy', 0),
            neutral=emotions.get('neutral', 0),
            anxious=emotions.get('anxious', 0),
            stressed=emotions.get('stressed', 0),
        )
