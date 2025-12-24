# Dockerfile for Waste Detection API - FINAL VERSION
FROM python:3.10-slim-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    curl \
    wget \
    libjpeg62-turbo \
    libpng16-16 \
    libtiff5 \
    libopenblas0 \
    libhdf5-103-1 \
    libc-ares2 \
    libatlas3-base \
    libssl3 \
    libgfortran5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy application files
COPY requirements.txt .
COPY app.py .

# Create necessary directories
RUN mkdir -p uploads hf_cache logs

# Install Python dependencies - ALL AT ONCE to avoid conflicts
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir wheel setuptools && \
    pip install --no-cache-dir --retries 10 --timeout 300 \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        -r requirements.txt

# Verify key installations
RUN python -c "import flask; print(f'✅ Flask {flask.__version__}')" && \
    python -c "import ultralytics; print(f'✅ Ultralytics {ultralytics.__version__}')" && \
    python -c "import torch; print(f'✅ PyTorch {torch.__version__}')" && \
    python -c "import tensorflow as tf; print(f'✅ TensorFlow {tf.__version__}')"

# Create non-root user for security
RUN useradd -m -u 1000 -s /bin/bash appuser && \
    chown -R appuser:appuser /app

USER appuser

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8080 \
    MODEL_CACHE_DIR=/app/hf_cache \
    HF_HOME=/app/hf_cache \
    TORCH_HOME=/app/hf_cache \
    TF_CPP_MIN_LOG_LEVEL=3 \
    TF_ENABLE_ONEDNN_OPTS=1 \
    DEBUG=False \
    OMP_NUM_THREADS=1

EXPOSE 8080

# Use Gunicorn with gevent worker
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--worker-class", "gevent", "--timeout", "120", "app:app"]
