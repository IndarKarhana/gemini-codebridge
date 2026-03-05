"""Tool: Generate rich captions for the deaf developer."""


def generate_caption(
    speaker: str,
    text: str,
    code_references: list[dict] | None = None,
    confidence: float = 1.0,
) -> dict:
    """Generates a rich caption message for the deaf developer's communication panel.

    Args:
        speaker: Who is speaking — 'hearing_dev' or 'deaf_dev'.
        text: The caption text with resolved code references.
        code_references: List of resolved code entity references.
        confidence: Confidence score for the interpretation (0.0 to 1.0).

    Returns:
        dict with the formatted caption message.
    """
    return {
        "type": "caption",
        "speaker": speaker,
        "text": text,
        "code_references": code_references or [],
        "confidence": confidence,
    }
