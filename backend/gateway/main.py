import logging
import os
import sys

import structlog
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import config
from backend.gateway.routes import sessions, health
from backend.gateway.session_state import broadcast_caption
from backend.gateway.ws_handler import media_ws, agent_ws

# Yjs WebSocket server for real-time code sync (ypy-websocket compatible with y-websocket client)
try:
    from ypy_websocket import ASGIServer, WebsocketServer

    _yjs_ws_server = WebsocketServer()
    _yjs_app = ASGIServer(_yjs_ws_server)
except ImportError:
    _yjs_app = None

app = FastAPI(
    title="CodeBridge API",
    description="Real-time AI-powered pair programming for deaf and hearing developers",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure structlog to print to console (must run before any logger use)
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)
logging.basicConfig(format="%(message)s", stream=sys.stdout, level=getattr(logging, config.log_level.upper(), logging.INFO))

app.include_router(health.router, tags=["health"])
app.include_router(sessions.router, prefix="/api", tags=["sessions"])

if _yjs_app is not None:
    app.mount("/yjs", _yjs_app)


@app.get("/debug/caption/{session_id}")
async def debug_send_caption(session_id: str, text: str = "Test caption") -> dict:
    """Send a test caption. Requires agent WS connected (click Start mic first)."""
    await broadcast_caption(session_id, text)
    return {"ok": True, "session_id": session_id, "text": text}





@app.on_event("startup")
async def startup():
    import structlog
    from backend.services.genai_client import is_vertex_configured
    log = structlog.get_logger()
    log.info(
        "startup",
        genai_configured=config.has_genai,
        vertex_ai=is_vertex_configured(),
        log_level=config.log_level,
    )


@app.websocket("/ws/media/{session_id}")
async def websocket_media(websocket: WebSocket, session_id: str):
    await media_ws(websocket, session_id)


@app.websocket("/ws/agent/{session_id}")
async def websocket_agent(websocket: WebSocket, session_id: str):
    await agent_ws(websocket, session_id)

# Serve frontend static files when they exist (production build) — must be last so /ws, /api, /yjs match first
_static_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.isdir(_static_dir):
    app.mount("/", StaticFiles(directory=_static_dir, html=True), name="static")
