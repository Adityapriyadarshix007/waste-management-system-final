FROM python:3.10-slim-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libx11-dev \
    libgl1-mesa-glx \
    libgomp1 \
    libjpeg-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements_light.txt .

# Install Python packages (gunicorn will be installed via requirements)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --retries 3 --timeout 120 \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        -r requirements_light.txt

# Copy app files
COPY app.py start.sh ./

RUN chmod +x start.sh && mkdir -p hf_cache

EXPOSE 5001

CMD ["./start.sh"]
