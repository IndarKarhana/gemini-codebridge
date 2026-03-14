#!/bin/bash
# Run from project root
cd "$(dirname "$0")/.."
source .venv/bin/activate 2>/dev/null || true
export PYTHONPATH=.
exec uvicorn backend.gateway.main:app --reload --port 8080
