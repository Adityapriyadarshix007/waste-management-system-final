FROM python:3.10-slim

WORKDIR /app

# 1. Install the specific system library that contains libGL.so.1
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python packages. Note: using 'opencv-python', NOT 'headless'
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    numpy==1.24.3 \
    # Changed: Use the main OpenCV package, not headless
    opencv-python==4.8.1.78 \
    torch==2.1.0+cpu --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.16.0+cpu --index-url https://download.pytorch.org/whl/cpu \
    ultralytics==8.0.196 \
    huggingface-hub==0.19.4 \
    Flask==2.3.3 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.0.5 \
    Pillow==10.1.0 \
    gunicorn==21.2.0

# 3. Copy your application code
COPY backend/ .

# 4. Create necessary directories
RUN mkdir -p uploads hf_cache static

# 5. Set environment variables
ENV PORT=5001
ENV MODEL_CACHE_DIR=./hf_cache
ENV DEBUG=False

EXPOSE 5001

# 6. Start the application
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
