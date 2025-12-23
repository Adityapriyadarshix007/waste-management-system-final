FROM python:3.11-slim

WORKDIR /app

# 1. Install system packages (OpenCV dependencies)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install build tools (required for ultralytics compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 3. Install Python packages
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    torch==2.2.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.17.1 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics \
    opencv-python-headless==4.10.0.84 \
    Flask==3.1.0 \
    numpy==1.26.4 \
    Pillow==10.4.0 \
    gunicorn==21.2.0

# 4. Clean up build tools to reduce image size (optional but recommended)
RUN apt-get purge -y --auto-remove gcc g++ python3-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 5. Copy application code
COPY backend/ .

# 6. Create necessary directories
RUN mkdir -p uploads hf_cache

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--timeout", "120", "app:app"]
