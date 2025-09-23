"""
Real-time Emotion Detection using Pre-trained ML Models
Uses FER (Facial Emotion Recognition) library with pre-trained models
"""
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from fer import FER
import logging
from typing import Dict, Any, Optional, Tuple
import time

class EmotionDetector:
    """
    Real-time emotion detection using pre-trained ML models
    """

    def __init__(self):
        self.detector = None
        self.mtcnn_detector = None
        self.initialize_detectors()

    def initialize_detectors(self):
        """Initialize the emotion detection models"""
        try:
            # Initialize FER detector with MTCNN for better face detection
            self.detector = FER(mtcnn=True)

            # Set up logging
            logging.info("✅ Emotion detection models initialized successfully")
            logging.info("🎭 Using FER with MTCNN for enhanced face detection")

        except Exception as e:
            logging.error(f"❌ Failed to initialize emotion detection models with MTCNN: {e}")
            try:
                # Fallback to basic emotion detection without MTCNN
                self.detector = FER()
                logging.info("✅ Emotion detection model initialized without MTCNN")
            except Exception as e2:
                logging.error(f"❌ Failed to initialize any emotion detection model: {e2}")
                self.detector = None

    def decode_image(self, image_data: str) -> Optional[np.ndarray]:
        """Decode base64 image data to numpy array"""
        try:
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]

            # Decode base64
            image_bytes = base64.b64decode(image_data)

            # Convert to PIL Image
            pil_image = Image.open(BytesIO(image_bytes))

            # Convert to RGB if necessary
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')

            # Convert to numpy array
            image_array = np.array(pil_image)

            return image_array

        except Exception as e:
            logging.error(f"Error decoding image: {e}")
            return None

    def detect_emotions(self, image_data: str) -> Dict[str, Any]:
        """
        Detect emotions from image data
        Returns emotion percentages and dominant emotion
        """
        try:
            if self.detector is None:
                logging.warning("⚠️ Emotion detection not available due to initialization failure")
                return self._get_default_emotions()

            # Decode image
            image = self.decode_image(image_data)
            if image is None:
                return self._get_default_emotions()

            # Detect emotions
            emotions = self.detector.detect_emotions(image)

            if not emotions:
                logging.warning("⚠️ No faces detected in image")
                return self._get_default_emotions()

            # Get the first (main) face emotions
            face_emotions = emotions[0]["emotions"]

            # Convert to percentages and round to 1 decimal place
            emotion_percentages = {
                emotion: round(score * 100, 1)
                for emotion, score in face_emotions.items()
            }

            # Ensure all expected emotions are present
            expected_emotions = ['happy', 'sad', 'angry', 'fear', 'disgust', 'surprise', 'neutral']
            for emotion in expected_emotions:
                if emotion not in emotion_percentages:
                    emotion_percentages[emotion] = 0.0

            # Map to our expected emotion categories
            mapped_emotions = self._map_emotions(emotion_percentages)

            # Add metadata
            result = {
                'emotions': mapped_emotions,
                'dominant_emotion': max(mapped_emotions, key=mapped_emotions.get),
                'confidence': max(mapped_emotions.values()),
                'face_detected': True,
                'processing_time': time.time()
            }

            logging.info(f"🎭 Detected emotions: {mapped_emotions}")
            return result

        except Exception as e:
            logging.error(f"Error in emotion detection: {e}")
            return self._get_default_emotions()

    def _map_emotions(self, detected_emotions: Dict[str, float]) -> Dict[str, float]:
        """
        Map detected emotions to our expected categories
        """
        # Our expected emotion categories
        mapped = {
            'happy': 0.0,
            'neutral': 0.0,
            'anxious': 0.0,  # fear + disgust
            'stressed': 0.0   # angry + sad
        }

        # Direct mappings
        if 'happy' in detected_emotions:
            mapped['happy'] = detected_emotions['happy']

        if 'neutral' in detected_emotions:
            mapped['neutral'] = detected_emotions['neutral']

        # Map fear and disgust to anxious
        if 'fear' in detected_emotions:
            mapped['anxious'] += detected_emotions['fear'] * 0.6
        if 'disgust' in detected_emotions:
            mapped['anxious'] += detected_emotions['disgust'] * 0.4

        # Map angry and sad to stressed
        if 'angry' in detected_emotions:
            mapped['stressed'] += detected_emotions['angry'] * 0.5
        if 'sad' in detected_emotions:
            mapped['stressed'] += detected_emotions['sad'] * 0.5

        # Map surprise to happy if it's high, otherwise neutral
        if 'surprise' in detected_emotions:
            surprise_value = detected_emotions['surprise']
            if surprise_value > 30:  # High surprise often indicates positive reaction
                mapped['happy'] += surprise_value * 0.3
            else:
                mapped['neutral'] += surprise_value * 0.7

        # Normalize values to ensure they add up to 100%
        total = sum(mapped.values())
        if total > 0:
            mapped = {k: round((v / total) * 100, 1) for k, v in mapped.items()}

        return mapped

    def _get_default_emotions(self) -> Dict[str, Any]:
        """Return default emotion values when detection fails"""
        return {
            'emotions': {
                'happy': 25.0,
                'neutral': 50.0,
                'anxious': 12.5,
                'stressed': 12.5
            },
            'dominant_emotion': 'neutral',
            'confidence': 50.0,
            'face_detected': False,
            'processing_time': time.time()
        }

    def get_emotion_summary(self, emotion_data: Dict[str, Any]) -> str:
        """Generate a human-readable emotion summary"""
        emotions = emotion_data.get('emotions', {})
        dominant = emotion_data.get('dominant_emotion', 'neutral')

        if not emotions:
            return "No emotion data available"

        # Create summary based on dominant emotion
        summaries = {
            'happy': f"Feeling positive and happy ({emotions.get('happy', 0)}%)",
            'neutral': f"Maintaining a neutral emotional state ({emotions.get('neutral', 0)}%)",
            'anxious': f"Showing signs of anxiety ({emotions.get('anxious', 0)}%)",
            'stressed': f"Appearing stressed or tense ({emotions.get('stressed', 0)}%)"
        }

        return summaries.get(dominant, f"Dominant emotion: {dominant}")

# Global emotion detector instance
emotion_detector = EmotionDetector()
