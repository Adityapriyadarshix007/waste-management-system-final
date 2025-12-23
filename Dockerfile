FROM python:3.9-slim

WORKDIR /app

# Install ALL dependencies including build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender1 \
    gcc g++ python3-dev pkg-config \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install OpenCV from pip with specific version
RUN pip install --no-cache-dir \
    numpy==1.23.5 \
    opencv-python-headless==4.5.5.64 \
    torch==1.13.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.14.1 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics==8.0.196 \
    huggingface-hub==0.19.4 \
    Flask==2.3.3 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.0.5 \
    Pillow==10.1.0 \
    gunicorn==21.2.0

# Clean build tools
RUN apt-get purge -y --auto-remove gcc g++ python3-dev pkg-config \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY backend/ .
RUN mkdir -p uploads hf_cache

ENV PORT=5001
EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
