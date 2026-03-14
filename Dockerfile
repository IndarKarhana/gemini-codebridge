# CodeBridge — production Dockerfile (frontend + backend)
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

# Backend (slim prod deps for faster startup)
COPY backend/requirements-prod.txt ./
RUN pip install --no-cache-dir -r requirements-prod.txt
COPY backend/ ./backend/

# Frontend static files
COPY --from=frontend /app/frontend/dist ./frontend/dist

ENV PYTHONPATH=/app
EXPOSE 8080

# Cloud Run sets PORT; default 8080
CMD ["sh", "-c", "uvicorn backend.gateway.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
