variable "aws_account_id" {
  description = "12-digit AWS account this stack may be applied to; the provider refuses any other account (allowed_account_ids)"
  type        = string
  nullable    = false

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be exactly 12 digits."
  }
}

variable "aws_region" {
  description = "AWS region for the queues and Lambdas; keep it close to Neon and Vercel functions"
  type        = string
  nullable    = false
}

variable "vercel_team_slug" {
  description = "Vercel team slug; must match the shared/ OIDC provider and the sub claim owner"
  type        = string
  nullable    = false
}

variable "vercel_project_name" {
  description = "Vercel project name used in the OIDC sub claim"
  type        = string
  nullable    = false
}

variable "github_repository" {
  description = "GitHub repository (owner/name) allowed to deploy the Lambdas from the production environment"
  type        = string
  default     = "NeiruBugz/play-later-v2"
  nullable    = false
}

variable "max_receive_count" {
  description = "Receives before a message moves to the DLQ; also passed to the Lambdas as SYNC_MAX_RECEIVE_COUNT"
  type        = number
  default     = 3
  nullable    = false
}

variable "owner" {
  description = "Owner tag value"
  type        = string
  default     = "NeiruBugz"
  nullable    = false
}
