variable "vercel_token" {
  description = "The Vercel token"
  sensitive   = true
}

variable "vercel_org_id" {
  description = "The Vercel organization ID"
}

variable "vercel_project_id" {
  description = "The Vercel project ID"
}

variable "tag_name" {
  description = "The container tag name"
}
