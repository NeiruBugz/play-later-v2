locals {
  project     = "savepoint"
  environment = "prod"

  required_tags = {
    Environment = local.environment
    Project     = local.project
    Owner       = var.owner
    ManagedBy   = "terraform"
  }

  vercel_oidc_host = "oidc.vercel.com/${var.vercel_team_slug}"
  github_oidc_host = "token.actions.githubusercontent.com"
}
