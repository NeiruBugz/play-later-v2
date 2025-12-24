# =============================================================================
# Authentication (Cognito)
# =============================================================================

module "cognito" {
  source                = "../../modules/cognito"
  name_prefix           = var.project_name
  environment           = var.environment
  region                = var.region
  domain_prefix         = var.domain_prefix
  enable_cognito_native = var.enable_cognito_native
  google_client_id      = var.google_client_id
  google_client_secret  = var.google_client_secret

  callback_urls = [
    "${var.app_url}/api/auth/callback/cognito"
  ]

  logout_urls = [
    var.app_url
  ]
}

# =============================================================================
# Storage (S3)
# =============================================================================

module "s3" {
  source      = "../../modules/s3"
  name_prefix = var.project_name
  environment = var.environment

  bucket_name          = var.s3_bucket_name
  cors_allowed_origins = concat([var.app_url], var.s3_additional_allowed_origins)
  ecs_task_role_name   = var.s3_ecs_task_role_name
}

# =============================================================================
# Lambda Infrastructure
# =============================================================================

module "ecr" {
  source      = "../../modules/ecr"
  name_prefix = var.project_name
  environment = var.environment
}

module "lambda_secrets" {
  source      = "../../modules/secrets"
  name_prefix = var.project_name
  environment = var.environment

  secret_names = ["steam-api-key", "igdb-credentials", "database-url"]
  # NOTE: secret_values populated out-of-band via AWS CLI after terraform apply
  # See lambdas-py/README.md for deployment instructions

  recovery_window_in_days = 7 # 7-day recovery window in prod
}

module "lambda_imports_bucket" {
  source      = "../../modules/lambda-imports-bucket"
  name_prefix = var.project_name
  environment = var.environment

  lifecycle_expiration_days = 90 # Keep imports longer in prod
}

# =============================================================================
# Lambda Functions
# =============================================================================

module "steam_import_lambda" {
  source        = "../../modules/lambda-container"
  function_name = "${var.project_name}-${var.environment}-steam-import"
  description   = "Fetch Steam library and upload raw CSV to S3"
  image_uri     = "${module.ecr.repository_url}:steam-import-latest"
  timeout       = 300
  memory_size   = 512

  s3_bucket_arns = [module.lambda_imports_bucket.bucket_arn]
  secrets_arns   = [module.lambda_secrets.secret_arns["steam-api-key"]]

  environment_variables = {
    S3_BUCKET                = module.lambda_imports_bucket.bucket_name
    AWS_DEFAULT_REGION       = var.region
    LOG_LEVEL                = var.lambda_log_level
    STEAM_API_KEY_SECRET_ARN = module.lambda_secrets.secret_arns["steam-api-key"]
  }
}

module "igdb_enrichment_lambda" {
  source        = "../../modules/lambda-container"
  function_name = "${var.project_name}-${var.environment}-igdb-enrichment"
  description   = "Enrich Steam games with IGDB metadata"
  image_uri     = "${module.ecr.repository_url}:igdb-enrichment-latest"
  timeout       = 600
  memory_size   = 512

  s3_bucket_arns = [module.lambda_imports_bucket.bucket_arn]
  secrets_arns   = [module.lambda_secrets.secret_arns["igdb-credentials"]]

  environment_variables = {
    S3_BUCKET                   = module.lambda_imports_bucket.bucket_name
    AWS_DEFAULT_REGION          = var.region
    LOG_LEVEL                   = var.lambda_log_level
    IGDB_CREDENTIALS_SECRET_ARN = module.lambda_secrets.secret_arns["igdb-credentials"]
  }
}

module "database_import_lambda" {
  source        = "../../modules/lambda-container"
  function_name = "${var.project_name}-${var.environment}-database-import"
  description   = "Import enriched games into PostgreSQL database"
  image_uri     = "${module.ecr.repository_url}:database-import-latest"
  timeout       = 300
  memory_size   = 512

  s3_bucket_arns = [module.lambda_imports_bucket.bucket_arn]
  secrets_arns   = [module.lambda_secrets.secret_arns["database-url"]]

  environment_variables = {
    S3_BUCKET               = module.lambda_imports_bucket.bucket_name
    AWS_DEFAULT_REGION      = var.region
    LOG_LEVEL               = var.lambda_log_level
    DATABASE_URL_SECRET_ARN = module.lambda_secrets.secret_arns["database-url"]
  }

  # VPC config will be added when RDS is set up
  # vpc_config = {
  #   subnet_ids         = [...]
  #   security_group_ids = [...]
  # }
}

# =============================================================================
# Cognito Outputs
# =============================================================================

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

# =============================================================================
# S3 Outputs
# =============================================================================

output "s3_bucket_name" {
  value       = module.s3.bucket_name
  description = "S3 bucket name for application assets"
}

output "s3_access_policy_arn" {
  value       = module.s3.s3_access_policy_arn
  description = "IAM policy that grants RW access to the S3 bucket"
}

# =============================================================================
# Lambda Outputs
# =============================================================================

output "ecr_repository_url" {
  value       = module.ecr.repository_url
  description = "ECR repository URL for Lambda container images"
}

output "lambda_imports_bucket_name" {
  value       = module.lambda_imports_bucket.bucket_name
  description = "S3 bucket name for Steam import CSVs"
}

output "steam_import_lambda_arn" {
  value       = module.steam_import_lambda.function_arn
  description = "ARN of the Steam Import Lambda function"
}

output "igdb_enrichment_lambda_arn" {
  value       = module.igdb_enrichment_lambda.function_arn
  description = "ARN of the IGDB Enrichment Lambda function"
}

output "database_import_lambda_arn" {
  value       = module.database_import_lambda.function_arn
  description = "ARN of the Database Import Lambda function"
}
