# AI Service Deployment Guide

## Overview
This guide covers deploying the AI Psychologist service with real-time emotion detection using pre-trained ML models.

## Prerequisites
- Python 3.8+
- Required ML libraries (see requirements.txt)
- Deployment platform (Railway, Render, Heroku, etc.)

## Local Development Setup

### 1. Install Dependencies
```bash
cd ai_service
pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file in the ai_service directory:
```bash
# AI Service Configuration
PORT=8001

# Add other environment variables as needed
```

### 3. Run Locally
```bash
# Development mode
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8001
```

## Production Deployment

### Railway Deployment

1. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - Create new project
   - Connect your GitHub repository

2. **Configure Build Settings**
   - **Root Directory:** `ai_service`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**
   ```
   PORT=8001
   ```

4. **Deploy**
   - Railway will automatically deploy when you push to main branch

### Render Deployment

1. **Create Render Service**
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect your GitHub repository

2. **Configure Service**
   - **Root Directory:** `ai_service`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**
   ```
   PORT=8001
   ```

### Docker Deployment

1. **Main Dockerfile (Recommended for Railway/Render)**
   ```bash
   # Build - Railway automatically uses ai_service/Dockerfile
   docker build -t ai-psychologist-service -f ai_service/Dockerfile .

   # Run
   docker run -p 8001:8001 ai-psychologist-service
   ```

2. **Railway Specific Optimization**
   - Railway automatically uses `ai_service/Dockerfile` when root directory is set to `ai_service`
   - Optimized for Railway's caching system
   - Set build timeout to 15 minutes in Railway settings if needed
   - No need to specify Dockerfile path in Railway settings

## WebSocket Configuration

### Frontend Configuration
Update your frontend environment variables:

**Development (.env):**
```bash
VITE_WS_BASE_URL=ws://localhost:8001
VITE_API_BASE_URL=http://localhost:8000
```

**Production (.env.production):**
```bash
VITE_WS_BASE_URL=wss://your-deployed-ai-service-domain.com
VITE_API_BASE_URL=https://your-deployed-backend-domain.com
```

### WebSocket Endpoints
- **Emotion Monitoring:** `ws://your-domain.com/ws/emotions/`
- **Voice Sessions:** `ws://your-domain.com/ws/voice/{session_id}`
- **Health Check:** `http://your-domain.com/health`

## ML Model Initialization

The service automatically initializes pre-trained ML models on startup:

### FER (Facial Emotion Recognition)
- **Model:** Pre-trained facial emotion recognition
- **Face Detection:** MTCNN (Multi-task Cascaded Convolutional Networks)
- **Emotions Detected:** happy, sad, angry, fear, disgust, surprise, neutral
- **Processing:** Real-time analysis every 2 seconds

### Model Loading
```python
# Models are loaded automatically when the service starts
✅ Emotion detection models initialized successfully
🎭 Using FER with MTCNN for enhanced face detection
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure all dependencies are installed
   - Check file structure matches expected layout
   - Verify Python path configuration

2. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify WebSocket URL is correct
   - Ensure port 8001 is accessible

3. **ML Model Issues**
   - Verify TensorFlow and OpenCV are installed
   - Check for CUDA compatibility if using GPU
   - Ensure sufficient memory for model loading

### Debug Mode
Enable debug logging by setting:
```bash
VITE_DEBUG=true
```

### Health Check
Test if service is running:
```bash
curl http://your-domain.com/health
# Should return: {"status": "healthy"}
```

## Performance Optimization

### Memory Management
- Models are loaded once at startup
- Session cleanup prevents memory leaks
- Image processing optimized for speed

### Scalability
- WebSocket connections are stateless
- ML models are shared across sessions
- Async processing for concurrent requests

## Security Considerations

1. **CORS Configuration**
   - Configure allowed origins in production
   - Use HTTPS for WebSocket connections (WSS)

2. **Environment Variables**
   - Never commit sensitive data to version control
   - Use environment-specific configurations

3. **Rate Limiting**
   - Consider implementing rate limiting for production
   - Monitor resource usage

## Monitoring

### Logs to Monitor
```
✅ Emotion detection models initialized successfully
🔗 Emotion WebSocket connection accepted for session: {session_id}
🎭 ML Emotion analysis sent: Happy=X%, Neutral=Y%, Anxious=Z%, Stressed=W%
```

### Metrics
- WebSocket connection count
- Emotion analysis requests per minute
- Average response time
- Error rates

## Support

For issues during deployment:
1. Check application logs in your deployment platform
2. Verify all dependencies are installed
3. Test WebSocket connectivity
4. Validate ML model loading

## API Documentation

Once deployed, visit:
- **API Docs:** `http://your-domain.com/docs`
- **Health Check:** `http://your-domain.com/health`
- **WebSocket Test:** Use browser WebSocket client to test connections
