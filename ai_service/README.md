# AI Psychologist Service

A FastAPI-based voice AI service for mental wellness support with real-time conversations using WebSocket technology.

## Features

- **Multiple AI Psychologist Agents**: 3 specialized psychologists (Academic Stress, Relationships, Career Anxiety)
- **Voice Sessions**: Real-time voice conversations with WebSocket support
- **Risk Classification**: Automatic detection of safety concerns using Gemini AI
- **Conversation Memory**: Context-aware responses with consent-respecting data management
- **Emotion Integration**: Real-time emotion monitoring integration
- **Multilingual Support**: English, Hindi, and Tamil language support
- **Safety First**: Comprehensive safety protocols and crisis response

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │--->│   Django REST   │    │   FastAPI AI    │
│ (React/Vite)    │    │     API         │    │     Service     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                         ┌─────────────────┐
                         │   Databases    │
                         │ PostgreSQL     │
                         └─────────────────┘
```

## Core Components

### 1. Agent Management (`agents.py`)
- Loads agent configurations from Django
- Provides agent registry with caching
- Handles language and voice preferences

### 2. LLM Integration (`llm.py`)
- Gemini AI integration for conversation
- Function calling for therapeutic exercises
- Emotion-aware response generation

### 3. Risk Classification (`risk.py`)
- Real-time risk assessment using Gemini
- Pattern matching for immediate risks
- Multilingual safety responses with crisis helplines

### 4. WebSocket Voice Pipeline (`ws_voice.py`)
- Real-time audio streaming
- Session authentication with JWT
- Coordination of STT → LLM → TTS pipeline

### 5. Memory Management (`memory.py`)
- Conversation context storage
- Consent-based data persistence
- Conversation summarization

### 6. Emotion Integration (`emotion_integration.py`)
- Real-time emotion monitoring
- Emotion trend analysis
- Adaptive response tones

## Setup Instructions

### 1. Environment Setup

```bash
# Create virtual environment for AI service
cd ai_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.template .env
# Edit .env with your configuration
```

### 2. Configuration

Update `.env` file with:

```env
DJANGO_URL=http://localhost:8000
SECRET_KEY=your-django-secret-key
GEMINI_API_KEY=your-gemini-api-key
PORT=8001
```

### 3. Running the Service

```bash
# Run FastAPI service
python -m uvicorn ai_service.main:app --reload --host 0.0.0.0 --port 8001
```

### 4. Seed Django Data

```bash
cd backend
python scripts/seed_agents.py
```

## API Documentation

### FastAPI Endpoints

- `GET /health` - Health check
- `WebSocket /ws/voice/{session_id}` - Voice session handler

### Django REST API Endpoints

- `GET /api/agents/` - List available agents
- `GET /api/agents/{agent_id}/` - Get agent details
- `POST /api/sessions/start/` - Start new voice session
- `POST /api/sessions/end/` - End voice session
- `POST /api/alerts/` - Create safety alert

## Voice Session Flow

```
Frontend Request ----> Django /api/sessions/start
                       │
                       └─> JWT Token Generation
                       └─> Session Creation

WebSocket Connection ──> FastAPI /ws/voice/{session_id}
                           │
                           └─> Authentication Check
                           └─> Agent Configuration Load
                           └─> Memory Manager Setup

Audio Streaming ────────> User speaks
       ↓
STT Processing ────> Convert speech to text
       ↓
Risk Classification ─> Safety assessment
       ↓
LLM Generation ────> AI response generation
       ↓
TTS Streaming ────> Convert text to speech
       ↓
Audio Playback ───> User hears response
```

## Safety Features

### Risk Classification Levels
- **None**: No safety concerns
- **Low**: Mild distress indicators
- **Medium**: Significant distress or self-harm thoughts
- **High**: Active suicidal ideation or immediate danger

### Safety Responses
When risk is detected, the system:
1. Skips normal agent response
2. Generates safety message with crisis helplines
3. Sends alert to human counselors
4. Continues with modified conversation flow

## Agent Specializations

### 1. Academic Stress Psychologist (CBT)
- Exam anxiety and performance pressure
- Study skills and time management
- Family expectation stress

### 2. Relationships Psychologist
- Communication skills
- Boundary setting
- Conflict resolution
- Cultural relationship dynamics

### 3. Career Anxiety Psychologist
- Career decision making
- Impuster syndrome
- Job market stress
- Work-life balance

## Language Support

### English (en-IN)
- Voice: en-IN-Neural2-A
- Support: Native

### Hindi (hi-IN)
- Voice: hi-IN-Standard-A
- Support: Native

### Tamil (ta-IN)
- Voice: ta-IN-Standard-A
- Support: Native

## Function Calling

The AI agents support therapeutic function calls:

- `breathing_exercise(duration)` - Guided breathing exercises
- `grounding_5_4_3_2_1()` - Sensory grounding technique
- `thought_record()` - CBT thought records

## Testing

### Voice Session Test Flow

1. **Start Session**
   ```javascript
   // Frontend
   const response = await fetch('/api/sessions/start/', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       agent_id: 'academic_stress_psychologist',
       lang: 'en-IN',
       consent_store: true
     })
   });
   ```

2. **Connect WebSocket**
   ```javascript
   const ws = new WebSocket(
     `ws://localhost:8001/ws/voice/${session_id}`
   );
   // Send JWT token for authentication
   ```

3. **Send Audio Data**
   ```javascript
   // After user speaks
   ws.send(JSON.stringify({
     type: 'user_utterance_end'
   }));
   ```

### Risk Assessment Test Cases

- ✅ Safe: "I'm feeling stressed about exams"
- ⚠️ Medium: "I feel like hurting myself"
- 🚨 High: "I want to kill myself"

## Performance Considerations

### Latency Targets
- STT: <2 seconds
- Risk Classification: <1 second
- LLM Generation: <3 seconds
- TTS Streaming: Streaming chunks
- Total Response Time: <8 seconds

### Memory Management
- Sliding window: 6-8 recent turns
- Consent-based persistence
- Automatic cleanup after session end

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check JWT token validity
   - Verify session ID matches token
   - Check FastAPI service is running

2. **Audio Not Processing**
   - Verify audio format is supported
   - Check audio chunk encoding
   - Review STT service configuration

3. **Risk Classification Errors**
   - Verify Gemini API key
   - Check internet connection
   - Review error logs

### Logs and Monitoring

```bash
# View FastAPI logs
tail -f ai_service.log

# Django API logs
tail -f backend/logs/debug.log

# Database queries
python manage.py dbshell --settings=production
```

## Future Enhancements

### Planned Features
- RAG (Retrieval-Augmented Generation) for curated content
- Advanced emotion trend analysis
- Group therapy support
- Offline capability
- Advanced risk prediction models
- Custom agent creation

### Scalability Improvements
- Redis clustering for memory sharing
- Load balancing across multiple AI instances
- Voice activity detection
- Automatic audio segmentation

## Contributing

See the main Mental Wellness AI project for contribution guidelines.

## License

See the main project license.
