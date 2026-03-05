"""Data models for Voice and Vision agent intents."""

from pydantic import BaseModel, Field


class CodeReference(BaseModel):
    entity_type: str = Field(description="function, variable, class, line_range, or file")
    name: str
    file: str
    line_range: tuple[int, int]


class UnresolvedReference(BaseModel):
    ref_type: str = "unresolved"
    phrase: str
    requires_context: bool = True


class Emotion(BaseModel):
    tone: str = Field(description="collaborative, frustrated, uncertain, excited, neutral")
    urgency: str = Field(description="normal, high, low")


class VoiceIntent(BaseModel):
    type: str = "voice_intent"
    timestamp: str
    speaker: str = "hearing_dev"
    transcript: str
    intent: str
    code_references: list[UnresolvedReference | CodeReference] = Field(default_factory=list)
    emotion: Emotion
    confidence: float = Field(ge=0.0, le=1.0)


class Gesture(BaseModel):
    gesture_type: str
    direction: str | None = None
    estimated_target: str | None = None


class FacialExpression(BaseModel):
    grammatical_marker: str
    intensity: str = Field(description="low, moderate, high")


class AlternativeInterpretation(BaseModel):
    interpretation: str
    confidence: float = Field(ge=0.0, le=1.0)


class VisionIntent(BaseModel):
    type: str = "vision_intent"
    timestamp: str
    speaker: str = "deaf_dev"
    interpretation: str
    raw_signs: list[str] = Field(default_factory=list)
    gestures: list[Gesture] = Field(default_factory=list)
    facial_expression: FacialExpression | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    alternatives: list[AlternativeInterpretation] = Field(default_factory=list)
