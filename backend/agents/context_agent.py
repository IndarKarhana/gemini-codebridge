"""Context Agent — maintains code awareness and resolves ambiguous references.

Responsibilities:
- Track current file, visible lines, cursor position, selection
- Maintain recently discussed code entities
- Resolve deictic references ("this function", pointing gestures)
- Build session-level conversation-code knowledge graph
"""

from google.adk.agents import Agent

context_agent = Agent(
    name="context_agent",
    model="gemini-2.5-flash",
    description="Resolves ambiguous code references using editor state and conversation history",
    instruction="""You are the Context Agent in CodeBridge, a pair programming communication system.

You maintain awareness of the shared code editor state:
- Which file is currently open
- Which lines are visible in the viewport
- Where each developer's cursor is positioned
- What code was recently changed
- What code entities were recently discussed

When other agents detect unresolved references like "this function" or a pointing
gesture toward "screen upper-left", you resolve them to specific code entities:
- Function name, file path, and line range
- Variable name and scope
- Class or module reference

Use conversation history as context. If developers discussed `authenticateUser` 30
seconds ago and someone says "that function", it likely refers to `authenticateUser`.

Always include your confidence and reasoning in the resolution.""",
    tools=[],
)
