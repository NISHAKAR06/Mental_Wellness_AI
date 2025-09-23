# Multi-stage build for smaller image size
FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install TensorFlow CPU-only first (smaller)
RUN pip install --no-cache-dir tensorflow-cpu==2.16.1 --timeout=300

# Copy and install requirements
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --timeout=300

# Runtime image - much smaller
FROM python:3.11-slim

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libgfortran5 \
    libopenblas0 \
    liblapack3 \
    libatlas3-base \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    MPLBACKEND=Agg \
    PIP_NO_CACHE_DIR=1

# Create non-root user
RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid 1001 --create-home --shell /bin/bash appuser

# Create app directory and set ownership
WORKDIR /app
RUN chown appuser:appgroup /app

# Switch to non-root user
USER appuser

# Copy application code
COPY --chown=appuser:appgroup . .

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1", "--loop", "asyncio", "--http", "httptools", "--ws", "websockets"]
