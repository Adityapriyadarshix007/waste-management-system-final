FROM python:3.10-slim

WORKDIR /app

# Minimal dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install ALL packages without ANY version pins
RUN pip install --no-cache-dir \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    ultralytics \
    opencv-python \
    Flask flask-cors flask-sqlalchemy \
    huggingface-hub \
    gunicorn

COPY backend/ .
RUN mkdir -p uploads hf_cache

ENV PORT=5001
EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
