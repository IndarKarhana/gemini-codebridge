"""WebSocket handlers for media (audio) and agent (captions) streams."""

import asyncio
import structlog
from fastapi import WebSocket, WebSocketDisconnect

from backend.config import config
from backend.gateway.session_state import (
    broadcast_caption,
    broadcast_speech,
    get_or_create_audio_queue,
    is_duplicate_sign_caption,
    record_sign_caption,
    register_agent_connection,
    set_gemini_task,
    unregister_agent_connection,
)
from backend.services.bridge_service import enrich_caption as bridge_enrich
from backend.services.gemini_live import run_voice_session
from backend.services.sign_service import interpret_sign
from backend.services.tts_service import text_to_speech

logger = structlog.get_logger()


async def _prepare_caption(text: str, speaker: str = "hearing_dev") -> str:
    """Optionally enrich caption through Bridge Agent when agentic mode is on."""
    if not config.agentic_mode or not text or not config.has_genai:
        return text
    try:
        return await bridge_enrich(text, speaker=speaker, code_context=None)
    except Exception as e:
        logger.warning("bridge_enrich_error", error=str(e)[:80], fallback="raw")
        return text


async def media_ws(websocket: WebSocket, session_id: str) -> None:
    """Receive audio from hearing dev, forward to Gemini Live, captions go to agent_ws."""
    await websocket.accept()
    logger.info("media_ws_connected", session_id=session_id)

    if not config.has_genai:
        await websocket.close(code=1011, reason="GenAI not configured (set GOOGLE_API_KEY or Vertex AI)")
        return

    queue = await get_or_create_audio_queue(session_id)

    async def on_caption(text: str) -> None:
        caption = await _prepare_caption(text, speaker="hearing_dev")
        await broadcast_caption(session_id, caption)

    # Start Gemini session (consumes from queue, calls on_caption)
    gemini_task = asyncio.create_task(run_voice_session(queue, on_caption))
    set_gemini_task(session_id, gemini_task)

    chunk_count = 0
    try:
        while True:
            data = await websocket.receive_bytes()
            chunk_count += 1
            if chunk_count <= 3 or chunk_count % 50 == 0:
                logger.info("media_audio_received", session_id=session_id, chunk=chunk_count, bytes=len(data))
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
            msg = await websocket.receive()
            if msg.get("type") == "websocket.disconnect":
                break
            if msg.get("text"):
                try:
                    import json
                    data = json.loads(msg["text"])
                    if data.get("type") == "client_caption" and data.get("text"):
                        # Client-side caption (e.g. Web Speech API fallback) — broadcast to all tabs
                        text = data["text"].strip()
                        speaker = data.get("speaker", "hearing_dev")
                        if text:
                            logger.info("client_caption_received", session_id=session_id, text=text[:50])
                            await broadcast_caption(session_id, text, speaker=speaker)
                    elif data.get("type") == "deaf_speech" and data.get("text"):
                        text = data["text"].strip()
                        if text and config.has_genai:
                            logger.info("deaf_speech_received", session_id=session_id, text=text[:50])
                            # Typed input: use as-is (user chose exact words); no bridge enrichment
                            await broadcast_caption(session_id, text, speaker="deaf_dev")
                            audio = await text_to_speech(text)
                            if audio:
                                import base64
                                await broadcast_speech(
                                    session_id,
                                    base64.b64encode(audio).decode(),
                                    sample_rate=24000,
                                )
                    elif data.get("type") == "sign_frame" and data.get("image"):
                        if config.has_genai:
                            img_len = len(data.get("image", ""))
                            logger.info("sign_frame_received", session_id=session_id, image_base64_len=img_len)
                            try:
                                text = await interpret_sign(data["image"])
                                if text:
                                    if is_duplicate_sign_caption(session_id, text):
                                        logger.info("sign_interpreted_duplicate_skipped", text=text[:50])
                                    else:
                                        record_sign_caption(session_id, text)
                                        logger.info("sign_interpreted", text=text[:50])
                                        caption = await _prepare_caption(text, speaker="deaf_dev")
                                        await broadcast_caption(session_id, caption, speaker="deaf_dev")
                                        audio = await text_to_speech(caption)
                                        if audio:
                                            import base64
                                            await broadcast_speech(
                                                session_id,
                                                base64.b64encode(audio).decode(),
                                                sample_rate=24000,
                                            )
                                else:
                                    logger.info("sign_interpreted_empty", session_id=session_id)
                            except Exception as e:
                                logger.error("sign_frame_error", error=str(e), exc_info=True)
                except (json.JSONDecodeError, KeyError) as e:
                    logger.debug("agent_client_msg", session_id=session_id, data=msg["text"][:50], err=str(e))
    except WebSocketDisconnect:
        pass
    finally:
        await unregister_agent_connection(session_id, websocket)
