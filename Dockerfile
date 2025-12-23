FROM python:3.10-slim

WORKDIR /app

# 1. Install system dependencies (no libgl1 issues)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python packages WITHOUT version pins for problematic packages
RUN pip install --no-cache-dir --upgrade pip==24.0 && \
    pip install --no-cache-dir \
    numpy \
    opencv-python \
    torch==2.2.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.17.1 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics \
    huggingface-hub \
    Flask \
    flask-cors \
    flask-sqlalchemy \
    Pillow \
    gunicorn

# 3. Copy application code
COPY backend/ .

# 4. Create directories
RUN mkdir -p uploads hf_cache

# 5. Set environment variables
ENV PORT=5001
ENV MODEL_CACHE_DIR=./hf_cache
ENV DEBUG=False

EXPOSE 5001

# 6. Start the application
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
