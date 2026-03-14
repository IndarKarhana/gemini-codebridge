# Debug Endpoints

Development and troubleshooting endpoints. Available in both local and deployed environments.

**Base URL (local):** `http://localhost:8080`  
**Base URL (deployed):** `https://codebridge-api-dev-myqv6txzea-uc.a.run.app`

---

## GET /debug/yjs

Verify that the Yjs WebSocket server is available for real-time code sync.

**Request:**
```http
GET /debug/yjs
```

**Response:**
```json
{
  "ok": true,
  "yjs_mounted": true
}
```

- `yjs_mounted: true` — Yjs server is configured; clients can connect to `wss://host/yjs/codebridge`
- `yjs_mounted: false` — Yjs server not loaded (e.g. `ypy-websocket` not installed)

**Use case:** If the sync badge stays on "Connecting", check this endpoint. If it returns `yjs_mounted: true` but sync still fails, the WebsocketServer may not have been started (see backend startup logs for `yjs_started: true`).

---

## GET /debug/caption/{session_id}

Send a test caption to all connected agent WebSocket clients in the given session.

**Request:**
```http
GET /debug/caption/demo?text=Hello%20world
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `session_id` | Yes | Session ID (path). Use `demo` for the default session. |
| `text` | No | Caption text. Default: `"Test caption"` |

**Response:**
```json
{
  "ok": true,
  "session_id": "demo",
  "text": "Hello world"
}
```

**Requirements:** At least one agent WebSocket must be connected (click **Start mic** in the app first).

**Use case:** Test caption delivery without speaking. The frontend "Quick test" button calls this endpoint.
