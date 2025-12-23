FROM python:3.11-slim

WORKDIR /app

# Install system dependencies efficiently
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (better caching)
COPY backend/requirements.txt .

# Upgrade pip and install dependencies in one layer
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir \
    --no-deps \
    --find-links https://download.pytorch.org/whl/torch_stable.html \
    -r requirements.txt

# Copy the rest of the application
COPY backend/ .

RUN mkdir -p uploads hf_cache

# Optional: Pre-download models during build if needed
# RUN python -c "from transformers import AutoModel; AutoModel.from_pretrained('model-name', cache_dir='hf_cache')"

EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "app:app"]
