# Dockerfile for Waste Detection API - FINAL WORKING VERSION
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
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy application files
COPY requirements.txt .
COPY app.py .

# Create necessary directories
RUN mkdir -p uploads hf_cache logs

# Install Python dependencies - WITH GEVENT
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir wheel setuptools && \
    pip install --no-cache-dir --retries 10 --timeout 100 \
        Flask==2.3.3 \
        flask-cors==4.0.0 \
        numpy==1.24.3 \
        Pillow==10.0.0 \
        opencv-python-headless==4.8.1.78 \
        huggingface-hub==0.19.4 \
        gunicorn==21.2.0 \
        gevent==24.10.1 && \  # GEVENT ADDED HERE
    pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
        torch==2.0.1 \
        torchvision==0.15.2 && \
    pip install --no-cache-dir ultralytics==8.0.196

# Verify installations
RUN python -c "import gevent; print(f'gevent {gevent.__version__} installed')"

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
    DEBUG=False

EXPOSE 8080

# Use Gunicorn with gevent worker
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--worker-class", "gevent", "--timeout", "120", "app:app"]
