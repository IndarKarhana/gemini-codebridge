# Billing budget — alerts at 60%, 100% of limit, emails when reached
# NOTE: GCP budgets do NOT auto-stop spending — they only send email alerts.
# To actually stop: manually disable billing or shut down Cloud Run when alerted.
#
# Set billing_account_id and billing_alert_email to enable.
# Get billing account: gcloud billing accounts list

variable "billing_account_id" {
  description = "Billing account ID (e.g. 01ABCD-23EF56-789ABC). Get from: gcloud billing accounts list"
  type        = string
  default     = ""
}

data "google_billing_account" "account" {
  count             = var.billing_account_id != "" ? 1 : 0
  billing_account   = var.billing_account_id
  lookup_projects   = false
}

# Enable Monitoring API for notification channels
resource "google_project_service" "monitoring" {
  count   = var.billing_account_id != "" && var.billing_alert_email != "" ? 1 : 0
  project = var.project_id
  service = "monitoring.googleapis.com"
}

# Email notification channel for billing alerts
resource "google_monitoring_notification_channel" "billing_alert" {
  count        = var.billing_account_id != "" && var.billing_alert_email != "" ? 1 : 0
  project      = var.project_id
  display_name = "CodeBridge Billing Alert"
  type         = "email"

  labels = {
    email_address = var.billing_alert_email
  }

  depends_on = [google_project_service.monitoring]
}

resource "google_billing_budget" "codebridge" {
  count           = var.billing_account_id != "" ? 1 : 0
  billing_account = data.google_billing_account.account[0].id
  display_name    = "CodeBridge ${var.project_id}"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(var.billing_budget_usd)
    }
  }

  # Alert at 60% and 100% of budget
  threshold_rules {
    threshold_percent = 0.6
  }
  threshold_rules {
    threshold_percent = 1.0
  }

  # Send email to specified address when threshold is reached
  dynamic "all_updates_rule" {
    for_each = var.billing_alert_email != "" ? [1] : []
    content {
      monitoring_notification_channels = [
        google_monitoring_notification_channel.billing_alert[0].id
      ]
      disable_default_iam_recipients = false
    }
  }
}
