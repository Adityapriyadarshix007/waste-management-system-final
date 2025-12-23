FROM ubuntu:22.04

WORKDIR /app

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    python3.10-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Make python3 point to python3.10
RUN ln -sf /usr/bin/python3.10 /usr/bin/python3

# Install Python packages
RUN pip3 install --no-cache-dir \
    numpy \
    opencv-python \
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
