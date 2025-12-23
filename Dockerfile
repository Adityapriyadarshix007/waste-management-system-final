FROM python:3.9-slim

WORKDIR /app

# Minimal system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install packages without strict version pins
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    opencv-python-headless \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    ultralytics \
    huggingface-hub \
    Flask flask-cors flask-sqlalchemy \
    gunicorn

COPY backend/ .
RUN mkdir -p uploads hf_cache

ENV PORT=5001
EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
