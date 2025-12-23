FROM python:3.11-slim

WORKDIR /app

# 1. Install system dependencies - USE UPDATED PACKAGE NAMES
RUN apt-get update && apt-get install -y --no-install-recommends \
    # OpenCV graphical dependencies for Debian 12
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libegl1 \
    libxcb1 \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python packages WITH huggingface-hub
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    numpy==1.24.3 \
    opencv-python-headless==4.10.0.84 \
    torch==2.2.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.17.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    ultralytics==8.1.0 \
    # ADD THIS LINE - Fixes huggingface_hub import error
    huggingface-hub==0.19.4 \
    Flask==3.1.0 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.1.1 \
    Pillow==10.4.0 \
    gunicorn==21.2.0 \
    pyyaml==6.0.1  # For YAML support

# 3. Download YOLOv8m model during build (optional)
RUN wget -q https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8m.pt -O yolov8m.pt

# 4. Copy application
COPY backend/ .

# 5. Create directories
RUN mkdir -p uploads hf_cache static

# 6. Set environment variables
ENV PORT=5001
ENV MODEL_CACHE_DIR=./hf_cache
ENV DEBUG=False

EXPOSE 5001

# 7. Start the application
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
