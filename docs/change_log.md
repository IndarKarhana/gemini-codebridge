# CodeBridge — Architecture Change Log

All changes to architecture decisions, tech stack, or design patterns are logged here.

| Date | What Changed | Why | Section Affected |
|------|-------------|-----|-----------------|
| 2026-03-04 21:30 | Initial architecture document created (v1.0) | Project kickoff | All sections |
| 2026-03-04 22:00 | Added Section 4: Open-Source Ecosystem & Build vs. Reuse Map | Ensure compose-first approach is explicit — reuse open-source, only build core IP | Sections 4, 5, 13 |
| 2026-03-04 22:00 | Added LiveKit for WebRTC transport | Replaces custom WebSocket media handling — saves ~2 weeks of work | Sections 4, 5, 13 |
| 2026-03-04 22:00 | Added MediaPipe as client-side gate before Gemini | Reduces Gemini API calls ~70% by only sending frames when hands detected | Section 4 |
| 2026-03-04 22:30 | Architecture review: identified missing CORS, env config, LiveKit session limit note | Gaps found during thorough review pass | Sections 9, 10, Appendix |
| 2026-03-04 22:30 | Added Gemini Live API session limits to architecture awareness | Live API has 15min audio-only / 2min audio-video session limits — need session rotation | Section 8, 12 |
| 2026-03-14 | Implemented voice → captions pipeline (P0) | Full build: Gemini Live API, WebSocket handlers, mic capture, live captions in UI | Backend services, gateway, frontend hooks |
| 2026-03-14 | Shared Monaco editor with Yjs CRDT (P0 #3) | Yjs + y-monaco + y-websocket server, real-time collaborative editing | SharedEditor, vite proxy, package.json |
| 2026-03-14 | Deaf dev → speech (P0 #2) | Text input + Gemini TTS, agent connects on mount, bidirectional flow | tts_service, useAgentConnection, CommunicationPanel |
