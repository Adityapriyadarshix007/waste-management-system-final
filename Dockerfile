# Dockerfile for Waste Detection API - OPTIMIZED UNDER 2GB
FROM python:3.10-slim-bullseye

# 1. Install ONLY essential dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# 2. Copy requirements FIRST for caching
COPY requirements_light.txt .

# 3. Install in ONE LAYER with cleanup
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --retries 3 --timeout 60 \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        -r requirements_light.txt && \
    # Cleanup to reduce size
    pip cache purge && \
    rm -rf /root/.cache/pip

# 4. Copy app code AFTER dependencies (caching optimization)
COPY app.py .

RUN mkdir -p hf_cache

EXPOSE 5001

CMD ["python", "app.py"]
