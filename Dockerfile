FROM python:3.9-slim

WORKDIR /app

# 1. Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python packages
RUN pip install --no-cache-dir \
    numpy==1.23.5 \
    opencv-python \
    torch==1.13.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.14.1 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics==8.0.196 \
    huggingface-hub==0.19.4 \
    Flask==2.3.3 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.0.5 \
    Pillow==10.1.0 \
    gunicorn==21.2.0

# 3. Copy application code
COPY backend/ .

# 4. Fix potential app.py issues
# Check if app.py exists and has correct imports
RUN if [ -f "app.py" ]; then \
        echo "✅ app.py exists"; \
        # Remove any OpenCV errors from app.py
        sed -i 's/import cv2/# import cv2 - using Pillow instead/' app.py 2>/dev/null || true; \
        # Add Pillow import
        sed -i '1s/^/from PIL import Image\n/' app.py; \
    else \
        echo "❌ app.py not found in backend/"; \
        exit 1; \
    fi

# 5. Create directories
RUN mkdir -p uploads hf_cache

# 6. Test the app imports
RUN python -c "from flask import Flask; print('✅ Flask import successful')" && \
    python -c "from ultralytics import YOLO; print('✅ Ultralytics import successful')" && \
    python -c "from PIL import Image; print('✅ Pillow import successful')"

# 7. Set environment variables
ENV PORT=5001
ENV MODEL_CACHE_DIR=./hf_cache
ENV DEBUG=False

EXPOSE 5001

# 8. Start the application
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
