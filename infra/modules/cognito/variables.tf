variable "name_prefix" {
  type        = string
  description = "Project or service name prefix"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, prod)"
}

variable "region" {
  type        = string
  description = "AWS region"
}

variable "domain_prefix" {
  type        = string
  description = "Cognito domain prefix (will be suffixed with env)"
}

variable "callback_urls" {
  type        = list(string)
  description = "Allowed OAuth callback URLs"
}

variable "logout_urls" {
  type        = list(string)
  description = "Allowed logout URLs"
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
