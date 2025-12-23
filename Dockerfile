FROM python:3.11-slim

WORKDIR /app

# 1. Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender1 libgomp1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Don't upgrade pip - use existing version
RUN pip install --no-cache-dir \
    numpy==1.26.0 \
    opencv-python-headless \
    torch==2.2.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.17.1 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics \
    huggingface-hub \
    Flask \
    flask-cors \
    flask-sqlalchemy \
    Pillow \
    gunicorn

COPY backend/ .
RUN mkdir -p uploads hf_cache

ENV PORT=5001
EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
