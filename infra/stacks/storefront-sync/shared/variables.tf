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
