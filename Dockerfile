# Dockerfile for Waste Detection API - Simplified Working Version
FROM python:3.11-slim-bookworm

# Install minimal system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    curl \
    libjpeg62-turbo \
    libpng16-16 \
    libtiff6 \
    libopenblas0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy application files
COPY requirements.txt .
COPY app.py .

# Create directories with proper permissions
RUN mkdir -p uploads hf_cache waste_dataset logs

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Verify installation
RUN python -c "import flask; print(f'Flask {flask.__version__} installed')" && \
    python -c "import ultralytics; print(f'Ultralytics {ultralytics.__version__} installed')" && \
    python -c "import torch; print(f'PyTorch {torch.__version__} installed')"

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=5001 \
    MODEL_CACHE_DIR=/app/hf_cache \
    HF_HOME=/app/hf_cache \
    TORCH_HOME=/app/hf_cache \
    DEBUG=True \
    FLASK_ENV=development \
    TF_CPP_MIN_LOG_LEVEL=0

EXPOSE ${PORT}

# Run with Python first (easier to debug)
CMD ["python", "-u", "app.py"]
