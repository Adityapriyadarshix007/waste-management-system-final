# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install minimal system dependencies (OpenCV headless works with minimal deps)
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Create necessary directories
RUN mkdir -p uploads hf_cache

EXPOSE 5000

CMD ["python", "app.py"]
