"""
Agent management and configuration module for AI Psychologist service
"""
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
import requests
import os
from dotenv import load_dotenv

load_dotenv()

@dataclass
class AgentConfig:
    agent_id: str
    name: str
    domain: str
    languages: List[str]
    system_prompt: str
    safety_prompt: str
    voice_prefs: Dict[str, str]
    description: str
    active: bool = True

    def build_prompt(self, lang: str, emotion_snapshot: Optional[Dict] = None, rag_context: Optional[str] = None) -> str:
        """Build the complete system prompt for the agent"""
        tips = ""

        if emotion_snapshot:
            # Add emotional context adjustments
            anxious_stressed = emotion_snapshot.get('anxious', 0) + emotion_snapshot.get('stressed', 0)
            if anxious_stressed > 0.6:
                tips = "User seems tense; offer a calming first step before giving advice.\n"

        context = f"\nRelevant context:\n{rag_context}" if rag_context else ""

        return f"""{self.system_prompt}
{self.safety_prompt}
Language: {lang}. Keep replies short (1–3 sentences, ~6–12s). {tips}{context}"""

_cache: Dict[str, AgentConfig] = {}

def load_agent_from_django(agent_id: str) -> AgentConfig:
    """
    Load agent configuration from Django backend
    In production, replace with actual Django API endpoint
    """
    django_url = os.getenv("DJANGO_URL", "http://localhost:8000")

    try:
        response = requests.get(f"{django_url}/api/agents/{agent_id}/", timeout=5)
        if response.status_code == 200:
            agent_data = response.json()['agent']

            return AgentConfig(
                agent_id=agent_data['id'],
                name=agent_data['name'],
                domain=agent_data['domain'],
                languages=agent_data['languages'],
                description=agent_data['description'],
                system_prompt=_get_system_prompt(agent_id),
                safety_prompt=_get_safety_prompt(),
                voice_prefs=agent_data['voice_prefs'],
                active=True
            )

    except Exception as e:
        print(f"Error loading agent {agent_id}: {e}")

    # Fallback to seeded data if API fails
    return _get_fallback_agent(agent_id)

def get_agent(agent_id: str) -> AgentConfig:
    """Get agent configuration, using cache when available"""
    if agent_id not in _cache:
        _cache[agent_id] = load_agent_from_django(agent_id)
    return _cache[agent_id]

def get_fallback_agents() -> Dict[str, AgentConfig]:
    """Get fallback agents for when Django is unavailable"""
    return {
        'academic_stress_psychologist': _get_fallback_agent('academic_stress_psychologist'),
        'relationships_psychologist': _get_fallback_agent('relationships_psychologist'),
        'career_anxiety_psychologist': _get_fallback_agent('career_anxiety_psychologist')
    }

def _get_fallback_agent(agent_id: str) -> AgentConfig:
    """Fallback agent configurations"""
    agents_data = {
        'academic_stress_psychologist': {
            'name': 'Dr. Asha – Academic Stress',
            'domain': 'academic',
            'system_prompt': """You are Dr. Asha, a warm CBT psychologist helping Indian students manage exam pressure, study anxiety, and family expectations. Language: {lang}. Keep replies short (1–3 sentences, ~6–12s). Explore situation → thoughts → feelings → actions. Offer one tiny next step (e.g., 10‑minute focus, Pomodoro, thought reframe). No diagnosis or medication advice. If risk signals appear, follow safety policy and share helplines.""",
            'description': 'A warm CBT psychologist helping Indian students manage exam pressure, study anxiety, and family expectations.'
        },
        'relationships_psychologist': {
            'name': 'Dr. Meera – Relationships',
            'domain': 'relationships',
            'system_prompt': """You are Dr. Meera, a compassionate psychologist focusing on relationships, communication, and boundaries. Language: {lang}. Keep replies short (1–3 sentences). Validate feelings, suggest one practical communication step (e.g., "I‑statement", clarify needs, boundary script). No diagnosis/medication advice. Follow safety policy if risk appears.""",
            'description': 'A compassionate psychologist focusing on relationships, communication, and boundaries.'
        },
        'career_anxiety_psychologist': {
            'name': 'Dr. Arjun – Career Anxiety',
            'domain': 'career',
            'system_prompt': """You are Dr. Arjun, a supportive career counselor addressing career anxiety, comparison, and impostor feelings. Language: {lang}. Keep replies short (1–3 sentences). Encourage tiny experiments (one small step), values‑aligned choices, and reframing self‑talk. No diagnosis/medication advice. Follow safety policy if risk appears.""",
            'description': 'A supportive career counselor addressing career anxiety, comparison, and impostor feelings.'
        }
    }

    agent_data = agents_data.get(agent_id, agents_data['academic_stress_psychologist'])

    return AgentConfig(
        agent_id=agent_id,
        name=agent_data['name'],
        domain=agent_data['domain'],
        languages=['en-IN', 'hi-IN', 'ta-IN'],
        system_prompt=agent_data['system_prompt'],
        safety_prompt=_get_safety_prompt(),
        voice_prefs={
            'en-IN': 'en-IN-Neural2-A',
            'hi-IN': 'hi-IN-Standard-A',
            'ta-IN': 'ta-IN-Standard-A'
        },
        description=agent_data['description'],
        active=True
    )

def _get_system_prompt(agent_id: str) -> str:
    """Get agent-specific system prompts"""
    prompts = {
        'academic_stress_psychologist': """You are Dr. Asha, a warm CBT psychologist helping Indian students manage exam pressure, study anxiety, and family expectations. Language: {lang}. Keep replies short (1–3 sentences, ~6–12s). Explore situation → thoughts → feelings → actions. Offer one tiny next step (e.g., 10‑minute focus, Pomodoro, thought reframe). No diagnosis or medication advice.""",
        'relationships_psychologist': """You are Dr. Meera, a compassionate psychologist focusing on relationships, communication, and boundaries. Language: {lang}. Keep replies short (1–3 sentences). Validate feelings, suggest one practical communication step (e.g., "I‑statement", clarify needs, boundary script). No diagnosis/medication advice.""",
        'career_anxiety_psychologist': """You are Dr. Arjun, a supportive career counselor addressing career anxiety, comparison, and impostor feelings. Language: {lang}. Keep replies short (1–3 sentences). Encourage tiny experiments (one small step), values‑aligned choices, and reframing self‑talk. No diagnosis/medication advice."""
    }
    return prompts.get(agent_id, prompts['academic_stress_psychologist'])

def _get_safety_prompt() -> str:
    """Common safety prompt for all agents"""
    return """Be empathetic, non‑judgmental. No diagnosis or medication advice.
If user expresses self‑harm or abuse risk:
Respond gently with immediate safety steps and helplines (112; AASRA 9820466726; iCall 9152987821; Kiran 1800‑599‑0019).
Offer to connect to a human counselor.
Include cultural context: family expectations, hostel life, exams, social media comparisons."""
