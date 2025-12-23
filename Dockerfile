# WORKING Dockerfile for Waste Detection API
FROM python:3.10-slim-bullseye  # Changed to more stable version

# Install system dependencies - BULLSEYE has stable packages
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

# Copy files
COPY requirements.txt .
COPY app.py .

# Verify files copied
RUN echo "Files in /app:" && ls -la

# Install Python dependencies with retry logic
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir wheel setuptools && \
    pip install --no-cache-dir --retries 10 --timeout 100 \
    Flask==2.3.3 \
    flask-cors==4.0.0 \
    numpy==1.24.3 \
    Pillow==10.0.0 \
    ultralytics==8.0.196 \
    torch==2.0.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cpu \
    opencv-python-headless==4.8.1.78 \
    huggingface-hub==0.19.4

# Create directories
RUN mkdir -p uploads hf_cache

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8080 \
    MODEL_CACHE_DIR=/app/hf_cache \
    HF_HOME=/app/hf_cache \
    DEBUG=True

EXPOSE 8080

# Simple CMD to test
CMD ["python", "app.py"]
