resource "aws_cognito_user_pool" "this" {
  name = "${var.name_prefix}-${var.environment}"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

locals {
  enable_google       = length(var.google_client_id) > 0 && length(var.google_client_secret) > 0
  enable_cognito_auth = var.enable_cognito_native
}

resource "aws_cognito_identity_provider" "google" {
  count        = local.enable_google ? 1 : 0
  user_pool_id = aws_cognito_user_pool.this.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id       = var.google_client_id
    client_secret   = var.google_client_secret
    authorize_scopes = "openid email profile"
  }

  attribute_mapping = {
    email = "email"
    name  = "name"
  }
}

locals {
  google_idp_name = local.enable_google ? aws_cognito_identity_provider.google[0].provider_name : null
  base_providers  = local.enable_cognito_auth ? ["COGNITO"] : []
  supported_identity_providers = compact(concat(local.base_providers, local.google_idp_name == null ? [] : [local.google_idp_name]))
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.name_prefix}-${var.environment}-web"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret                       = true
  prevent_user_existence_errors         = "ENABLED"
  enable_token_revocation               = true
  allowed_oauth_flows_user_pool_client  = true
  allowed_oauth_flows                   = ["code"]
  allowed_oauth_scopes                  = ["openid", "email", "profile"]
  supported_identity_providers          = local.supported_identity_providers
  callback_urls                         = var.callback_urls
  logout_urls                           = var.logout_urls
  access_token_validity                 = 60
  id_token_validity                     = 60
  refresh_token_validity                = 30
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = "${var.domain_prefix}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.this.id
}
