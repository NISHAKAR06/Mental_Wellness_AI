"""
LLM module for AI Psychologist service using Gemini
Handles LLM conversations, function calling, and safety responses
"""
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from typing import Dict, List, Optional, Tuple, Any
import json
import base64
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    print("⚠️ WARNING: GEMINI_API_KEY not found in environment variables. LLM functionality will fail.")

class LLMHandler:
    def __init__(self):
        self.model_name = "gemini-1.5-flash"
        self.generation_config = GenerationConfig(
            temperature=0.4,
            max_output_tokens=250,  # Keep responses short
            top_p=0.9,
            top_k=40
        )

    def generate_reply(
        self,
        system_prompt: str,
        user_text: str,
        memory_turns: List[Dict[str, str]],
        emotion_snapshot: Optional[Dict[str, float]] = None,
        rag_passages: Optional[List[str]] = None,
        function_schemas: Optional[List[Dict]] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Generate AI reply using Gemini

        Returns:
            Tuple[str, Dict]: reply text and metadata (including function calls)
        """
        try:
            # Build conversation history
            messages = []

            # Add memory turns (limited to last 6-8)
            for turn in memory_turns[-6:]:
                messages.append({
                    "role": "user",
                    "parts": [turn["user"]]
                })
                messages.append({
                    "role": "model",
                    "parts": [turn["assistant"]]
                })

            # Add rag context to system prompt if available
            if rag_passages:
                rag_context = "\n".join(rag_passages[:3])  # Limit to 3 passages
                system_prompt += f"\n\nRelevant context:\n{rag_context}"

            # Add emotion context if available
            if emotion_snapshot:
                emotion_text = self._format_emotion_context(emotion_snapshot)
                if emotion_text:
                    system_prompt += f"\n{emotion_text}"

            # Add current user message
            messages.append({
                "role": "user",
                "parts": [user_text]
            })

            # Create model with system instruction
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_prompt
            )

            # Add function calling if available
            if function_schemas:
                # Note: Gemini function calling would be implemented here
                # For now, we'll use heuristics to determine function calls
                function_call = self._check_function_trigger(user_text, function_schemas)
                if function_call:
                    return self._execute_function_locally(function_call), {"function_called": function_call}

            # Generate response
            response = model.generate_content(
                messages,
                generation_config=self.generation_config
            )

            reply_text = response.text.strip() if response.text else ""

            # Check if this should trigger safety response
            safety_metadata = self._analyze_for_safety(reply_text)
            if safety_metadata:
                return reply_text, safety_metadata

            return reply_text, {"response_type": "normal"}

        except Exception as e:
            print(f"Error generating reply: {e}")
            return "I'm sorry, I encountered an error processing your message. Please try again.", {"error": str(e)}

    def _format_emotion_context(self, emotion_snapshot: Dict[str, float]) -> str:
        """Format emotion data into contextual prompt text"""
        if not emotion_snapshot:
            return ""

        # Check for high anxiety/stress
        anxious = emotion_snapshot.get('anxious', 0)
        stressed = emotion_snapshot.get('stressed', 0)
        happy = emotion_snapshot.get('happy', 0)
        neutral = emotion_snapshot.get('neutral', 0)

        if anxious + stressed > 0.6:
            return "Emotional context: User appears stressed or anxious - consider offering calming techniques first."

        if happy > 0.7 and neutral < 0.3:
            return "Emotional context: User appears positive and engaged."

        if stressed > 0.5:
            return "Emotional context: User appears somewhat stressed - pay extra attention to gentle communication."

        return ""

    def _check_function_trigger(self, user_text: str, function_schemas: List[Dict]) -> Optional[Dict]:
        """Check if user text triggers a function call using simple heuristics"""
        # This is a simple implementation - in production, use Gemini's function calling
        lower_text = user_text.lower()

        for schema in function_schemas:
            func_name = schema.get("name", "")
            if func_name == "breathing_exercise" and any(word in lower_text for word in ["breath", "breathe", "calm", "relax"]):
                return {"name": "breathing_exercise", "parameters": {"duration_sec": 300}}
            elif func_name == "grounding_5_4_3_2_1" and any(word in lower_text for word in ["ground", "present", "mindful"]):
                return {"name": "grounding_5_4_3_2_1", "parameters": {}}
            elif func_name == "thought_record" and any(word in lower_text for word in ["think", "thought", "negative", "mind"]):
                return {"name": "thought_record", "parameters": {"start_prompt": "Let's examine what you're thinking..."}}

        return None

    def _execute_function_locally(self, function_call: Dict) -> str:
        """Execute functions locally when triggered"""
        func_name = function_call.get("name")
        params = function_call.get("parameters", {})

        if func_name == "breathing_exercise":
            duration = params.get("duration_sec", 300)
            return f"Okay, let's do a breathing exercise for {duration // 60} minutes. Sit comfortably, place one hand on your chest and one on your belly. Breathe in slowly through your nose for 4 counts, hold for 4, then exhale through your mouth for 6 counts. Focus on your breath moving in and out."

        elif func_name == "grounding_5_4_3_2_1":
            return "Let's do the 5-4-3-2-1 grounding exercise. Name 5 things you can see around you. Now 4 things you can touch. 3 things you can hear. 2 things you can smell. And 1 thing you can taste. How do you feel now?"

        elif func_name == "thought_record":
            return f"Let's create a thought record. {params.get('start_prompt', 'What thought is troubling you right now?')} We'll examine this thought objectively and see if we can find a more balanced perspective."

        return "I'm not sure about that specific technique right now. Let's talk about what's on your mind."

    def _analyze_for_safety(self, response: str) -> Optional[Dict]:
        """Analyze response for safety concerns and return metadata"""
        # This could be enhanced with more sophisticated analysis
        safety_keywords = ["helpline", "crisis", "emergency", "suicide", "harm"]
        if any(keyword in response.lower() for keyword in safety_keywords):
            return {
                "response_type": "safety",
                "safety_level": "medium"
            }
        return None

def generate_reply(
    system_prompt: str,
    user_text: str,
    memory_turns: List[Dict[str, str]],
    emotion_snapshot: Optional[Dict[str, float]] = None,
    rag_passages: Optional[List[str]] = None
) -> str:
    """Convenience function for generating replies"""
    handler = LLMHandler()
    reply_text, _ = handler.generate_reply(
        system_prompt=system_prompt,
        user_text=user_text,
        memory_turns=memory_turns,
        emotion_snapshot=emotion_snapshot,
        rag_passages=rag_passages
    )
    return reply_text
