variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
  default     = "dev"
}

variable "google_api_key" {
  description = "Google Gemini API key (from https://aistudio.google.com/app/apikey). Pass via -var or TF_VAR_google_api_key."
  type        = string
  sensitive   = true
}

variable "billing_budget_usd" {
  description = "Billing budget limit in USD — alerts at 60%, 100%. Does NOT auto-stop spending."
  type        = number
  default     = 60
}

variable "billing_alert_email" {
  description = "Email address to receive billing alerts when budget threshold is reached."
  type        = string
  default     = ""
}
