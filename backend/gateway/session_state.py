"""In-memory session state — maps session_id to active connections and Gemini task."""

import asyncio
from collections import defaultdict
from typing import Any

import structlog
from fastapi import WebSocket

logger = structlog.get_logger()

# session_id -> { "agent_connections": set[WebSocket], "audio_queue": asyncio.Queue, "gemini_task": Task }
_sessions: dict[str, dict[str, Any]] = defaultdict(dict)
_lock = asyncio.Lock()


async def register_agent_connection(session_id: str, ws: WebSocket) -> None:
    async with _lock:
        if session_id not in _sessions:
            _sessions[session_id] = {
                "agent_connections": set(),
                "audio_queue": asyncio.Queue(),
                "gemini_task": None,
            }
        _sessions[session_id]["agent_connections"].add(ws)
    logger.info("agent_connected", session_id=session_id)


async def unregister_agent_connection(session_id: str, ws: WebSocket) -> None:
    async with _lock:
        if session_id in _sessions:
            _sessions[session_id]["agent_connections"].discard(ws)
            if not _sessions[session_id]["agent_connections"]:
                # Stop Gemini task when last agent disconnects
                task = _sessions[session_id].get("gemini_task")
                if task:
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
                del _sessions[session_id]
    logger.info("agent_disconnected", session_id=session_id)


async def broadcast_caption(session_id: str, text: str) -> None:
    """Send caption to all agent connections for this session."""
    async with _lock:
        conns = list(_sessions.get(session_id, {}).get("agent_connections", set()))
    msg = {"type": "caption", "speaker": "hearing_dev", "text": text, "confidence": 1.0}
    for ws in conns:
        try:
            await ws.send_json(msg)
        except Exception as e:
            logger.warning("caption_send_failed", session_id=session_id, error=str(e))


def get_or_create_audio_queue(session_id: str) -> asyncio.Queue[bytes]:
    """Get the audio queue for a session, creating session state if needed."""
    if session_id not in _sessions:
        _sessions[session_id] = {
            "agent_connections": set(),
            "audio_queue": asyncio.Queue(),
            "gemini_task": None,
        }
    return _sessions[session_id]["audio_queue"]


def set_gemini_task(session_id: str, task: asyncio.Task) -> None:
    _sessions[session_id]["gemini_task"] = task


def get_gemini_task(session_id: str) -> asyncio.Task | None:
    return _sessions.get(session_id, {}).get("gemini_task")
