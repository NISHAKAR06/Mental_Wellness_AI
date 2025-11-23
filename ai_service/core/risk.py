"""
Risk classification module for AI Psychologist service
Analyzes user text for safety concerns using Gemini
"""
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from typing import Dict, Any, Optional, Tuple
import json
import re
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class RiskClassifier:
    def __init__(self):
        self.model_name = "gemini-1.5-flash"
        self.generation_config = GenerationConfig(
            temperature=0.1,  # Very low for consistent risk classification
            max_output_tokens=150,
            top_p=0.9,
            top_k=20
        )

    def classify(self, text: str) -> Dict[str, Any]:
        """
        Classify risk level of user input

        Returns dictionary with:
        - risk_level: "none", "low", "medium", "high"
        - reason: explanation for classification
        - urgent: boolean indicating if immediate action needed
        """
        try:
            # First do a quick pattern match for obvious risks
            pattern_result = self._quick_pattern_check(text)
            if pattern_result['risk_level'] == 'high':
                return pattern_result

            # Use Gemini for classification
            prompt = f"""Analyze the following user message for mental health risk.
Return only JSON in this exact format:
{{
"risk_level": "none|low|medium|high",
"reason": "brief explanation",
"urgent": true|false
}}

Message: "{text}"

Risk levels:
- none: no risk indicators
- low: mild distress, general anxiety/stress
- medium: significant distress, possible self-harm ideation
- high: immediate danger, active self-harm intent, severe crisis"""

            # List of models to try for risk classification
            models_to_try = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-pro"]
            
            response = None
            
            for model_name in models_to_try:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt, generation_config=self.generation_config)
                    if response:
                        break
                except Exception as e:
                    print(f"⚠️ Risk model {model_name} failed: {e}")
                    continue
            
            if not response:
                print("❌ All risk models failed, falling back to pattern matching")
                return self._quick_pattern_check(text)

            # Parse JSON response
            result = self._parse_json_response(response.text)
            return result if result else {"risk_level": "none", "reason": "could not parse response", "urgent": False}

        except Exception as e:
            print(f"Error in risk classification: {e}")
            # Fallback to pattern matching
            return self._quick_pattern_check(text)

    def _quick_pattern_check(self, text: str) -> Dict[str, Any]:
        """Quick pattern-based risk detection"""
        text_lower = text.lower()

        # High risk keywords (immediate attention needed)
        high_risk_patterns = [
            r'i want to (kill|harm) myself',
            r'i\'m going to (end|kill) it',
            r'i can\'t take it anymore',
            r'i want to die',
            r'i\'m suicidal',
            r'i\'m having thoughts of suicide'
        ]

        for pattern in high_risk_patterns:
            if re.search(pattern, text_lower):
                return {
                    "risk_level": "high",
                    "reason": "active suicidal ideation detected",
                    "urgent": True
                }

        # Medium risk keywords
        medium_risk_patterns = [
            r'i feel like harming myself',
            r'intent to harm myself',
            r'thoughts of (hurting|harming) myself',
            r'life isn\'t worth living',
            r'i wish i were dead',
            r'dangerous thoughts'
        ]

        for pattern in medium_risk_patterns:
            if re.search(pattern, text_lower):
                return {
                    "risk_level": "medium",
                    "reason": "passive suicidal ideation or self-harm concerns",
                    "urgent": False
                }

        # Low risk indicators (general distress)
        low_risk_patterns = [
            r'i feel (depressed|sad|hopeless|worthless| useless)',
            r'i\'m struggling',
            r'i need help',
            r'i\'m (worried|anxious) about',
            r'i can\'t cope'
        ]

        for pattern in low_risk_patterns:
            if re.search(pattern, text_lower):
                return {
                    "risk_level": "low",
                    "reason": "general distress or emotional pain",
                    "urgent": False
                }

        return {"risk_level": "none", "reason": "no risk indicators detected", "urgent": False}

    def _parse_json_response(self, text: str) -> Optional[Dict[str, Any]]:
        """Parse JSON response from Gemini"""
        try:
            # Extract JSON from response (might have markdown formatting)
            json_start = text.find('{')
            json_end = text.rfind('}') + 1

            if json_start != -1 and json_end > json_start:
                json_str = text[json_start:json_end]
                data = json.loads(json_str)

                # Validate required fields
                if 'risk_level' in data and data['risk_level'] in ['none', 'low', 'medium', 'high']:
                    # Ensure has reason and urgent fields
                    if 'reason' not in data:
                        data['reason'] = "classified by AI"
                    if 'urgent' not in data:
                        data['urgent'] = data['risk_level'] == 'high'

                    return data

        except json.JSONDecodeError:
            pass

        return None

class SafetyResponseGenerator:
    def __init__(self):
        self.responses = self._get_safety_responses()

    def generate_safety_reply(self, risk_level: str, lang: str = "en-IN") -> str:
        """
        Generate appropriate safety response based on risk level and language
        """
        if lang not in self.responses:
            lang = "en-IN"  # fallback to English

        if risk_level not in self.responses[lang]:
            risk_level = "medium"  # fallback to medium

        response = self.responses[lang][risk_level]

        # Add helpline information
        response += "\n\n" + self._get_helpline_info(lang)

        return response

    def _get_safety_responses(self) -> Dict[str, Dict[str, str]]:
        """Safety responses in different languages"""
        return {
            "en-IN": {
                "high": "I'm very concerned about what you've shared and I need you to take immediate steps for your safety. Please call emergency services right now or go to the nearest hospital.",
                "medium": "I'm concerned about what you've said and want to help ensure your safety. I can hear that you're in significant distress right now.",
                "low": "I can hear that you're going through a difficult time and it sounds important that we talk more about this."
            },
            "hi-IN": {
                "high": "आपके द्वारा बताई गई बातों से मुझे काफी चिंता हो रही है और मुझे आपकी सुरक्षा के लिए तत्काल कदम उठाने की जरूरत है। कृपया अभी आपातकालीन सेवाएं कॉल करें या पास के अस्पताल जाएं।",
                "medium": "आपके कहे हुए समय की वजह से मुझे आपकी सुरक्षा की चिंता है। मैं सुन सकता हूं कि आप काफी परेशान हैं।",
                "low": "ऐसा लगता है कि आप काफी मुश्किल समय से गुजर रहे हैं और यह importante है कि हम इसके बारे में और बात करें।"
            },
            "ta-IN": {
                "high": "நீங்கள் சொன்னவற்றால் எனக்கு மிகவும் கவலை இருக்கிறது மற்றும் உங்கள் பாதுகாப்புக்காக உடனடியாக நடவடிக்கை எடுக்க வேண்டும். தயவு செய்து இப்போதே துர்பல சேவைகளை அழைக்கவும் அல்லது அருகிலுள்ள மருத்துவமனைக்கு செல்லுங்கள்.",
                "medium": "உங்கள் வார்த்றையால் உங்கள் பாதுகாப்பைப் பற்றி எனக்கு கவலை இருக்கிறது. நீங்கள் இப்போது மிகவும் துன்பமாக இருப்பதை யான் கேட்கலாம்.",
                "low": "நீங்கள் கடினமான காலத்தை கடந்து வருகிறீர்கள் என்று தெரிகிறது மற்றும் இதைப்பற்றி மேலும் பேசுவதில் முக்கியம் இருக்கிறது."
            }
        }

    def _get_helpline_info(self, lang: str) -> str:
        """Get helpline information for the specified language"""
        helplines = {
            "en-IN": "Support helplines: AASRA (9820466726), iCall (9152987821), Kiran (1800-599-0019), Emergency: 112",
            "hi-IN": "सहायक हेल्पलाइंस: AASRA (9820466726), iCall (9152987821), Kiran (1800-599-0019), आपातकाल: 112",
            "ta-IN": "துணை செய்தி லைன்கள்: AASRA (9820466726), iCall (9152987821), Kiran (1800-599-0019), அவசரநிலை: 112"
        }
        return helplines.get(lang, helplines["en-IN"])

# Global instances
_classifier = RiskClassifier()
_safety_generator = SafetyResponseGenerator()

def classify_risk(text: str) -> Dict[str, Any]:
    """Convenience function to classify risk"""
    return _classifier.classify(text)

def generate_safety_reply(risk_level: str, lang: str = "en-IN") -> str:
    """Convenience function to generate safety reply"""
    return _safety_generator.generate_safety_reply(risk_level, lang)
