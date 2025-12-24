# Dockerfile for Waste Detection API - OPTIMIZED FOR SIZE
FROM python:3.10-slim-bullseye

# Install ONLY essential system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    curl \
    libjpeg62-turbo \
    libpng16-16 \
    libopenblas0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy application files
COPY requirements_optimized.txt .
COPY app.py .

# Create directories
RUN mkdir -p hf_cache

# Install Python dependencies with size optimization
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir wheel setuptools && \
    pip install --no-cache-dir --retries 5 --timeout 180 \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        -r requirements_optimized.txt

# Clean pip cache to save space
RUN pip cache purge

# Remove unnecessary files
RUN find /usr/local/lib/python3.10 -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true && \
    find /usr/local/lib/python3.10 -name "*.pyc" -delete

ENV PYTHONUNBUFFERED=1 \
    PORT=5001 \
    MODEL_CACHE_DIR=/app/hf_cache \
    HF_HOME=/app/hf_cache \
    TORCH_HOME=/app/hf_cache \
    TF_CPP_MIN_LOG_LEVEL=3 \
    DEBUG=False

EXPOSE ${PORT}

CMD ["python", "-u", "app.py"]
