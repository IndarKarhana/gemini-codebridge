"""Gemini Vision service — interpret sign language from camera frames.

Uses Vertex AI (GCP billing) when configured, else API key (free tier).
"""

import asyncio
import base64
import structlog
from google.genai import types
from google.genai.errors import ClientError

from backend.services.genai_client import get_client

logger = structlog.get_logger()

# Try in order; fall back on 429 (quota), 404 (model not found), or 503
VISION_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
]

SIGN_PROMPT = """Look at this image. A person may be using sign language (ASL) or hand gestures.

Your task: Describe what they are communicating. Give your best interpretation.

- If they appear to be signing: translate to plain English (e.g. "Hello", "Thank you", "Yes", "No").
- If they are gesturing: describe it (e.g. "thumbs up", "pointing", "waving").
- If hands are visible but unclear: give your best guess (e.g. "possibly greeting").
- Only respond with exactly [none] if no hands are visible in the frame.

Output ONLY the translation or description. One short phrase. No explanations."""


def _is_retryable_error(e: Exception) -> bool:
    """True if we should try a fallback model (quota, 404, 503, etc.)."""
    if isinstance(e, ClientError):
        return e.code in (404, 429, 503)  # 404=model not found, 429=quota, 503=unavailable
    err_str = str(e).lower()
    return "429" in err_str or "404" in err_str or "resource_exhausted" in err_str or "quota" in err_str or "not_found" in err_str


def _interpret_sync(image_bytes: bytes) -> str | None:
    """Interpret sign language/gesture from image. Returns English text or None."""
    if not image_bytes or len(image_bytes) < 100:
        logger.warning("sign_interpret_skip", reason="image_too_small", bytes=len(image_bytes) if image_bytes else 0)
        return None

    contents = [
        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
        SIGN_PROMPT,
    ]
    config = types.GenerateContentConfig(
        safety_settings=[
            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_ONLY_HIGH"),
            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_ONLY_HIGH"),
            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_ONLY_HIGH"),
            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_ONLY_HIGH"),
        ]
    )

    client = get_client()
    last_error: Exception | None = None

    for model in VISION_MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config,
            )
            raw = getattr(response, "text", None) or ""
            text = raw.strip()
            if not text or text.lower() == "[none]":
                logger.info("sign_interpret_empty", model=model, raw_preview=raw[:80] if raw else "")
                return None
            logger.info("sign_interpret_ok", model=model, text=text[:60])
            return text
        except Exception as e:
            last_error = e
            if _is_retryable_error(e):
                idx = VISION_MODELS.index(model)
                next_model = VISION_MODELS[idx + 1] if idx + 1 < len(VISION_MODELS) else None
                logger.warning("sign_interpret_fallback", model=model, error=str(e)[:120], next_model=next_model)
            else:
                logger.error("sign_interpret_error", model=model, error=str(e), exc_info=True)
                return None

    logger.error("sign_interpret_all_failed", models=VISION_MODELS, error=str(last_error))
    return None


async def interpret_sign(image_base64: str) -> str | None:
    """Interpret sign language from base64 JPEG. Returns English text or None."""
    try:
        image_bytes = base64.b64decode(image_base64)
    except Exception:
        return None
    return await asyncio.to_thread(_interpret_sync, image_bytes)
