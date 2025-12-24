FROM python:3.10-slim-bullseye

# Install ALL required system dependencies for OpenCV, PyTorch, and GLib
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libx11-dev \
    libgomp1 \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libatlas-base-dev \
    gfortran \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better caching
COPY requirements_light.txt .

# Install gevent first to fix gunicorn issue
RUN pip install gevent==23.9.1

# Install other dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --retries 3 --timeout 120 \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        -r requirements_light.txt

# Copy the rest of the application
COPY app.py .
COPY start.sh .

# Make start.sh executable
RUN chmod +x start.sh

RUN mkdir -p hf_cache

EXPOSE 5001

# Use the start script
CMD ["./start.sh"]
