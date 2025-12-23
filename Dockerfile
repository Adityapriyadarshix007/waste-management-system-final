FROM python:3.9-slim

WORKDIR /app

# 1. Install ONLY essential system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python packages WITHOUT OpenCV (use Pillow for image processing)
RUN pip install --no-cache-dir \
    numpy==1.23.5 \
    # SKIP OpenCV entirely - use Pillow instead
    torch==1.13.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.14.1 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics==8.0.196 \
    huggingface-hub==0.19.4 \
    Flask==2.3.3 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.0.5 \
    Pillow==10.1.0 \
    gunicorn==21.2.0

# 3. Modify your app.py to remove OpenCV import
# Replace: import cv2
# With: from PIL import Image
# Add this line to your app.py:
# print("WARNING: OpenCV not installed, using Pillow for image processing")

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
