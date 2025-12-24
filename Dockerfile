FROM python:3.10-slim-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements_light.txt .
COPY app.py .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --retries 3 --timeout 120 \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        -r requirements_light.txt

RUN pip install gevent  # Add gevent

RUN mkdir -p hf_cache

EXPOSE 5001

# Set default PORT environment variable
ENV PORT=5001

# Use the environment variable
CMD ["python", "app.py"]
