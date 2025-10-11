# Multi-stage Dockerfile for theFOX application
# This Dockerfile builds and deploys the web app, mobile app, and backend

# Stage 1: Build Web App
FROM node:18-alpine AS web-builder
WORKDIR /app/web
COPY apps/web/package*.json ./
RUN npm install --only=production --legacy-peer-deps
COPY apps/web/ ./
RUN npm run build

# Stage 2: Build Mobile App (Expo)
FROM node:18-alpine AS mobile-builder
WORKDIR /app/mobile
COPY apps/mobile/package*.json ./
RUN npm install --only=production --legacy-peer-deps
COPY apps/mobile/ ./
RUN npx expo export --platform web

# Stage 3: Build Backend (Rust)
FROM rust:1.80-alpine AS backend-builder
WORKDIR /app/backend
RUN apk add --no-cache musl-dev sqlite-dev
COPY backend/Cargo.toml ./
COPY backend/src/ ./src/
COPY backend/migrations/ ./migrations/
RUN cargo build --release

# Stage 4: Production Image
FROM node:18-alpine AS production
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    sqlite \
    nginx \
    supervisor \
    curl

# Copy built applications
COPY --from=web-builder /app/web/.next /app/web/.next
COPY --from=web-builder /app/web/public /app/web/public
COPY --from=web-builder /app/web/package*.json /app/web/
COPY --from=web-builder /app/web/node_modules /app/web/node_modules
COPY --from=web-builder /app/web/next.config.ts /app/web/

COPY --from=mobile-builder /app/mobile/dist /app/mobile/dist
COPY --from=mobile-builder /app/mobile/package*.json /app/mobile/
COPY --from=mobile-builder /app/mobile/node_modules /app/mobile/node_modules
COPY --from=mobile-builder /app/mobile/app.json /app/mobile/

COPY --from=backend-builder /app/backend/target/release/thefox-backend /app/backend/thefox-backend

# Copy configuration files
COPY docker-config/nginx.conf /etc/nginx/nginx.conf
COPY docker-config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker-config/start.sh /app/start.sh

# Create necessary directories
RUN mkdir -p /var/log/nginx /var/log/supervisor /app/data

# Set permissions
RUN chmod +x /app/start.sh /app/backend/thefox-backend

# Set environment variables for Cloud Run
ENV PORT=8080
ENV NODE_ENV=production

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/ || exit 1

# Start services
CMD ["/app/start.sh"]
