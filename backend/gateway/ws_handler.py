"""WebSocket handlers for media (audio) and agent (captions) streams."""

import asyncio
import structlog
from fastapi import WebSocket, WebSocketDisconnect

from backend.config import config
from backend.gateway.session_state import (
    broadcast_caption,
    get_or_create_audio_queue,
    register_agent_connection,
    set_gemini_task,
    unregister_agent_connection,
)
from backend.services.gemini_live import run_voice_session

logger = structlog.get_logger()


async def media_ws(websocket: WebSocket, session_id: str) -> None:
    """Receive audio from hearing dev, forward to Gemini Live, captions go to agent_ws."""
    await websocket.accept()
    logger.info("media_ws_connected", session_id=session_id)

    if not config.google_api_key:
        await websocket.close(code=1011, reason="GOOGLE_API_KEY not configured")
        return

    queue = get_or_create_audio_queue(session_id)

    async def on_caption(text: str) -> None:
        await broadcast_caption(session_id, text)

    # Start Gemini session (consumes from queue, calls on_caption)
    gemini_task = asyncio.create_task(
        run_voice_session(config.google_api_key, queue, on_caption)
    )
    set_gemini_task(session_id, gemini_task)

    try:
        while True:
            data = await websocket.receive_bytes()
            await queue.put(data)
    except WebSocketDisconnect:
        logger.info("media_ws_disconnected", session_id=session_id)
        await queue.put(None)  # Signal Gemini to stop
        gemini_task.cancel()
        try:
            await gemini_task
        except asyncio.CancelledError:
            pass


async def agent_ws(websocket: WebSocket, session_id: str) -> None:
    """Push captions and agent messages to deaf dev's client."""
    await websocket.accept()
    await register_agent_connection(session_id, websocket)
    logger.info("agent_ws_connected", session_id=session_id)
    try:
        while True:
            # Keep connection alive, receive pings or simple acks if needed
            data = await websocket.receive_text()
            logger.debug("agent_client_msg", session_id=session_id, data=data[:50])
    except WebSocketDisconnect:
        await unregister_agent_connection(session_id, websocket)
