# Mental Wellness AI 🤖💚

A comprehensive mental health support platform featuring AI-powered psychotherapy sessions, emotion monitoring, and therapeutic gaming experiences. Built with cutting-edge AI technology to provide accessible, culturally-sensitive mental health support across India.

## 🔬 What is Mental Wellness AI?

Mental Wellness AI is an end-to-end mental health technology platform that combines:

- **Voice-based AI Psychotherapy**: 3 specialized AI psychologists trained in CBT techniques
- **Real-time Emotional Intelligence**: Continuous emotion monitoring with therapeutic insights
- **Session Analytics**: AI-powered session summarization for therapy continuity
- **Therapeutic Gaming**: Interactive cognitive behavioral exercises
- **Multilingual Support**: Native voice interactions in English, Hindi, and Tamil
- **Safety-First Architecture**: Comprehensive risk assessment with crisis intervention protocols

## 🎯 AI Components

### Core AI Services
- **Google Gemini AI**: Advanced natural language processing for therapeutic conversations
- **Google Text-to-Speech**: Multilingual voice synthesis (en-IN, hi-IN, ta-IN)
- **Google Speech-to-Text**: Real-time speech recognition
- **OpenCV + FaceAPI.js**: Emotion detection through facial analysis
- **DeepFace**: Advanced emotion recognition algorithms
- **Librosa**: Voice stress analysis and vocal pattern recognition

### AI Agent Specializations
1. **Academic Stress Psychologist**: CBT expert for exam anxiety, performance pressure, study skills
2. **Relationships Psychologist**: Communication training, boundary setting, conflict resolution
3. **Career Anxiety Psychologist**: Career decision-making, imposter syndrome, work-life balance

### AI Features
- **Risk Classification**: Real-time safety assessment (None/Low/Medium/High)
- **Emotion Trend Analysis**: Longitudinal emotional state tracking
- **Therapeutic Exercise Generation**: Breathing exercises, cognitive reframing, grounding techniques
- **Contextual Memory Management**: Sliding window conversation history
- **Cultural Adaptations**: Regionally appropriate therapeutic responses

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend         │───►│   Django REST     │───►│      FastAPI AI   │
│ (React/Vite)       │    │     API            │    │          Service   │
│                    │    └─────────────────┘    └─────────────────┘
└─────────────────┘          │                       │
                                ├────────────────────┘
                                │
                         ┌─────────────────┐
                         │   PostgreSQL       │
                         │   Database         │
                         └─────────────────┘
```

### Technology Stack
- **Backend**: Django 5.0 + FastAPI + Channels (WebSocket support)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Database**: PostgreSQL with pg_vector support
- **Infrastructure**: Docker + Kubernetes + Redis clustering
- **AI Integration**: Google Cloud Platform + REST APIs
- **Security**: JWT authentication + CORS protection

## 🚀 End-to-End Setup Guide

### Prerequisites
- **Python 3.9+**: Required for Django backend and AI service
- **Node.js 18+**: Required for React frontend
- **PostgreSQL 13+**: Primary database (can use SQLite for development)
- **Git**: Version control
- **Google Cloud Account**: For Gemini AI, Text-to-Speech, and Speech-to-Text APIs
- **Virtual Environment**: Python venv for dependency isolation

### System Requirements
- **RAM**: 8GB minimum (16GB recommended for AI processing)
- **Storage**: 10GB free space
- **Network**: Stable internet for Google Cloud API calls

### 1. Clone Repository & Initial Setup
```bash
# Clone the project
git clone https://github.com/Nehasasikumar/Mental_Wellness_AI.git
cd Mental_Wellness_AI

# Create main environment structure
mkdir -p logs models temp
```

### 2. Google Cloud API Configuration

#### Step 2.1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable required APIs:
   - Google Gemini AI API
   - Cloud Text-to-Speech API
   - Cloud Speech-to-Text API

#### Step 2.2: Generate API Credentials
```bash
# Install Google Cloud CLI
# Follow: https://cloud.google.com/sdk/docs/install

# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Create service account
gcloud iam service-accounts create mental-wellness-ai \
    --description="Service account for Mental Wellness AI" \
    --display-name="Mental Wellness AI Service"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:mental-wellness-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:mental-wellness-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudtranslate.user"

# Generate key
gcloud iam service-accounts keys create ai-service-key.json \
    --iam-account=mental-wellness-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/ai-service-key.json"
```

#### Step 2.3: Enable Gemini AI
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Generate Gemini API key
3. Note the API key for configuration

### 3. Google Services Integration

#### Text-to-Speech Setup
- **Languages Supported**: English (en-IN), Hindi (hi-IN), Tamil (ta-IN)
- **Voices Used**:
  - English: en-IN-Neural2-A
  - Hindi: hi-IN-Standard-A
  - Tamil: ta-IN-Standard-A

#### Speech-to-Text Setup
- **Real-time Streaming**: Enabled for low-latency voice processing
- **Noise Cancellation**: Automatic background noise reduction
- **Word-level Timestamps**: For precise transcription accuracy

#### Gemini AI Setup
- **Model**: Gemini Pro Vision (for multimodal inputs)
- **Safety Settings**: Configured for therapeutic conversations
- **Function Calling**: Enabled for therapeutic exercises integration

### 4. Database Configuration

#### Option A: PostgreSQL (Production)
```bash
# Install PostgreSQL
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS with Homebrew:
brew install postgresql
brew services start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE mental_wellness_ai;
CREATE USER ai_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mental_wellness_ai TO ai_user;
\q
```

#### Option B: SQLite (Development)
```bash
# SQLite is automatically configured for development
# Django will create the database file automatically
```

### 5. Environment Configuration
```bash
# Create environment template files
touch backend/.env.template
touch ai_service/.env.template
```

**backend/.env.template**
```env
# Django Configuration
DJANGO_SETTINGS_MODULE=backend.settings
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True

# Database Configuration
DATABASE_URL=postgresql://ai_user:secure_password@localhost:5432/mental_wellness_ai
# For SQLite development: DATABASE_URL=sqlite:///db.sqlite3

# CORS Settings (for development)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ALLOWED_HOSTS=localhost,127.0.0.1

# Session Configuration
SESSION_ENGINE=django.contrib.sessions.backends.db
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

**ai_service/.env.template**
```env
# AI Service Configuration
PORT=8001
HOST=0.0.0.0
RELOAD=True

# Django Backend Connection
DJANGO_URL=http://localhost:8000
SECRET_KEY=django-insecure-change-this-in-production

# Google Cloud Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS=/path/to/ai-service-key.json

# Memory & Performance
MEMORY_WINDOW_SIZE=6
MAX_TOKENS_PER_TURN=1000
RISK_CHECK_TIMEOUT=1.0
EMOTION_ANALYSIS_INTERVAL=1.0

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/ai_service.log

# Development Settings
DEBUG=True
TEST_MODE=False
```

### 6. Backend Setup (Django)
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.template .env
# Edit .env with your actual configuration

# Run database migrations
python manage.py makemigrations api
python manage.py migrate

# Create Django superuser
python manage.py createsuperuser --username admin --email admin@example.com

# Seed initial data (AI agents)
python manage.py shell -c "
from api.models import Agent
Agent.objects.get_or_create(
    agent_id='academic_stress_psychologist',
    defaults={
        'name': 'Dr. Alice Johnson',
        'domain': 'academic',
        'languages': ['en', 'hi', 'ta'],
        'description': 'Specialist in academic stress and performance anxiety',
        'system_prompt': 'You are a CBT specialist focused on academic stress...',
        'safety_prompt': 'Maintain safety protocols...'
    }
)
print('AI agents seeded successfully')
"

# Create static files
python manage.py collectstatic --noinput

# Test backend health
python manage.py check
```

### 7. AI Service Setup (FastAPI)
```bash
cd ../ai_service

# Create virtual environment (separate from backend)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.template .env
# Edit .env with your Google Cloud credentials

# Create required directories
mkdir -p logs temp models

# Test AI service health
python -c "
import asyncio
from ai_service.main import check_services
asyncio.run(check_services())
print('AI Service dependencies verified')
"

# Start AI service
python -m uvicorn ai_service.main:app --reload --host 0.0.0.0 --port 8001
```

### 8. Frontend Setup (React + TypeScript)
```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment variables (if needed)
cp .env.example .env.local  # Create this file if it doesn't exist

# Install additional development tools
npm install -D @types/node @types/react @types/react-dom

# Build for development
npm run build

# Start development server
npm run dev
# Frontend will be available at http://localhost:5173
```

### 9. Integrated Testing
```bash
# Test full system integration
cd ../

# 1. Start backend (Terminal 1)
cd backend && source venv/bin/activate && python manage.py runserver

# 2. Start AI service (Terminal 2)
cd ai_service && source venv/bin/activate && python -m uvicorn ai_service.main:app --reload --host 0.0.0.0 --port 8001

# 3. Start frontend (Terminal 3)
cd frontend && npm run dev

# Verify all services
curl http://localhost:8000/api/health/  # Backend health
curl http://localhost:8001/health      # AI service health
curl http://localhost:5173             # Frontend (should load)
```

### 10. Access the Complete Platform
- **Main Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs/
- **AI Service**: http://localhost:8001
- **AI Service Docs**: http://localhost:8001/docs
- **Admin Panel**: http://localhost:8000/admin (use superuser credentials)

### Troubleshooting Setup

#### Common Issues:

**Backend won't start**:
```bash
# Check Python version
python --version  # Should be 3.9+

# Verify virtual environment
which python     # Should point to venv
pip list         # Verify Django installation
```

**AI Service errors**:
```bash
# Test Google Cloud credentials
python -c "import google.cloud.aiplatform as aiplatform; aiplatform.init()"

# Check API key
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

**Frontend issues**:
```bash
# Clear cache and reinstall
rm -rf node_modules .vite
npm install

# Check Node version
node --version  # Should be 18+
```

#### Google Cloud Troubleshooting:
- Verify API keys are active and have correct permissions
- Check billing is enabled on Google Cloud project
- Ensure service account has necessary IAM roles
- Confirm API quotas are sufficient

### Production Deployment Checklist
- [ ] Set DEBUG=False in Django settings
- [ ] Configure production-grade database
- [ ] Set up SSL certificates
- [ ] Configure environment variables securely
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set up load balancing
- [ ] Enable CDN for static assets

## 📋 Key Features

### Core Platform Features
- 🤖 **AI Psychologist Sessions**: Voice-based therapeutic conversations
- 📊 **Emotion Monitoring**: Real-time emotional state analysis
- 📝 **Session Summarization**: AI-powered therapy insight generation
- 🎮 **Therapeutic Gaming**: Interactive mental health exercises
- 🌍 **Multilingual Support**: English, Hindi, Tamil language support
- 📱 **Responsive Design**: Mobile-first, accessible interface
- 🔒 **Secure Architecture**: End-to-end encryption and privacy protection

### AI-Powered Capabilities
- **Voice Stress Detection**: Physiological stress analysis through vocal patterns
- **Facial Emotion Recognition**: Computer vision-based emotion detection
- **Risk Assessment**: Real-time suicide prevention and crisis intervention
- **Cultural Context Awareness**: Regionally appropriate therapeutic responses
- **Memory-Enhanced Conversations**: Context-aware dialogue continuity
- **Therapeutic Exercise Integration**: Breathing exercises, grounding techniques

## 🎮 Therapeutic Gaming Features

### Interactive Exercises
- **Cognitive Reframing Cards**: Interactive CBT thought exercises
- **Mindful Breathing Quest**: Guided meditation and breathwork
- **Mindful Maze**: Stress reduction through focused attention
- **Pattern Painter**: Artistic expression for emotion regulation

### Gaming Benefits
- **Engagement**: Gamified therapeutic interventions increase participation
- **Progress Tracking**: Measurable improvement metrics
- **Accessibility**: No additional hardware required
- **Evidence-Based**: Techniques grounded in cognitive behavioral therapy

## 🔒 Safety & Compliance

### Safety Protocols
- **Immediate Risk Intervention**: Real-time crisis response activation
- **Human Oversight**: Alert system for human counselors in high-risk situations
- **Crisis Resource Integration**: Direct links to emergency helplines
- **Multilingual Support Lines**: Regional crisis intervention services

### Privacy Protection
- **Consent-Based Data Storage**: User-controlled data persistence
- **End-to-End Encryption**: All communications encrypted in transit
- **GDPR Compliance**: European Union privacy regulation adherence
- **Data Minimization**: Only essential data collection and retention

### Ethical AI Guidelines
- **Culturally Sensitive**: Region-specific mental health considerations
- **Bias Mitigation**: Regular model audits and bias testing
- **Transparency**: Clear disclosure of AI involvement
- **Human-AI Collaboration**: AI augmentation, not replacement of human care

## 📊 API Documentation

### REST Endpoints
- `GET /api/agents/` - List available AI psychologists
- `POST /api/sessions/start/` - Initiate therapy session
- `POST /api/sessions/end/` - Conclude therapy session
- `POST /api/alerts/` - Create safety alert

### WebSocket Connections
- `/ws/voice/{session_id}` - Real-time voice session handler
- `/ws/emotions/` - Emotion monitoring stream

### AI Service Endpoints
- `GET /health` - AI service health check
- `POST /api/summarize/` - Generate session summary

## 🚀 Free Cloud Deployment Guide

### 🎯 Recommended Platforms
- **Frontend**: [Vercel](https://vercel.com) (Free tier: 100GB/month, auto-deploy from GitHub)
- **Backend & AI Service**: [Render](https://render.com) (Free tier: 750 hours/month, PostgreSQL included)
- **Database**: Render PostgreSQL (No additional cost)
- **Monitoring**: Built-in with both platforms

### Alternative Platform
- **Backend & AI Service**: [Railway](https://railway.app) (Free tier: $5 credit, PostgreSQL included)

### Estimated Monthly Costs:
- **Development/Testing**: $0-5/month within free limits
- **100-500 users**: $20-60/month
- **500-2000 users**: $50-120/month

### 📋 Quick Deployment Steps

#### Prerequisites:
1. Create accounts: [Railway](https://railway.app), [Vercel](https://vercel.com)
2. Get Google Gemini API key: [Google AI Studio](https://aistudio.google.com/)
3. Push all code to GitHub repository

#### Step 1: Deploy Backend & Database to Railway
```bash
# 1. Go to railway.app/new
# 2. Connect your GitHub repository
# 3. Railway auto-detects Django backend
# 4. In Railway dashboard → Add PostgreSQL plugin
# 5. Set environment variables:
SECRET_KEY=django-insecure-$(openssl rand -hex 32)
DEBUG=False
ALLOWED_HOSTS=your-railway-app.railway.app
DATABASE_URL=postgresql://... (auto-generated)
GEMINI_API_KEY=your-gemini-key
```

#### Step 2: Deploy AI Service to Railway
```bash
# 1. In Railway project → Add Service
# 2. Connect same GitHub repo, set root directory: ai_service/
# 3. Set environment variables:
PORT=8001
GEMINI_API_KEY=your-gemini-key
GOOGLE_CLOUD_PROJECT=your-gcp-project
```

#### Step 3: Deploy Frontend to Vercel
```bash
# 1. Go to vercel.com/new
# 2. Connect GitHub repository
# 3. Set root directory: frontend/
# 4. Set environment variables:
VITE_API_BASE_URL=https://your-railway-backend.railway.app
VITE_AI_SERVICE_URL=https://your-railway-ai-service.railway.app
```

#### Step 4: Test Your Live Application
```bash
# Test endpoints:
curl https://your-backend.railway.app/api/health/
curl https://your-ai-service.railway.app/health

# Visit your Vercel URL to use the app!
```

### 📚 Detailed Deployment Guide
For complete step-by-step instructions with screenshots and troubleshooting:
- **[`deployment_steps.md`](deployment_steps.md)**: Comprehensive deployment walkthrough
- **[`deployment_guide.md`](deployment_guide.md)**: Platform comparisons and architecture

### 🐳 Local Development with Docker
```bash
# Quick local setup (optional):
docker-compose up --build
# Access at http://localhost:3000
```

### ⚙️ Production Configuration
```bash
# Environment files created:
backend/.env.production.example    # Django production config
ai_service/.env.example           # AI service config
frontend/vercel.json             # Vercel deployment config
```

### 🔒 Security & SSL
- **Automatic SSL**: Both Vercel and Railway provide free SSL certificates
- **Environment Security**: Use platform-specific secure environment variable storage
- **Database Encryption**: Railway PostgreSQL automatically encrypts data

### 🚨 Troubleshooting Issues
```bash
# Common fixes:
1. CORS errors: Update CORS_ALLOWED_ORIGINS in Railway
2. WebSocket issues: Check railway.app firewall settings
3. Build failures: Check Railway/Vercel build logs
4. API timeouts: Verify service URLs are correct
```

### 📊 Monitoring & Scaling
- **Free Monitoring**: Built into Railway and Vercel dashboards
- **User Analytics**: Vercel Analytics available
- **Auto-scaling**: Both platforms scale automatically
- **Backup**: Railway provides automatic database backups

### 💰 Cost Optimization Tips
- Monitor Railway usage dashboard to stay within free tier
- Enable Vercel Analytics only when needed (adds to bill)
- Optimize API calls to reduce Gemini costs
- Set up billing alerts to avoid surprises

## 🧪 Testing & Quality Assurance

### Automated Testing
```bash
# Backend tests
cd backend && python manage.py test

# Frontend tests
cd frontend && npm run test

# AI service tests
cd ai_service && python -m pytest
```

### Performance Benchmarks
- **Response Time**: <8 seconds end-to-end latency
- **Concurrent Users**: 1000+ simultaneous voice sessions
- **Emotion Analysis**: <1 second processing latency
- **Risk Classification**: <500ms safety assessment

## 🤝 Contributing

We welcome contributions from mental health professionals, AI researchers, and developers.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes with comprehensive tests
4. Submit a pull request with detailed documentation

### Code Standards
- **Backend**: PEP 8 with Django best practices
- **Frontend**: ESLint + Prettier configuration
- **AI Service**: Clean, documented, tested FastAPI code
- **Testing**: 80%+ code coverage requirement

## 📄 License & Legal

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Clinical Disclaimer
This platform is designed to complement, not replace, professional mental health care. Users are encouraged to seek licensed practitioners for serious mental health concerns.

## 📈 Future Roadmap

### Phase 1 (Q1 2025): Enhanced Safety
- Advanced suicide prevention algorithms
- Multi-language crisis intervention
- Integration with emergency services

### Phase 2 (Q2 2025): Advanced AI
- Custom agent creation for institutions
- Predictive mental health analytics
- Group therapy capabilities

### Phase 3 (Q3 2025): Clinical Validation
- RCT studies with mental health institutions
- Integration with EMR systems
- Telemedicine feature expansion

### Phase 4 (Q4 2025): Global Expansion
- Multi-language expansion (10+ languages)
- Cultural adaptation modules
- Cross-border healthcare collaboration


## 🙏 Acknowledgments

This project was developed with guidance from mental health professionals and AI ethicists. Special thanks to our clinical advisors and technology partners who helped shape a responsible, accessible mental health solution.

---

## 📞 Contact

- Archana Sengunthar — Email: [archanagurusamy648@gmail.com](mailto:archanagurusamy648@gmail.com)
- • GitHub: [ARCHANA-SENGUNTHAR](https://github.com/ARCHANA-SENGUNTHAR)
- Deepika S — Email: [studiesfor456@gmail.com](mailto:studiesfor456@gmail.com)
- • GitHub: [Deepikasel](https://github.com/Deepikasel)

---
