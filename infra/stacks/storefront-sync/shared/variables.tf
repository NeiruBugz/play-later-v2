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
  description = "AWS region for the provider; IAM OIDC providers are global but the provider still needs one"
  type        = string
  nullable    = false
}

variable "vercel_team_slug" {
  description = "Vercel team slug; the Vercel OIDC issuer is https://oidc.vercel.com/<slug> (Team issuer mode)"
  type        = string
  nullable    = false
}

variable "owner" {
  description = "Owner tag value"
  type        = string
  default     = "NeiruBugz"
  nullable    = false
}
