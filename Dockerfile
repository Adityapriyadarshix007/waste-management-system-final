FROM python:3.11-bullseye  # Use Debian 11 instead of slim (which is Debian 12)

WORKDIR /app

# 1. Install system dependencies - Bullseye version
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python packages (same as above)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    numpy==1.24.3 \
    opencv-python-headless==4.10.0.84 \
    torch==2.2.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.17.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    ultralytics==8.1.0 \
    huggingface-hub==0.19.4 \
    Flask==3.1.0 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.1.1 \
    Pillow==10.4.0 \
    gunicorn==21.2.0 \
    pyyaml==6.0.1

# 3. Download model
RUN wget -q https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8m.pt -O yolov8m.pt

COPY backend/ .
RUN mkdir -p uploads hf_cache static

ENV PORT=5001
EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
