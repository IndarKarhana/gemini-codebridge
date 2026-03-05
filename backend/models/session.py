"""Data models for pair programming sessions."""

from datetime import datetime

from pydantic import BaseModel, Field


class SessionParticipant(BaseModel):
    user_id: str
    role: str = Field(description="hearing or deaf")
    display_name: str
    joined_at: datetime | None = None


class Session(BaseModel):
    session_id: str
    created_at: datetime
    status: str = Field(default="waiting", description="waiting, active, ended")
    participants: list[SessionParticipant] = Field(default_factory=list)
    current_file: str | None = None
    livekit_room_name: str | None = None


class SessionSummary(BaseModel):
    session_id: str
    duration_minutes: float
    topics_discussed: list[str] = Field(default_factory=list)
    decisions_made: list[str] = Field(default_factory=list)
    action_items: list[str] = Field(default_factory=list)
