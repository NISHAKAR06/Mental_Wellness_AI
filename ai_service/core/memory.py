"""
Memory management module for AI Psychologist service
Handles conversation context and session memory with consent management
"""
from typing import List, Dict, Any, Optional
import json
import os
from datetime import datetime
from dataclasses import dataclass, asdict
from dotenv import load_dotenv

load_dotenv()

@dataclass
class ConversationTurn:
    user_text: str
    assistant_response: str
    timestamp: datetime
    emotion_context: Optional[Dict[str, float]] = None

class MemoryManager:
    """
    Manages conversation memory for AI Psychologist sessions
    Respects user consent for data storage and handles short-term memory
    """
    def __init__(self, session_id: str, consent_store: bool = False):
        self.session_id = session_id
        self.consent_store = consent_store
        self.memory: List[ConversationTurn] = []
        self.max_turns = int(os.getenv("MEMORY_MAX_TURNS", "10"))

        # Redis would be used here in production for distributed instances
        # For now, using in-memory storage per session

    def add_turn(self, user_text: str, assistant_response: str, emotion_context: Optional[Dict[str, float]] = None):
        """Add a new conversation turn to memory"""
        turn = ConversationTurn(
            user_text=user_text,
            assistant_response=assistant_response,
            timestamp=datetime.utcnow(),
            emotion_context=emotion_context
        )

        self.memory.append(turn)

        # Keep only recent turns (sliding window)
        if len(self.memory) > self.max_turns:
            self.memory = self.memory[-self.max_turns:]

        print(f"Added turn to memory for session {self.session_id}: {len(self.memory)} turns total")

    def get_context(self, last_n_turns: Optional[int] = None) -> List[Dict[str, str]]:
        """
        Get conversation context as list of message dictionaries
        Returns format suitable for LLM prompt building
        """
        if last_n_turns:
            turns_to_use = self.memory[-last_n_turns:]
        else:
            turns_to_use = self.memory

        context = []
        for turn in turns_to_use:
            context.append({
                "user": turn.user_text,
                "assistant": turn.assistant_response
            })

        return context

    def get_full_memory(self) -> List[Dict[str, Any]]:
        """Get full memory for persistence (if consent given)"""
        if not self.consent_store:
            return []

        return [
            {
                "user_text": turn.user_text,
                "assistant_response": turn.assistant_response,
                "timestamp": turn.timestamp.isoformat(),
                "emotion_context": turn.emotion_context
            }
            for turn in self.memory
        ]

    def persist_to_backend(self, django_url: str):
        """Persist conversation to Django backend if consent given"""
        if not self.consent_store or not self.memory:
            return

        try:
            import requests

            memory_data = self.get_full_memory()

            # In production, you might batch send turns or send periodically
            # For now, this is a placeholder structure
            payload = {
                "session_id": self.session_id,
                "conversations": memory_data
            }

            response = requests.post(
                f"{django_url}/api/turns/bulk/",
                json=payload,
                timeout=10
            )

            if response.status_code == 200:
                print(f"Persisted {len(self.memory)} turns for session {self.session_id}")
            else:
                print(f"Failed to persist turns: {response.status_code}")

        except Exception as e:
            print(f"Error persisting memory: {e}")

    def get_conversation_summary(self) -> str:
        """Generate a brief summary of the conversation so far"""
        if not self.memory:
            return "Starting a new conversation."

        total_turns = len(self.memory)
        last_exchange = self.memory[-1] if self.memory else None

        summary = f"Conversation with {total_turns} exchanges."

        if last_exchange:
            # Brief summary of last few exchanges
            recent_turns = self.memory[-3:] if len(self.memory) >= 3 else self.memory
            user_inputs = [turn.user_text[:50] for turn in recent_turns]
            summary += f" Recent topics: {'; '.join(user_inputs)}"

        return summary

    def search_relevant_context(self, query: str, max_results: int = 3) -> List[str]:
        """Search for relevant conversation turns (simple keyword matching)"""
        query_lower = query.lower()

        relevant_turns = []
        for turn in self.memory:
            # Simple keyword matching in user text and assistant response
            if any(keyword in turn.user_text.lower() or
                   keyword in turn.assistant_response.lower()
                   for keyword in query_lower.split()):
                relevant_turns.append(f"User: {turn.user_text} | Assistant: {turn.assistant_response}")

                if len(relevant_turns) >= max_results:
                    break

        return relevant_turns

    def clear_memory(self):
        """Clear all conversation memory"""
        self.memory = []

    def get_memory_stats(self) -> Dict[str, Any]:
        """Get statistics about current memory usage"""
        return {
            "session_id": self.session_id,
            "total_turns": len(self.memory),
            "consent_store": self.consent_store,
            "max_turns": self.max_turns,
            "last_turn_timestamp": self.memory[-1].timestamp.isoformat() if self.memory else None
        }

# Global memory managers for active sessions
_active_memory_managers: Dict[str, MemoryManager] = {}

def get_memory_manager(session_id: str, consent_store: bool = False) -> MemoryManager:
    """Get or create memory manager for session"""
    if session_id not in _active_memory_managers:
        _active_memory_managers[session_id] = MemoryManager(session_id, consent_store)

    return _active_memory_managers[session_id]

def cleanup_memory_manager(session_id: str):
    """Remove memory manager when session ends"""
    if session_id in _active_memory_managers:
        # Optionally persist final state here
        manager = _active_memory_managers[session_id]
        if manager.consent_store:
            manager.persist_to_backend(os.getenv("DJANGO_URL", "http://localhost:8000"))

        del _active_memory_managers[session_id]

def get_active_sessions_count() -> int:
    """Get count of active memory managers (sessions)"""
    return len(_active_memory_managers)
