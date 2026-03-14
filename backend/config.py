"""Application configuration loaded from environment variables."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Config:
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
    google_cloud_project: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    google_cloud_location: str = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    use_vertex_ai: bool = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "").lower() in ("true", "1", "yes")
    livekit_api_key: str = os.getenv("LIVEKIT_API_KEY", "")
    livekit_api_secret: str = os.getenv("LIVEKIT_API_SECRET", "")
    livekit_url: str = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    environment: str = os.getenv("ENVIRONMENT", "dev")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    agentic_mode: bool = os.getenv("AGENTIC_MODE", "true").lower() in ("true", "1", "yes")

    @property
    def is_production(self) -> bool:
        return self.environment == "prod"

    @property
    def has_genai(self) -> bool:
        """True if GenAI is configured (API key or Vertex AI)."""
        if self.use_vertex_ai and self.google_cloud_project:
            return True
        return bool(self.google_api_key)


config = Config()
