module "cognito" {
  source        = "../../modules/cognito"
  name_prefix   = var.project_name
  environment   = var.environment
  region        = var.region
  domain_prefix = var.domain_prefix
  enable_cognito_native = var.enable_cognito_native
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret

  callback_urls = concat(
    ["${var.app_url}/api/auth/callback/cognito"],
    [for url in var.additional_callback_urls : "${url}/api/auth/callback/cognito"]
  )

  logout_urls = concat(
    [var.app_url],
    var.additional_callback_urls
  )
}

module "s3" {
  source      = "../../modules/s3"
  name_prefix = var.project_name
  environment = var.environment

  bucket_name            = var.s3_bucket_name
  cors_allowed_origins   = concat([var.app_url], var.s3_additional_allowed_origins)
  ecs_task_role_name     = var.s3_ecs_task_role_name
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

output "s3_bucket_name" {
  value       = module.s3.bucket_name
  description = "S3 bucket name for application assets"
}

output "s3_access_policy_arn" {
  value       = module.s3.s3_access_policy_arn
  description = "IAM policy that grants RW access to the S3 bucket"
}
