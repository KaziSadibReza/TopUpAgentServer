# Node.js automation server - with fallback Chromium support
FROM node:22-alpine

# Install Chromium and minimal dependencies for browser support
RUN apk add --no-cache \
    curl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    xvfb

# Set up Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    DISPLAY=:99

WORKDIR /app

# Copy and install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY .env.example ./.env

# Create necessary directories
RUN mkdir -p logs database screenshots

# Create startup script with virtual display
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting virtual display..."' >> /start.sh && \
    echo 'Xvfb :99 -screen 0 1920x1080x16 &' >> /start.sh && \
    echo 'sleep 2' >> /start.sh && \
    echo 'echo "Starting automation server..."' >> /start.sh && \
    echo 'npm start' >> /start.sh && \
    chmod +x /start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose app port
EXPOSE 3000

# Start with virtual display
CMD ["/start.sh"]
