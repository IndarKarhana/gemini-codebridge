# CodeBridge

**Real-time AI-powered pair programming for deaf and hearing developers.**

CodeBridge is a communication agent that sits between a deaf developer and a hearing developer during pair programming sessions. It uses Google's Gemini Live API and Agent Development Kit (ADK) to listen, watch, understand code context, and bridge communication bidirectionally — so both developers can collaborate at full speed, in their natural language.

Built for the [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com/).

---

## The Problem

Pair programming is the most effective form of collaborative software development — but it's built around voice. Deaf developers are forced into text chat (2-3x slower than speech, no nuance, context-poor) or expensive human interpreters who don't understand technical jargon.

**The real problem isn't translation — it's context loss.** When someone says "refactor that function," they combine speech + gesture + shared screen context. Text alone can't carry that.

## The Solution

CodeBridge is not a translator. It's a **code-aware communication agent** powered by a multi-agent architecture:

| Agent | Role |
|-------|------|
| **Voice Agent** | Processes hearing developer's speech → extracts intent + code references |
| **Vision Agent** | Interprets deaf developer's sign language, gestures, pointing via camera |
| **Context Agent** | Tracks the shared code editor state, resolves "this function" → actual line numbers |
| **Bridge Agent** | Fuses all inputs, produces context-rich captions and synthesized speech |

The deaf developer sees rich captions with highlighted code references. The hearing developer hears natural speech representing the deaf developer's signed intent. Both developers stay in flow.

## Key Features

- **Bidirectional real-time communication** — speech ↔ sign language with code context
- **Code-aware reference resolution** — "this function" becomes "`authenticateUser` at line 34"
- **Confidence indicators** — shows when the agent is uncertain, offers alternatives
- **Graceful degradation** — falls back to text if sign recognition struggles
- **Session summaries** — AI-generated recap of decisions and action items

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Monaco Editor + LiveKit + MediaPipe)      │
└──────────────────────────┬──────────────────────────────────┘
                           │
              LiveKit WebRTC / WebSocket / Yjs CRDT
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Backend (FastAPI + Google ADK)                              │
│                                                              │
│  Voice Agent ──┐                                             │
│  Vision Agent ─┼──► Bridge Agent ──► Captions / Speech       │
│  Context Agent ┘        ▲                                    │
│                         │                                    │
│                   Code State (Yjs)                            │
└──────────────────────────────────────────────────────────────┘
│              Google Cloud (Cloud Run, Firestore, Gemini)      │
└──────────────────────────────────────────────────────────────┘
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full 15-section architecture document.

## Tech Stack

### We Build (~1,800 lines of custom code)
- Bridge Agent intelligence (code-context fusion)
- Context Engine (deictic reference resolution)
- Communication Panel UI (captions, confidence, disambiguation)

### We Compose (open-source)
| Component | Package |
|-----------|---------|
| Agent orchestration | Google ADK (`google-adk`) |
| Gemini models | Google GenAI SDK (`google-genai`) |
| Video/audio transport | LiveKit (`livekit`, `@livekit/components-react`) |
| Hand/face tracking | MediaPipe (`@mediapipe/tasks-vision`) |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Real-time sync | Yjs CRDT (`yjs`, `y-monaco`) |
| Backend | FastAPI + Uvicorn |
| Frontend | React 19 + TypeScript + Tailwind CSS |
| State management | Zustand |
| Infrastructure | Terraform on Google Cloud |

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker
- Google Cloud account with billing enabled
- [Gemini API key](https://aistudio.google.com/app/apikey)
- [LiveKit Cloud account](https://cloud.livekit.io) (free tier)

### Setup

```bash
# Clone
git clone https://github.com/IndarKarhana/gemini-codebridge.git
cd gemini-codebridge

# 1. Create .env (copy from root)
cp .env.example .env
# Add your GOOGLE_API_KEY from https://aistudio.google.com/app/apikey

# 2. Backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r backend/requirements.txt
PYTHONPATH=. uvicorn backend.gateway.main:app --reload --port 8080

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — click **Start mic** in the Communication panel, speak, and see live captions.

### Environment Variables

| Variable | Where to Get It |
|----------|----------------|
| `GOOGLE_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GOOGLE_CLOUD_PROJECT` | [Google Cloud Console](https://console.cloud.google.com) |
| `LIVEKIT_API_KEY` | [LiveKit Cloud](https://cloud.livekit.io) |
| `LIVEKIT_API_SECRET` | [LiveKit Cloud](https://cloud.livekit.io) |
| `LIVEKIT_URL` | [LiveKit Cloud](https://cloud.livekit.io) |

### Deploy to Google Cloud

```bash
cd infrastructure
terraform init
terraform plan -var="project_id=YOUR_PROJECT_ID"
terraform apply -var="project_id=YOUR_PROJECT_ID"
```

## Project Structure

```
├── backend/
│   ├── agents/           # ADK agent definitions (Voice, Vision, Context, Bridge)
│   ├── gateway/          # FastAPI server, WebSocket handlers, REST routes
│   ├── models/           # Pydantic data models
│   ├── services/         # Session management, media processing
│   └── config.py         # Environment configuration
├── frontend/
│   ├── src/
│   │   ├── components/   # VideoPanel, CodeEditor, CommunicationPanel, SessionControls
│   │   ├── stores/       # Zustand state management
│   │   ├── types/        # TypeScript type definitions
│   │   └── App.tsx       # Main 3-panel layout
│   └── package.json
├── infrastructure/       # Terraform for GCP (Cloud Run, Firestore, etc.)
├── docs/
│   ├── ARCHITECTURE.md   # Full system architecture (15 sections)
│   ├── progress.md       # Project status tracker
│   ├── change_log.md     # Architecture decision log
│   └── run_log.md        # Test/build/deploy log
└── README.md
```

## Hackathon Submission

- **Category:** Live Agents
- **Mandatory Tech:** Gemini Live API + Google ADK + Google Cloud
- **Google Cloud Services:** Cloud Run, Firestore, Memorystore, Cloud Storage, Vertex AI, Secret Manager

## License

[MIT](LICENSE)
