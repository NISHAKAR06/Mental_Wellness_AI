# Optimized Dockerfile for Render deployment
FROM python:3.11-slim

# Set environment variables early
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    MPLBACKEND=Agg \
    PIP_NO_CACHE_DIR=1 \
    PORT=8001

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libgomp1 \
    libgfortran5 \
    libopenblas0 \
    liblapack3 \
    libatlas3-base \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory first
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with optimized settings (as root)
RUN pip install --no-cache-dir --timeout=300 -r requirements.txt

# Create non-root user and set ownerships
RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid 1001 --create-home --shell /bin/bash appuser && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Copy application code and set ownership
COPY --chown=appuser:appgroup . .

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Expose the port
EXPOSE $PORT

# Start with environment variable port support
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001} --workers 1 --loop asyncio"]
