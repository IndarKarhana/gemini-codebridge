# How to Get Your API Keys — Step by Step

## I can't connect to your accounts

I (the AI) **cannot** log into your Google account, GCP console, or retrieve keys for you. You need to do the 2-minute setup yourself. Here's exactly how.

---

## 1. Gemini API Key (REQUIRED — for voice captions)

**This is all you need for local development.** No GCP billing, no Cloud Run.

1. Open: **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account (the one you use for the hackathon)
3. Click **"Create API Key"**
4. Select or create a project (Google creates one for you automatically)
5. Copy the key (starts with `AIza...`)
6. Open the file **`.env`** in your project root
7. Replace `PASTE_YOUR_KEY_HERE` with your key:
   ```
   GOOGLE_API_KEY=AIzaSy...your-actual-key...
   ```
8. Save the file

**That's it.** The voice pipeline will work.

---

## 2. GCP Project (for deployment only — not needed for local dev)

You only need this when you're ready to deploy to Cloud Run for the hackathon submission.

1. Open: **https://console.cloud.google.com**
2. Create a project (e.g. `gemini-codebridge`) or use existing
3. Enable billing (required for Cloud Run — your hackathon credits cover it)
4. Note your **Project ID** (e.g. `gemini-codebridge-12345`)
5. Add to `.env`:
   ```
   GOOGLE_CLOUD_PROJECT=your-project-id
   ```

---

## 3. LiveKit (optional — for video/sign language later)

Only needed when we add the vision pipeline (deaf dev's camera).

1. Open: **https://cloud.livekit.io**
2. Sign up (free tier)
3. Create a project
4. Copy API Key, API Secret, and URL from the dashboard
5. Add to `.env`:
   ```
   LIVEKIT_API_KEY=...
   LIVEKIT_API_SECRET=...
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

---

## Quick test

After adding `GOOGLE_API_KEY` to `.env`:

```bash
# Terminal 1
source .venv/bin/activate
PYTHONPATH=. uvicorn backend.gateway.main:app --reload --port 8080

# Terminal 2
cd frontend && npm run dev
```

Open http://localhost:3000 → Click **Start mic** → Speak → See captions.
