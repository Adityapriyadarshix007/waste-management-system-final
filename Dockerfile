FROM python:3.10-slim

WORKDIR /app

# 1. Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python packages - ALL WORK WITH PYTHON 3.10
RUN pip install --no-cache-dir \
    numpy==1.24.3 \
    opencv-python-headless==4.8.1.78 \
    torch==2.1.0 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics==8.0.196 \
    huggingface-hub==0.19.4 \
    Flask==2.3.3 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.0.5 \
    Pillow==10.1.0 \
    gunicorn==21.2.0

# 3. Copy application
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
