# Dockerfile for Waste Detection API with YOLOv8
# Multi-stage build for optimized image size
# Using python:3.9-slim-bookworm for stable Debian Bookworm environment

# Stage 1: Build stage with all dependencies
FROM python:3.9-slim-bookworm as builder

# Install system dependencies for OpenCV and other requirements
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
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
COPY app.py .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    Flask==2.3.3 \
    Flask-CORS==4.0.0 \
    numpy==1.24.3 \
    Pillow==10.0.0 \
    opencv-python-headless==4.8.1.78 \
    ultralytics==8.0.196 \
    huggingface-hub==0.19.4 \
    torch==2.0.1 \
    torchvision==0.15.2 \
    pyyaml==6.0 \
    --index-url https://download.pytorch.org/whl/cpu

# Stage 2: Production stage
FROM python:3.9-slim-bookworm

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
    libtiff5 \
    libopenblas0 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 -s /bin/bash appuser && \
    mkdir -p /app && chown -R appuser:appuser /app

WORKDIR /app

# Copy Python dependencies from builder stage
COPY --from=builder /usr/local/lib/python3.9/site-packages/ /usr/local/lib/python3.9/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Copy application code
COPY --chown=appuser:appuser . .

# Create necessary directories
RUN mkdir -p uploads hf_cache waste_dataset && \
    chown -R appuser:appuser uploads hf_cache waste_dataset

# Switch to non-root user
USER appuser

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=5001 \
    MODEL_CACHE_DIR=/app/hf_cache \
    HF_HOME=/app/hf_cache \
    TORCH_HOME=/app/hf_cache \
    DEBUG=False \
    FLASK_ENV=production \
    OMP_NUM_THREADS=1 \
    OPENCV_IO_MAX_IMAGE_PIXELS=1099511627776

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5001}/health || exit 1

# Expose port (Railway will override PORT env variable)
EXPOSE ${PORT}

# Run the application
CMD ["python", "app.py"]
