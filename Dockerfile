# Dockerfile for Waste Detection API with YOLOv8
# Using python:3.11-slim-bookworm for Keras 3.x compatibility

# Stage 1: Build stage with all dependencies
FROM python:3.11-slim-bookworm as builder

# Install system dependencies for OpenCV, TensorFlow, and other requirements
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    cmake \
    curl \
    wget \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    pkg-config \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libhdf5-dev \
    libc-ares-dev \
    libeigen3-dev \
    libatlas-base-dev \
    libopenblas-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
COPY app.py .

# Install Python dependencies with specific versions for compatibility
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    setuptools==69.5.1 \
    wheel==0.43.0 \
    && pip install --no-cache-dir -r requirements.txt

# Stage 2: Production stage
FROM python:3.11-slim-bookworm

# Install minimal runtime dependencies for Debian Bookworm
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    libjpeg62-turbo \
    libpng16-16 \
    libtiff6 \
    libopenblas0 \
    libhdf5-103-1 \
    libc-ares2 \
    libatlas3-base \
    libssl3 \
    libgfortran5 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 -s /bin/bash appuser && \
    mkdir -p /app && chown -R appuser:appuser /app

WORKDIR /app

# Copy Python dependencies from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Copy application code
COPY --chown=appuser:appuser . .

# Create necessary directories
RUN mkdir -p uploads hf_cache waste_dataset logs && \
    chown -R appuser:appuser uploads hf_cache waste_dataset logs

# Switch to non-root user
USER appuser

# Environment variables for TensorFlow and performance optimization
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=5001 \
    MODEL_CACHE_DIR=/app/hf_cache \
    HF_HOME=/app/hf_cache \
    TORCH_HOME=/app/hf_cache \
    TF_CPP_MIN_LOG_LEVEL=3 \
    TF_ENABLE_ONEDNN_OPTS=1 \
    DEBUG=False \
    FLASK_ENV=production \
    OMP_NUM_THREADS=1 \
    OPENCV_IO_MAX_IMAGE_PIXELS=1099511627776 \
    PYTHONPATH=/app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5001}/health || exit 1

# Expose port (Railway will override PORT env variable)
EXPOSE ${PORT}

# Run the application with Gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:${PORT:-5001}", "--workers", "2", "--worker-class", "gevent", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
