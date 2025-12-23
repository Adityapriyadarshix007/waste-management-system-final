FROM python:3.11-alpine

WORKDIR /app

# Alpine packages are smaller
RUN apk add --no-cache \
    libstdc++ \
    libgcc \
    musl \
    libxrender \
    libxext \
    libsm \
    glib \
    tiff \
    jpeg \
    zlib \
    libpng \
    freetype \
    lcms2 \
    libwebp \
    tcl \
    tk

# Copy requirements
COPY backend/requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    --no-deps \
    -r requirements.txt

COPY backend/ .

RUN mkdir -p uploads hf_cache

EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--timeout", "120", "app:app"]
