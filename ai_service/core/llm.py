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
        self.model_name = "gemini-2.5-flash"
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

            # List of models to try in order of preference
            models_to_try = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"]
            
            response = None
            last_error = None

            for model_name in models_to_try:
                try:
                    print(f"🤖 Attempting to generate with model: {model_name}")
                    
                    # Try with system_instruction (supported by newer models)
                    try:
                        model = genai.GenerativeModel(
                            model_name=model_name,
                            system_instruction=system_prompt
                        )
                        response = model.generate_content(
                            messages,
                            generation_config=self.generation_config
                        )
                    except Exception as inner_e:
                        # Fallback for models/libraries that don't support system_instruction
                        # or if the API call fails with specific parameter errors
                        print(f"⚠️ Standard generation failed for {model_name}, trying prompt injection: {inner_e}")
                        
                        # Create a deep copy of messages for this attempt
                        fallback_messages = json.loads(json.dumps(messages))
                        
                        # Inject system prompt into the first user message
                        if fallback_messages and fallback_messages[0]['role'] == 'user':
                            fallback_messages[0]['parts'][0] = f"System Instruction: {system_prompt}\n\nUser Message: {fallback_messages[0]['parts'][0]}"
                        else:
                            fallback_messages.insert(0, {"role": "user", "parts": [f"System Instruction: {system_prompt}"]})
                            
                        model = genai.GenerativeModel(model_name=model_name)
                        response = model.generate_content(
                            fallback_messages,
                            generation_config=self.generation_config
                        )
                    
                    # If we got here, we have a response
                    if response:
                        break
                        
                except Exception as e:
                    print(f"❌ Model {model_name} failed: {e}")
                    last_error = e
                    continue

            if not response:
                print("💀 All models failed to generate a response.")
                if last_error:
                    print(f"Last error: {last_error}")
                    # Try to list available models for debugging
                    try:
                        print("📋 Available models for your API key:")
                        for m in genai.list_models():
                            if 'generateContent' in m.supported_generation_methods:
                                print(f"   - {m.name}")
                    except Exception as list_err:
                        print(f"Could not list models: {list_err}")
                        
                return self._offline_fallback_reply(user_text, emotion_snapshot), {"error": str(last_error), "response_type": "fallback"}

            # Safely extract text
            reply_text = ""
            if response.candidates and response.candidates[0].content.parts:
                reply_text = response.text.strip()
            elif response.prompt_feedback and response.prompt_feedback.block_reason:
                print(f"⚠️ Response blocked: {response.prompt_feedback.block_reason}")
                reply_text = "I'm sorry, I can't respond to that specific query due to safety guidelines. Can we discuss something else?"
            else:
                print(f"⚠️ Empty response from model. Finish reason: {response.candidates[0].finish_reason if response.candidates else 'Unknown'}")
                reply_text = "I'm listening. Could you please rephrase that?"

            # Check if this should trigger safety response
            safety_metadata = self._analyze_for_safety(reply_text)
            if safety_metadata:
                return reply_text, safety_metadata

            return reply_text, {"response_type": "normal"}

        except Exception as e:
            print(f"Error generating reply: {e}")
            return self._offline_fallback_reply(user_text, emotion_snapshot), {"error": str(e), "response_type": "fallback"}

    def _format_emotion_context(self, emotion_snapshot: Dict[str, float]) -> str:
        """Format emotion data into contextual prompt text"""
        if not emotion_snapshot:
            return ""

        # Create a detailed summary of the emotional state
        emotions_list = []
        normalized_snapshot: Dict[str, float] = {}
        for emotion, score in emotion_snapshot.items():
            try:
                score_value = float(score)
            except (TypeError, ValueError):
                continue

            normalized_snapshot[emotion] = score_value
            if score_value > 0.1:  # Only include significant emotions
                emotions_list.append(f"{emotion}: {score_value:.2f}")
        
        emotion_str = ", ".join(emotions_list)
        
        # Determine dominant emotion
        dominant_emotion = max(normalized_snapshot.items(), key=lambda x: x[1])[0] if normalized_snapshot else "neutral"
        
        context_msg = f"VISUAL OBSERVATION: The user's facial expression indicates the following emotions: [{emotion_str}]. The dominant emotion is '{dominant_emotion}'."
        
        # Add specific guidance based on dominant emotion
        if dominant_emotion in ['sad', 'sadness']:

            context_msg += " VISUAL OBSERVATION: User looks sad. Use this as context, but prioritize their spoken words."
        elif dominant_emotion in ['angry', 'anger']:
            context_msg += " VISUAL OBSERVATION: User looks angry. Keep this in mind while responding to their words."
        elif dominant_emotion in ['fear', 'fearful', 'anxious']:
            context_msg += " VISUAL OBSERVATION: User looks anxious. Be gentle, but focus on what they are saying."
        elif dominant_emotion in ['happy', 'happiness']:
            context_msg += " VISUAL OBSERVATION: User looks happy."
        elif dominant_emotion in ['neutral']:
            context_msg += " VISUAL OBSERVATION: User expression is neutral."
            
        return context_msg

    def _offline_fallback_reply(self, user_text: str, emotion_snapshot: Optional[Dict[str, float]] = None) -> str:
        """Generate a local response when Gemini is unavailable or quota-limited."""
        text = user_text.lower()

        if any(term in text for term in ["suicide", "kill myself", "harm myself", "end it"]):
            return "I'm very concerned about your safety. If you might act on these thoughts, call emergency services or a trusted person right now."

        if any(term in text for term in ["anxious", "anxiety", "stressed", "stress", "overwhelmed"]):
            return "That sounds overwhelming. Let's slow it down and focus on the one part that feels hardest right now."

        if any(term in text for term in ["sad", "depressed", "down", "hopeless"]):
            return "I'm sorry this feels heavy. We can keep this simple and work through one small step at a time."

        if emotion_snapshot:
            try:
                normalized = {k: float(v) for k, v in emotion_snapshot.items() if v is not None}
                dominant = max(normalized.items(), key=lambda item: item[1])[0] if normalized else "neutral"
                if dominant in ["sad", "fearful", "angry", "anxious"]:
                    return "I'm noticing distress in what you're sharing. We can take this one step at a time and focus on what feels most urgent."
            except Exception:
                pass

        return "I'm here with you. Tell me what has been on your mind most, and we'll take it one step at a time."

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
