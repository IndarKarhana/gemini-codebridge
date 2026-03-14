"""Gemini Live API service — streams audio to Gemini, returns transcriptions."""

import asyncio
import structlog
from google import genai
from google.genai import types

logger = structlog.get_logger()

# Model for native audio (transcription + optional TTS)
GEMINI_LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"
INPUT_SAMPLE_RATE = 16000


async def run_voice_session(
    api_key: str,
    audio_queue: asyncio.Queue[bytes],
    caption_callback: callable,
) -> None:
    """Run a Gemini Live session: receive PCM audio, emit transcriptions as captions.

    Args:
        api_key: Google API key for Gemini
        audio_queue: Queue of raw PCM 16-bit 16kHz audio chunks
        caption_callback: async fn(text: str) called when user speech is transcribed
    """
    config = types.LiveConnectConfig(
        response_modalities=[types.Modality.AUDIO],
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        system_instruction=types.Content(
            parts=[
                types.Part(
                    text="You are CodeBridge, a pair programming communication assistant. "
                    "You transcribe the hearing developer's speech. Output only the transcript. "
                    "Do not respond with speech — we only need the text transcription."
                )
            ]
        ),
    )

    client = genai.Client(api_key=api_key, http_options={"api_version": "v1alpha"})

    async with client.aio.live.connect(model=GEMINI_LIVE_MODEL, config=config) as session:
        logger.info("gemini_live_session_started")

        async def send_audio() -> None:
            try:
                while True:
                    chunk = await audio_queue.get()
                    if chunk is None:
                        break
                    await session.send_realtime_input(
                        audio=types.Blob(
                            data=chunk,
                            mime_type=f"audio/pcm;rate={INPUT_SAMPLE_RATE}",
                        )
                    )
            except asyncio.CancelledError:
                pass

        async def receive_loop() -> None:
            try:
                async for response in session.receive():
                    if not response.server_content:
                        continue
                    sc = response.server_content
                    if sc.input_transcription and sc.input_transcription.text:
                        text = sc.input_transcription.text.strip()
                        if text:
                            logger.info("transcription_received", text=text[:50])
                            if asyncio.iscoroutinefunction(caption_callback):
                                await caption_callback(text)
                            else:
                                caption_callback(text)
            except Exception as e:
                logger.error("gemini_receive_error", error=str(e))
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
