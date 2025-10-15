variable "region" {
  type        = string
  description = "AWS region"
}

variable "project_name" {
  type        = string
  description = "Project/service name prefix"
}

variable "environment" {
  type        = string
  description = "Environment name"
  default     = "prod"
}

variable "app_url" {
  type        = string
  description = "Application base URL (e.g., https://app.example.com)"
}

variable "domain_prefix" {
  type        = string
  description = "Cognito domain prefix (globally unique per region)"
}

variable "enable_cognito_native" {
  type        = bool
  description = "Whether to enable Cognito native (email/password) login"
  default     = false
}

variable "google_client_id" {
  type        = string
  description = "Google OAuth client ID for Cognito federation"
  default     = ""
}

variable "google_client_secret" {
  type        = string
  description = "Google OAuth client secret for Cognito federation"
  default     = ""
}
