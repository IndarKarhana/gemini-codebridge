from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from backend.gateway.routes import sessions, health
from backend.gateway.ws_handler import media_ws, agent_ws

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

app.include_router(health.router, tags=["health"])
app.include_router(sessions.router, prefix="/api", tags=["sessions"])


@app.websocket("/ws/media/{session_id}")
async def websocket_media(websocket: WebSocket, session_id: str):
    await media_ws(websocket, session_id)


@app.websocket("/ws/agent/{session_id}")
async def websocket_agent(websocket: WebSocket, session_id: str):
    await agent_ws(websocket, session_id)
