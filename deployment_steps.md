# Mental Wellness AI - Step-by-Step Deployment Guide

## 🚀 Complete End-to-End Deployment Process

### Prerequisites

1. **Accounts Created**:
   - Railway account: https://railway.app
   - Vercel account: https://vercel.com
   - Google Cloud (for Gemini API): https://cloud.google.com

2. **API Keys Prepared**:
   - Google Gemini API key
   - Any other AI service keys

3. **GitHub Repository Connected**:
   - All code pushed to GitHub
   - Repository set to public (recommended for deployment)

---

## Step 1: Deploy Backend & AI Service to Railway

### 1.1 Create Railway Project
```bash
# Visit https://railway.app/new (after logging in)
# Connect your GitHub repository
# Railway will auto-detect Django and FastAPI services
```

### 1.2 Configure Database
```bash
# In Railway dashboard, add PostgreSQL plugin:
1. Go to Plugins → Add Plugin → PostgreSQL
2. Database will be created automatically
3. Copy the DATABASE_URL from Variables tab
```

### 1.3 Set Up Backend Environment Variables
```bash
# In Railway dashboard → Your Backend Service → Variables:

SECRET_KEY=django-insecure-$(openssl rand -hex 32)
DEBUG=False
ALLOWED_HOSTS=your-railway-backend-domain.railway.app
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main-yourusername.vercel.app
DATABASE_URL=postgresql://... (from PostgreSQL plugin)
GEMINI_API_KEY=your-gemini-api-key
AI_SERVICE_URL=https://your-railway-ai-service.railway.app
```

### 1.4 Deploy Backend
```bash
# Railway auto-deploys when you push to connected branch
# Or trigger manual deploy in dashboard
# Wait for build to complete (~3-5 minutes)
# Note your backend URL: https://your-project-name.railway.app
```

### 1.5 Set Up AI Service
```bash
# In Railway, add a new service:
# Service → Add Service → GitHub Repo (select same repo)
# Root Directory: ai_service/

# Environment Variables for AI Service:
PORT=8001
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
DEBUG=false
CORS_ORIGINS=https://your-app.vercel.app
```

### 1.6 Deploy AI Service
```bash
# Railway will use ai_service/Dockerfile
# Deploy will take ~5-7 minutes (building AI/ML dependencies)
# Note your AI service URL: https://your-project-name-ai-service.railway.app
```

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Import Repository
```bash
# Visit https://vercel.com/new
# Connect your GitHub repository
# Configure project:

Framework Preset: Vite
Root Directory: frontend/
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node.js Version: 18.x or later
```

### 2.2 Set Environment Variables
```bash
# In Vercel dashboard → Project Settings → Environment Variables:

VITE_API_BASE_URL=https://your-backend.railway.app
VITE_AI_SERVICE_URL=https://your-ai-service.railway.app
VITE_DEBUG=false
```

### 2.3 Configure Rewrites
```json
# frontend/vercel.json (already created):
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-backend.railway.app/api/:path*" },
    { "source": "/ws/:path*", "destination": "wss://your-ai-service.railway.app/:path*" }
  ]
}
```

### 2.4 Deploy Frontend
```bash
# Vercel auto-deploys on every push to main branch
# First deployment: ~2-3 minutes
# Note your frontend URL: https://your-app.vercel.app
```

---

## Step 3: Update API Keys and URLs

### 3.1 Update Railway Backend
```bash
# Update CORS_ALLOWED_ORIGINS with actual Vercel URL:
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main-yourusername.vercel.app
AI_SERVICE_URL=https://your-railway-ai-service.railway.app

# Redeploy backend service
```

### 3.2 Update Vercel Frontend (if needed)
```bash
# Verify environment variables are correct:
VITE_API_BASE_URL=https://your-railway-backend.railway.app
VITE_AI_SERVICE_URL=https://your-railway-ai-service.railway.app
```

---

## Step 4: Test Deployments

### 4.1 Test Backend Health
```bash
curl https://your-railway-backend.railway.app/api/health/
# Expected: {"status": "healthy"} or similar
```

### 4.2 Test AI Service Health
```bash
curl https://your-railway-ai-service.railway.app/health
# Expected: {"status": "healthy"}
```

### 4.3 Test Frontend Loading
```bash
# Visit https://your-app.vercel.app
# Check browser console for errors
# Try navigating through the app
```

### 4.4 Test WebSocket Connection
```javascript
// Open browser console and run:
const ws = new WebSocket('wss://your-ai-service.railway.app/ws/voice/test-session');
// Look for 'WebSocket connection established' in AI service logs
```

### 4.5 Test Database Connection
```bash
# Check Railway logs for migration success
# Verify any database-dependent features work
```

---

## Step 5: Handle Domains and SSL

### 5.1 Custom Domain (Optional)
```bash
# Vercel Custom Domain:
# Project Settings → Domains → Add your-domain.com
# Follow DNS instructions

# Railway Custom Domain:
# Project Settings → Domains → Generate domain or add custom
```

### 5.2 SSL Certificates
- **Vercel**: Auto-SSL for all deployments
- **Railway**: Auto-SSL for railway.app domains and custom domains

---

## Step 6: Enable Backups and Monitoring

### 6.1 Database Backups
```bash
# Railway PostgreSQL backups are automatic
# Enable point-in-time recovery in Plugin settings
```

### 6.2 Monitoring
```bash
# Free monitoring included with both platforms
# Check Railway and Vercel dashboards for logs and metrics
```

---

## Step 7: Scale and Optimize

### 7.1 Free Tier Limits Awareness
| Service | Free Limit | Usage Indicators |
|---------|------------|------------------|
| Vercel | 100GB bandwidth/Month | Check Vercel Analytics |
| Railway | $5 credit | Watch usage meter |
| Gemini API | $0.50-2.00/1000 requests | Monitor API usage |

### 7.2 Scaling (When Free Limits Exceeded)
```bash
# Vercel: Upgrade to Pro ($20/month)
# Railway: Pay-as-you-go beyond $5 credit
# Database: Add more resources as needed
```

---

## Troubleshooting Deployment Issues

### Railway Issues
- **Build Failures**: Check logs for missing dependencies
- **Port Bindings**: Ensure services use correct ports (8000 for backend, 8001 for AI)
- **Environment Variables**: Check Railway dashboard for correct variable names

### Vercel Issues
- **Build Errors**: Verify build command and root directory
- **API Timeouts**: Check Railway service status
- **CORS Issues**: Verify CORS_ALLOWED_ORIGINS in backend

### Common Issues
- **WebSocket Connections**: Check firewall settings and URL format
- **Database Migrations**: Ensure migrations run successfully
- **Static Assets**: Verify build process creates dist/ directory

---

## Post-Deployment Commands

### Health Check Script
```bash
#!/bin/bash
echo "Testing all services..."

# Test Frontend
curl -s -o /dev/null -w "%{http_code}" https://your-app.vercel.app

# Test Backend
curl -s https://your-backend.railway.app/api/health/

# Test AI Service
curl -s https://your-ai-service.railway.app/health

echo "All tests completed!"
```

### Environment Update Script
```bash
#!/bin/bash
# Quick env var updates across services

# Update Vercel
vercel env add VITE_API_BASE_URL production
vercel env add VITE_AI_SERVICE_URL production

# Railway updates via dashboard
```

---

## Cost Monitoring Guide

### Monthly Estimates
- **0-100 users**: $0-5/month
- **100-500 users**: $20-60/month
- **500-2000 users**: $50-120/month

### Free→Paid Triggers
- Vercel Pro needed at ~10-20GB+ monthly traffic
- Railway paid plan at $30-50+ monthly usage
- API costs scale linearly with conversation volume

### Optimization Tips
- Enable caching to reduce API calls
- Optimize images and assets
- Monitor unused resources
- Set up billing alerts

---

## Emergency Rollback Procedures

### Code Rollback
1. **Vercel**: Rollback to previous deployment
2. **Railway**: Use git history or manual deploy older commit

### Configuration Rollback
1. **Environment Variables**: Keep backup of working configs
2. **Database**: Maintain schema versioning

### Service Status Check
```bash
# Monitor all services hourly
curl -s https://backend/api/health/
curl -s https://ai-service/health/
```

---

**🎉 Deployment Complete!**
Your Mental Wellness AI platform is now live with:
- Frontend on Vercel
- Backend API on Railway
- AI Voice Service on Railway
- PostgreSQL Database
- Auto-scaling and SSL certificates
- Production monitoring and logging

Visit your Vercel URL to start using the application!
