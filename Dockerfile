FROM python:3.11-slim

WORKDIR /app

# 1. Install ALL system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # OpenCV runtime dependencies
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    # Build tools
    gcc \
    g++ \
    python3-dev \
    pkg-config \
    curl \
    wget \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Upgrade pip and tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# 3. Install SPECIFIC numpy version to fix "expected np.ndarray (got numpy.ndarray)" error
RUN pip install --no-cache-dir numpy==1.23.5

# 4. Install PyTorch with CPU versions
RUN pip install --no-cache-dir \
    torch==2.2.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.17.1+cpu --index-url https://download.pytorch.org/whl/cpu

# 5. Install ultralytics
RUN pip install --no-cache-dir ultralytics==8.1.0

# 6. Install Hugging Face Hub (was missing)
RUN pip install --no-cache-dir huggingface-hub==0.19.4

# 7. Install compatible OpenCV (downgraded for stability)
RUN pip install --no-cache-dir opencv-python-headless==4.8.1.78

# 8. Install Flask and web dependencies
RUN pip install --no-cache-dir \
    Flask==3.1.0 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.1.1 \
    Pillow==10.4.0 \
    gunicorn==21.2.0 \
    gevent==24.10.1

# 9. Clean up build tools to reduce image size
RUN apt-get purge -y --auto-remove gcc g++ python3-dev pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 10. Download the YOLOv8m model during build (optional but recommended)
RUN wget -q https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8m.pt -O yolov8m.pt

# 11. Copy application code
COPY backend/ .

# 12. Create necessary directories
RUN mkdir -p uploads hf_cache static

# 13. Set environment variables for your app
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PORT=5001

EXPOSE 5001

# 14. Use gunicorn to run the app on port 5001
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "1", "--timeout", "120", "app:app"]
