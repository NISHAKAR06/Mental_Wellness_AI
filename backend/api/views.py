from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.decorators import api_view, permission_classes
from rest_framework import viewsets
import json
import jwt
from datetime import datetime, timedelta
import google.generativeai as genai
from .models import Agent, VoiceSession, SafetyAlert, UserProfile
from .serializers import RegisterSerializer, UserSerializer, AgentSerializer, VoiceSessionSerializer, SafetyAlertSerializer

# Configure the Gemini API key
genai.configure(api_key=settings.GEMINI_API_KEY)

User = get_user_model()

# Agent API Endpoints

@csrf_exempt
def get_agents(request):
    if request.method == 'GET':
        # Return agents from Django database only
        # FastAPI handles actual agent selection and management
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
            user_id = data.get('user_id', 'demo_user')
            
            # Create or get demo user for testing
            user, created = get_user_model().objects.get_or_create(
                username=user_id,
                defaults={
                    'email': f'{user_id}@example.com',
                    'first_name': 'Demo',
                    'last_name': 'User'
                }
            )

            # If user was just created, set a simple password
            if created:
                user.set_password('demo123')
                user.save()

            # Get or create a default agent for session storage
            # FastAPI will handle actual agent selection
            default_agent, agent_created = Agent.objects.get_or_create(
                agent_id='career_anxiety_psychologist',
                defaults={
                    'name': 'Default Agent (Managed by FastAPI)',
                    'domain': 'career',
                    'languages': ['en-IN'],
                    'description': 'Default placeholder - FastAPI manages actual agents',
                    'system_prompt': 'Managed by FastAPI',
                    'safety_prompt': 'Managed by FastAPI',
                    'voice_prefs': {}
                }
            )

            # Create VoiceSession with existing model fields
            session = VoiceSession.objects.create(
                user=user,
                agent=default_agent,  # Placeholder - FastAPI will handle real agent
                lang='en-IN',
                consented_store=True
            )

            # Generate JWT token for FastAPI authentication
            token_payload = {
                'user_id': user.id,
                'session_id': str(session.session_id),
                'exp': datetime.utcnow() + timedelta(hours=1)
            }
            token = jwt.encode(token_payload, settings.SECRET_KEY, algorithm='HS256')

            # Ensure token is string
            if isinstance(token, bytes):
                token = token.decode('utf-8')

            # FastAPI will handle all AI agent logic
            # Construct WebSocket URL dynamically based on settings
            ws_host = settings.FASTAPI_WS_URL
            ws_protocol = "wss" if "onrender.com" in ws_host or "https" in settings.FASTAPI_URL else "ws"
            
            return JsonResponse({
                'session_id': str(session.session_id),
                'ws_url': f'{ws_protocol}://{ws_host}/ws/voice/{session.session_id}',
                'ws_token': token,
                'message': 'Session created. AI agent will be managed by FastAPI service.'
            })

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
            # Check if API key is configured
            if not settings.GEMINI_API_KEY:
                return JsonResponse({'error': 'Gemini API key not configured'}, status=500)

            # Try different model names in order of preference
            model_names = ['gemini-2.5-flash', 'gemini-2.5-flash-preview-05-20', 'gemini-2.5-pro-preview-03-25']
            model = None

            for model_name in model_names:
                try:
                    model = genai.GenerativeModel(model_name)
                    # Test the model with a simple request
                    test_response = model.generate_content("Test")
                    if test_response:
                        print(f"✅ Using Gemini model: {model_name}")
                        break
                except Exception as e:
                    print(f"❌ Model {model_name} not available: {e}")
                    continue

            if not model:
                return JsonResponse({'error': 'No available Gemini models found. Please check your API key and model availability.'}, status=500)

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
            return JsonResponse({'error': f'Gemini API error: {str(e)}'}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

# Auth Views

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_me(request):
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

# Agents ViewSet

class AgentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Agent.objects.filter(active=True)
    serializer_class = AgentSerializer
    lookup_field = 'agent_id'

# Sessions API

from rest_framework.views import APIView
from rest_framework.parsers import JSONParser

class SessionSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        data = request.data
        session_id = data.get("session_id")
        transcript = data.get("transcript")
        summary = data.get("summary")
        emotion_timeline = data.get("emotion_timeline")
        risk_outcomes = data.get("risk_outcomes")

        if not session_id:
            return Response({"error": "session_id is required"}, status=400)
        try:
            session = VoiceSession.objects.get(session_id=session_id, user=request.user)
            session.transcript = transcript
            session.summary = summary
            session.emotion_timeline = emotion_timeline
            session.risk_outcomes = risk_outcomes
            session.save()
            return Response({"message": "Session summary saved"})
        except VoiceSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_session_view(request):
    try:
        data = request.data
        agent_id = data.get('agent_id')
        lang = data.get('lang', 'en-IN')
        consent_store = data.get('consent_store', False)

        if not agent_id:
            return Response({'error': 'agent_id is required'}, status=400)

        agent = Agent.objects.get(agent_id=agent_id, active=True)
        session = VoiceSession.objects.create(
            user=request.user,
            agent=agent,
            lang=lang,
            consented_store=consent_store
        )

        token_payload = {
            'user_id': request.user.id,
            'session_id': str(session.session_id),
            'agent_id': agent.agent_id,
            'lang': lang,
            'consent': consent_store,
            'exp': datetime.utcnow() + timedelta(minutes=10)
        }
        token = jwt.encode(token_payload, settings.SECRET_KEY, algorithm='HS256')

        ws_host = settings.FASTAPI_WS_URL or "localhost:8001"
        ws_protocol = "wss" if "onrender.com" in ws_host or "https" in settings.FASTAPI_URL else "ws"

        return Response({
            'session_id': str(session.session_id),
            'ws_url': f'{ws_protocol}://{ws_host}/ws/voice/{session.session_id}',
            'ws_token': token if isinstance(token, str) else token.decode('utf-8'),
            'agent': AgentSerializer(agent).data
        })

    except Agent.DoesNotExist:
        return Response({'error': 'Agent not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_session_view(request):
    try:
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id is required'}, status=400)

        session = VoiceSession.objects.get(session_id=session_id, user=request.user)
        session.ended_at = timezone.now()
        session.duration_sec = (session.ended_at - session.started_at).total_seconds()
        session.save()

        return Response({'message': 'Session ended'})

    except VoiceSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)

# Internal AI Alerts

@api_view(['POST'])
@permission_classes([])  # AllowAny but with header check
def create_safety_alert_view(request):
    auth_token = request.headers.get('X-Internal-Token')
    if auth_token != settings.INTERNAL_AI_TOKEN:
        return Response({'error': 'Unauthorized'}, status=401)

    try:
        session = VoiceSession.objects.get(session_id=request.data.get('session_id'))
        alert = SafetyAlert.objects.create(
            user=session.user if request.data.get('user_id') else None,
            session=session,
            risk_level=request.data['risk_level'],
            summary=request.data['summary']
        )
        if request.data['risk_level'] in ['medium', 'high']:
            session.risk_level = request.data['risk_level']
            session.save()
        return Response({'alert_id': alert.id})

    except VoiceSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# Token Obtain with Profile

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = self.get_user_from_token(response.data['access'])
            response.data['user'] = UserSerializer(user).data
        return response

    def get_user_from_token(self, token):
        from rest_framework_simplejwt.tokens import AccessToken
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        return User.objects.get(id=user_id)

def parse_summary(text):
    """Parse the detailed summary format with ** headers"""
    summary = {
        'mainThemes': [],
        'keyInsights': [],
        'actionItems': [],
        'nextSessionGoals': []
    }
    current_section = None
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue

        # Match original format with ** headers
        if '**Main Themes:**' in line:
            current_section = 'mainThemes'
        elif '**Key Insights:**' in line:
            current_section = 'keyInsights'
        elif '**Action Items:**' in line:
            current_section = 'actionItems'
        elif '**Next Session Goals:**' in line:
            current_section = 'nextSessionGoals'
        elif line.startswith('- ') and current_section:
            # Extract content after "- " and clean up [Item 1] format
            content = line[2:].strip()
            # Remove brackets if present and clean content
            if content.startswith('[') and content.endswith(']'):
                content = content[1:-1].strip()
            if content:
                summary[current_section].append(content)
        elif current_section and line.startswith('-'):
            # Handle cases where the - formatting might be slightly different
            content = line[1:].strip() if line[1:].strip() else line[2:].strip()
            if content.startswith('[') and content.endswith(']'):
                content = content[1:-1].strip()
            if content:
                summary[current_section].append(content)

    return summary
