# CodeBridge GCP Deployment

## Hackathon submission requirements (Gemini Live Agent Challenge)

From [geminiliveagentchallenge.devpost.com](https://geminiliveagentchallenge.devpost.com):

### What to submit

| Item | Requirement |
|------|-------------|
| **App link** | URL to your live app (Cloud Run) |
| **Code repo** | Public URL with spin-up instructions in README |
| **Architecture diagram** | Clear visual in submission or image carousel |
| **Demo video** | <4 min, real-time (no mockups), pitches problem + solution |

### Bonus points

- Prove automated Cloud deployment (scripts or IaC in public repo) — ✅ we have `scripts/deploy.sh` + Terraform
- Publish content (blog, podcast, video) covering how you built with Google AI + Cloud

### Live Agents category

- Must use Gemini Live API or ADK ✅
- Agents hosted on Google Cloud ✅

---

## Deploy steps

### 1. Prerequisites

- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated
- Docker
- Terraform (`brew install terraform`)

### 2. Authenticate

```bash
# If you get "invalid_grant" or "Bad Request" from Terraform:
gcloud auth login
gcloud auth application-default login
```

### 3. Deploy

```bash
./scripts/deploy.sh gemeni-codebridge YOUR_GOOGLE_API_KEY
```

Optional region (default: us-central1):

```bash
./scripts/deploy.sh gemeni-codebridge YOUR_GOOGLE_API_KEY europe-west1
```

### 4. App link

After deployment, the script prints the service URL. Use that as your **app link** for the hackathon submission.

Example: `https://codebridge-api-dev-xxxxx-uc.a.run.app`

### 5. Debug endpoints

See [`docs/DEBUG.md`](DEBUG.md) for `/debug/yjs` and `/debug/caption/{session_id}`.

---

## Vertex AI (GCP billing) — avoids free-tier limits

The deployed app automatically uses **Vertex AI** instead of the API key when these env vars are set (Terraform adds them):

- `GOOGLE_CLOUD_PROJECT` — your GCP project
- `GOOGLE_CLOUD_LOCATION` — region (e.g. us-central1)
- `GOOGLE_GENAI_USE_VERTEXAI=true`

This routes Gemini (Live, TTS, sign, bridge) through your GCP project billing instead of the free-tier API key limits. After a few chats, the free tier can hit rate limits and stop sharing context; Vertex AI uses your project's quota.

---

## Billing budget (alerts at $60)

To get **email alerts** when spend reaches 60% or 100% of $60, set these in `.env` and redeploy:

```bash
# Get your billing account ID
gcloud billing accounts list

# Add to .env:
BILLING_ACCOUNT_ID=01ABCD-23EF56-789ABC   # from the list
BILLING_ALERT_EMAIL=your-email@example.com
```

Then deploy (script reads from .env):

```bash
export $(grep -v '^#' .env | xargs)
./scripts/deploy.sh "${GOOGLE_CLOUD_PROJECT}" "${GOOGLE_API_KEY}"
```

Or apply manually:

```bash
cd infrastructure
terraform apply -var="project_id=gemeni-codebridge" -var="google_api_key=..." \
  -var="billing_account_id=BILLING_ACCOUNT_ID" \
  -var="billing_alert_email=your-email@example.com"
```

Optional: `-var="billing_budget_usd=50"` to change the limit (default: 60).

**Important:** GCP budgets do **not** automatically stop spending — they only notify you. When you get the alert, manually shut down Cloud Run or disable billing if you want to stop charges.
