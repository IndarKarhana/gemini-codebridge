"""Tool: Send code highlight commands to the shared editor."""


def highlight_code(
    file_path: str,
    line_start: int,
    line_end: int,
    style: str = "reference",
    label: str | None = None,
    duration_ms: int = 5000,
) -> dict:
    """Highlights a range of lines in the shared code editor.

    Args:
        file_path: Path to the file in the editor.
        line_start: First line to highlight (1-indexed).
        line_end: Last line to highlight (1-indexed).
        style: Highlight style — 'reference', 'suggestion', or 'warning'.
        label: Optional label to show next to the highlight.
        duration_ms: How long to show the highlight in milliseconds.

    Returns:
        dict with status and highlight details.
    """
    return {
        "status": "success",
        "highlight": {
            "file": file_path,
            "line_start": line_start,
            "line_end": line_end,
            "style": style,
            "label": label,
            "duration_ms": duration_ms,
        },
    }
