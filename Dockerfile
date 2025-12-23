FROM ubuntu:20.04

WORKDIR /app

# Install Python 3.8 (most compatible)
RUN apt-get update && apt-get install -y \
    python3.8 \
    python3-pip \
    python3.8-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN ln -sf /usr/bin/python3.8 /usr/bin/python3

# Install packages
RUN pip3 install --no-cache-dir \
    numpy==1.21.6 \
    opencv-python==4.5.5.64 \
    torch==1.12.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.13.1 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics==8.0.196 \
    huggingface-hub==0.19.4 \
    Flask==2.2.5 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.0.5 \
    Pillow==9.5.0 \
    gunicorn==21.2.0

COPY backend/ .
RUN mkdir -p uploads hf_cache

ENV PORT=5001
EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
