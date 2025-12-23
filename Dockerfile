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
    curl \
    wget \
    # Clean up to reduce image size
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Verify Python environment
RUN python -c "import sys; print('Python version:', sys.version); print('Platform:', sys.platform)"

# 3. Upgrade pip and setuptools to stable versions
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# 4. Install Python packages with specific compatible versions
RUN pip install --no-cache-dir \
    numpy==1.26.4 \
    Pillow==10.4.0

# 5. Install PyTorch first (explicitly specify CPU version)
RUN pip install --no-cache-dir \
    torch==2.2.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.17.1+cpu --index-url https://download.pytorch.org/whl/cpu

# 6. Install ultralytics with exact version that's known to work
RUN pip install --no-cache-dir \
    ultralytics==8.1.0

# 7. Install remaining packages
RUN pip install --no-cache-dir \
    opencv-python-headless==4.10.0.84 \
    Flask==3.1.0 \
    gunicorn==21.2.0 \
    gevent==24.10.1

# 8. Clean up build tools (optional but recommended for size)
RUN apt-get purge -y --auto-remove gcc g++ python3-dev pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 9. Copy application code
COPY backend/ .

# 10. Create necessary directories
RUN mkdir -p uploads hf_cache

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--timeout", "120", "app:app"]
