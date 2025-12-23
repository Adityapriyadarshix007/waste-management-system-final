# Dockerfile for Waste Detection API with YOLOv8
# Using python:3.11-slim-bookworm for Keras 3.x compatibility

FROM python:3.11-slim-bookworm

# Install system dependencies for OpenCV, TensorFlow, and other requirements
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    libjpeg62-turbo \
    libpng16-16 \
    libtiff6 \
    libopenblas0 \
    libhdf5-103-1 \
    libc-ares2 \
    libatlas3-base \
    libssl3 \
    libgfortran5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and application files
COPY requirements.txt .
COPY app.py .

# Create directories before setting permissions
RUN mkdir -p uploads hf_cache waste_dataset logs

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create non-root user AFTER installing packages
RUN useradd -m -u 1000 -s /bin/bash appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=5001 \
    MODEL_CACHE_DIR=/app/hf_cache \
    HF_HOME=/app/hf_cache \
    TORCH_HOME=/app/hf_cache \
    TF_CPP_MIN_LOG_LEVEL=3 \
    TF_ENABLE_ONEDNN_OPTS=1 \
    DEBUG=True \
    FLASK_ENV=production \
    OMP_NUM_THREADS=1 \
    OPENCV_IO_MAX_IMAGE_PIXELS=1099511627776 \
    PYTHONPATH=/app

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5001}/health || exit 1

EXPOSE ${PORT}

# Start with simple Python first for debugging
CMD ["python", "app.py"]
