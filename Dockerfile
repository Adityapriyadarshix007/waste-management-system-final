FROM python:3.11-slim

WORKDIR /app

# 1. Install ALL system dependencies in a single layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    # OpenCV dependencies
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    # Build tools for compiling Python packages
    gcc \
    g++ \
    python3-dev \
    pkg-config \
    # Clean up to reduce image size
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Upgrade pip and setuptools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# 3. Install base packages first
RUN pip install --no-cache-dir \
    numpy==1.26.4 \
    Pillow==10.4.0

# 4. Install PyTorch
RUN pip install --no-cache-dir \
    torch==2.2.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.17.1+cpu --index-url https://download.pytorch.org/whl/cpu

# 5. Install ultralytics
RUN pip install --no-cache-dir \
    ultralytics==8.1.0

# 6. Install Flask and ALL its dependencies (FIXED HERE)
RUN pip install --no-cache-dir \
    Flask==3.1.0 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.1.1 \
    opencv-python-headless==4.10.0.84 \
    gunicorn==21.2.0 \
    gevent==24.10.1

# 7. Clean up build tools to reduce image size
RUN apt-get purge -y --auto-remove gcc g++ python3-dev pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 8. Copy application code
COPY backend/ .

# 9. Create necessary directories
RUN mkdir -p uploads hf_cache

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--timeout", "120", "app:app"]
