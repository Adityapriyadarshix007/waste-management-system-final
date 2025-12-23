FROM python:3.11-slim

WORKDIR /app

# 1. Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender1 libgomp1 \
    curl wget \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Upgrade pip and install compatible packages
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# 3. Install SPECIFIC compatible versions (CRITICAL FIX)
RUN pip install --no-cache-dir \
    numpy==1.24.3 \
    opencv-python-headless==4.10.0.84 \
    Pillow==10.4.0

# 4. Install PyTorch
RUN pip install --no-cache-dir \
    torch==2.2.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.17.1+cpu --index-url https://download.pytorch.org/whl/cpu

# 5. Install ultralytics
RUN pip install --no-cache-dir ultralytics==8.1.0

# 6. Install Flask packages
RUN pip install --no-cache-dir \
    Flask==3.1.0 \
    flask-cors==4.0.0 \
    flask-sqlalchemy==3.1.1 \
    gunicorn==21.2.0

# 7. Copy application
COPY backend/ .

# 8. Create directories
RUN mkdir -p uploads hf_cache static

# 9. Set port
ENV PORT=5001

EXPOSE 5001

# 10. Start the app
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "--workers", "1", "app:app"]
