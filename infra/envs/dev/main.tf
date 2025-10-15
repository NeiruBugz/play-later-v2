module "cognito" {
  source        = "../../modules/cognito"
  name_prefix   = var.project_name
  environment   = var.environment
  region        = var.region
  domain_prefix = var.domain_prefix
  enable_cognito_native = var.enable_cognito_native
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret

  callback_urls = [
    "${var.app_url}/api/auth/callback/cognito"
  ]

  logout_urls = [
    var.app_url
  ]
}

output "cognito_user_pool_id" {
  value       = module.cognito.user_pool_id
  description = "Cognito User Pool ID"
}

output "cognito_user_pool_client_id" {
  value       = module.cognito.user_pool_client_id
  description = "Cognito App Client ID"
}

output "cognito_user_pool_client_secret" {
  value       = module.cognito.user_pool_client_secret
  description = "Cognito App Client Secret"
  sensitive   = true
}

output "cognito_domain" {
  value       = module.cognito.domain
  description = "Cognito domain prefix"
}

output "cognito_issuer" {
  value       = module.cognito.issuer
  description = "OIDC issuer URL for NextAuth"
}
