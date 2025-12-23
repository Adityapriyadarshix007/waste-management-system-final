FROM ubuntu:22.04

WORKDIR /app

# 1. Install Python 3.9 (NOT 3.10) - better package compatibility
RUN apt-get update && apt-get install -y \
    python3.9 \
    python3-pip \
    python3.9-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgl1 \
    wget \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Make python3 point to python3.9
RUN ln -sf /usr/bin/python3.9 /usr/bin/python3 && \
    ln -sf /usr/bin/python3.9 /usr/bin/python

# 3. Upgrade pip FIRST
RUN pip3 install --no-cache-dir --upgrade pip==23.3.1

# 4. Install Python packages with COMPATIBLE versions
RUN pip3 install --no-cache-dir \
    numpy==1.23.5 \
    opencv-python-headless==4.8.1.78 \
    torch==2.0.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics==8.0.196 \
    huggingface-hub==0.19.4 \
    Flask==2.3.3 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.0.5 \
    Pillow==10.1.0 \
    gunicorn==21.2.0

# 5. Copy application code
COPY backend/ .

# 6. Create directories
RUN mkdir -p uploads hf_cache

# 7. Set environment variables
ENV PORT=5001
ENV MODEL_CACHE_DIR=./hf_cache
ENV DEBUG=False

EXPOSE 5001

# 8. Start the application
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
