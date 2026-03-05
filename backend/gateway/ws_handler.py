import structlog
from fastapi import WebSocket, WebSocketDisconnect

logger = structlog.get_logger()


async def media_ws(websocket: WebSocket, session_id: str) -> None:
    """Handle incoming audio/video media streams from clients."""
    await websocket.accept()
    logger.info("media_ws_connected", session_id=session_id)
    try:
        while True:
            data = await websocket.receive_bytes()
            # TODO: Route to Voice Agent or Vision Agent based on media type header
            logger.debug("media_chunk_received", session_id=session_id, size=len(data))
    except WebSocketDisconnect:
        logger.info("media_ws_disconnected", session_id=session_id)


async def agent_ws(websocket: WebSocket, session_id: str) -> None:
    """Push agent messages (captions, highlights, disambiguation) to clients."""
    await websocket.accept()
    logger.info("agent_ws_connected", session_id=session_id)
    try:
        while True:
            # TODO: Subscribe to Bridge Agent output for this session
            # and forward messages to the connected client
            data = await websocket.receive_text()
            logger.debug("agent_client_msg", session_id=session_id, data=data)
    except WebSocketDisconnect:
        logger.info("agent_ws_disconnected", session_id=session_id)
