"""In-memory session state — maps session_id to active connections and Gemini task."""

import asyncio
import time
from collections import defaultdict
from typing import Any

import structlog
from fastapi import WebSocket

logger = structlog.get_logger()

# session_id -> { "agent_connections": set[WebSocket], "audio_queue": asyncio.Queue, "gemini_task": Task }
_sessions: dict[str, dict[str, Any]] = defaultdict(dict)
_lock = asyncio.Lock()

# Dedupe sign captions: session_id -> (last_text, timestamp)
_last_sign_caption: dict[str, tuple[str, float]] = {}
SIGN_DEDUPE_SECONDS = 5


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


async def broadcast_caption(session_id: str, text: str, speaker: str = "hearing_dev") -> None:
    """Send caption to all agent connections for this session."""
    async with _lock:
        conns = list(_sessions.get(session_id, {}).get("agent_connections", set()))
    logger.info("broadcast_caption", session_id=session_id, speaker=speaker, text=text[:50], conn_count=len(conns))
    msg = {"type": "caption", "speaker": speaker, "text": text, "confidence": 1.0}
    for ws in conns:
        try:
            await ws.send_json(msg)
        except Exception as e:
            logger.warning("caption_send_failed", session_id=session_id, error=str(e))


async def broadcast_speech(session_id: str, audio_base64: str, sample_rate: int = 24000) -> None:
    """Send TTS audio to all agent connections for this session."""
    async with _lock:
        conns = list(_sessions.get(session_id, {}).get("agent_connections", set()))
    logger.info("broadcast_speech", session_id=session_id, conn_count=len(conns), sample_rate=sample_rate)
    msg = {"type": "speech", "audio": audio_base64, "sample_rate": sample_rate, "speaker": "deaf_dev"}
    for ws in conns:
        try:
            await ws.send_json(msg)
        except Exception as e:
            logger.warning("speech_send_failed", session_id=session_id, error=str(e))


async def get_or_create_audio_queue(session_id: str) -> asyncio.Queue[bytes]:
    """Get the audio queue for a session, creating session state if needed."""
    async with _lock:
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


def is_duplicate_sign_caption(session_id: str, text: str) -> bool:
    """True if this sign caption is a duplicate of the last one (within window)."""
    key = session_id
    if key not in _last_sign_caption:
        return False
    last_text, last_ts = _last_sign_caption[key]
    if text.strip().lower() != last_text.strip().lower():
        return False
    return (time.monotonic() - last_ts) < SIGN_DEDUPE_SECONDS


def record_sign_caption(session_id: str, text: str) -> None:
    """Record that we broadcast this sign caption (for deduplication)."""
    _last_sign_caption[session_id] = (text.strip().lower(), time.monotonic())
