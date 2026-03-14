# CodeBridge

**Real-time AI-powered pair programming for deaf and hearing developers.**

CodeBridge is a communication agent that sits between a deaf developer and a hearing developer during pair programming sessions. It uses Google's Gemini Live API and GenAI SDK to bridge communication bidirectionally — speech to captions, text to synthesized speech — with a shared code editor so both developers can collaborate at full speed.

Built for the [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com/).

**[→ Try the live app](https://codebridge-api-dev-myqv6txzea-uc.a.run.app)**

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

The deaf developer sees rich captions. The hearing developer hears natural speech from the deaf developer's typed input or sign language (via camera). Both developers share the same code in real time.

## Key Features

- **Bidirectional real-time communication** — speech → captions, text → TTS, sign/gesture → captions + TTS
- **Sign language input** — camera captures hand gestures; Gemini Vision interprets common signs and gestures (see [Future](#future) for full ASL roadmap)
- **Bridge Agent enrichment** — voice and sign captions flow through the Bridge Agent for context-rich output
- **Code-aware reference resolution** — "this function" → actual line numbers (planned)
- **Graceful degradation** — text fallback when sign recognition struggles; caption audio toggle (off by default)
- **Session summaries** — AI-generated recap (planned)

## Architecture

![Architecture Diagram](docs/architecture-diagram.svg)

```
Frontend (React)          Backend (FastAPI)         Gemini
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Monaco + Yjs    │◄────►│ /ws/media       │◄────►│ Live API        │
│ Communication   │      │ /ws/agent       │      │ TTS             │
│ Panel           │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full architecture document.

## Tech Stack

### We Build
- Communication Panel (captions, TTS, bidirectional flow)
- WebSocket gateway (media + agent)
- Gemini Live + TTS integration

### We Compose (open-source)
| Component | Package |
|-----------|---------|
| Gemini models | Google GenAI SDK (`google-genai`) |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Real-time sync | Yjs CRDT (`yjs`, `y-monaco`, `y-websocket`) |
| Backend | FastAPI + Uvicorn |
| Frontend | React 19 + TypeScript + Tailwind CSS |
| State management | Zustand |
| Infrastructure | Terraform (Cloud Run) |

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- [Gemini API key](https://aistudio.google.com/app/apikey) (free tier)

### Setup

```bash
# Clone
git clone https://github.com/IndarKarhana/gemini-codebridge.git
cd gemini-codebridge

# 1. Create .env
cp .env.example .env
# Edit .env and add GOOGLE_API_KEY from https://aistudio.google.com/app/apikey

# 2. Backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r backend/requirements.txt
PYTHONPATH=. uvicorn backend.gateway.main:app --port 8080

# 3. Yjs server for shared editor (new terminal)
cd frontend && npm run yjs:server

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. You need **3 terminals**:
- Backend (port 8080)
- Yjs server (port 1234) — for real-time code sync
- Frontend (port 3000)

**Try it:**
1. **Hearing dev:** Click **Start mic**, speak — see live captions.
2. **Deaf dev:** Type in the input, press Enter — hear TTS. Or click **Start sign** in the Video panel and use hand gestures — see captions from sign interpretation.
3. **Shared editor:** Open two browser tabs — edits sync in real time.

**How it works when deployed:** Two users open the same app URL and share one session — they see the same code, captions, and speech. In a production scenario, you'd use unique session URLs (e.g. `https://app.com/s/abc123`) so each pair gets a private link; the current demo uses a shared session for simplicity.

### Environment Variables

| Variable | Required | Where to Get It |
|----------|----------|-----------------|
| `GOOGLE_API_KEY` | Yes | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GOOGLE_CLOUD_PROJECT` | No (for deploy) | [Google Cloud Console](https://console.cloud.google.com) |
| `AGENTIC_MODE` | No (default: true) | Set to `false` to bypass Bridge Agent enrichment |

### Deploy to Google Cloud

**Prerequisites:** [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated (`gcloud auth login`), Docker, Terraform.

```bash
# One-command deploy (builds image, pushes to Artifact Registry, deploys to Cloud Run)
chmod +x scripts/deploy.sh
./scripts/deploy.sh YOUR_PROJECT_ID YOUR_GOOGLE_API_KEY

# Optional: specify region (default: us-central1)
./scripts/deploy.sh YOUR_PROJECT_ID YOUR_GOOGLE_API_KEY europe-west1
```

The script will:
1. Enable Cloud Run and Artifact Registry APIs
2. Create the Artifact Registry repository
3. Build the Docker image (frontend + backend)
4. Push to Artifact Registry
5. Deploy to Cloud Run

After deployment, the service URL is printed. Open it in your browser — the app serves the frontend, API, WebSockets, and Yjs from a single URL.

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
│   ├── DEBUG.md          # Debug endpoints (/debug/yjs, /debug/caption)
│   ├── progress.md       # Project status tracker
│   ├── change_log.md     # Architecture decision log
│   └── run_log.md        # Test/build/deploy log
└── README.md
```

## Hackathon Submission

| Requirement | Status |
|-------------|--------|
| **App link** | [https://codebridge-api-dev-myqv6txzea-uc.a.run.app](https://codebridge-api-dev-myqv6txzea-uc.a.run.app) |
| **Category** | Live Agents |
| **Gemini Live API** | ✅ Audio → captions (via GenAI SDK) |
| **GenAI SDK or ADK** | ✅ `google-genai` |
| **Google Cloud** | Terraform for Cloud Run ✅ |
| **Architecture diagram** | [`docs/architecture-diagram.svg`](docs/architecture-diagram.svg) |
| **Demo video** | <4 min, real-time, no mockups |

## Future

### True ASL (American Sign Language) Support

The current sign interpretation uses Gemini Vision on single static frames — it recognizes common signs and gestures but is **not** a full ASL interpreter. Planned improvements:

| Improvement | Description |
|-------------|-------------|
| **Video sequences** | Send 1–2 second clips instead of single frames; ASL relies on movement over time |
| **ASL-specific models** | MediaPipe Gesture Recognizer with ASL vocabulary, or models trained on WLASL |
| **Hand + face landmarks** | Pass MediaPipe landmark data to enrich interpretation (facial grammar, finger positions) |
| **Temporal modeling** | Process sequences of hand shapes and movements for fingerspelling and complex signs |
| **Facial expression** | ASL uses eyebrow raise, head tilt, etc. for grammar — integrate face mesh data |

### Other Roadmap Items

- **Private sessions** — Unique session URLs (e.g. `/s/abc123`) so each pair gets a private link; only invited users join
- **Code context** — Editor state → Context Agent (resolve "this function" to actual line numbers)
- **Confidence indicators** — Show alternatives when sign recognition is uncertain; disambiguation prompts
- **Session summaries** — AI-generated recap of decisions and action items

## License

[MIT](LICENSE)
