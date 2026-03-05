# CodeBridge — Architecture Document

## Real-Time AI-Powered Pair Programming for Deaf and Hearing Developers

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Design Principles](#3-design-principles)
4. [Open-Source Ecosystem & Build vs. Reuse Map](#4-open-source-ecosystem--build-vs-reuse-map)
5. [High-Level Architecture](#5-high-level-architecture)
6. [Agent Architecture (ADK)](#6-agent-architecture-adk)
7. [Component Deep Dive](#7-component-deep-dive)
8. [Data Flow](#8-data-flow)
9. [API Contracts](#9-api-contracts)
10. [Google Cloud Infrastructure](#10-google-cloud-infrastructure)
11. [Security, Privacy & Guardrails](#11-security-privacy--guardrails)
12. [Failure Handling & Resilience](#12-failure-handling--resilience)
13. [Technology Stack](#13-technology-stack)
14. [MVP Scope vs Full Vision](#14-mvp-scope-vs-full-vision)
15. [Deployment Architecture](#15-deployment-architecture)

---

## 1. Problem Statement

### The Gap

Pair programming is the most effective form of collaborative software development. It relies
on **rapid, synchronous, high-bandwidth communication** — speaking, pointing, interrupting,
reacting in real time.

For deaf and hard-of-hearing developers, this collaboration model is fundamentally broken:

| Communication Mode | Words Per Minute | Hands Free? | Conveys Tone/Confidence? | Real-Time? |
|--------------------|-----------------|-------------|--------------------------|-----------|
| Speech (hearing)   | 125–150 WPM    | Yes         | Yes                      | Yes       |
| ASL/Sign Language  | 100–120 WPM    | No*         | Yes (facial expressions) | Yes       |
| Typing (chat)      | 40–60 WPM      | No          | No                       | Delayed   |

*Sign language requires hands, but alternates naturally with keyboard use — unlike typing for
communication which competes directly with typing for code.

### Why Existing Solutions Fail

- **Text chat (Slack, IDE chat):** Too slow, no nuance, context-poor. "Refactor that function"
  — which function? The hearing developer knows from vocal + gestural context. The reader doesn't.
- **Human interpreters:** Expensive ($50–150/hr), unavailable on-demand, rarely understand
  technical/programming jargon.
- **Generic sign language apps:** Translate signs to text, but have zero understanding of
  the code being discussed. They're modality translators, not communication bridges.
- **Auto-captions (Google Meet, Zoom):** One-directional (speech → text), no code awareness,
  no sign language input, and no context about what's on screen.

### The Core Insight

The problem isn't translation. It's **context loss**. When a hearing developer says "move that
function above the class declaration," they're combining speech + screen gaze + shared code
context. Any tool that just translates words without understanding the code context will
always produce ambiguous, incomplete communication.

---

## 2. Solution Overview

### What CodeBridge Is

CodeBridge is a **real-time, code-aware communication agent** that sits between a deaf developer
and a hearing developer during pair programming sessions. It uses Google's Gemini Live API
and Agent Development Kit (ADK) to:

1. **Listen** to the hearing developer's speech and extract intent + code references
2. **Watch** the deaf developer's camera for sign language, gestures, and pointing
3. **Understand** the shared code context (what file is open, what's highlighted, what was
   recently changed)
4. **Bridge** communication bidirectionally — converting speech to rich visual annotations for
   the deaf developer, and sign/gesture to synthesized speech for the hearing developer

### What CodeBridge Is NOT

- Not a code completion tool (not competing with Copilot/Cursor)
- Not a generic sign language translator
- Not a video calling app
- Not a code editor (it integrates with one)

### Value Proposition

> CodeBridge gives deaf developers what hearing developers take for granted: the ability to
> communicate naturally about code in real time, at full speed, with full nuance, while their
> hands stay on the keyboard.

---

## 3. Design Principles

### 3.1 Equal Participation, Not Accommodation

The deaf developer should feel like an equal participant, not a person being "helped."
The UI must be symmetrical — both developers have a rich, natural experience.

### 3.2 Code Context is King

Every piece of communication is enriched with code context. "This function" becomes
"the `authenticateUser` function at line 34 of `auth.py`." This is the core differentiator.

### 3.3 Graceful Degradation

When the Vision Agent is uncertain about a sign, it says so: "I'm 80% confident Dev B
signed 'refactor' — can you confirm?" Never hallucinate intent.

### 3.4 Low Latency Above All

Real-time communication tolerates ~1–2 seconds of latency. Beyond that, the conversational
flow breaks. Every architectural decision optimizes for latency.

### 3.5 Privacy by Default

Video streams are processed in real-time and not stored. Code context stays in the session.
No training on user data.

### 3.6 Compose, Don't Reinvent

Every component that isn't our core differentiator should be an open-source package or
managed service. We build the **glue and the intelligence** — everything else is off-the-shelf.

---

## 4. Open-Source Ecosystem & Build vs. Reuse Map

### Philosophy

CodeBridge's competitive advantage is the **Bridge Agent intelligence** — the code-aware
context fusion that no existing tool provides. Everything else (video streaming, code editing,
hand tracking, real-time sync) is solved by battle-tested open-source projects. We compose them.

### Component Mapping

| Component | Build or Reuse? | Package / Service | Why This One |
|-----------|----------------|-------------------|-------------|
| **Real-time video/audio transport** | REUSE | **LiveKit** (`livekit`, `@livekit/components-react`) | Open-source WebRTC infrastructure used by OpenAI, Spotify. Handles all signaling, room management, track subscriptions. Eliminates ~2 weeks of WebRTC plumbing. |
| **Hand landmark detection** | REUSE | **MediaPipe Hands** (`@mediapipe/tasks-vision`) | Google's own hand tracking — 21 landmarks per hand, runs client-side in browser at 30fps. We use this as a **gate**: only send video to Gemini when hands are detected and moving (saves API cost + latency). |
| **Pose & facial expression** | REUSE | **MediaPipe Holistic** (`@mediapipe/tasks-vision`) | Provides face mesh (478 landmarks) + pose (33 landmarks). ASL grammar depends heavily on facial expressions — eyebrow raise = question, head shake = negation. MediaPipe gives us this for free on-device. |
| **Code editor** | REUSE | **Monaco Editor** (`monaco-editor`, `@monaco-editor/react`) | VS Code's editor component. Syntax highlighting, IntelliSense, 50+ language support. Zero reason to build a code editor. |
| **Real-time code sync (CRDT)** | REUSE | **Yjs** (`yjs`, `y-monaco`, `y-websocket`) | Industry-standard CRDT library. `y-monaco` binding gives us Google Docs-style collaborative editing in ~20 lines of code. |
| **Agent orchestration** | REUSE | **Google ADK** (`google-adk` v1.26) | Required by hackathon. Multi-agent composition, tool registration, session management. Code-first Python framework. |
| **Gemini model access** | REUSE | **Google GenAI SDK** (`google-genai`) | Required by hackathon. Live API for streaming audio/video, multimodal understanding, speech synthesis. |
| **Backend framework** | REUSE | **FastAPI** (`fastapi`, `uvicorn`) | Async Python, native WebSocket support, automatic OpenAPI docs, Pydantic validation. |
| **State management (frontend)** | REUSE | **Zustand** (`zustand`) | Minimal, fast React state. No Redux boilerplate. |
| **Styling** | REUSE | **Tailwind CSS** (`tailwindcss`) | Utility-first CSS. Ship a beautiful UI without writing custom CSS files. |
| **Data validation** | REUSE | **Pydantic** (`pydantic` v2) | Type-safe data models shared between agents. Automatic JSON serialization. |
| **Session persistence** | REUSE | **Firestore** (managed) | Google Cloud NoSQL. Real-time listeners, serverless, zero ops. |
| **Caching / pub-sub** | REUSE | **Redis via Memorystore** (managed) | Sub-ms latency for code state cache and inter-agent message passing. |
| **Infrastructure as code** | REUSE | **Terraform** (`hashicorp/terraform`) | Declarative GCP provisioning. Reproducible deployments (bonus points). |
| **Bridge Agent intelligence** | **BUILD** | Custom (our code) | The core IP. Fuses voice intent + sign interpretation + code context into rich bidirectional communication. No existing tool does this. |
| **Code context engine** | **BUILD** | Custom (our code) | Maps deictic references ("this function", pointing gestures) to actual code entities using editor state + conversation history. Novel. |
| **Confidence & disambiguation UX** | **BUILD** | Custom (our code) | Shows alternatives when sign confidence is low, prompts for clarification. The guardrail layer. |

### How MediaPipe + Gemini Work Together (Not Redundant)

This is a critical architectural decision — we use MediaPipe and Gemini for **different things**:

```
Camera Feed (30 fps)
  │
  ▼
MediaPipe (runs in browser, client-side, free)
  │
  ├─ Hand detected? ──► No ──► Don't send to Gemini (save cost + latency)
  │
  ├─ Yes ──► Extract:
  │          ├─ 21 hand landmarks (x, y, z per hand)
  │          ├─ Hand openness / finger positions
  │          ├─ 478 face mesh landmarks (eyebrow, mouth, head tilt)
  │          └─ Pointing direction estimate
  │
  ├─ Package: landmarks + key video frames
  │
  ▼
Gemini Live API (runs on Google Cloud, the brain)
  │
  ├─ Receives: video frames + structured landmark data
  ├─ Interprets: "Given these hand shapes, facial expression, and the code
  │              context, the developer is signing: 'rename this variable'"
  └─ Returns: structured intent with confidence score
```

**Why this split matters:**
- MediaPipe runs at **30fps client-side for free** — perfect for continuous monitoring
- Gemini is powerful but costly per API call — we only invoke it when MediaPipe detects active signing
- MediaPipe provides **structured landmark data** that enriches Gemini's interpretation
- This reduces Gemini API calls by ~70% (idle time, typing time, etc.)

### How LiveKit Replaces Custom WebRTC

Instead of building WebSocket media transport from scratch:

```
WITHOUT LiveKit (weeks of work):
  - Build WebSocket server for binary audio/video
  - Handle codec negotiation
  - Implement room/session logic
  - Build reconnection handling
  - Handle NAT traversal, STUN/TURN
  - Build audio level detection
  - Manage track subscriptions

WITH LiveKit (hours of work):
  - livekit-server handles all transport (self-hosted or LiveKit Cloud)
  - @livekit/components-react gives us <VideoTrack>, <AudioTrack>, room UI
  - livekit Python SDK lets backend subscribe to tracks for agent processing
  - Built-in reconnection, room events, participant management
  - We focus 100% on the agent intelligence layer
```

### How Yjs + Monaco Replaces Custom Sync

```
WITHOUT Yjs (weeks of work):
  - Build Operational Transform or CRDT from scratch
  - Handle conflict resolution
  - Build cursor presence protocol
  - Sync editor state over WebSocket

WITH Yjs (20 lines of code):
  const ydoc = new Y.Doc()
  const ytext = ydoc.getText('code')
  const provider = new WebsocketProvider(wsUrl, roomId, ydoc)
  const binding = new MonacoBinding(ytext, editor.getModel(), new Set([editor]), provider.awareness)
  // Done. Real-time collaborative editing works.
```

---

## 5. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React + TypeScript)                      │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐   │
│  │  Video Panel      │  │  Code Editor      │  │  Communication Panel │   │
│  │                   │  │                   │  │                      │   │
│  │  LiveKit React    │  │  Monaco Editor    │  │  Custom (we build)   │   │
│  │  (@livekit/       │  │  (@monaco-editor/ │  │                      │   │
│  │   components-     │  │   react)          │  │  - Live captions     │   │
│  │   react)          │  │                   │  │  - Sign output       │   │
│  │                   │  │  + Yjs CRDT       │  │  - Code highlights   │   │
│  │  + MediaPipe      │  │  (y-monaco)       │  │  - Confidence scores │   │
│  │  (hand/face       │  │                   │  │  - Conversation log  │   │
│  │   landmarks,      │  │  + Cursor         │  │                      │   │
│  │   client-side)    │  │    Presence        │  │                      │   │
│  │                   │  │  (y-protocols/     │  │                      │   │
│  │                   │  │   awareness)       │  │                      │   │
│  └────────┬──────────┘  └────────┬──────────┘  └──────────┬───────────┘   │
│           │                      │                        │               │
└───────────┼──────────────────────┼────────────────────────┼───────────────┘
            │                      │                        │
     LiveKit WebRTC         Yjs WebSocket              WebSocket
     (audio+video tracks)   (CRDT sync)            (agent messages)
            │                      │                        │
┌───────────┼──────────────────────┼────────────────────────┼───────────────┐
│           ▼                      ▼                        ▼               │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │              API GATEWAY (FastAPI on Cloud Run)                     │   │
│  │         Authentication · Rate Limiting · Routing                   │   │
│  └──────────────────────────┬─────────────────────────────────────────┘   │
│                             │                                             │
│  ┌──────────────────────────▼─────────────────────────────────────────┐   │
│  │            AGENT ORCHESTRATOR (Google ADK v1.26)                    │   │
│  │                                                                    │   │
│  │  ┌───────────────┐ ┌────────────────┐ ┌─────────────────────────┐  │   │
│  │  │  VOICE AGENT  │ │  VISION AGENT  │ │    CONTEXT AGENT        │  │   │
│  │  │               │ │                │ │    ★ Custom (we build)  │  │   │
│  │  │  Gemini Live  │ │  Gemini Live   │ │                         │  │   │
│  │  │  API (Audio   │ │  API (Video    │ │  - Code state from      │  │   │
│  │  │  stream via   │ │  frames +      │ │    Monaco/Yjs           │  │   │
│  │  │  GenAI SDK)   │ │  MediaPipe     │ │  - Reference resolver   │  │   │
│  │  │               │ │  landmarks     │ │  - Session memory       │  │   │
│  │  │  Duties:      │ │  via GenAI SDK)│ │    (Firestore)          │  │   │
│  │  │  - Stream ASR │ │                │ │  - Disambiguation       │  │   │
│  │  │  - Intent     │ │  Duties:       │ │    engine               │  │   │
│  │  │    extraction │ │  - Sign/gesture│ │                         │  │   │
│  │  │  - Emotion    │ │    recognition │ │                         │  │   │
│  │  │    detection  │ │  - Pointing    │ │                         │  │   │
│  │  │               │ │    detection   │ │                         │  │   │
│  │  │               │ │  - Facial expr │ │                         │  │   │
│  │  └───────┬───────┘ └───────┬────────┘ └────────────┬────────────┘  │   │
│  │          │                 │                       │               │   │
│  │          ▼                 ▼                       ▼               │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │         BRIDGE AGENT ★ Custom (we build — core IP)         │    │   │
│  │  │                                                            │    │   │
│  │  │  Fuses all agent outputs + code context to produce:        │    │   │
│  │  │  → Context-rich captions for deaf developer                │    │   │
│  │  │  → Synthesized speech for hearing developer (Gemini TTS)   │    │   │
│  │  │  → Code annotation commands for shared editor              │    │   │
│  │  │  → Confidence indicators when uncertain                    │    │   │
│  │  │  → Session summaries and action items                      │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                    DATA / STATE LAYER (all managed services)        │   │
│  │                                                                    │   │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐         │   │
│  │  │  Firestore   │  │  Memorystore  │  │  Cloud Storage   │         │   │
│  │  │  (NoSQL)     │  │  (Redis 7)    │  │  (Blobs)         │         │   │
│  │  │              │  │               │  │                  │         │   │
│  │  │  Sessions,   │  │  Code state   │  │  Session         │         │   │
│  │  │  Users,      │  │  cache,       │  │  recordings,     │         │   │
│  │  │  Vocabulary  │  │  Agent msg    │  │  summaries       │         │   │
│  │  │              │  │  queue        │  │                  │         │   │
│  │  └──────────────┘  └───────────────┘  └──────────────────┘         │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│                         GOOGLE CLOUD PLATFORM                             │
└───────────────────────────────────────────────────────────────────────────┘

★ = Custom code (our IP). Everything else is open-source or managed service.
```

---

## 6. Agent Architecture (ADK — google-adk v1.26)

CodeBridge uses Google's Agent Development Kit (ADK) to orchestrate a multi-agent system.
Each agent has a single responsibility and communicates through the Bridge Agent.

### 6.1 Voice Agent

**Purpose:** Process the hearing developer's audio stream in real time.

```
Input:  Raw audio stream (WebSocket)
Output: Structured intent objects

Pipeline:
  Audio Stream
    → Gemini Live API (streaming ASR + understanding)
    → Intent Extraction
    → Code Reference Detection (e.g., "this function" → needs resolution)
    → Emotion/Urgency Tagging
    → Structured Output to Bridge Agent
```

**Output Schema:**
```json
{
  "type": "voice_intent",
  "timestamp": "2026-03-10T14:30:00.123Z",
  "speaker": "hearing_dev",
  "transcript": "Can you refactor this function to use async await?",
  "intent": "refactor_request",
  "code_references": [
    {
      "type": "unresolved",
      "phrase": "this function",
      "requires_context": true
    }
  ],
  "emotion": {
    "tone": "collaborative",
    "urgency": "normal"
  },
  "confidence": 0.94
}
```

### 6.2 Vision Agent

**Purpose:** Interpret the deaf developer's camera feed for sign language, gestures, and pointing.

```
Input:  Video stream (WebSocket, 15-30 fps)
Output: Structured gesture/sign interpretation objects

Pipeline:
  Video Stream
    → Gemini Live API (multimodal vision, streaming)
    → Frame Analysis:
        → Hand Tracking / Gesture Classification
        → Sign Language Interpretation
        → Pointing Direction Estimation
        → Facial Expression Analysis (ASL grammatical markers)
    → Temporal Aggregation (signs are multi-frame)
    → Structured Output to Bridge Agent
```

**Output Schema:**
```json
{
  "type": "vision_intent",
  "timestamp": "2026-03-10T14:30:02.456Z",
  "speaker": "deaf_dev",
  "interpretation": "I think we should rename this variable",
  "raw_signs": ["I", "THINK", "RENAME", "POINT_AT_SCREEN"],
  "gestures": [
    {
      "type": "pointing",
      "direction": "screen_upper_left",
      "estimated_target": "requires_context_resolution"
    }
  ],
  "facial_expression": {
    "grammatical_marker": "suggestion",
    "intensity": "moderate"
  },
  "confidence": 0.78,
  "alternatives": [
    {
      "interpretation": "I think we should remove this variable",
      "confidence": 0.15
    }
  ]
}
```

### 6.3 Context Agent

**Purpose:** Maintain awareness of the shared code state and resolve ambiguous references.

```
Input:  Code editor state (file, cursor, selection, visible lines, recent changes)
Output: Resolved code references

Responsibilities:
  1. Track which file is open, what lines are visible, what's highlighted
  2. Maintain a sliding window of "recently discussed" code entities
  3. Resolve deictic references ("this", "that", pointing gestures) to specific
     code elements (function names, line numbers, variables)
  4. Build a conversation-code knowledge graph for the session
```

**Resolution Example:**
```json
{
  "type": "context_resolution",
  "request": {
    "phrase": "this function",
    "pointing_direction": "screen_upper_left"
  },
  "resolution": {
    "entity": "function",
    "name": "authenticateUser",
    "file": "src/auth/handler.py",
    "line_range": [34, 67],
    "confidence": 0.91,
    "reasoning": "Function visible in upper portion of editor, most recently discussed entity"
  }
}
```

### 6.4 Bridge Agent (Orchestrator)

**Purpose:** Fuse outputs from all agents and produce final bidirectional communication.

```
Inputs:
  - Voice Agent intents
  - Vision Agent interpretations
  - Context Agent resolutions
  - Session history

Outputs:
  → For deaf developer:  Rich visual caption + code annotations + confidence indicators
  → For hearing developer: Synthesized speech (via Gemini TTS) + text backup
  → For shared editor:  Highlight commands, annotation overlays
```

**Fusion Logic:**
```
1. Receive intent from Voice Agent or Vision Agent
2. Query Context Agent to resolve any code references
3. Enrich the message with resolved references
4. Determine output format based on target:
   - Deaf dev → Visual: caption + highlighted code region + confidence badge
   - Hearing dev → Audio: synthesized speech with natural prosody
5. If confidence < threshold (0.7):
   - Add disambiguation prompt: "Did you mean X or Y?"
   - Highlight both possible code targets
6. Append to session transcript
```

**ADK Agent Definition (Pseudocode):**
```python
from google.adk import Agent, Tool, Orchestrator

bridge_agent = Orchestrator(
    name="bridge_agent",
    description="Fuses multimodal inputs to bridge deaf-hearing communication",
    sub_agents=[voice_agent, vision_agent, context_agent],
    routing_strategy="parallel_merge",
    model="gemini-2.5-pro",
    tools=[
        code_highlight_tool,
        speech_synthesis_tool,
        caption_generator_tool,
        session_memory_tool,
    ],
    system_instruction="""
    You are CodeBridge, a communication agent bridging a deaf developer and a
    hearing developer during pair programming. Your job is to:
    1. Fuse voice input, sign language input, and code context
    2. Produce rich, context-aware communication for both parties
    3. When uncertain, say so — never hallucinate intent
    4. Treat both developers as equal participants
    """
)
```

### 6.5 Agent Communication Flow

```
                    Hearing Dev speaks
                          │
                          ▼
                   ┌──────────────┐
                   │  Voice Agent  │
                   └──────┬───────┘
                          │ voice_intent
                          ▼
                   ┌──────────────┐      ┌───────────────┐
                   │ Bridge Agent  │◄────►│ Context Agent  │
                   └──────┬───────┘      └───────────────┘
                          │                resolve references
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
    ┌──────────────────┐   ┌──────────────────┐
    │ Caption + Code   │   │ Session Memory   │
    │ Highlight → Deaf │   │ Update           │
    │ Dev's Screen     │   │                  │
    └──────────────────┘   └──────────────────┘


                    Deaf Dev signs
                          │
                          ▼
                   ┌──────────────┐
                   │ Vision Agent  │
                   └──────┬───────┘
                          │ vision_intent
                          ▼
                   ┌──────────────┐      ┌───────────────┐
                   │ Bridge Agent  │◄────►│ Context Agent  │
                   └──────┬───────┘      └───────────────┘
                          │                resolve references
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
    ┌──────────────────┐   ┌──────────────────┐
    │ Speech Synthesis │   │ Session Memory   │
    │ → Hearing Dev's  │   │ Update           │
    │   Speakers       │   │                  │
    └──────────────────┘   └──────────────────┘
```

---

## 7. Component Deep Dive

### 7.1 Frontend (React + TypeScript)

```
src/
├── components/
│   ├── VideoPanel/
│   │   ├── CameraFeed.tsx          # WebRTC camera with overlay
│   │   ├── SoundVisualizer.tsx     # Visual representation of audio for deaf dev
│   │   ├── SignDetectionOverlay.tsx # Bounding box on detected signs
│   │   └── SpeakerIndicator.tsx    # Who is currently communicating
│   │
│   ├── CodeEditor/
│   │   ├── SharedEditor.tsx        # Monaco editor with CRDT sync
│   │   ├── CodeHighlighter.tsx     # Agent-driven code highlighting
│   │   ├── AnnotationOverlay.tsx   # Inline annotations from agent
│   │   └── CursorPresence.tsx      # Show both developers' cursors
│   │
│   ├── CommunicationPanel/
│   │   ├── LiveCaptions.tsx        # Real-time captions with code refs
│   │   ├── SignInterpretation.tsx   # What the vision agent interpreted
│   │   ├── ConfidenceBadge.tsx     # Visual confidence indicator
│   │   ├── ConversationLog.tsx     # Scrollable history
│   │   └── DisambiguationPrompt.tsx# "Did you mean X or Y?"
│   │
│   └── SessionControls/
│       ├── SessionManager.tsx      # Start/end/configure session
│       ├── AccessibilitySettings.tsx# Font size, contrast, caption speed
│       └── SessionSummary.tsx      # Post-session summary view
│
├── services/
│   ├── websocket.ts               # WebSocket connection manager
│   ├── webrtc.ts                  # Media stream handling
│   ├── codeSync.ts                # CRDT-based code synchronization
│   └── agentClient.ts            # Communication with backend agents
│
├── hooks/
│   ├── useMediaStream.ts          # Camera/microphone access
│   ├── useAgentMessages.ts        # Subscribe to agent outputs
│   ├── useCodeContext.ts          # Track editor state for context agent
│   └── useAccessibility.ts       # User accessibility preferences
│
└── stores/
    ├── sessionStore.ts            # Session state (Zustand)
    ├── codeStore.ts               # Shared code state
    └── communicationStore.ts      # Message history
```

### 7.2 Backend Services (Cloud Run)

```
backend/
├── gateway/
│   ├── main.py                    # FastAPI entry point
│   ├── auth.py                    # Session authentication
│   ├── ws_handler.py              # WebSocket endpoint management
│   └── rate_limiter.py            # Request rate limiting
│
├── agents/
│   ├── orchestrator.py            # ADK Bridge Agent definition
│   ├── voice_agent.py             # ADK Voice Agent definition
│   ├── vision_agent.py            # ADK Vision Agent definition
│   ├── context_agent.py           # ADK Context Agent definition
│   └── tools/
│       ├── code_highlight.py      # Tool: send highlight commands to editor
│       ├── speech_synthesis.py    # Tool: generate speech via Gemini
│       ├── caption_generator.py   # Tool: format rich captions
│       ├── reference_resolver.py  # Tool: resolve code references
│       └── session_memory.py      # Tool: read/write session history
│
├── services/
│   ├── media_processor.py         # Audio/video stream preprocessing
│   ├── code_state_tracker.py      # Track and index code editor state
│   ├── session_manager.py         # Session lifecycle management
│   └── summary_generator.py       # Post-session summary generation
│
└── models/
    ├── intents.py                 # Voice/Vision intent data models
    ├── code_context.py            # Code reference data models
    └── session.py                 # Session data models
```

---

## 8. Data Flow

### 8.1 Hearing Developer Speaks → Deaf Developer Sees

```
Timeline (target: < 1.5 seconds end-to-end)

t=0ms      Hearing dev speaks into microphone
           │
t=50ms     Browser captures audio chunk via MediaRecorder
           │
t=100ms    Audio chunk sent via WebSocket to Gateway
           │
t=150ms    Gateway routes to Voice Agent
           │
t=150-800ms Voice Agent (Gemini Live API, streaming):
           ├─ Streaming ASR: partial transcript available at ~300ms
           ├─ Intent extraction on partial transcript
           └─ Code reference detection
           │
t=800ms    Voice Agent emits voice_intent to Bridge Agent
           │
t=800-900ms Bridge Agent:
           ├─ Queries Context Agent for code reference resolution
           ├─ Context Agent checks: current file, visible lines, recent discussion
           └─ Returns resolved references
           │
t=900-1000ms Bridge Agent generates output:
           ├─ Rich caption: "Let's refactor `authenticateUser` (line 34) to use async/await"
           ├─ Code highlight command: highlight lines 34-67 in auth.py
           └─ Confidence: 0.94
           │
t=1000ms   Outputs sent via WebSocket to deaf dev's client
           │
t=1050ms   Deaf dev's UI updates:
           ├─ Caption appears in Communication Panel
           ├─ Code editor highlights lines 34-67
           └─ Sound Visualizer shows speaking pattern
```

### 8.2 Deaf Developer Signs → Hearing Developer Hears

```
Timeline (target: < 2 seconds end-to-end)

t=0ms      Deaf dev begins signing
           │
t=0-500ms  Browser captures video frames (15fps) via MediaStream
           │
t=100ms    Frames streamed via WebSocket to Gateway
           │
t=150ms    Gateway routes to Vision Agent
           │
t=150-1200ms Vision Agent (Gemini Live API, streaming video):
           ├─ Hand tracking and gesture classification
           ├─ Sign sequence aggregation (signs span multiple frames)
           ├─ Pointing direction estimation
           ├─ Facial expression analysis (ASL grammatical markers)
           └─ Temporal context: combine with recent signs
           │
t=1200ms   Vision Agent emits vision_intent to Bridge Agent
           │
t=1200-1400ms Bridge Agent:
           ├─ Queries Context Agent to resolve pointing + "this"
           ├─ Checks confidence: 0.78 (above threshold, proceed)
           ├─ Generates synthesized speech text
           └─ Includes alternatives for low-confidence segments
           │
t=1400-1600ms Speech synthesis via Gemini
           │
t=1600ms   Outputs sent to hearing dev's client:
           ├─ Audio plays: "I think we should rename this variable — pointing at `usr` on line 12"
           └─ Text backup appears in their panel
           │
t=1700ms   Hearing dev hears the synthesized speech
```

---

## 9. API Contracts

### 9.1 WebSocket Channels

Each session establishes three WebSocket connections:

| Channel | Path | Direction | Payload |
|---------|------|-----------|---------|
| Media | `/ws/media/{session_id}` | Client → Server | Audio chunks (PCM 16-bit) + Video frames (JPEG) |
| Code | `/ws/code/{session_id}` | Bidirectional | CRDT operations (Yjs) |
| Agent | `/ws/agent/{session_id}` | Server → Client | Agent messages (JSON) |

### 9.2 Agent Message Types

```typescript
// Server → Client message types

interface CaptionMessage {
  type: "caption";
  speaker: "hearing_dev" | "deaf_dev";
  text: string;
  code_references: CodeReference[];
  confidence: number;
  timestamp: string;
}

interface CodeHighlightMessage {
  type: "code_highlight";
  file: string;
  line_start: number;
  line_end: number;
  style: "reference" | "suggestion" | "warning";
  label?: string;
  duration_ms: number;
}

interface DisambiguationMessage {
  type: "disambiguation";
  question: string;
  options: {
    label: string;
    code_reference?: CodeReference;
    confidence: number;
  }[];
}

interface SessionSummaryMessage {
  type: "session_summary";
  duration_minutes: number;
  topics_discussed: string[];
  decisions_made: string[];
  action_items: string[];
  code_changes_discussed: CodeChange[];
}

interface CodeReference {
  entity_type: "function" | "variable" | "class" | "line_range" | "file";
  name: string;
  file: string;
  line_range: [number, number];
}
```

### 9.3 REST Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/sessions` | Create a new pair programming session |
| GET | `/api/sessions/{id}` | Get session metadata |
| POST | `/api/sessions/{id}/end` | End session, trigger summary |
| GET | `/api/sessions/{id}/summary` | Retrieve session summary |
| POST | `/api/sessions/{id}/feedback` | Submit correction for sign interpretation |
| GET | `/api/users/{id}/vocabulary` | Get custom sign vocabulary |
| PUT | `/api/users/{id}/vocabulary` | Update custom sign vocabulary |

---

## 10. Google Cloud Infrastructure

```
┌────────────────────────────────────────────────────────────────┐
│                     Google Cloud Platform                       │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Cloud Run (Compute)                    │  │
│  │                                                          │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ API Gateway      │  │ Agent Workers                │   │  │
│  │  │ Service          │  │ Service                      │   │  │
│  │  │                  │  │                              │   │  │
│  │  │ - FastAPI        │  │ - ADK Orchestrator           │   │  │
│  │  │ - WebSocket      │  │ - Voice/Vision/Context/     │   │  │
│  │  │   management     │  │   Bridge Agents              │   │  │
│  │  │ - Auth           │  │ - Gemini Live API clients    │   │  │
│  │  │                  │  │                              │   │  │
│  │  │ Min: 1 instance  │  │ Min: 1 instance              │   │  │
│  │  │ Max: 10          │  │ Max: 20                      │   │  │
│  │  │ CPU: 2 vCPU      │  │ CPU: 4 vCPU                  │   │  │
│  │  │ RAM: 2 GB        │  │ RAM: 8 GB                    │   │  │
│  │  └─────────────────┘  └──────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Data Services                          │  │
│  │                                                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐   │  │
│  │  │  Firestore   │  │ Memorystore  │  │ Cloud Storage │   │  │
│  │  │  (NoSQL DB)  │  │ (Redis)      │  │ (Blobs)       │   │  │
│  │  │              │  │              │  │               │   │  │
│  │  │  Sessions,   │  │  Code state  │  │  Session      │   │  │
│  │  │  Users,      │  │  cache,      │  │  recordings,  │   │  │
│  │  │  Vocabulary  │  │  Pub/Sub     │  │  summaries    │   │  │
│  │  └──────────────┘  └──────────────┘  └───────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    AI Services                            │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │  Gemini 2.5 Pro (via Vertex AI / Google GenAI SDK) │   │  │
│  │  │                                                    │   │  │
│  │  │  - Live API: Streaming audio + video processing    │   │  │
│  │  │  - Multimodal understanding: Sign interpretation   │   │  │
│  │  │  - Text generation: Caption enrichment             │   │  │
│  │  │  - Speech synthesis: Voice output for hearing dev  │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Networking                             │  │
│  │                                                          │  │
│  │  Cloud Load Balancer → Cloud Armor (DDoS) → Cloud Run    │  │
│  │  Cloud CDN for static frontend assets                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Observability                           │  │
│  │                                                          │  │
│  │  Cloud Logging · Cloud Monitoring · Cloud Trace           │  │
│  │  Custom Metrics: latency_p95, sign_confidence_avg,        │  │
│  │                  disambiguation_rate, session_duration     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Google Cloud Services Used

| Service | Purpose | Justification |
|---------|---------|---------------|
| **Cloud Run** | Serverless compute for API + agents | Auto-scaling, WebSocket support, cost-effective |
| **Firestore** | Session/user data | Real-time sync, serverless, no ops |
| **Memorystore (Redis)** | Code state cache, message queue | Sub-millisecond latency for real-time features |
| **Cloud Storage** | Session recordings, summaries | Durable blob storage |
| **Vertex AI / GenAI SDK** | Gemini model access | Required by hackathon |
| **Cloud Load Balancer** | Traffic routing | WebSocket support, SSL termination |
| **Cloud Armor** | DDoS protection | Security requirement |
| **Cloud Logging + Monitoring** | Observability | Debugging, performance tracking |
| **Secret Manager** | API keys, credentials | Secure credential storage |
| **Artifact Registry** | Container images | CI/CD for Cloud Run deployments |

---

## 11. Security, Privacy & Guardrails

### 11.1 Data Privacy

| Data Type | Stored? | Duration | Encryption |
|-----------|---------|----------|------------|
| Video stream | **No** | Real-time processing only | TLS in transit |
| Audio stream | **No** | Real-time processing only | TLS in transit |
| Code content | Session cache only | Deleted after session ends | AES-256 at rest |
| Conversation transcript | Optional (user consent) | 30 days | AES-256 at rest |
| Session summary | Yes (user consent) | Until deleted by user | AES-256 at rest |
| User profile | Yes | Until account deletion | AES-256 at rest |

### 11.2 Agent Guardrails

```python
GUARDRAIL_CONFIG = {
    "sign_interpretation": {
        "min_confidence_to_speak": 0.70,
        "min_confidence_to_act": 0.85,
        "always_show_alternatives_below": 0.80,
        "max_consecutive_low_confidence": 3,
        "action_on_max_low_confidence": "prompt_for_text_input"
    },
    "code_actions": {
        "agent_can_highlight": True,
        "agent_can_edit_code": False,       # NEVER auto-edit
        "agent_can_suggest_edits": True,
        "require_confirmation_for": ["file_operations", "git_operations"]
    },
    "content_safety": {
        "filter_profanity": False,           # Developers swear; don't censor
        "detect_frustration": True,          # Offer help if session is going badly
        "prevent_pii_in_summaries": True     # Strip names/emails from stored summaries
    },
    "session_limits": {
        "max_duration_hours": 4,
        "warn_at_minutes": [60, 120, 180],
        "max_participants": 2                # MVP: pair programming only
    }
}
```

### 11.3 Authentication

- Session-based authentication with short-lived tokens
- Both developers must authenticate before joining a session
- WebSocket connections authenticated via token in initial handshake
- No OAuth complexity for MVP — simple invite-link model

---

## 12. Failure Handling & Resilience

### 12.1 Failure Modes and Recovery

| Failure | Detection | Recovery | User Experience |
|---------|-----------|----------|----------------|
| Gemini API timeout | 3-second timeout | Retry with exponential backoff (max 2 retries) | Caption shows "..." indicator, catches up when restored |
| WebSocket disconnect | Heartbeat miss (5s) | Auto-reconnect with session resumption | "Reconnecting..." banner, session state preserved |
| Low sign confidence streak | 3+ consecutive < 0.5 confidence | Prompt deaf dev to switch to text input temporarily | "I'm having trouble reading your signs. Would you like to type for a moment?" |
| Code state desync | CRDT conflict detection | Force resync from most recent consistent state | Brief flicker, no data loss |
| Agent crash | Health check failure | Cloud Run auto-restarts, session reconnects to new instance | ~5 second interruption, session resumes |

### 12.2 Graceful Degradation Ladder

```
Full Experience (all systems nominal)
  │
  ▼ If Vision Agent fails:
Partial Experience (voice → captions works, deaf dev types instead of signs)
  │
  ▼ If Voice Agent also fails:
Text-Only Mode (both developers type, agent provides code-context enrichment)
  │
  ▼ If all agents fail:
Raw Mode (basic code editor collaboration, no AI, just shared editor)
```

Every degradation level is still usable. The session never fully breaks.

---

## 13. Technology Stack

### Frontend — All Open-Source

| Package | npm Install | What It Solves For Us | Lines of Custom Code Saved |
|---------|------------|----------------------|---------------------------|
| `react` + `react-dom` 19.x | `npm i react react-dom` | UI framework | — |
| `typescript` 5.x | `npm i -D typescript` | Type safety | — |
| `@monaco-editor/react` | `npm i @monaco-editor/react` | Full code editor with syntax highlighting, IntelliSense | ~5,000+ |
| `yjs` + `y-monaco` + `y-websocket` | `npm i yjs y-monaco y-websocket` | Real-time collaborative editing via CRDT | ~3,000+ |
| `@livekit/components-react` + `livekit-client` | `npm i @livekit/components-react livekit-client` | WebRTC video/audio rooms, track management, reconnection | ~8,000+ |
| `@mediapipe/tasks-vision` | `npm i @mediapipe/tasks-vision` | Client-side hand tracking (21 landmarks), face mesh (478 landmarks) | ~2,000+ |
| `zustand` 5.x | `npm i zustand` | Lightweight state management | ~500 |
| `tailwindcss` 4.x | `npm i -D tailwindcss` | Utility-first styling | — |

### Backend — All Open-Source

| Package | pip Install | What It Solves For Us | Lines of Custom Code Saved |
|---------|------------|----------------------|---------------------------|
| `python` 3.12+ | — | Runtime | — |
| `google-adk` 1.26 | `pip install google-adk` | Multi-agent orchestration, tool registry, session management | ~4,000+ |
| `google-genai` | `pip install google-genai` | Gemini Live API access (streaming audio/video), multimodal understanding | ~2,000+ |
| `fastapi` + `uvicorn` | `pip install fastapi uvicorn` | Async HTTP + WebSocket server with auto-generated OpenAPI docs | ~1,500+ |
| `pydantic` 2.x | `pip install pydantic` | Type-safe data models, automatic JSON serialization | ~500 |
| `livekit` + `livekit-api` | `pip install livekit livekit-api` | Server-side track subscription for agent audio/video processing | ~2,000+ |
| `redis` (via `redis-py`) | `pip install redis` | Code state caching, inter-agent pub/sub | ~300 |
| `google-cloud-firestore` | `pip install google-cloud-firestore` | Session persistence, user profiles | ~400 |

### Infrastructure

| Technology | Install | What It Solves For Us |
|-----------|---------|----------------------|
| Docker | — | Containerization for Cloud Run |
| Terraform | `brew install terraform` | Infrastructure as code (GCP provisioning in ~200 lines) |
| Cloud Build | GCP managed | CI/CD pipeline — zero custom scripting |
| LiveKit Server | Docker image `livekit/livekit-server` | Self-hosted WebRTC SFU (or use LiveKit Cloud free tier for hackathon) |

### What We Actually Write (Our Custom Code)

| Component | Est. Lines | Purpose |
|-----------|-----------|---------|
| Bridge Agent logic | ~400 | Fuse voice + vision + code context into bidirectional output |
| Context Engine | ~300 | Map deictic references to code entities using editor state |
| MediaPipe → Gemini pipeline | ~150 | Gate and enrich video frames before sending to Gemini |
| Communication Panel UI | ~500 | Captions, confidence badges, disambiguation prompts |
| Session management glue | ~200 | Connect LiveKit rooms to ADK agents to Yjs docs |
| Agent tool definitions | ~250 | ADK tools for highlighting, captioning, speech synthesis |
| **Total custom code** | **~1,800** | **Everything else is open-source** |

---

## 14. MVP Scope vs Full Vision

### MVP (Hackathon Demo — 12 Days)

| Feature | Priority | Status |
|---------|----------|--------|
| Gemini Live API audio processing (hearing dev → captions) | P0 | Must ship |
| Gemini Vision sign/gesture interpretation (deaf dev → speech) | P0 | Must ship |
| Shared Monaco code editor | P0 | Must ship |
| Code-context-aware reference resolution | P0 | Must ship |
| Bridge Agent orchestration via ADK | P0 | Must ship |
| Rich visual captions with code highlights | P0 | Must ship |
| Confidence indicators + disambiguation prompts | P1 | Should ship |
| Session summary generation | P1 | Should ship |
| Sound visualizer for deaf dev | P1 | Should ship |
| Cloud Run deployment + Terraform | P1 | Should ship (bonus points) |
| Custom sign vocabulary | P2 | If time allows |
| Multilingual support | P2 | If time allows |
| Session recording (opt-in) | P2 | If time allows |

### Full Vision (Post-Hackathon)

- Support for 3+ participants (mob programming)
- IDE plugin (VS Code extension) instead of web-only
- Offline sign vocabulary training per user
- Integration with Jira/Linear for action item creation
- Support for multiple sign languages (BSL, LSF, JSL)
- Mobile companion app for on-the-go code review

---

## 15. Deployment Architecture

### Infrastructure as Code (Terraform)

```
infrastructure/
├── main.tf                 # Provider config, backend
├── cloud_run.tf            # API Gateway + Agent Worker services
├── firestore.tf            # Database setup
├── memorystore.tf          # Redis instance
├── storage.tf              # Cloud Storage buckets
├── networking.tf           # VPC, Load Balancer, Cloud Armor
├── iam.tf                  # Service accounts, permissions
├── secrets.tf              # Secret Manager entries
├── monitoring.tf           # Dashboards, alerts
├── variables.tf            # Configurable parameters
└── outputs.tf              # Deployment URLs, connection strings
```

### Deployment Pipeline

```
git push
  │
  ▼
Cloud Build Trigger
  │
  ├─ Build frontend → Cloud Storage (static hosting)
  ├─ Build backend container → Artifact Registry
  ├─ Run tests
  └─ Deploy to Cloud Run (rolling update)
```

### Environment Configuration

| Environment | Purpose | Gemini Model | Cloud Run Instances |
|-------------|---------|-------------|-------------------|
| `dev` | Development/testing | gemini-2.5-flash | 1 (min/max) |
| `prod` | Demo / hackathon judges | gemini-2.5-pro | 1-5 (auto-scale) |

---

## Appendix A: Key Metrics to Track

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| End-to-end voice → caption latency | < 1.5s | Conversational flow |
| End-to-end sign → speech latency | < 2.0s | Natural communication |
| Sign interpretation confidence (avg) | > 0.75 | Quality of deaf dev experience |
| Disambiguation rate | < 20% | Agent should be right most of the time |
| Session duration (avg) | > 15 min | People actually use it for real work |
| Code reference resolution accuracy | > 85% | Core differentiator must work |

---

## Appendix B: Accessibility Considerations

- All UI elements meet WCAG 2.1 AA contrast ratios
- Captions use a clear, large sans-serif font (configurable size)
- Code highlights use patterns + colors (not color alone) for color-blind users
- Keyboard navigable — no mouse-only interactions
- Screen reader compatible for any text elements
- High-contrast mode toggle
- Caption background opacity is adjustable

---

*Document Version: 1.1 — Updated with open-source composition strategy*
*Last Updated: March 4, 2026*
*Project: CodeBridge — Gemini Live Agent Challenge*
