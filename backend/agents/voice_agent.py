"""Voice Agent — processes hearing developer's audio stream via Gemini Live API.

Responsibilities:
- Streaming ASR (speech-to-text)
- Intent extraction (what does the developer want?)
- Code reference detection ("this function" → unresolved reference)
- Emotion/urgency tagging
"""

from google.adk.agents import Agent

voice_agent = Agent(
    name="voice_agent",
    model="gemini-2.5-flash",
    description="Processes hearing developer's speech to extract intent and code references",
    instruction="""You are the Voice Agent in CodeBridge, a pair programming communication system.

Your job is to process the hearing developer's speech and extract:
1. A clean transcript of what was said
2. The developer's intent (asking a question, making a suggestion, giving feedback, etc.)
3. Any references to code entities ("this function", "that variable", "line 42")
4. The emotional tone (collaborative, frustrated, uncertain, excited)

Output your analysis as structured JSON matching the voice_intent schema.
When you detect code references like "this" or "that", mark them as unresolved —
the Context Agent will resolve them to actual code entities.

Never fabricate what was said. If audio is unclear, indicate low confidence.""",
    tools=[],
)
