# Use the official Python 3.11 slim image as a base
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# 1. Install system-level dependencies in a single layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    # OpenCV runtime dependencies
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    # Compiler and build tools for compiling Python packages
    gcc \
    g++ \
    python3-dev \
    pkg-config \
    # Clean up apt cache to keep image small
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python packages
# We upgrade pip, wheel, and setuptools first to known stable versions
RUN pip install --no-cache-dir --upgrade "pip<25.0" "wheel" "setuptools"
# Now install your application packages
RUN pip install --no-cache-dir \
    torch==2.2.1 --index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.17.1 --index-url https://download.pytorch.org/whl/cpu \
    ultralytics \
    opencv-python-headless==4.10.0.84 \
    Flask==3.1.0 \
    numpy==1.26.4 \
    Pillow==10.4.0 \
    gunicorn==21.2.0

# 3. (Optional) Clean up build tools to reduce final image size
RUN apt-get purge -y --auto-remove gcc g++ python3-dev pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy your application code
COPY backend/ .

# 5. Create any necessary directories
RUN mkdir -p uploads hf_cache

# 6. Expose port and define the startup command
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--timeout", "120", "app:app"]
