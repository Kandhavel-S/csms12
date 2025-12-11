FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install LibreOffice, fonts and utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    libreoffice-common \
    fontconfig \
    fonts-crosextra-caladea \
    fonts-liberation \
    fonts-noto \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    fonts-dejavu \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/* \
    && fc-cache -f -v

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server.py .

EXPOSE 10000
CMD gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 server:app
