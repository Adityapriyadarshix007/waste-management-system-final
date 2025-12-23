FROM python:3.10-slim

WORKDIR /app

# 1. Install essential system dependencies for OpenCV and compilers.
# Combined into a single RUN command for efficiency and smaller image size [citation:1][citation:4].
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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Upgrade pip to ensure compatibility with modern wheels [citation:10].
RUN pip install --no-cache-dir --upgrade pip

# 3. Install core Python packages, using more flexible or compatible versions.
# 'opencv-python-headless' is recommended for server environments [citation:3][citation:10].
RUN pip install --no-cache-dir \
    numpy \
    opencv-python-headless \
    torch==2.2.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.17.1 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics==8.1.0 \
    huggingface-hub==0.19.4 \
    Flask \
    flask-cors \
    flask-sqlalchemy \
    Pillow \
    gunicorn

# 4. (Optional) Clean up build tools to reduce final image size.
RUN apt-get purge -y --auto-remove gcc g++ python3-dev pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 5. Copy your application code. Done after dependencies to leverage Docker cache [citation:1][citation:7].
COPY backend/ .

# 6. Create necessary directories.
RUN mkdir -p uploads hf_cache static

# 7. Set environment variables.
ENV PORT=5001
ENV MODEL_CACHE_DIR=./hf_cache
ENV DEBUG=False

EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
