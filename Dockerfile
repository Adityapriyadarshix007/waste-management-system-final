FROM python:3.10-slim-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libx11-dev \
    libgl1-mesa-glx \
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

# Copy requirements from backend folder
COPY backend/requirements_light.txt .

# Install Python packages
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --retries 3 --timeout 120 \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        -r requirements_light.txt

# Copy app files
COPY backend/app.py .
RUN mkdir -p hf_cache

# The ENTRYPOINT is the gunicorn command itself
ENTRYPOINT ["gunicorn"]
CMD ["--bind", "0.0.0.0:${PORT:-5001}", "app:app"]
