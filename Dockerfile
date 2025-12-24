FROM python:3.10-slim-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    curl \
    libjpeg62-turbo \
    libpng16-16 \
    libopenblas0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN mkdir -p hf_cache

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir wheel setuptools && \
    pip install --no-cache-dir --retries 5 --timeout 180 \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        -r requirements_optimized.txt

ENV PORT=5001 HF_HOME=/app/hf_cache TORCH_HOME=/app/hf_cache

EXPOSE 5001

# FIXED CMD - Use actual port number, not ${PORT}
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--worker-class", "gevent", "--timeout", "120", "app:app"]
