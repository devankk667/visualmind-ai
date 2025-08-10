# Multi-stage build for production deployment
FROM node:18-alpine AS frontend-build

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Backend stage
FROM node:18-alpine AS backend

WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start backend server
CMD ["node", "backend/index.mjs"]
