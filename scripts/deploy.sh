#!/usr/bin/env bash
# Deploy CodeBridge to Google Cloud Run
# Prerequisites: gcloud CLI, Docker, Terraform
# Usage: ./scripts/deploy.sh PROJECT_ID GOOGLE_API_KEY [REGION]

set -e

# Ensure Docker is in PATH (Docker Desktop on macOS often installs to /usr/local/bin)
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
if command -v docker &>/dev/null; then
  DOCKER=docker
elif [ -x /usr/local/bin/docker ]; then
  DOCKER=/usr/local/bin/docker
else
  echo "ERROR: Docker not found. Start Docker Desktop or install Docker."
  exit 1
fi

PROJECT_ID="${1:?Usage: $0 PROJECT_ID GOOGLE_API_KEY [REGION]}"
GOOGLE_API_KEY="${2:?Usage: $0 PROJECT_ID GOOGLE_API_KEY [REGION]}"
REGION="${3:-us-central1}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/codebridge/api:latest"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "==> Configuring gcloud for project ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

echo "==> Terraform: init and create Artifact Registry"
cd "${PROJECT_ROOT}/infrastructure"
terraform init
terraform apply -auto-approve \
  -target=google_project_service.run \
  -target=google_project_service.artifactregistry \
  -target=google_artifact_registry_repository.codebridge \
  -var="project_id=${PROJECT_ID}" \
  -var="google_api_key=${GOOGLE_API_KEY}" \
  -var="region=${REGION}"

echo "==> Configuring Docker for Artifact Registry"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

echo "==> Building Docker image (linux/amd64 for Cloud Run)"
cd "${PROJECT_ROOT}"
"$DOCKER" build --platform linux/amd64 -t "${IMAGE}" .

echo "==> Pushing image to Artifact Registry"
"$DOCKER" push "${IMAGE}"

echo "==> Terraform: deploy Cloud Run service"
cd "${PROJECT_ROOT}/infrastructure"
TF_VARS=(-var="project_id=${PROJECT_ID}" -var="google_api_key=${GOOGLE_API_KEY}" -var="region=${REGION}")
[ -n "${BILLING_ACCOUNT_ID:-}" ] && TF_VARS+=(-var="billing_account_id=${BILLING_ACCOUNT_ID}")
[ -n "${BILLING_ALERT_EMAIL:-}" ] && TF_VARS+=(-var="billing_alert_email=${BILLING_ALERT_EMAIL}")
terraform apply -auto-approve "${TF_VARS[@]}"

echo ""
echo "==> Deployment complete!"
echo "Service URL: $(terraform output -raw service_url)"
