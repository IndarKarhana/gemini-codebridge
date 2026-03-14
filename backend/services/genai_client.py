"""GenAI client factory — uses Vertex AI (GCP billing) when configured, else API key (free tier)."""

import os
from google import genai
from google.genai.types import HttpOptions

# Vertex AI uses GCP project billing; API key uses free tier limits
USE_VERTEX = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "").lower() in ("true", "1", "yes")
VERTEX_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "")
VERTEX_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
API_KEY = os.getenv("GOOGLE_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")


def get_client():
    """Return a genai.Client — Vertex AI (billing) when configured, else API key (free tier)."""
    if USE_VERTEX and VERTEX_PROJECT:
        return genai.Client(
            vertexai=True,
            project=VERTEX_PROJECT,
            location=VERTEX_LOCATION,
            http_options=HttpOptions(api_version="v1beta1"),
        )
    if API_KEY:
        return genai.Client(api_key=API_KEY, http_options=HttpOptions(api_version="v1alpha"))
    raise ValueError("Configure GOOGLE_API_KEY or (GOOGLE_CLOUD_PROJECT + GOOGLE_GENAI_USE_VERTEXAI=True)")


def is_vertex_configured() -> bool:
    """True if Vertex AI (GCP billing) is configured."""
    return bool(USE_VERTEX and VERTEX_PROJECT)


def has_genai_config() -> bool:
    """True if any GenAI backend is configured."""
    return bool(API_KEY or (USE_VERTEX and VERTEX_PROJECT))


def get_live_model() -> str:
    """Model ID for Gemini Live — Vertex uses GA model, API key uses preview."""
    return "gemini-2.5-flash-native-audio" if is_vertex_configured() else "gemini-2.5-flash-native-audio-preview-12-2025"
