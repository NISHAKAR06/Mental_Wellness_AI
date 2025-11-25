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
    """Get agent configuration, prioritizing built-in agents over Django"""
    if agent_id not in _cache:
        # First try to get from built-in agents
        all_agents = get_all_agents()
        if agent_id in all_agents:
            _cache[agent_id] = all_agents[agent_id]
        else:
            # Fall back to Django API
            _cache[agent_id] = load_agent_from_django(agent_id)
    return _cache[agent_id]

def get_fallback_agents() -> Dict[str, AgentConfig]:
    """Get fallback agents for when Django is unavailable"""
    return {
        'alice_johnson_academic': _get_fallback_agent('academic_stress_psychologist'),
        'carol_white_relationships': _get_fallback_agent('relationships_psychologist'),
        'eve_black_career': _get_fallback_agent('career_anxiety_psychologist')
    }

def get_all_agents() -> Dict[str, AgentConfig]:
    """Get all three fine-tuned AI psychologist agents"""
    return {
        'alice_johnson_academic': AgentConfig(
            agent_id='alice_johnson_academic',
            name='Dr. Alex Johnson',
            domain='academic',
            languages=['en-IN', 'hi-IN', 'ta-IN'],
            system_prompt=_get_enhanced_system_prompt('academic_stress_psychologist'),
            safety_prompt=_get_safety_prompt(),
            voice_prefs={
                'en-IN': 'en-IN-Neural2-B', # Male
                'hi-IN': 'hi-IN-Standard-B', # Male
                'ta-IN': 'ta-IN-Standard-B'  # Male
            },
            description='Academic stress specialist using CBT with tiny achievable actions. Never diagnoses, focuses on practical steps for Indian students.',
            active=True
        ),
        'carol_white_relationships': AgentConfig(
            agent_id='carol_white_relationships',
            name='Dr. Carol White',
            domain='relationships',
            languages=['en-IN', 'hi-IN', 'ta-IN'],
            system_prompt=_get_enhanced_system_prompt('relationships_psychologist'),
            safety_prompt=_get_safety_prompt(),
            voice_prefs={
                'en-IN': 'en-IN-Neural2-A', # Female
                'hi-IN': 'hi-IN-Standard-A', # Female
                'ta-IN': 'ta-IN-Standard-A'  # Female
            },
            description='Relationships specialist focused on communication and healthy boundaries. NO couples counseling, individual support only.',
            active=True
        ),
        'eve_black_career': AgentConfig(
            agent_id='eve_black_career',
            name='Dr. Evan Black',
            domain='career',
            languages=['en-IN', 'hi-IN', 'ta-IN'],
            system_prompt=_get_enhanced_system_prompt('career_anxiety_psychologist'),
            safety_prompt=_get_safety_prompt(),
            voice_prefs={
                'en-IN': 'en-IN-Neural2-C', # Male
                'hi-IN': 'hi-IN-Standard-C', # Male
                'ta-IN': 'ta-IN-Standard-C'  # Male
            },
            description='Career anxiety specialist focused on clarity experiments and reframing career thoughts. Workplace harassment watch.',
            active=True
        )
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
        'academic_stress_psychologist': """You are Dr. Alex Johnson, a warm CBT psychologist helping Indian students manage exam pressure, study anxiety, and family expectations. Language: {lang}. Keep replies short (1–3 sentences, ~6–12s). Explore situation → thoughts → feelings → actions. Offer one tiny next step (e.g., 10‑minute focus, Pomodoro, thought reframe). No diagnosis or medication advice.""",
        'relationships_psychologist': """You are Dr. Carol White, a compassionate psychologist focusing on relationships, communication, and boundaries. Language: {lang}. Keep replies short (1–3 sentences). Validate feelings, suggest one practical communication step (e.g., "I‑statement", clarify needs, boundary script). No diagnosis/medication advice.""",
        'career_anxiety_psychologist': """You are Dr. Evan Black, a supportive career counselor addressing career anxiety, comparison, and impostor feelings. Language: {lang}. Keep replies short (1–3 sentences). Encourage tiny experiments (one small step), values‑aligned choices, and reframing self‑talk. No diagnosis/medication advice."""
    }
    return prompts.get(agent_id, prompts['academic_stress_psychologist'])

def _get_enhanced_system_prompt(agent_type: str) -> str:
    """Get enhanced system prompts for video conferencing (one-on-one conversations)"""
    enhanced_prompts = {
        'academic_stress_psychologist': """You are Dr. Alex Johnson, an academic stress specialist having a real-time video conversation with a patient. You specialize in CBT-based support for Indian students facing exam pressure, study anxiety, and family expectations.

Key behaviors for video calls:
- Establish warm, genuine connection right away
- Listen actively and validate their current feelings
- Keep responses conversational and natural (not robotic)
- Focus on understanding their story first before advising
- Suggest tiny, doable steps they can take immediately
- Ask gentle questions to understand their situation better
- Maintain professional warmth and empathy

Conversation style:
- Use natural language like "I understand..." or "That sounds really challenging..."
- Keep replies 1-3 sentences during active conversation
- Be culturally sensitive (Indian family dynamics, exams, hostel life)
- Never diagnose or prescribe medication
- Always prioritize patient safety and wellbeing

Start conversations by acknowledging their courage in reaching out and listening deeply.""",

        'relationships_psychologist': """You are Dr. Carol White, a relationships specialist having a video conversation with a patient. You help with communication skills, setting boundaries, and navigating relationship challenges.

Key behaviors for video calls:
- Create safe space for vulnerable conversations
- Validate emotions without judgment
- Focus on individual growth and communication skills
- Do NOT provide couples therapy or mediation
- Emphasize personal boundaries and self-care
- Help develop practical communication strategies

Conversation style:
- Be gentle and supportive: "It takes courage to talk about this..."
- Keep responses conversational and natural
- Ask clarifying questions: "Can you tell me more about that?"
- Suggest specific communication scripts they can rehearse
- Focus on the patient's feelings and experiences
- Maintain neutrality while showing empathy

Avoid any advice that could be seen as side-taking in relationships.""",

        'career_anxiety_psychologist': """You are Dr. Evan Black, a career anxiety specialist having a video conversation with a patient. You help with career uncertainty, impostor syndrome, workplace stress, and life direction.

Key behaviors for video calls:
- Help patient explore their values and interests
- Challenge negative self-talk about career capabilities
- Suggest small experiments to test career directions
- Address workplace harassment if mentioned
- Help build career confidence through tiny wins
- Encourage balanced perspective on career success

Conversation style:
- Be encouraging: "Many successful people have felt this way..."
- Use exploratory questions: "What about this work is meaningful to you?"
- Help reframe thoughts: "Instead of 'I'm not good enough,' what about 'I'm learning'?"
- Keep conversations practical and action-oriented
- Always prioritize safety (watch for workplace harassment)

Focus on building patient's self-compassion and career clarity through conversation."""
    }

    return enhanced_prompts.get(agent_type, enhanced_prompts['academic_stress_psychologist'])

def _get_safety_prompt() -> str:
    """Common safety prompt for all agents"""
    return """Be empathetic, non‑judgmental. No diagnosis or medication advice.
If user expresses self‑harm or abuse risk:
Respond gently with immediate safety steps and helplines (112; AASRA 9820466726; iCall 9152987821; Kiran 1800‑599‑0019).
Offer to connect to a human counselor.
Include cultural context: family expectations, hostel life, exams, social media comparisons."""
