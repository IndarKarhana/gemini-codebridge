"""Gemini Live API service — streams audio to Gemini, returns transcriptions."""

import asyncio
import structlog
from google.genai import types

from backend.services.genai_client import get_client, get_live_model

logger = structlog.get_logger()

INPUT_SAMPLE_RATE = 16000


async def run_voice_session(
    audio_queue: asyncio.Queue[bytes],
    caption_callback: callable,
) -> None:
    """Run a Gemini Live session: receive PCM audio, emit transcriptions as captions.

    Uses Vertex AI (GCP billing) when configured, else API key (free tier).
    Args:
        audio_queue: Queue of raw PCM 16-bit 16kHz audio chunks
        caption_callback: async fn(text: str) called when user speech is transcribed
    """
    # Use dict config to match Gemini Live API docs exactly
    live_config = {
        "response_modalities": ["AUDIO"],
        "input_audio_transcription": {},
        "system_instruction": types.Content(
            parts=[
                types.Part(
                    text="You are CodeBridge, a pair programming communication assistant. "
                    "You transcribe the hearing developer's speech. Output only the transcript. "
                    "Do not respond with speech — we only need the text transcription."
                )
            ]
        ),
    }

    client = get_client()
    model = get_live_model()

    async with client.aio.live.connect(model=model, config=live_config) as session:
        logger.info("gemini_live_session_started")

        sent_count = [0]  # use list to allow mutation in closure

        async def send_audio() -> None:
            try:
                while True:
                    chunk = await audio_queue.get()
                    if chunk is None:
                        break
                    sent_count[0] += 1
                    if sent_count[0] <= 3 or sent_count[0] % 50 == 0:
                        logger.info("gemini_audio_sent", count=sent_count[0], bytes=len(chunk))
                    await session.send_realtime_input(
                        audio=types.Blob(
                            data=chunk,
                            mime_type=f"audio/pcm;rate={INPUT_SAMPLE_RATE}",
                        )
                    )
            except asyncio.CancelledError:
                pass

        recv_count = [0]

        async def receive_loop() -> None:
            try:
                async for response in session.receive():
                    if not response.server_content:
                        continue
                    sc = response.server_content
                    recv_count[0] += 1
                    if recv_count[0] <= 5:
                        has_input = hasattr(sc, "input_transcription") and sc.input_transcription
                        logger.info("gemini_response", recv=recv_count[0], has_input_transcription=has_input)
                    if hasattr(sc, "input_transcription") and sc.input_transcription:
                        text = getattr(sc.input_transcription, "text", None) or ""
                        text = (text or "").strip()
                        if text:
                            logger.info("transcription_received", text=text[:50])
                            if asyncio.iscoroutinefunction(caption_callback):
                                await caption_callback(text)
                            else:
                                caption_callback(text)
                    # Also check for model_turn (model response) - we only want input transcription
            except Exception as e:
                logger.error("gemini_receive_error", error=str(e), exc_info=True)
                raise

        send_task = asyncio.create_task(send_audio())
        recv_task = asyncio.create_task(receive_loop())

        try:
            await asyncio.gather(send_task, recv_task)
        finally:
            send_task.cancel()
            recv_task.cancel()
            try:
                await send_task
                await recv_task
            except asyncio.CancelledError:
                pass
