FROM python:3.9-slim

WORKDIR /app

# 1. Install system dependencies INCLUDING OpenCV from system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    # Install OpenCV from SYSTEM PACKAGES
    python3-opencv \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python packages with COMPATIBLE ultralytics version
RUN pip install --no-cache-dir \
    numpy==1.23.5 \
    torch==1.13.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.14.1 --index-url https://download.pytorch.org/whl/cpu \
    # CHANGED: Use different ultralytics version
    ultralytics==8.0.0 \
    huggingface-hub==0.19.4 \
    Flask==2.3.3 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.0.5 \
    Pillow==10.1.0 \
    gunicorn==21.2.0

# 3. Copy application code
COPY backend/ .

# 4. Create directories
RUN mkdir -p uploads hf_cache

# 5. Test imports work
RUN python -c "import cv2; print(f'✅ OpenCV: {cv2.__version__}')" && \
    python -c "from ultralytics import YOLO; print('✅ Ultralytics import successful')"

# 6. Set environment variables
ENV PORT=5001
ENV MODEL_CACHE_DIR=./hf_cache
ENV DEBUG=False

EXPOSE 5001

# 7. Start the application
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
