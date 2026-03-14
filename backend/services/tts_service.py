"""Gemini TTS service — convert text to speech for deaf dev → hearing dev.

Uses Vertex AI (GCP billing) when configured, else API key (free tier).
"""

import asyncio
import base64
import structlog
from google.genai import types

from backend.services.genai_client import get_client

logger = structlog.get_logger()

TTS_MODEL = "gemini-2.5-flash-preview-tts"
SAMPLE_RATE = 24000


def _tts_sync(api_key: str, text: str) -> bytes | None:
    """Convert text to speech using Gemini TTS. Returns raw PCM 16-bit 24kHz."""
    if not text or not text.strip():
        return None
    try:
        client = get_client()
        response = client.models.generate_content(
            model=TTS_MODEL,
            contents=f"Say naturally in a conversational tone: {text.strip()}",
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Kore",
                        )
                    )
                ),
            ),
        )
        if response.candidates and response.candidates[0].content.parts:
            part = response.candidates[0].content.parts[0]
            if hasattr(part, "inline_data") and part.inline_data:
                data = part.inline_data.data
                if isinstance(data, str):
                    return base64.b64decode(data)
                return data
        return None
    except Exception as e:
        logger.error("tts_error", error=str(e), text=text[:50])
        return None


async def text_to_speech(text: str) -> bytes | None:
    """Convert text to speech using Gemini TTS. Returns raw PCM 16-bit 24kHz."""
    return await asyncio.to_thread(_tts_sync, text)
