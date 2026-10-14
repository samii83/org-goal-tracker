# Multi-stage Dockerfile: Builds React frontend and serves with FastAPI backend

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Python Backend with Static Serving
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV ENVIRONMENT=production

# Install backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ ./backend/

# Copy built frontend assets from stage 1 into dist/
COPY --from=frontend-builder /app/dist ./dist

# Create persistent storage directory for SQLite database
RUN mkdir -p /app/data
ENV DATABASE_URL="sqlite:////app/data/goaltrack.db"

EXPOSE 8000

# Run FastAPI with Uvicorn
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]

