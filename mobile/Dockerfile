# Multi-stage Docker build for Flutter Web Command Center & Situation Room
FROM ghcr.io/cirruslabs/flutter:3.24.3 AS builder

WORKDIR /app

# Cache dependencies
COPY pubspec.yaml pubspec.lock* ./
RUN flutter config --enable-web && flutter pub get

# Copy application source code
COPY . .
RUN flutter build web --release --no-wasm-dry-run

# Production Lightweight Web Server
FROM nginx:alpine

# Support dynamic PORT environment variable (Render sets $PORT dynamically)
ENV PORT=3000
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/build/web /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
