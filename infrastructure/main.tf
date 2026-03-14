terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Use local backend for initial deploy. For production, use GCS:
  # backend "gcs" { bucket = "codebridge-terraform-state"; prefix = "terraform/state" }
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "run" {
  project = var.project_id
  service = "run.googleapis.com"
}

resource "google_project_service" "artifactregistry" {
  project = var.project_id
  service = "artifactregistry.googleapis.com"
}

# Vertex AI — required for Gemini with GCP billing (avoids free-tier limits)
resource "google_project_service" "vertexai" {
  project = var.project_id
  service = "aiplatform.googleapis.com"
}

# Grant Cloud Run default SA access to Vertex AI (for Gemini with GCP billing)
data "google_project" "project" {
  project_id = var.project_id
}

resource "google_project_iam_member" "run_vertexai" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"

  depends_on = [google_project_service.vertexai]
}

# Artifact Registry repository for CodeBridge images
resource "google_artifact_registry_repository" "codebridge" {
  location      = var.region
  repository_id = "codebridge"
  description   = "CodeBridge Docker images"
  format        = "DOCKER"

  depends_on = [google_project_service.artifactregistry]
}
