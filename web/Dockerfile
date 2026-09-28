FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

ENV PORT=3000 \
    NODE_ENV=production

# Start production server
CMD ["npm", "run", "start"]
