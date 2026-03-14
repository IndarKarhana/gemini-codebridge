#!/bin/bash
# Restart CodeBridge backend with visible logs.
# Run from project root: ./scripts/restart-backend.sh

cd "$(dirname "$0")/.."

# Kill existing backend on 8080
echo "Stopping any backend on port 8080..."
lsof -ti :8080 | xargs kill -9 2>/dev/null || true
sleep 1

echo "Starting backend (logs below)..."
echo "---"
PYTHONPATH=. uvicorn backend.gateway.main:app --port 8080
