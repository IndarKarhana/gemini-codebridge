"""Data models for agent output messages sent to clients."""

from pydantic import BaseModel, Field


class CaptionMessage(BaseModel):
    type: str = "caption"
    speaker: str
    text: str
    code_references: list[dict] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    timestamp: str


class CodeHighlightMessage(BaseModel):
    type: str = "code_highlight"
    file: str
    line_start: int
    line_end: int
    style: str = Field(description="reference, suggestion, or warning")
    label: str | None = None
    duration_ms: int = 5000


class DisambiguationOption(BaseModel):
    label: str
    code_reference: dict | None = None
    confidence: float = Field(ge=0.0, le=1.0)


class DisambiguationMessage(BaseModel):
    type: str = "disambiguation"
    question: str
    options: list[DisambiguationOption]
