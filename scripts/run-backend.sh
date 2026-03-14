#!/bin/bash
# Run from project root
cd "$(dirname "$0")/.."
source .venv/bin/activate 2>/dev/null || true
export PYTHONPATH=.
# No --reload to avoid .venv file watcher spam; use --reload for dev if needed
exec uvicorn backend.gateway.main:app --port 8080
