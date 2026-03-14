# CodeBridge — 3-Minute Demo Script

**Format:** Two users record their screens. Each opens the app at [https://codebridge-api-dev-myqv6txzea-uc.a.run.app](https://codebridge-api-dev-myqv6txzea-uc.a.run.app). Both join the same session.

**Total time:** ~3 minutes

---

## Part 1: Intro (0:00–0:25) — ~25 seconds

**Speaker (voiceover or on-screen):**

> Pair programming is built around voice — but deaf developers are forced into slow text chat or expensive interpreters who don't understand code.  
>  
> **CodeBridge** bridges that gap. It's a real-time communication agent for deaf and hearing developers. Speech becomes captions. Text and sign language become speech. And both developers share the same code in real time.  
>  
> Here's how it works.

---

## Part 2: Hearing Developer — Screen 1 (0:25–1:25) — ~60 seconds

**User 1 records their screen.**

### Actions

1. **0:25** — Open the app. Show the 3-panel layout: Video (left), Shared Editor (center), Communication (right).

2. **0:30** — Click **Start mic** in the Communication panel. Speak clearly:
   > "Let's add a function to validate the password. I'll type it in the editor."

3. **0:45** — Point at the captions appearing in real time as you speak. Show the "Hearing Dev" label.

4. **0:55** — Type in the shared editor:

   ```python
   def validate_password(password: str) -> bool:
       return len(password) >= 8
   ```

5. **1:10** — Speak again:
   > "What do you think about adding a check for special characters?"

6. **1:15** — Pause. Say: "Now the deaf developer sees my captions and can respond."

---

## Part 3: Deaf Developer — Screen 2 (1:25–2:25) — ~60 seconds

**User 2 records their screen.**

### Actions

1. **1:25** — Open the app (same URL). Show the same session — captions from the hearing dev are already visible.

2. **1:35** — Show the shared editor. The code the hearing dev typed is already there. Point at the **● Synced** badge to show real-time sync.

3. **1:45** — Type in the input at the bottom:
   > "Good idea. Let me add that."

4. **1:50** — Press **Enter** or click **Speak**. The hearing dev will hear this as TTS.

5. **2:00** — Edit the code in the shared editor — add a check for special characters:

   ```python
   def validate_password(password: str) -> bool:
       if len(password) < 8:
           return False
       return any(c in "!@#$%" for c in password)
   ```

6. **2:15** — Optionally click **Start sign** in the Video panel. Show hands to the camera — "thumbs up" or "OK" — and point at captions appearing from sign interpretation.

7. **2:25** — Say (or type): "That's the flow. Both of us see the same code and communicate in real time."

---

## Part 4: Wrap-Up (2:25–3:00) — ~35 seconds

**Either screen can show.**

### Actions

1. **2:25** — Open a second tab with the same URL. Show that edits in the editor sync instantly across tabs.

2. **2:35** — Quick recap:
   > "CodeBridge: speech to captions, text and sign to speech, shared code. Built for the Gemini Live Agent Challenge."

3. **2:50** — Optional: Show the architecture diagram or README link.

4. **3:00** — End.

---

## Tips for Recording

| Tip | Details |
|-----|---------|
| **Same session** | Both users open the same URL. The demo uses a shared session. |
| **Mic & camera** | Hearing dev: grant mic. Deaf dev: grant camera for sign if using it. |
| **Connection** | Wait for "● Synced" and "Connected" before starting. |
| **Pace** | Speak clearly; pause briefly between actions so captions can appear. |
| **Sign** | Keep hands in frame; use simple gestures (thumbs up, OK, etc.) for reliability. |

---

## Quick Reference — UI Elements

| Element | Location | Action |
|---------|----------|--------|
| **Start mic** | Communication panel (top right) | Hearing dev speaks → captions |
| **Deaf dev input** | Communication panel (bottom) | Type + Enter → TTS for hearing dev |
| **Speak** | Next to deaf input | Same as Enter |
| **Start sign** | Video panel (Deaf Dev tile) | Camera on → sign → captions |
| **● Synced** | Shared Editor header | Indicates real-time code sync |

---

## Script Variants

**Shorter (2 min):** Skip sign language; focus on speech → captions and text → TTS only.

**Longer (4 min):** Add a second round of code edits, show caption audio toggle, or mention future ASL support.
