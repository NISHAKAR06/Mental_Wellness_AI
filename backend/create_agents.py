#!/usr/bin/env python3
import os
import django
import sys
from pathlib import Path

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Agent

def create_agents():
    """Create the 3 AI psychologist agents with correct domain constraints"""

    # Fixed domains to match model constraints (character varying(20))
    agents_data = [
        {
            'agent_id': 'eve_black_career',
            'name': 'Dr. Eve Black',
            'domain': 'career',  # Exactly as per your specification
            'languages': ['en-IN', 'hi-IN', 'ta-IN'],
            'description': 'Career anxiety specialist focused on clarity, experiments, and reframing.',
            'system_prompt': 'You are Dr. Eve Black, career anxiety specialist. Focus on clarity, small experiments, reframing thoughts. Keep responses 1-3 sentences.',
            'safety_prompt': 'Check for workplace harassment. Provide helplines: AASRA 9820466726',
            'voice_prefs': {'en-IN': 'en-IN-Neural2-A', 'hi-IN': 'hi-IN-Standard-A', 'ta-IN': 'ta-IN-Standard-A'},
            'active': True
        },
        {
            'agent_id': 'carol_white_relationships',
            'name': 'Dr. Carol White',
            'domain': 'relationships',  # Exactly as per your specification
            'languages': ['en-IN', 'hi-IN', 'ta-IN'],
            'description': 'Relationships problems specialist focused on communication and boundaries.',
            'system_prompt': 'You are Dr. Carol White, relationships specialist. Focus on communication skills, boundaries, validation. Keep responses short.',
            'safety_prompt': 'Check for domestic violence. Never provide couples counseling unless requested.',
            'voice_prefs': {'en-IN': 'en-IN-Neural2-B', 'hi-IN': 'hi-IN-Standard-B', 'ta-IN': 'ta-IN-Standard-B'},
            'active': True
        },
        {
            'agent_id': 'alice_johnson_academic',
            'name': 'Dr. Alice Johnson',
            'domain': 'academic',  # Exactly as per your specification
            'languages': ['en-IN', 'hi-IN', 'ta-IN'],
            'description': 'Academic stress specialist using CBT with tiny achievable actions.',
            'system_prompt': 'You are Dr. Alice Johnson, academic stress specialist. Use CBT, tiny actions, pomodoro. Keep responses 1-3 sentences.',
            'safety_prompt': 'Check for academic burnout, suicidal ideation. Provide Kiran: 1800-599-0019',
            'voice_prefs': {'en-IN': 'en-IN-Neural2-A', 'hi-IN': 'hi-IN-Standard-A', 'ta-IN': 'ta-IN-Standard-A'},
            'active': True
        }
    ]

    for agent_data in agents_data:
        Agent.objects.get_or_create(
            agent_id=agent_data['agent_id'],
            defaults=agent_data
        )

    print("✅ All 3 AI psychologist agents created successfully!")

    # Show summary
    print("\n📋 Available agents:")
    for agent in Agent.objects.filter(active=True):
        print(f"   • {agent.name} ({agent.domain}) - {agent.agent_id}")

if __name__ == '__main__':
    create_agents()
