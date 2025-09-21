# Mental Wellness AI Deployment Guide

## Platform Recommendations

### Frontend (React/Vite)
- **Primary Platform**: Vercel
  - **Why**: Excellent for static sites, built-in CI/CD from GitHub, unlimited deployments
  - **Free Tier**: 100GB bandwidth/month, 100 deployments/month, $7/analytics
  - **Pro Tier**: Starts at $20/month (500GB bandwidth, unlimited deployments)

- **Alternative**: Netlify
  - Free tier: 100GB bandwidth/month

### Backend (Django with WebSockets)
- **Primary Platform**: Railway
  - **Why**: Supports Docker, PostgreSQL database, persistent volumes, WebSockets
  - **Free Tier**: $5 credit, usage-based after that
  - **Pro Tier**: From $10/month for 8GB memory

- **Alternative**: Render
  - **Free Tier**: 750 hours/month (across all services)
  - **Paid Tier**: From $7/month

### AI Service (Python with WebSockets)
- **Primary Platform**: Railway
  - Same specs as backend - can be deployed in same project
  - **Cost**: Included in Railway project limits

- **Alternative**: Fly.io
  - **Free Tier**: $1 credit (very limited)
  - **Paid Tier**: From $2/month per app

### Database
- **Primary**: Railway PostgreSQL (free with Railway project)
- **Alternative**: Neon.tech (512MB free, then $0.5/hour for compute)

## Architecture Overview

```
Frontend (Vercel)
    ↓ REST API calls
Backend (Railway + Django)
    ↓ WebSocket connections
AI Service (Railway + Python)
    ↓
Database (Railway PostgreSQL)
```

## Step-by-Step Setup Instructions

### Backend + Database (Railway)

1. **Create Railway Account**: https://railway.app/new
2. **Connect GitHub Repository**
3. **Deploy Backend**:
   ```bash
   # Railway automatically detects Django projects
   # Set environment variables in Railway dashboard:
   SECRET_KEY=generate-a-secure-key
   DEBUG=False
   ALLOWED_HOSTS=your-railway-app.railway.app
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   DATABASE_URL=railway-auto-generated-postgres-url
   GEMINI_API_KEY=your-api-key
   AI_SERVICE_URL=your-ai-service-url
   ```
4. **PostgreSQL Database**:
   - Add PostgreSQL plugin in Railway dashboard
   - Copy DATABASE_URL from Railway

### AI Service (Railway)

1. **Add Service to Railway Project**:
   ```bash
   # Railway will use ai_service/Dockerfile
   # Environment variables:
   PORT=8001
   # Add your AI API keys
   ```

### Frontend (Vercel)

1. **Connect Repository**: Connect GitHub repo to Vercel at https://vercel.com/new
   - Import your Mental_Wellness_AI repository
   - Select "frontend/" as the root directory (or configure accordingly)

2. **Configure Build Settings**:
   ```bash
   Framework Preset: Vite
   Root Directory: frontend/
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   Node.js Version: 18.x or later
   ```

3. **Environment Variables** (in Vercel dashboard):
   ```bash
   VITE_API_BASE_URL=https://your-backend.railway.app
   VITE_AI_SERVICE_URL=https://your-ai-service.railway.app
   VITE_DEBUG=false
   ```

4. **Configure Rewrites** (vercel.json in frontend/ directory):
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://your-backend.railway.app/api/:path*" },
       { "source": "/ws/:path*", "destination": "wss://your-ai-service.railway.app/:path*" }
     ]
   }
   ```

## Testing Deployments and Connections

### 1. Test Health Endpoints
```bash
# Backend health check
curl https://your-backend.railway.app/api/health/

# AI Service health check
curl https://your-ai-service.railway.app/health
```

### 2. Test Frontend Loading
- Visit your Vercel deployment URL
- Check browser console for API connection errors
- Verify static assets load correctly

### 3. Test WebSocket Connections
```javascript
// Test AI service WebSocket from browser console
const ws = new WebSocket('wss://your-ai-service.railway.app/ws/voice/test-session');
ws.onmessage = (event) => console.log('WS Message:', event.data);
ws.onopen = () => console.log('WS Connected');
ws.onerror = (error) => console.error('WS Error:', error);
```

### 4. Test Database Connections
- Check Railway logs for database migration success
- Verify API endpoints that access database return correct data

### 5. Environment Variable Validation
- Ensure all required env vars are set in each service
- Test API key functionality (e.g., Gemini API calls)

## Troubleshooting

### Common Issues:
- **CORS Errors**: Check CORS_ALLOWED_ORIGINS in backend settings
- **WebSocket Connection Failed**: Verify AI service deployment and port
- **Database Connection Issues**: Check DATABASE_URL configuration
- **Static Asset Loading**: Ensure frontend build includes all assets

### Railway Logs:
- Access via Railway dashboard for each service
- Check build logs for Dockerfile errors
- Monitor runtime logs for application errors

## Environment Variable Security

- Never commit actual .env files to Git
- Use Railway/Vercel environment variable management
- Rotate API keys regularly
- Use different keys for staging/production

## Cost Breakdown

### Free Tariff Limitations:
- **Vercel**: 100GB bandwidth, 100 deployments, hobby plan CPU limits
- **Railway**: $5 starting credit, usage-based pricing after depletion
- **Database**: Included with Railway, limited to ~10GB initially
- **API Keys**: Google Cloud, OpenAI charges may apply for LLM usage

### Scaling Costs:
- **Railway**: $10-50/month depending on CPU/memory needs
- **Vercel**: Pro plan from $20/month (unlimited bandwidth, faster builds)
- **Database**: Additional storage $0.15/GB/month beyond included limits

### Cost Estimation:
- **Development/Testing**: $0-5/month (within free limits)
- **Small Production**: $30-60/month (100-500 users, basic usage)
- **Medium Production**: $60-120/month (1000-2000 users, extended usage)
- **Enterprise Scale**: $200+/month (5000+ users, premium features)

### External Service Costs:
- **Google Cloud (Gemini API)**: $0.002-$0.008 per 1K tokens
- **Cloud Storage**: $0.02/GB/month if using Google Cloud Storage
- **CDN**: Included with Vercel/Railway up to limits

### Monitoring Usage:
- Railway provides usage metrics in dashboard
- Vercel analytics available on paid plans
- Set up billing alerts to avoid unexpected charges
