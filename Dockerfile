FROM python:3.11-slim

WORKDIR /app

# Minimal system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender1 libgomp1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install packages
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    numpy==1.24.3 \
    opencv-python-headless==4.10.0.84 \
    torch==2.2.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.17.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    ultralytics==8.1.0 \
    Flask==3.1.0 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.1.1 \
    gunicorn==21.2.0

COPY backend/ .
RUN mkdir -p uploads hf_cache

ENV PORT=5001
EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
