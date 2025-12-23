FROM python:3.10-slim

WORKDIR /app

# 1. Install system dependencies in a SINGLE RUN command
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    gcc \
    g++ \
    python3-dev \
    pkg-config \
    wget \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Upgrade pip FIRST (no package installation in same command)
RUN pip install --no-cache-dir --upgrade pip

# 3. Install packages in STAGES to avoid conflicts
# Install NumPy FIRST (critical for other packages)
RUN pip install --no-cache-dir numpy==1.23.5

# Install OpenCV with compatible version
RUN pip install --no-cache-dir opencv-python-headless==4.8.1.78

# Install PyTorch
RUN pip install --no-cache-dir \
    torch==2.1.0 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cpu

# Install ultralytics
RUN pip install --no-cache-dir ultralytics==8.0.196

# Install Flask and web packages
RUN pip install --no-cache-dir \
    Flask==2.3.3 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.0.5 \
    Pillow==10.1.0 \
    huggingface-hub==0.19.4 \
    gunicorn==21.2.0

# 4. Clean up build tools
RUN apt-get purge -y --auto-remove gcc g++ python3-dev pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 5. Copy application code
COPY backend/ .

# 6. Create necessary directories
RUN mkdir -p uploads hf_cache static

# 7. Set environment variables
ENV PORT=5001
ENV MODEL_CACHE_DIR=./hf_cache
ENV DEBUG=False

EXPOSE 5001

# 8. Start the application
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
