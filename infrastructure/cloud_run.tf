# CodeBridge API service on Cloud Run

resource "google_cloud_run_v2_service" "api" {
  depends_on = [google_project_service.vertexai]
  name     = "codebridge-api-${var.environment}"
  location = var.region

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/codebridge/api:latest"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }

      # Environment variables injected from Secret Manager
      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }
      env {
        name  = "GOOGLE_API_KEY"
        value = var.google_api_key
      }
      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GOOGLE_CLOUD_LOCATION"
        value = var.region
      }
      env {
        name  = "GOOGLE_GENAI_USE_VERTEXAI"
        value = "true"
      }
      env {
        name  = "AGENTIC_MODE"
        value = "true"
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 30
        period_seconds        = 10
        timeout_seconds       = 5
        failure_threshold     = 24
      }
    }

    timeout = "300s"

    scaling {
      # Single instance required for Yjs: all users must share same in-memory sync server.
      # min=1 keeps instance warm so WebSocket connects (cold start causes "Connecting" to hang).
      min_instance_count = 1
      max_instance_count = 1
    }
  }
}

# Allow unauthenticated access (public API)
resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "service_url" {
  description = "CodeBridge Cloud Run service URL"
  value       = google_cloud_run_v2_service.api.uri
}
