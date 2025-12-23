FROM python:3.9-slim

WORKDIR /app

# 1. Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    # Add compiler tools for OpenCV compilation
    gcc \
    g++ \
    python3-dev \
    pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install packages WITHOUT specific version for OpenCV
RUN pip install --no-cache-dir \
    numpy==1.23.5 \
    # Use standard opencv-python (NOT headless)
    opencv-python \
    torch==2.0.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics==8.0.196 \
    huggingface-hub==0.19.4 \
    Flask==2.3.3 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.0.5 \
    Pillow==10.1.0 \
    gunicorn==21.2.0

# 3. Clean up build tools (optional)
RUN apt-get purge -y --auto-remove gcc g++ python3-dev pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy application code
COPY backend/ .

# 5. Create directories
RUN mkdir -p uploads hf_cache

# 6. Set environment variables
ENV PORT=5001
ENV MODEL_CACHE_DIR=./hf_cache
ENV DEBUG=False

EXPOSE 5001

# 7. Start the application
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
