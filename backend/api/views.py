from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.utils import timezone
import json
import jwt
from datetime import datetime, timedelta
import google.generativeai as genai
from api.models import Agent, VoiceSession, SafetyAlert

# Configure the Gemini API key
genai.configure(api_key=settings.GEMINI_API_KEY)

User = get_user_model()

# Agent API Endpoints

@csrf_exempt
def get_agents(request):
    if request.method == 'GET':
        agents = Agent.objects.filter(active=True).order_by('name')
        agents_data = []
        for agent in agents:
            agents_data.append({
                'id': agent.agent_id,
                'name': agent.name,
                'domain': agent.domain,
                'languages': agent.languages,
                'description': agent.description,
                'voice_prefs': agent.voice_prefs
            })
        return JsonResponse({'agents': agents_data})
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def get_agent_by_id(request, agent_id):
    if request.method == 'GET':
        try:
            agent = Agent.objects.get(agent_id=agent_id, active=True)
            return JsonResponse({
                'agent': {
                    'id': agent.agent_id,
                    'name': agent.name,
                    'domain': agent.domain,
                    'languages': agent.languages,
                    'description': agent.description,
                    'voice_prefs': agent.voice_prefs
                }
            })
        except Agent.DoesNotExist:
            return JsonResponse({'error': 'Agent not found'}, status=404)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

# Session Management Endpoints

@csrf_exempt
def start_session(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            agent_id = data.get('agent_id')
            lang = data.get('lang', 'en-IN')
            consent_store = data.get('consent_store', False)

            # Validate required data
            if not agent_id:
                return JsonResponse({'error': 'agent_id is required'}, status=400)

            # Get agent
            agent = Agent.objects.get(agent_id=agent_id, active=True)

            # Create or get demo user for testing (in production, use authenticated user)
            user, created = get_user_model().objects.get_or_create(
                username='demo_user',
                defaults={
                    'email': 'demo@example.com',
                    'first_name': 'Demo',
                    'last_name': 'User'
                }
            )

            # If user was just created, set a simple password for demo purposes
            if created:
                user.set_password('demo123')
                user.save()

            # Create VoiceSession
            session = VoiceSession.objects.create(
                user=user,
                agent=agent,
                lang=lang,
                consented_store=consent_store,
                risk_level='none'
            )

            # Generate WS token (10 minutes)
            token_payload = {
                'user_id': session.user_id,
                'session_id': str(session.session_id),
                'agent_id': session.agent.agent_id,
                'lang': session.lang,
                'consent': consent_store,
                'exp': datetime.utcnow() + timedelta(minutes=10)
            }
            token = jwt.encode(token_payload, settings.SECRET_KEY, algorithm='HS256')

            # Ensure token is string (PyJWT returns bytes in older versions)
            if isinstance(token, bytes):
                token = token.decode('utf-8')

            return JsonResponse({
                'session_id': str(session.session_id),
                'ws_url': f'ws://localhost:8001/ws/voice/{session.session_id}/',
                'ws_token': token,
                'agent': {
                    'id': agent.agent_id,
                    'name': agent.name,
                    'voice_prefs': agent.voice_prefs
                }
            })

        except Agent.DoesNotExist:
            return JsonResponse({'error': 'Agent not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def end_session(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            session_id = data.get('session_id')

            if not session_id:
                return JsonResponse({'error': 'session_id is required'}, status=400)

            session = VoiceSession.objects.get(session_id=session_id)
            session.ended_at = timezone.now()
            session.duration_sec = (session.ended_at - session.started_at).total_seconds()
            session.save()

            return JsonResponse({'message': 'Session ended successfully'})

        except VoiceSession.DoesNotExist:
            return JsonResponse({'error': 'Session not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

# Safety Alerts Endpoint (for internal AI service calls)

@csrf_exempt
def create_safety_alert(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            session_id = data.get('session_id')
            risk_level = data.get('risk_level')
            summary = data.get('summary')

            if not all([user_id, session_id, risk_level, summary]):
                return JsonResponse({'error': 'Missing required fields'}, status=400)

            session = VoiceSession.objects.get(session_id=session_id)
            user = User.objects.get(id=user_id)

            alert = SafetyAlert.objects.create(
                user=user,
                session=session,
                risk_level=risk_level,
                summary=summary
            )

            # Update session risk level if higher
            if risk_level in ['medium', 'high']:
                session.risk_level = risk_level
                session.save()

            return JsonResponse({'alert_id': alert.id, 'message': 'Alert created'})

        except VoiceSession.DoesNotExist:
            return JsonResponse({'error': 'Session not found'}, status=404)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

# Keep existing session summary function

@csrf_exempt
def summarize_session(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        session_notes = data.get('session_notes', '')

        try:
            # Generate the summary using the Gemini API
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Analyze the following therapy session notes and generate a summary in the following format:

            **Main Themes:**
            - [Theme 1]
            - [Theme 2]
            - [Theme 3]

            **Key Insights:**
            - [Insight 1]
            - [Insight 2]
            - [Insight 3]

            **Action Items:**
            - [Action Item 1]
            - [Action Item 2]
            - [Action Item 3]

            **Next Session Goals:**
            - [Goal 1]
            - [Goal 2]
            - [Goal 3]

            Session Notes:
            {session_notes}
            """
            response = model.generate_content(prompt)

            # Parse the response and format it as JSON
            summary = parse_summary(response.text)

            return JsonResponse(summary)
        except Exception as e:
            print(f"An error occurred during Gemini API call: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

def parse_summary(text):
    summary = {
        'mainThemes': [],
        'keyInsights': [],
        'actionItems': [],
        'nextSessionGoals': []
    }
    current_section = None
    for line in text.split('\n'):
        line = line.strip()
        if line.startswith('**Main Themes:**'):
            current_section = 'mainThemes'
        elif line.startswith('**Key Insights:**'):
            current_section = 'keyInsights'
        elif line.startswith('**Action Items:**'):
            current_section = 'actionItems'
        elif line.startswith('**Next Session Goals:**'):
            current_section = 'nextSessionGoals'
        elif line.startswith('- ') and current_section:
            summary[current_section].append(line[2:])
    return summary
