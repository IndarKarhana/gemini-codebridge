"""Bridge Agent service — agentic enrichment of captions using Bridge Agent logic.

Routes raw inputs (voice transcript, sign interpretation) through the Bridge Agent
to produce context-rich captions. Uses Gemini with the Bridge Agent's instruction
to fuse multimodal inputs and optionally resolve code references.
Uses Vertex AI (GCP billing) when configured, else API key (free tier).
"""

import asyncio
import structlog

from backend.services.genai_client import get_client

logger = structlog.get_logger()

BRIDGE_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"]

BRIDGE_INSTRUCTION = """You are the Bridge Agent in CodeBridge — the central intelligence that
enables deaf and hearing developers to pair-program together in real time.

You receive raw inputs from:
1. Voice Agent: transcript from the hearing developer's speech
2. Vision Agent: sign language/gesture interpretation from the deaf developer

Your job: Produce a single, clear caption for display. Output ONLY the caption text.

Rules:
- Keep the caption concise (1-2 short sentences max)
- If code context is provided, resolve references like "this function" to actual names when possible
- Preserve the original intent and tone
- Never add explanations or meta-commentary
- Output ONLY the caption, nothing else"""


def _enrich_sync(raw_text: str, speaker: str, code_context: str | None) -> str:
    """Enrich raw caption through Bridge Agent logic. Returns enriched text."""
    if not raw_text or not raw_text.strip():
        return raw_text

    parts = [
        f"Raw input from {speaker}: {raw_text.strip()}",
    ]
    if code_context and code_context.strip():
        parts.append(f"\nCode context:\n{code_context.strip()}")

    parts.append("\nProduce the caption to display:")
    prompt = BRIDGE_INSTRUCTION + "\n\n" + "\n".join(parts)

    client = get_client()
    last_error = None

    for model in BRIDGE_MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )
            text = (getattr(response, "text", None) or "").strip()
            if text:
                logger.info("bridge_enriched", model=model, speaker=speaker, raw_preview=raw_text[:40], output_preview=text[:40])
                return text
        except Exception as e:
            last_error = e
            logger.warning("bridge_enrich_fallback", model=model, error=str(e)[:80])

    logger.warning("bridge_enrich_all_failed", fallback="raw")
    return raw_text


async def enrich_caption(
    raw_text: str,
    speaker: str = "hearing_dev",
    code_context: str | None = None,
) -> str:
    """Enrich a raw caption through the Bridge Agent. Returns enriched caption."""
    return await asyncio.to_thread(_enrich_sync, raw_text, speaker, code_context)
