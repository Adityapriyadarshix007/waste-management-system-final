# Dockerfile for Waste Detection API - UPDATED FOR Flask 3.1.0
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

# Install Python dependencies - MUST MATCH requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir wheel setuptools && \
    pip install --no-cache-dir --retries 10 --timeout 100 \
        numpy==1.26.4 \
        Pillow==10.4.0 \
        opencv-python-headless==4.10.0.84 \
        huggingface-hub==0.19.4 \
        gunicorn==21.2.0 \
        gevent==24.10.1 && \
    pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
        torch==2.9.1 \
        torchvision==0.24.1 && \
    pip install --no-cache-dir \
        Flask==3.1.0 \
        flask-sqlalchemy==3.1.1 \
        flask-cors==4.0.0 \
        ultralytics==8.3.240 && \
    pip install --no-cache-dir \
        tensorflow==2.20.0 \
        keras==3.12.0 \
        pandas==2.2.3 \
        scikit-learn==1.5.0 \
        seaborn==0.13.2 \
        matplotlib==3.10.0 \
        beautifulsoup4==4.14.3 \
        lxml==5.3.0 \
        requests==2.32.5 \
        pyyaml==6.0.1

# Verify key installations
RUN python -c "import flask; print(f'Flask {flask.__version__} installed')" && \
    python -c "import ultralytics; print(f'Ultralytics {ultralytics.__version__} installed')" && \
    python -c "import torch; print(f'PyTorch {torch.__version__} installed')" && \
    python -c "import tensorflow as tf; print(f'TensorFlow {tf.__version__} installed')"

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
