FROM python:3.10-slim-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Hardcoded port - NO VARIABLES
ENV PORT=5001
EXPOSE 5001

# Simple Python command
CMD ["python", "app.py"]
