FROM python:3.9-slim

WORKDIR /app

# 1. Install ONLY what's needed (no OpenCV dependencies)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python packages WITHOUT OpenCV
RUN pip install --no-cache-dir \
    numpy==1.23.5 \
    # REMOVED: opencv-python
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

# 4. FIX YOUR APP.PY - Remove OpenCV import
# Run this command to fix OpenCV imports in your app.py
RUN if [ -f "app.py" ]; then \
    # Replace cv2 imports with Pillow
    sed -i 's/import cv2/# import cv2 - REMOVED for compatibility/' app.py; \
    sed -i 's/from cv2 import/# from cv2 import - REMOVED for compatibility/' app.py; \
    # Add Pillow import at the top
    sed -i '1s/^/from PIL import Image\nimport numpy as np\n# Note: OpenCV replaced with Pillow for compatibility\n/' app.py; \
    echo "✅ Fixed app.py - OpenCV replaced with Pillow"; \
fi

# 5. Create directories
RUN mkdir -p uploads hf_cache

# 6. Test imports work
RUN python -c "from flask import Flask; from ultralytics import YOLO; from PIL import Image; print('✅ All imports successful')"

# 7. Set environment variables
ENV PORT=5001
ENV MODEL_CACHE_DIR=./hf_cache
ENV DEBUG=False
ENV NO_CV=1 

EXPOSE 5001

# 8. Start the application
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
