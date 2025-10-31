# Dating App Backend - Dockerfile for Fly.io
FROM node:20-slim

# Install fonts for watermark rendering (Sharp/librsvg)
# - fonts-dejavu: Base fonts
# - fonts-noto-color-emoji: Emoji support (for 💕)
# - fonts-liberation: Free alternative to Georgia/Times
RUN apt-get update && apt-get install -y \
    fonts-dejavu \
    fonts-noto-color-emoji \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads/profiles

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/server.js"]
