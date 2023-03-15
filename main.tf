provider "google" {
  project = "pugtube"
  region  = "us-central1"
}

resource "google_cloud_run_service" "pugtube" {
  name     = "pugtube-${var.tag_name}"
  location = "us-central1"

  template {
    spec {
      containers {
        image = "gcr.io/pugtube/pugtube:${var.tag_name}"
        env {
          name  = "VERCEL_TOKEN"
          value = var.vercel_token
        }
        env {
          name  = "VERCEL_ORG_ID"
          value = var.vercel_org_id
        }
        env {
          name  = "VERCEL_PROJECT_ID"
          value = var.vercel_project_id
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

resource "google_cloud_run_service_iam_member" "allow_unauthenticated_invoker" {
  service  = google_cloud_run_service.pugtube.name
  location = "us-central1"
  role     = "roles/run.invoker"
  member   = "allUsers"
}
